# TONG GAMES

瀏覽器小遊戲入口網站。打開分頁就能玩，不必下載、也不必註冊。

站名維持 **TONG GAMES**（改 `assets/js/games.js` 的 `studioName` 即可全站替換）。

## 本機預覽

在這一層資料夾執行：

```bash
python3 -m http.server 8765
```

然後打開 http://127.0.0.1:8765/

若要一起測試留言、灣彩小鎮獎號與聚一桌開房，另開終端：

```bash
bash workers/dev-local.sh
```

管理頁：http://127.0.0.1:8765/admin.html  
本機測試密鑰寫在 `workers/feedback/.dev.vars.example`（不要用在正式環境）。

## 只要改一個檔案就能改站

網站名稱、遊戲列表和後端網址都寫在 `assets/js/games.js`。

- 改名稱：改 `studioName`。
- 上架遊戲：把遊戲檔案放到 `games/<slug>/`，在 `games` 陣列新增一筆，把 `status` 設成 `"live"`，並填 `title`、`summary`、`tags`、`thumb`、`embed`、`instructions`。
- 接上後端：填 `apiBase`（留言）、`wanTsaiApiBase`（灣彩小鎮，不含 `/api/draws`）、`tableClubApiBase`（聚一桌，不含 `/api`）。還沒填且在本機開啟時，會自動連 wrangler 的 8788 / 8789 / 8787 埠。正式網站若這三個欄位是空的，留言表單會顯示「尚未接上」，不會壞掉整個頁面。

## GitHub Pages（靜態網站）

這個資料夾已經是 git 倉庫的內容，含 `.nojekyll` 與 `.github/workflows/pages.yml`。**先不要推送，等 GitHub 帳號接上再做。**

建議步驟：

1. 在 GitHub 新建一個公開倉庫，例如 `tong-games`（名稱可自訂）。
2. 把這個資料夾設成遠端並推送到 `main`（不要把 `.dev.vars`、`.wrangler/`、`portfolio-draft.zip` 推上去，已寫在 `.gitignore`）：

```bash
# 若還沒有 commit：
git add .
git status   # 確認沒有密鑰檔
git commit -m "TONG GAMES 網站與 Cloudflare Worker 原始碼"
git remote add origin https://github.com/<你的帳號>/tong-games.git
git branch -M main
git push -u origin main
```

3. 到倉庫 Settings → Pages → Source，選 **GitHub Actions**。工作流程會只發布靜態網站，不會把 `workers/` 放到公開頁面目錄（原始碼仍在倉庫裡，這是正常的）。
4. 網站網址會是 `https://<你的帳號>.github.io/tong-games/`（專案頁）或 `https://<你的帳號>.github.io/`（若倉庫名是 `<帳號>.github.io`）。路徑都是相對路徑，兩種都可以。
5. 把這個 origin（例如 `https://<你的帳號>.github.io`，**不要加路徑**）填進三個 Worker 的 CORS / ALLOWED_ORIGINS，並把 Worker 網址填回 `games.js` 後再 push 一次。

也可以不用 Actions：Settings → Pages → Deploy from a branch，選 `main` 根目錄。那樣 `workers/` 原始碼會以靜態檔出現在網站路徑下，建議還是用 Actions。

## Cloudflare 後端（已部署在免費方案）

三個 Worker 已經上線（沒有開任何付費方案）：

| 服務 | 正式網址 |
| --- | --- |
| 留言 API | https://tong-games-feedback.yutong-huaizhu-1212.workers.dev |
| 灣彩小鎮獎號 API | https://wan-tsai-time-travel.yutong-huaizhu-1212.workers.dev |
| 聚一桌房間伺服器 | https://table-club.yutong-huaizhu-1212.workers.dev |

這些網址已寫進 `assets/js/games.js`（`apiBase`、`wanTsaiApiBase`、`tableClubApiBase`）。CORS 目前允許本機預覽來源 `http://127.0.0.1:8765` 與 `http://localhost:8765`。GitHub Pages 上線後，把 `https://<你的帳號>.github.io` 加進三個 `wrangler.toml` 的 `CORS_ORIGINS` / `ALLOWED_ORIGINS` 再部署一次，否則瀏覽器會擋跨網域請求。

- 留言：`workers/feedback`（Worker + D1 `tong-games-feedback`）。管理密鑰已設成 Worker secret，並只存在本機 `/workspace/portfolio/.secrets/admin-token`（權限 600、已列入 `.gitignore`）。請自行備份到密碼管理器，**不要寫進程式、不要貼到聊天或網站檔案**。管理頁是 `/admin.html`（沒有放在公開選單）。
- 灣彩小鎮：`workers/wan-tsai`。會向台灣彩券官方 API 查真實歷史獎號。
- 聚一桌：`workers/table-club`（Worker + D1 `table-club-db` 存房間）。沒用 Durable Objects。

詳細與之後若要自行再部署的指令見 `workers/README.md`。

## 留言功能怎麼運作

- 各遊戲頁和「留言」頁都有表單：1～5 星、類型（問題回報／建議／心得）、內容、選填暱稱。
- 預設只有作者看得到。玩家可勾選「希望公開顯示」，仍須到 `/admin.html` 核准後才會出現在公開列表（新到舊）。
- 防垃圾：同一 IP 每 10 分鐘最多 5 則，另有隱藏蜜罐欄位。Turnstile 之後可再加。
- 不收集電子郵件或其他必填個人資料。

## 免費方案上限（Cloudflare Workers Free，2026 年文件）

超過當日額度後，該項會失敗，約在 UTC 00:00（台北時間 08:00）重設。

- Workers：每天 100,000 次請求；每次呼叫 CPU 時間 10 毫秒。
- D1：每天 500 萬列讀取、10 萬列寫入；總容量 5 GB；最多 10 個資料庫。本站留言與聚一桌各用一個，共 2 個。
- Durable Objects：免費方案**只支援 SQLite 後端**（每天 100,000 次請求、13,000 GB-s 持續時間，儲存上限比照 D1）。本站目前**沒有使用** DO。
- 灣彩小鎮會對官方網站發出子請求；若官方來源暫時無法連線，對獎會失敗，這是遊戲原本的設計。

GitHub Pages 對公開倉庫是免費的。
