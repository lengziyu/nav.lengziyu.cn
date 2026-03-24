#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/apps/nav.lengziyu.cn"
APP_NAME="nav-lengziyu"
APP_PORT="3001"

cd "$APP_DIR"

# 只更新前端静态/样式相关变更：不执行 Prisma / 不动数据库
git pull

if command -v cnpm >/dev/null 2>&1; then
  cnpm i
else
  npm ci || npm i
fi

rm -rf .next
FAST_BUILD=1 NODE_OPTIONS="--max-old-space-size=1536" npx next build --webpack

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  PORT="$APP_PORT" pm2 restart "$APP_NAME" --update-env
else
  PORT="$APP_PORT" pm2 start "npm run start -- -p $APP_PORT" --name "$APP_NAME" --update-env
fi

pm2 save
pm2 status "$APP_NAME"
