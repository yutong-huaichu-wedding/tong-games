// 純靜態、獨立開啟時，填入獎號後端網址，不含 /api/draws。
// 若遊戲嵌在 TONG GAMES 遊戲頁，會優先使用 games.js 的 wanTsaiApiBase。
// 本機（localhost / 127.0.0.1）且未填網址時，自動連到 :8789。
(function () {
  var apiBase = "https://wan-tsai-time-travel.yutong-huaizhu-1212.workers.dev";
  try {
    var p = window.parent && window.parent !== window && window.parent.TONG_SITE;
    if (p && p.wanTsaiApiBase) apiBase = String(p.wanTsaiApiBase);
  } catch (e) {}
  if (!apiBase && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    apiBase = location.protocol + "//" + location.hostname + ":8789";
  }
  window.WAN_TSAI_CONFIG = { apiBase: apiBase };
})();
