(function () {
  "use strict";

  var CATEGORIES = [
    { value: "bug", label: "問題回報" },
    { value: "suggestion", label: "建議" },
    { value: "review", label: "心得" }
  ];
  var CATEGORY_LABEL = { bug: "問題回報", suggestion: "建議", review: "心得" };

  function site() { return window.TONG_SITE || {}; }
  function apiBase() { return String(site().apiBase || "").replace(/\/+$/, ""); }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function gameTitle(id) {
    if (id === "site") return "全站";
    var games = site().games || [];
    for (var i = 0; i < games.length; i++) {
      if (games[i].id === id) return games[i].title || id;
    }
    return id;
  }
  function formatTime(ms) {
    var d = new Date(ms);
    if (isNaN(d.getTime())) return "";
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function stars(n) {
    var out = "";
    for (var i = 1; i <= 5; i++) out += i <= n ? "★" : "☆";
    return out;
  }

  function formHtml(gameId) {
    var opts = CATEGORIES.map(function (c) {
      return '<option value="' + c.value + '">' + c.label + "</option>";
    }).join("");
    var starBtns = "";
    for (var i = 1; i <= 5; i++) {
      starBtns += '<button type="button" class="star-btn" data-star="' + i +
        '" aria-label="' + i + ' 顆星">' + "★" + "</button>";
    }
    return (
      '<form class="fb-form" novalidate>' +
        '<input type="hidden" name="game_id" value="' + escapeHtml(gameId) + '">' +
        '<p class="fb-note">預設只有作者看得到。若希望公開顯示，請勾選下方選項；仍須作者審核後才會出現在這裡。不必填電子郵件或其他個人資料。</p>' +
        '<div class="fb-row">' +
          '<fieldset class="fb-stars">' +
            "<legend>評分</legend>" +
            '<div class="star-row" role="radiogroup" aria-label="1 到 5 顆星">' + starBtns + "</div>" +
            '<input type="hidden" name="rating" value="0">' +
          "</fieldset>" +
          '<label class="fb-field">類型' +
            '<select name="category" required>' +
              '<option value="" selected disabled>請選擇</option>' + opts +
            "</select>" +
          "</label>" +
        "</div>" +
        '<label class="fb-field">留言' +
          '<textarea name="message" required minlength="4" maxlength="1000" rows="5" placeholder="想說的話、遇到的問題，或建議。"></textarea>' +
          '<span class="fb-count"><span data-count>0</span> / 1000</span>' +
        "</label>" +
        '<label class="fb-field">暱稱（選填）' +
          '<input type="text" name="nickname" maxlength="40" placeholder="可不填，空白會顯示為匿名" autocomplete="nickname">' +
        "</label>" +
        '<label class="fb-hp" aria-hidden="true">網站<input type="text" name="website" tabindex="-1" autocomplete="off"></label>' +
        '<label class="fb-check"><input type="checkbox" name="public_requested"> 希望公開顯示這則留言（仍須作者同意）</label>' +
        '<p class="fb-status" role="status" aria-live="polite"></p>' +
        '<p class="fb-actions"><button type="submit" class="btn btn-play">送出留言</button></p>' +
      "</form>"
    );
  }

  function bindForm(root, form) {
    var status = form.querySelector(".fb-status");
    var ratingInput = form.querySelector('[name="rating"]');
    var starRow = form.querySelector(".star-row");
    var area = form.querySelector('[name="message"]');
    var count = form.querySelector("[data-count]");
    var submitBtn = form.querySelector('[type="submit"]');

    function setStars(n) {
      ratingInput.value = String(n);
      var btns = starRow.querySelectorAll(".star-btn");
      for (var i = 0; i < btns.length; i++) {
        var v = i + 1;
        btns[i].classList.toggle("is-on", v <= n);
        btns[i].setAttribute("aria-checked", v === n ? "true" : "false");
      }
    }
    starRow.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-star]");
      if (!btn) return;
      setStars(Number(btn.getAttribute("data-star")));
    });

    area.addEventListener("input", function () {
      count.textContent = String(area.value.length);
    });

    var base = apiBase();
    if (!base) {
      status.textContent = "留言功能尚未接上後端。部署 Cloudflare Worker 後，把網址填進 assets/js/games.js 的 apiBase 即可。";
      submitBtn.disabled = true;
      return;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      var rating = Number(ratingInput.value);
      var category = form.category.value;
      var message = form.message.value.trim();
      if (!rating) { status.textContent = "請先點選 1 到 5 顆星。"; return; }
      if (!category) { status.textContent = "請選擇留言類型。"; return; }
      if (message.length < 4) { status.textContent = "留言請至少寫 4 個字。"; return; }

      submitBtn.disabled = true;
      status.textContent = "送出中…";
      fetch(base + "/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          game_id: form.game_id.value,
          rating: rating,
          category: category,
          message: message,
          nickname: form.nickname.value.trim(),
          public_requested: form.public_requested.checked,
          website: form.website.value
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          return { res: res, data: data };
        }).catch(function () {
          return { res: res, data: {} };
        });
      }).then(function (out) {
        if (!out.res.ok) {
          status.textContent = out.data.error || "送出失敗，請稍後再試。";
          submitBtn.disabled = false;
          return;
        }
        form.reset();
        setStars(0);
        count.textContent = "0";
        status.textContent = "已送出，謝謝。作者會收到這則留言。" +
          (form.public_requested ? "" : "");
        submitBtn.disabled = false;
      }).catch(function () {
        status.textContent = "目前連不上留言服務，請稍後再試。";
        submitBtn.disabled = false;
      });
    });
  }

  function renderList(box, comments) {
    if (!comments.length) {
      box.innerHTML = '<p class="muted">還沒有公開留言。</p>';
      return;
    }
    box.innerHTML = comments.map(function (c) {
      var name = c.nickname ? escapeHtml(c.nickname) : "匿名";
      return (
        '<article class="fb-item">' +
          '<header class="fb-item-head">' +
            '<span class="fb-stars-read" aria-label="' + c.rating + ' 顆星">' + stars(c.rating) + "</span>" +
            '<span class="fb-cat">' + escapeHtml(CATEGORY_LABEL[c.category] || c.category) + "</span>" +
            '<span class="fb-who">' + name + "</span>" +
            '<time class="fb-time">' + escapeHtml(formatTime(c.created_at)) + "</time>" +
          "</header>" +
          '<p class="fb-body">' + escapeHtml(c.message) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  function loadList(box, gameId) {
    var base = apiBase();
    if (!base) {
      box.innerHTML = '<p class="muted">留言後端尚未設定，暫時無法顯示公開留言。</p>';
      return;
    }
    box.innerHTML = '<p class="muted">載入留言中…</p>';
    fetch(base + "/api/feedback?game_id=" + encodeURIComponent(gameId), { credentials: "omit" })
      .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
      .then(function (out) {
        if (!out.res.ok) {
          box.innerHTML = '<p class="muted">暫時無法載入公開留言。</p>';
          return;
        }
        renderList(box, out.data.comments || []);
      })
      .catch(function () {
        box.innerHTML = '<p class="muted">暫時無法載入公開留言。</p>';
      });
  }

  function mountOne(el) {
    if (!el || el.getAttribute("data-fb-mounted")) return;
    el.setAttribute("data-fb-mounted", "1");
    var gameId = el.getAttribute("data-game-id") || "site";
    var title = gameId === "site" ? "給網站的留言" : "給「" + gameTitle(gameId) + "」的留言";
    el.innerHTML =
      "<h2>" + escapeHtml(title) + "</h2>" +
      formHtml(gameId) +
      '<div class="fb-list-wrap">' +
        "<h3>公開留言</h3>" +
        '<div class="fb-list" data-list></div>' +
      "</div>";
    bindForm(el, el.querySelector("form"));
    loadList(el.querySelector("[data-list]"), gameId);
  }

  function mount() {
    var nodes = document.querySelectorAll("[data-feedback]");
    for (var i = 0; i < nodes.length; i++) mountOne(nodes[i]);
  }

  window.TONG_FEEDBACK = { mount: mount };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
