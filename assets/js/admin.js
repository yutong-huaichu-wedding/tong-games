(function () {
  "use strict";

  var KEY = "tong-games-admin-token";
  var CATEGORY_LABEL = { bug: "問題回報", suggestion: "建議", review: "心得" };

  function apiBase() {
    return String((window.TONG_SITE || {}).apiBase || "").replace(/\/+$/, "");
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function gameTitle(id) {
    if (id === "site") return "全站";
    var games = (window.TONG_SITE && window.TONG_SITE.games) || [];
    for (var i = 0; i < games.length; i++) if (games[i].id === id) return games[i].title || id;
    return id;
  }
  function formatTime(ms) {
    var d = new Date(ms);
    if (isNaN(d.getTime())) return "";
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function token() {
    return (sessionStorage.getItem(KEY) || "").trim();
  }
  function headers() {
    return { "Content-Type": "application/json", Authorization: "Bearer " + token() };
  }

  var gate = document.getElementById("gate");
  var tokenInput = document.getElementById("token");
  var statusSel = document.getElementById("status");
  var msg = document.getElementById("status-msg");
  var list = document.getElementById("list");

  if (!apiBase()) {
    msg.textContent = "尚未設定 apiBase，無法連接留言後端。";
  }
  if (token()) tokenInput.value = token();

  function load() {
    var base = apiBase();
    if (!base) { msg.textContent = "尚未設定 apiBase。"; return; }
    if (!token()) { msg.textContent = "請輸入管理密鑰。"; return; }
    msg.textContent = "讀取中…";
    list.innerHTML = "";
    var url = base + "/api/admin/feedback?status=" + encodeURIComponent(statusSel.value);
    fetch(url, { headers: headers(), credentials: "omit" })
      .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
      .then(function (out) {
        if (out.res.status === 401) {
          msg.textContent = "管理密鑰不正確。";
          sessionStorage.removeItem(KEY);
          return;
        }
        if (!out.res.ok) {
          msg.textContent = out.data.error || "讀取失敗。";
          return;
        }
        var comments = out.data.comments || [];
        msg.textContent = "共 " + comments.length + " 則。";
        list.innerHTML = comments.map(function (c) {
          var cls = c.approved ? "is-approved" : "is-pending";
          var badges = "";
          if (c.approved) badges += '<span class="badge-ok">已公開</span>';
          else if (c.public_requested) badges += '<span class="badge-pub">希望公開</span>';
          else badges += '<span class="badge-priv">僅作者可見</span>';
          var actions = c.approved
            ? '<button type="button" class="btn btn-ghost" data-act="unapprove" data-id="' + escapeHtml(c.id) + '">取消公開</button>'
            : '<button type="button" class="btn btn-play" data-act="approve" data-id="' + escapeHtml(c.id) + '">核准公開</button>';
          actions += '<button type="button" class="btn btn-ghost" data-act="delete" data-id="' + escapeHtml(c.id) + '">刪除</button>';
          return (
            '<article class="admin-item ' + cls + '">' +
              '<div class="admin-meta">' +
                "<strong>" + escapeHtml(gameTitle(c.game_id)) + "</strong>" +
                "<span>" + escapeHtml(CATEGORY_LABEL[c.category] || c.category) + "</span>" +
                "<span>" + "★".repeat(c.rating) + "☆".repeat(5 - c.rating) + "</span>" +
                "<span>" + escapeHtml(c.nickname || "匿名") + "</span>" +
                "<time>" + escapeHtml(formatTime(c.created_at)) + "</time>" +
                badges +
              "</div>" +
              '<p class="fb-body">' + escapeHtml(c.message) + "</p>" +
              '<div class="admin-actions">' + actions + "</div>" +
            "</article>"
          );
        }).join("");
      })
      .catch(function () { msg.textContent = "目前連不上留言服務。"; });
  }

  gate.addEventListener("submit", function (e) {
    e.preventDefault();
    sessionStorage.setItem(KEY, tokenInput.value.trim());
    load();
  });
  statusSel.addEventListener("change", function () {
    if (token()) load();
  });
  list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var action = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");
    if (action === "delete" && !confirm("確定刪除這則留言？")) return;
    btn.disabled = true;
    fetch(apiBase() + "/api/admin/feedback", {
      method: "POST",
      headers: headers(),
      credentials: "omit",
      body: JSON.stringify({ action: action, id: id })
    }).then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
      .then(function (out) {
        if (!out.res.ok) {
          msg.textContent = out.data.error || "操作失敗。";
          btn.disabled = false;
          return;
        }
        load();
      })
      .catch(function () {
        msg.textContent = "目前連不上留言服務。";
        btn.disabled = false;
      });
  });
})();
