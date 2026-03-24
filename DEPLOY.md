# 部署说明（LifeShots 同款 /opt/apps）

## 1. 目录与代码

```bash
sudo mkdir -p /opt/apps
cd /opt/apps
sudo git clone https://github.com/<your-name>/nav.lengziyu.cn.git
sudo chown -R $USER:$USER /opt/apps/nav.lengziyu.cn
cd /opt/apps/nav.lengziyu.cn
cp .env.example .env
```

编辑 `.env`（至少改 `DATABASE_URL`、`ADMIN_PASSWORD`）。

## 2. 数据库（可选 Docker）

```bash
cd /opt/apps/nav.lengziyu.cn
docker compose up -d
```

## 3. 首次启动 PM2

```bash
cd /opt/apps/nav.lengziyu.cn
npm i -g pm2
npm ci || npm i
npx prisma generate
npx prisma db push
npx prisma db seed
FAST_BUILD=1 NODE_OPTIONS="--max-old-space-size=1536" npx next build --webpack
PORT=3001 pm2 start "npm run start -- -p 3001" --name nav-lengziyu --update-env
pm2 save
pm2 startup
```

## 4. 日常发布（一键）

项目根目录已提供 `deploy.sh`，和 LifeShots 一样：

```bash
cd /opt/apps/nav.lengziyu.cn
bash ./deploy.sh
```

## 4.1 只更新静态（不动数据库）

```bash
cd /opt/apps/nav.lengziyu.cn
bash ./update-static.sh
```

## 5. Nginx（同 LifeShots 风格）

```bash
sudo cp /opt/apps/nav.lengziyu.cn/deploy/nginx/nav.lengziyu.cn.conf /etc/nginx/conf.d/nav.lengziyu.cn.conf
sudo nginx -t
sudo systemctl reload nginx
```
