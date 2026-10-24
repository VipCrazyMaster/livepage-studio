#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
PORT="${1:-7788}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "需要 python3 才能启动本地服务（macOS 自带）。" >&2
  exit 1
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  PORT=$((PORT + 1))
fi

open "http://127.0.0.1:${PORT}/index.html" >/dev/null 2>&1 || true
echo "Livepage Studio: http://127.0.0.1:${PORT}/index.html"
echo "按 Ctrl+C 停止。"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
