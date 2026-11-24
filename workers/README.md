# TONG GAMES 後端（Cloudflare 免費方案）

三個獨立 Worker，都只走免費方案：Workers + D1（如需要）。**不要把管理密鑰寫進程式或這個說明。**

| 服務 | 目錄 | 預設本機埠 | 正式名稱建議 |
| --- | --- | --- | --- |
| 全站留言 | `workers/feedback` | 8788 | `tong-games-feedback` |
| 灣彩小鎮獎號 API | `workers/wan-tsai` | 8789 | `wan-tsai-time-travel` |
| 聚一桌房間伺服器 | `workers/table-club` | 8787 | `table-club` |

前端網址填在 `assets/js/games.js` 的 `apiBase`、`wanTsaiApiBase`、`tableClubApiBase`（不要斜線結尾）。本機開啟 `127.0.0.1` 或 `localhost` 時，若這三個欄位是空的，會自動連到上面的埠號。


## 已部署的網址

| 服務 | 正式網址 |
| --- | --- |
| 留言 | https://tong-games-feedback.yutong-huaizhu-1212.workers.dev |
| 灣彩小鎮獎號 API | https://wan-tsai-time-travel.yutong-huaizhu-1212.workers.dev |
| 聚一桌 | https://table-club.yutong-huaizhu-1212.workers.dev |

D1：`tong-games-feedback`、`table-club-db`。`wrangler.toml` 已寫入 `database_id` 與本機 CORS。GitHub Pages 上線後請把 Pages 的 origin 加進 CORS / ALLOWED_ORIGINS 再部署。

## 本機測試（不必登入 Cloudflare）

```bash
cd /path/to/portfolio
bash workers/dev-local.sh
# 另開終端
python3 -m http.server 8765
```

瀏覽器開 http://127.0.0.1:8765/ 。管理頁 http://127.0.0.1:8765/admin.html ，本機密鑰見 `workers/feedback/.dev.vars.example`。

## 帳號接上之後怎麼部署

先在本機登入一次（會開瀏覽器授權，不要把 token 貼進程式庫）：

```bash
npx wrangler login
```

### 1. 留言

```bash
cd workers/feedback
npx wrangler d1 create tong-games-feedback
# 把指令回傳的 database_id 寫進 wrangler.toml
npx wrangler d1 migrations apply DB --remote
# 產生密鑰（自己存好，不要提交、不要貼到公開地方）
#   openssl rand -hex 32
npx wrangler secret put ADMIN_TOKEN
# 把 GitHub Pages 的 origin 寫進 wrangler.toml 的 CORS_ORIGINS
# 例：CORS_ORIGINS = "https://<你的帳號>.github.io"
npx wrangler deploy
```

把得到的 `https://tong-games-feedback.<子網域>.workers.dev` 填進 `assets/js/games.js` 的 `apiBase`。

### 2. 灣彩小鎮獎號 API

此 Worker 會向 **台灣彩券官方 API**（`https://api.taiwanlottery.com/TLCAPIWeB/Lottery/`）抓真實歷史獎號，這是遊戲原本的設計，沒有改用假號碼。

```bash
cd workers/wan-tsai
# wrangler.toml 的 CORS_ORIGINS 填 GitHub Pages origin
npx wrangler deploy
```

把 Worker 網址（不含 `/api/draws`）填進 `games.js` 的 `wanTsaiApiBase`。也可寫在 `games/wan-tsai/config.js`。

### 3. 聚一桌房間伺服器

使用 D1 存房間，**沒用 Durable Objects**。D1 在免費方案可用。

```bash
cd workers/table-club
npx wrangler d1 create table-club-db
# 把 database_id 寫進 wrangler.toml
npx wrangler d1 migrations apply DB --remote
# wrangler.toml 的 ALLOWED_ORIGINS 填 GitHub Pages origin
npx wrangler deploy
```

把 Worker 網址（不含 `/api`）填進 `games.js` 的 `tableClubApiBase`。

### 自訂網域（可選、免費）

在 Cloudflare 儀表板把 `*.workers.dev` 換成自己的子網域也可以，記得同步改 CORS 與 `games.js`。
