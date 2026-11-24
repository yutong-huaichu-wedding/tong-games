(function () {
  "use strict";

  var SITE = window.TONG_SITE || { studioName: "TONG GAMES", games: [] };
  var games = Array.isArray(SITE.games) ? SITE.games : [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function asset(path) {
    if (!path) return "";
    if (/^https?:|^data:|^\//.test(path) || path.indexOf("assets/") === 0 || path.indexOf("games/") === 0) {
      var depth = (SITE._depth || 0);
      if (depth > 0 && !/^https?:|^data:|^\//.test(path)) {
        return new Array(depth + 1).join("../") + path;
      }
      return path;
    }
    return path;
  }

  /* Pages in / sit at depth 0. Kept for future subfolders. */
  SITE._depth = (function () {
    var p = location.pathname.replace(/\\/g, "/");
    if (/\/games\//.test(p)) return 1;
    return 0;
  })();

  function applyStudioName() {
    var name = SITE.studioName || "TONG GAMES";
    $$("[data-studio-name]").forEach(function (el) {
      el.textContent = name;
    });
    $$("[data-studio-year]").forEach(function (el) {
      el.textContent = String(SITE.year || new Date().getFullYear());
    });
    document.title = document.title.replace(/TONG GAMES/g, name);
    var og = document.querySelector('meta[property="og:site_name"]');
    if (og) og.setAttribute("content", name);
  }

  function isLive(g) { return g && g.status === "live"; }

  function playHref(g) { return "play.html?id=" + encodeURIComponent(g.id); }

  function allTags() {
    var seen = {};
    var out = [];
    games.forEach(function (g) {
      (g.tags || []).forEach(function (t) {
        if (t && !seen[t]) { seen[t] = 1; out.push(t); }
      });
    });
    return out;
  }

  function renderFilters(box) {
    if (!box) return;
    var tags = allTags();
    var html = '<button type="button" class="chip is-on" data-tag="" aria-pressed="true">全部</button>';
    tags.forEach(function (t) {
      html += '<button type="button" class="chip" data-tag="' + escapeHtml(t) + '" aria-pressed="false">' + escapeHtml(t) + "</button>";
    });
    box.innerHTML = html;
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tag]");
      if (!btn) return;
      $$(".chip", box).forEach(function (c) {
        var on = c === btn;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderGrid($("#game-grid"), btn.getAttribute("data-tag") || "");
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function cardHTML(g) {
    var live = isLive(g);
    var href = playHref(g);
    var metaBits = [];
    if (g.playTime) metaBits.push(escapeHtml(g.playTime));
    if (g.platforms) metaBits.push(escapeHtml(g.platforms));
    var tags = (g.tags || []).map(function (t) {
      return '<span class="tag">#' + escapeHtml(t) + "</span>";
    }).join("");
    var cta = live
      ? '<span class="btn btn-play">遊玩</span>'
      : '<span class="btn btn-ghost">查看頁面</span>';
    var badge = live ? "" : '<span class="badge">即將推出</span>';
    var genre = g.genre ? '<p class="game-genre">' + escapeHtml(g.genre) + "</p>" : "";
    var thumb = asset(g.thumb);
    return (
      '<article class="game-item" data-id="' + escapeHtml(g.id) + '"' +
        (live ? "" : ' data-status="upcoming"') + ">" +
        '<a class="game-card" href="' + href + '">' +
          '<div class="game-thumb">' +
            (thumb ? '<img src="' + escapeHtml(thumb) + '" alt="">' : "") +
            badge +
          "</div>" +
          '<div class="game-body">' +
            genre +
            "<h3 class=\"game-title\">" + escapeHtml(g.title || "未命名") + "</h3>" +
            '<p class="game-desc">' + escapeHtml(g.summary || "") + "</p>" +
            (metaBits.length ? '<p class="game-meta">' + metaBits.join(" ／ ") + "</p>" : "") +
            (tags ? '<p class="game-tags">' + tags + "</p>" : "") +
            '<p class="game-cta">' + cta + "</p>" +
          "</div>" +
        "</a>" +
      "</article>"
    );
  }

  function renderGrid(box, tag) {
    if (!box) return;
    var list = games.filter(function (g) {
      if (!tag) return true;
      return (g.tags || []).indexOf(tag) !== -1;
    });
    if (!list.length) {
      box.innerHTML = '<p class="empty">目前沒有符合條件的遊戲。</p>';
      return;
    }
    box.innerHTML = list.map(cardHTML).join("");
  }

  function renderHeroCopy() {
    var t = $("[data-tagline]");
    if (t && SITE.tagline) t.textContent = SITE.tagline;
    var l = $("[data-lead]");
    if (l && SITE.lead) l.textContent = SITE.lead;
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function findGame(id) {
    for (var i = 0; i < games.length; i++) if (games[i].id === id) return games[i];
    return null;
  }

  function renderPlayPage() {
    var stage = $("#play-root");
    if (!stage) return;
    var id = param("id");
    var g = id ? findGame(id) : null;
    if (!g) {
      stage.innerHTML =
        '<p class="crumb"><a href="index.html">首頁</a><span>／</span>遊戲</p>' +
        "<h1>找不到這個遊戲</h1>" +
        '<p class="lead">清單裡沒有這個編號。請回到首頁，或檢查 <code>assets/js/games.js</code> 的 id。</p>' +
        '<p><a class="btn btn-play" href="index.html#games">回到遊戲列表</a></p>';
      document.title = "找不到遊戲｜" + (SITE.studioName || "TONG GAMES");
      return;
    }
    var live = isLive(g);
    document.title = (g.title || "遊戲") + "｜" + (SITE.studioName || "TONG GAMES");
    var tags = (g.tags || []).map(function (t) {
      return '<span class="tag">#' + escapeHtml(t) + "</span>";
    }).join("");
    var metaBits = [];
    if (g.genre) metaBits.push(escapeHtml(g.genre));
    if (g.playTime) metaBits.push(escapeHtml(g.playTime));
    if (g.platforms) metaBits.push(escapeHtml(g.platforms));
    var instructions = (g.instructions || []).filter(Boolean);
    var how = "";
    if (live && instructions.length) {
      how = "<ol class=\"how-list\">" + instructions.map(function (s) {
        return "<li>" + escapeHtml(s) + "</li>";
      }).join("") + "</ol>";
    } else if (live) {
      how = "<p class=\"muted\">這款遊戲還沒有寫操作說明。可在 <code>games.js</code> 的 instructions 補上。</p>";
    } else {
      how =
        "<p>遊戲上架後，操作方式會寫在這裡。</p>" +
        "<p class=\"muted\">把遊戲的 HTML 放到 <code>games/</code>，並在 <code>assets/js/games.js</code> 把這一筆的 <code>status</code> 改成 <code>live</code>、<code>embed</code> 指向檔案路徑，上方的框就會嵌入遊戲。</p>";
    }
    var frame;
    if (live && g.embed) {
      frame =
        '<div class="stage stage-live">' +
          '<iframe src="' + escapeHtml(asset(g.embed)) + '" title="' + escapeHtml(g.title) +
            '" allow="autoplay; fullscreen; pointer-lock; gamepad; clipboard-write" allowfullscreen></iframe>' +
        "</div>";
    } else {
      frame =
        '<div class="stage stage-empty" role="img" aria-label="即將推出">' +
          '<p class="stage-kicker">尚未上架</p>' +
          "<p class=\"stage-title\">即將推出</p>" +
          "<p class=\"stage-note\">這裡之後會直接嵌入遊戲，不用另開網站。</p>" +
        "</div>";
    }
    var cta = live && g.embed
      ? '<a class="btn btn-play" href="' + escapeHtml(asset(g.embed)) + '">全畫面開啟</a>' +
        '<a class="btn btn-ghost" href="' + escapeHtml(asset(g.embed)) + '" target="_blank" rel="noopener">獨立分頁開啟</a>'
      : "";
    stage.innerHTML =
      '<p class="crumb"><a href="index.html">首頁</a><span>／</span><a href="index.html#games">遊戲</a><span>／</span>' +
        escapeHtml(g.title) + "</p>" +
      '<header class="play-head">' +
        (live ? "" : '<p class="badge">即將推出</p>') +
        "<h1>" + escapeHtml(g.title) + "</h1>" +
        (metaBits.length ? '<p class="game-meta">' + metaBits.join(" ／ ") + "</p>" : "") +
        (tags ? '<p class="game-tags">' + tags + "</p>" : "") +
        (g.summary ? '<p class="lead">' + escapeHtml(g.summary) + "</p>" : "") +
      "</header>" +
      frame +
      (cta ? '<p class="play-actions">' + cta + "</p>" : "") +
      '<section class="how" aria-labelledby="how-title">' +
        '<h2 id="how-title">操作說明</h2>' + how +
      "</section>" +
      '<section class="feedback" data-feedback data-game-id="' + escapeHtml(g.id) + '"></section>';
  }

  function navCurrent() {
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$(".site-nav a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
      if (!href) return;
      if (file === href || (file === "" && href === "index.html") || (file === "play.html" && href === "index.html")) {
        if (file === "play.html" && href === "index.html") return;
        a.setAttribute("aria-current", "page");
      }
    });
  }

  applyStudioName();
  renderHeroCopy();
  renderFilters($("#game-filters"));
  renderGrid($("#game-grid"), "");
  renderPlayPage();
  navCurrent();
})();
