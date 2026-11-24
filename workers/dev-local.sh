#!/usr/bin/env bash
# 本機同時啟動三個 Worker（不部署、不連正式帳號）。
# 用法：在 /workspace/portfolio 執行  bash workers/dev-local.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOCAL_ORIGINS="http://127.0.0.1:8765,http://localhost:8765"

# 留言本機密鑰（與 .dev.vars.example 相同，只用於本機）
if [[ ! -f workers/feedback/.dev.vars ]]; then
  cp workers/feedback/.dev.vars.example workers/feedback/.dev.vars
fi

echo "套用本機 D1 遷移…"
npx --yes wrangler d1 migrations apply DB --local --config workers/feedback/wrangler.toml
npx --yes wrangler d1 migrations apply DB --local --config workers/table-club/wrangler.toml

echo "啟動 Workers："
echo "  留言     http://127.0.0.1:8788"
echo "  灣彩小鎮 http://127.0.0.1:8789"
echo "  聚一桌   http://127.0.0.1:8787"
echo "請另開一個終端：python3 -m http.server 8765"
echo "然後打開 http://127.0.0.1:8765/"

npx --yes wrangler dev --local --port 8788 --config workers/feedback/wrangler.toml \
  --var CORS_ORIGINS:"$LOCAL_ORIGINS" &
PID1=$!
npx --yes wrangler dev --local --port 8789 --config workers/wan-tsai/wrangler.toml \
  --var CORS_ORIGINS:"$LOCAL_ORIGINS" &
PID2=$!
npx --yes wrangler dev --local --port 8787 --config workers/table-club/wrangler.toml \
  --var ALLOWED_ORIGINS:"$LOCAL_ORIGINS" &
PID3=$!

trap 'kill $PID1 $PID2 $PID3 2>/dev/null || true' INT TERM
wait
