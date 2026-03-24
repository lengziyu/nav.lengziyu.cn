#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/apps/nav.lengziyu.cn"
APP_NAME="nav-lengziyu"
APP_PORT="3001"

cd "$APP_DIR"

# 1) 拉最新代码
git pull

# 2) 安装依赖（和 LifeShots 一样优先 cnpm）
if command -v cnpm >/dev/null 2>&1; then
  cnpm i
else
  npm ci || npm i
fi

# 3) 加载环境变量
set -a
source .env
set +a

# 4) 数据库与 Prisma
npx prisma generate
npx prisma db push

# 5) 构建（更稳，避免内存不足）
rm -rf .next
FAST_BUILD=1 NODE_OPTIONS="--max-old-space-size=1536" npx next build --webpack

# 6) 重启 PM2
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  PORT="$APP_PORT" pm2 restart "$APP_NAME" --update-env
else
  PORT="$APP_PORT" pm2 start "npm run start -- -p $APP_PORT" --name "$APP_NAME" --update-env
fi

pm2 save

# 7) 查看状态
pm2 status "$APP_NAME"
pm2 logs "$APP_NAME" --lines 30
