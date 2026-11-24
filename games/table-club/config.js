// 獨立開啟時，填入房間伺服器網址，不含 /api。
// 若遊戲嵌在 TONG GAMES 遊戲頁，會優先使用 games.js 的 tableClubApiBase。
// 本機（localhost / 127.0.0.1）且未填網址時，自動連到 :8787。
(function () {
  var apiBase = "https://table-club.yutong-huaizhu-1212.workers.dev";
  try {
    var p = window.parent && window.parent !== window && window.parent.TONG_SITE;
    if (p && p.tableClubApiBase) apiBase = String(p.tableClubApiBase);
  } catch (e) {}
  if (!apiBase && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    apiBase = location.protocol + "//" + location.hostname + ":8787";
  }
  window.TABLE_CLUB_CONFIG = { apiBase: apiBase };
})();
