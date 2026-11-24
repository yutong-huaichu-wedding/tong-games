/**
 * TONG GAMES 留言 API（Cloudflare Worker + D1）
 * 管理密鑰只從環境變數 ADMIN_TOKEN 讀取，絕不寫進這個檔案。
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_MESSAGE = 1000;
const MIN_MESSAGE = 4;
const MAX_NICK = 40;
const CATEGORIES = new Set(["bug", "suggestion", "review"]);
const GAME_ID_RE = /^[a-z0-9-]{1,64}$/;

function corsHeaders(request, env) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = request.headers.get("Origin");
  if (!origin) return { ok: true, headers, origin: "" };
  const allowed = String(env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const url = new URL(request.url);
  const ok =
    origin === url.origin ||
    allowed.includes(origin) ||
    allowed.includes("*");
  if (!ok) return { ok: false, headers, origin };
  headers.set("Access-Control-Allow-Origin", allowed.includes("*") ? "*" : origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  headers.set("Access-Control-Max-Age", "86400");
  return { ok: true, headers, origin };
}

function json(data, status, headers) {
  const out = new Headers(headers);
  out.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers: out });
}

function readAdminToken(request) {
  const header = request.headers.get("Authorization") || "";
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1].trim();
  const alt = request.headers.get("X-Admin-Token");
  return alt ? alt.trim() : "";
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.byteLength !== bb.byteLength) {
    // Still compare to reduce obvious timing leaks on length, then fail.
    let dummy = 0;
    for (let i = 0; i < aa.byteLength; i++) dummy |= aa[i];
    return false;
  }
  let out = 0;
  for (let i = 0; i < aa.byteLength; i++) out |= aa[i] ^ bb[i];
  return out === 0;
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim() ||
    "local"
  );
}

async function hashIp(ip) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tg-fb|" + ip));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function allowSubmit(env, ipHash) {
  const now = Date.now();
  const row = await env.DB.prepare(
    "SELECT window_start, count FROM rate_limits WHERE ip_hash = ?"
  )
    .bind(ipHash)
    .first();
  if (!row || now - row.window_start >= WINDOW_MS) {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO rate_limits (ip_hash, window_start, count) VALUES (?, ?, 1)"
    )
      .bind(ipHash, now)
      .run();
    return true;
  }
  if (row.count >= MAX_PER_WINDOW) return false;
  await env.DB.prepare(
    "UPDATE rate_limits SET count = count + 1 WHERE ip_hash = ? AND window_start = ?"
  )
    .bind(ipHash, row.window_start)
    .run();
  return true;
}

function publicRow(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    game_id: row.game_id,
    rating: row.rating,
    category: row.category,
    message: row.message,
    nickname: row.nickname || "",
  };
}

function adminRow(row) {
  return {
    ...publicRow(row),
    public_requested: !!row.public_requested,
    approved: !!row.approved,
    ip_hash_prefix: (row.ip_hash || "").slice(0, 8),
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      if (!cors.ok) return json({ error: "此網站尚未列入 CORS_ORIGINS。" }, 403, cors.headers);
      return new Response(null, { status: 204, headers: cors.headers });
    }

    if (!cors.ok && request.headers.get("Origin")) {
      return json({ error: "此網站尚未列入 CORS_ORIGINS。請在 Worker 的 CORS_ORIGINS 加入前端網站的 origin。" }, 403, cors.headers);
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({ ok: true, service: "tong-games-feedback" }, 200, cors.headers);
      }

      if (url.pathname === "/api/feedback" && request.method === "GET") {
        return await listPublic(url, env, cors.headers);
      }

      if (url.pathname === "/api/feedback" && request.method === "POST") {
        return await submit(request, env, cors.headers);
      }

      if (url.pathname === "/api/admin/feedback" && request.method === "GET") {
        const auth = await checkAdmin(request, env, cors.headers);
        if (auth) return auth;
        return await listAdmin(url, env, cors.headers);
      }

      if (url.pathname === "/api/admin/feedback" && request.method === "POST") {
        const auth = await checkAdmin(request, env, cors.headers);
        if (auth) return auth;
        return await moderate(request, env, cors.headers);
      }

      return json({ error: "API not found" }, 404, cors.headers);
    } catch (err) {
      return json({ error: "伺服器暫時無法處理，請稍後再試。" }, 500, cors.headers);
    }
  },
};

async function checkAdmin(request, env, headers) {
  const expected = String(env.ADMIN_TOKEN || "");
  const provided = readAdminToken(request);
  if (!expected) {
    return json({ error: "後端尚未設定管理密鑰。" }, 503, headers);
  }
  if (!provided || !timingSafeEqual(provided, expected)) {
    return json({ error: "管理密鑰不正確。" }, 401, headers);
  }
  return null;
}

async function listPublic(url, env, headers) {
  const gameId = (url.searchParams.get("game_id") || "").trim();
  if (!GAME_ID_RE.test(gameId)) {
    return json({ error: "game_id 無效" }, 400, headers);
  }
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 30)));
  const rows = await env.DB.prepare(
    "SELECT id, created_at, game_id, rating, category, message, nickname FROM feedback WHERE approved = 1 AND game_id = ? ORDER BY created_at DESC LIMIT ?"
  )
    .bind(gameId, limit)
    .all();
  return json({ comments: (rows.results || []).map(publicRow) }, 200, headers);
}

async function submit(request, env, headers) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("application/json")) {
    return json({ error: "請使用 JSON 格式" }, 415, headers);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "內容格式錯誤" }, 400, headers);
  }

  // 蜜罐：機器人填了隱藏欄就假裝成功，不寫入。
  if (body && (body.website || body.hp || body.url)) {
    return json({ ok: true }, 200, headers);
  }

  const gameId = String(body.game_id || "").trim();
  const rating = Number(body.rating);
  const category = String(body.category || "").trim();
  const message = String(body.message || "").trim();
  const nickname = String(body.nickname || "").trim().slice(0, MAX_NICK);
  const publicRequested = !!body.public_requested;

  if (!GAME_ID_RE.test(gameId)) return json({ error: "請選擇遊戲或全站回饋。" }, 400, headers);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "請給 1 到 5 顆星。" }, 400, headers);
  }
  if (!CATEGORIES.has(category)) return json({ error: "請選擇留言類型。" }, 400, headers);
  if (message.length < MIN_MESSAGE || message.length > MAX_MESSAGE) {
    return json({ error: "留言請寫 " + MIN_MESSAGE + "～" + MAX_MESSAGE + " 字。" }, 400, headers);
  }

  const ipHash = await hashIp(clientIp(request));
  if (!(await allowSubmit(env, ipHash))) {
    return json({ error: "留言太頻繁，請稍後再試。" }, 429, headers);
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO feedback (id, created_at, game_id, rating, category, message, nickname, public_requested, approved, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)"
  )
    .bind(id, now, gameId, rating, category, message, nickname || null, publicRequested ? 1 : 0, ipHash)
    .run();

  return json({ ok: true, id }, 201, headers);
}

async function listAdmin(url, env, headers) {
  const gameId = (url.searchParams.get("game_id") || "").trim();
  const status = (url.searchParams.get("status") || "all").trim();
  const clauses = [];
  const binds = [];
  if (gameId) {
    if (!GAME_ID_RE.test(gameId)) return json({ error: "game_id 無效" }, 400, headers);
    clauses.push("game_id = ?");
    binds.push(gameId);
  }
  if (status === "pending") clauses.push("approved = 0");
  else if (status === "approved") clauses.push("approved = 1");
  else if (status === "public_requested") clauses.push("public_requested = 1 AND approved = 0");
  const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
  const rows = await env.DB.prepare(
    "SELECT id, created_at, game_id, rating, category, message, nickname, public_requested, approved, ip_hash FROM feedback" +
      where +
      " ORDER BY created_at DESC LIMIT 200"
  )
    .bind(...binds)
    .all();
  return json({ comments: (rows.results || []).map(adminRow) }, 200, headers);
}

async function moderate(request, env, headers) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "內容格式錯誤" }, 400, headers);
  }
  const id = String(body.id || "").trim();
  const action = String(body.action || "").trim();
  if (!/^[0-9a-f-]{16,80}$/i.test(id)) return json({ error: "找不到這則留言。" }, 400, headers);

  if (action === "approve") {
    const res = await env.DB.prepare("UPDATE feedback SET approved = 1 WHERE id = ?").bind(id).run();
    if (!res.meta || !res.meta.changes) return json({ error: "找不到這則留言。" }, 404, headers);
    return json({ ok: true, id, approved: true }, 200, headers);
  }
  if (action === "unapprove") {
    const res = await env.DB.prepare("UPDATE feedback SET approved = 0 WHERE id = ?").bind(id).run();
    if (!res.meta || !res.meta.changes) return json({ error: "找不到這則留言。" }, 404, headers);
    return json({ ok: true, id, approved: false }, 200, headers);
  }
  if (action === "delete") {
    const res = await env.DB.prepare("DELETE FROM feedback WHERE id = ?").bind(id).run();
    if (!res.meta || !res.meta.changes) return json({ error: "找不到這則留言。" }, 404, headers);
    return json({ ok: true, id, deleted: true }, 200, headers);
  }
  return json({ error: "未知的操作。" }, 400, headers);
}
