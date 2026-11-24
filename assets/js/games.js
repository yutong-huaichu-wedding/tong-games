/* =============================================================================
 * TONG GAMES 網站設定（只需要改這一份檔案）
 * -----------------------------------------------------------------------------
 * 改網站名稱：改 studioName。
 * 上架遊戲：把遊戲放到 /games/<slug>/，在下面 games 陣列新增一筆，
 * status 設成 "live"，並填 title、summary、tags、thumb、embed、instructions。
 * ============================================================================= */

window.TONG_SITE = {
  studioName: "TONG GAMES",
  tagline: "打開分頁，就能開玩。",
  lead: "不用下載、不用註冊，在瀏覽器裡直接玩的小遊戲。",
  year: 2026,

  /* ---------------------------------------------------------------------------
   * 後端網址（不要斜線結尾）。還沒部署時保持空字串，表單會顯示「尚未接上」。
   * 本機用 127.0.0.1 / localhost 開啟且欄位為空時，會自動連 wrangler dev 預設埠。
   *   apiBase          留言 Worker，例如 https://tong-games-feedback.xxx.workers.dev
   *   wanTsaiApiBase   灣彩小鎮獎號 API，不含 /api/draws
   *   tableClubApiBase 聚一桌房間伺服器，不含 /api
   * ------------------------------------------------------------------------- */
  apiBase: "https://tong-games-feedback.yutong-huaizhu-1212.workers.dev",
  wanTsaiApiBase: "https://wan-tsai-time-travel.yutong-huaizhu-1212.workers.dev",
  tableClubApiBase: "https://table-club.yutong-huaizhu-1212.workers.dev",

  games: [
    {
      id: "arctic-home",
      title: "極地家園",
      status: "live",
      genre: "3D 生存經營",
      tags: ["生存", "經營", "3D"],
      summary: "北極熊正從冰原南下。砍樹、獵熊、蓋工廠，守住你的小屋。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/arctic-home.jpg",
      embed: "games/arctic-home/index.html",
      instructions: [
        "WASD／方向鍵移動，或在畫面上拖曳。",
        "北極熊靠近會自動攻擊；打倒後掉落熊肉。靠近西邊森林的樹會自動砍伐。",
        "按 E 或右下按鈕吃烤肉回血。離開戰鬥 8 秒後會慢慢回血。",
        "按 R 進入或離開礦坑；在地下聽到家園遭攻擊時，也可按 R 緊急返家。",
        "Esc／P 開啟暫停選單，可查看成就、重新開始或調整音量。",
        "需連網載入 Babylon.js。鍵盤操作建議按「獨立分頁開啟」。"
      ]
    },
    {
      id: "wan-tsai",
      title: "灣彩小鎮",
      status: "live",
      genre: "時空小鎮",
      tags: ["探索", "彩券模擬"],
      summary: "走在街上忽然撿到一支發亮的手機。可回到過去查真實歷史獎號，在開獎前用虛擬資金簽注。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/wan-tsai.jpg",
      embed: "games/wan-tsai/index.html",
      instructions: [
        "在 2D 小鎮步行、進出店鋪、與店員聊天或請店員代選號碼。",
        "用時空手機選擇 2014～2025 年的時間座標，穿越到開獎前簽注，再快轉對獎。",
        "玩法含今彩539、大樂透、威力彩、賓果賓果（賓果穿越檔案從 2024 年起）。",
        "這是純虛擬資金遊戲，不涉及現金投注或真實兌獎。",
        "官方獎號、歷史穿越與對獎需要獎號 API（會向台灣彩券官方來源查詢真實歷史獎號，不會用假號碼代替）。部署後把網址填進 games.js 的 wanTsaiApiBase，本機測試會自動連到 wrangler dev。"
      ]
    },
    {
      id: "toy-card-house",
      title: "怪有趣玩具屋",
      status: "live",
      genre: "卡牌收集",
      tags: ["卡牌", "一番賞"],
      summary: "手繪迷因卡牌與一番賞經營遊戲。抽生活與美食卡、畫自己的卡，再經營店鋪。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/toy-card-house.jpg",
      embed: "games/toy-card-house/index.html",
      instructions: [
        "在抽卡屋單抽或十連抽；也可玩一番賞。開局 600 鑽石。",
        "可畫一張卡、為卡片定價，並在「我的卡牌店」接待模擬來客。",
        "這是單機網頁版：進度存在這個瀏覽器，可用右上角匯出／匯入存檔。",
        "廣告與儲值都只是模擬，沒有真實金流或實體獎品。"
      ]
    },
    {
      id: "table-club",
      title: "聚一桌",
      status: "live",
      genre: "派對桌遊",
      tags: ["骰子吹牛", "21點"],
      summary: "免登入的骰子吹牛與 21 點，本來支援好友房、隨機配對與電腦對手。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/table-club.jpg",
      embed: "games/table-club/index.html",
      instructions: [
        "在大廳選擇骰子吹牛或 21 點，填暱稱後入座。",
        "吹牛：每人 5 顆骰，依數量與點數遞增喊點，下一家可抓吹牛。",
        "21 點：要牌、停牌、加倍；練習籌碼，對電腦莊家。",
        "好友房與真正開局需要房間伺服器。部署後把網址填進 games.js 的 tableClubApiBase；本機測試會自動連到 wrangler dev。也可以按「獨立分頁開啟」遊玩。"
      ]
    },
    {
      id: "yoru-yatai",
      title: "夜灯屋台",
      status: "live",
      genre: "第一人稱互動",
      tags: ["3D", "料理"],
      summary: "第一人稱拉麵屋台互動原型：從家出發、展開屋台、開火試湯、接客料理，聽三位客人的故事。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/yoru-yatai.jpg",
      embed: "games/yoru-yatai/index.html",
      instructions: [
        "電腦：WASD 移動，移動滑鼠轉頭；點空白處鎖定滑鼠，Esc 釋放。",
        "接近場景物件後，依提示拖曳、向上提、轉動或按住 E。",
        "手機：畫面方向鍵移動，拖曳空白處轉頭，在物件標記上長按或拖曳。",
        "右上角選單可存檔、切換環境音與重設進度。",
        "滑鼠鎖定與鍵盤操作建議按「獨立分頁開啟」。"
      ]
    },
    {
      id: "pet-sitter",
      title: "寵物保姆：等你回家",
      status: "live",
      genre: "3D 寵物照顧",
      tags: ["3D", "照顧"],
      summary: "到別人的家，陪伴可愛的小生命。餵食、換水、清貓砂、陪玩，完成委託後回報。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/pet-sitter.jpg",
      embed: "games/pet-sitter/index.html",
      instructions: [
        "WASD 移動；拖曳畫面或方向鍵轉頭。",
        "E 互動；C 蹲下；Tab 開手機；Esc 關閉選單。",
        "手機：左側搖桿移動，右側滑動轉頭，再點「互動」。",
        "先用手機接案，再從家門出發。完成委託後到手機回報，可獲得報酬。",
        "鍵盤操作建議按「獨立分頁開啟」。"
      ]
    },
    {
      id: "bases-loaded",
      title: "滿壘強打者",
      status: "live",
      genre: "棒球柏青哥",
      tags: ["柏青哥", "經營"],
      summary: "棒球柏青哥加上店面經營。按住球棒出球，本壘入賞後抽打擊結果，全壘打可開啟大入賞口。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/bases-loaded.jpg",
      embed: "games/bases-loaded/index.html",
      instructions: [
        "按住盤面右下球棒持續出球；向上拖曳加強力道、向下減弱，放開停止。",
        "電腦也可按住空白鍵出球；畫面上有自動揮棒開關。",
        "中央本壘入賞後抽打擊結果；安打及保送會累積跑者與待入帳獎勵。",
        "出局會清空本輪攻勢；全壘打會開啟限時大入賞口，打進金色開口才可領獎。",
        "「我的店面」可開店、接待模擬客人並升級裝潢。"
      ]
    },
    {
      id: "stray-cafe",
      title: "浪浪咖啡館",
      status: "live",
      genre: "咖啡館經營",
      tags: ["經營", "料理"],
      summary: "咖啡館經營：烘豆、手沖、拉花、做蛋糕，也能和流浪貓狗互動、培養常客好感。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/stray-cafe.jpg",
      embed: "games/stray-cafe/index.html",
      instructions: [
        "在畫面中點選進行烘豆、手沖、拉花與蛋糕等料理小遊戲。",
        "可升級店鋪、照顧浪浪，並累積常客好感。",
        "提供三個存檔欄位，也可用存檔碼匯入匯出。"
      ]
    },
    {
      id: "skybound-arena",
      title: "凌空鬥技場",
      status: "live",
      genre: "對戰格鬥",
      tags: ["格鬥", "單人"],
      summary: "單人對電腦的登樓格鬥。從低樓層打起，挑戰樓主、進行奪樓與保衛戰。",
      playTime: "",
      platforms: "PC・手機",
      thumb: "assets/img/thumbs/skybound-arena.jpg",
      embed: "games/skybound-arena/index.html",
      instructions: [
        "WASD 或方向鍵移動，角色會自動朝向對手。",
        "J 輕拳、K 重擊、I 抓摔、U 氣衝。",
        "按住 L 防禦；剛按下時可精準格擋。",
        "空白鍵沿移動方向閃避，沒有方向時後撤。Esc 暫停／繼續。",
        "手機提供觸控按鈕。頂端可開關音效；商店可購買食物與裝備。"
      ]
    }
  ]
};

/* 本機預設埠：留言 8788、灣彩小鎮 8789、聚一桌 8787。正式站不會套用。 */
(function (site) {
  if (!site) return;
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  function fallback(value, port) {
    if (value) return String(value).replace(/\/+$/, "");
    if (local) return location.protocol + "//" + location.hostname + ":" + port;
    return "";
  }
  site.apiBase = fallback(site.apiBase, 8788);
  site.wanTsaiApiBase = fallback(site.wanTsaiApiBase, 8789);
  site.tableClubApiBase = fallback(site.tableClubApiBase, 8787);
})(window.TONG_SITE);
