# nav.lengziyu.cn

开源导航站模板（AI + 前端方向），包含：

- 访客端导航展示（分类 + 卡片/列表双风格）
- 访客推荐弹窗（投稿后进入审核）
- 管理后台（分类管理、管理员发布、投稿审核）
- 点赞数、浏览数统计
- 骨架屏与卡片 Hover 交互

## 技术栈

- Next.js 16 + TypeScript + App Router
- Prisma + PostgreSQL
- Tailwind CSS 4（样式主要写在 `app/globals.css`）

## 快速开始

```bash
npm install
cp .env.example .env
```

先启动数据库（推荐 Docker）：

```bash
docker compose up -d
```

初始化数据库并导入示例数据：

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

启动开发环境：

```bash
npm run dev
```

- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`

## 后台登录

后台登录密码由环境变量控制：

- `ADMIN_PASSWORD`
- `OPENROUTER_API_KEY`（可选，使用 OpenRouter 云模型时需要）
- `GEMINI_API_KEY`（可选，使用 Gemini 云模型时需要）
- `GITHUB_TOKEN`（可选，用于提高 GitHub 批量抓取频率限制）

本地默认值在 `.env`：`admin123`（上线请务必修改）。

## 目录结构

```text
app/
  admin/                     # 管理后台页面
  api/
    public/                  # 前台公开接口
    admin/                   # 后台接口（Cookie 登录保护）
components/
  navigation-app.tsx         # 前台主界面
  admin-dashboard.tsx        # 后台工作台
lib/
  prisma.ts                  # Prisma 单例
  auth.ts                    # 后台登录 Cookie 逻辑
  validators.ts              # Zod 参数校验
  utils.ts                   # slug / 标签 / 别名 / 默认背景色
prisma/
  schema.prisma
  seed.ts
```

## 业务规则

- 分类可选风格：`CARD`（卡片）或 `LIST`（列表）
- 一个分类只使用一种风格
- 投稿默认状态为 `PENDING`，必须后台审核通过才会公开
- 无封面图时，使用“标题 + 稳定背景色”占位
- 发布人展示：管理员发布显示“管理员”；访客投稿审核通过后显示访客别名（访客甲/乙/丙...）

## 后续建议

- 接入更完整的管理员权限体系（多账号/角色）
- 增加防刷（IP 限流、点赞去重）
- 为 SEO 增加站点地图与结构化数据
- 增加 Playwright E2E 测试

## 生产部署

- 参考 [DEPLOY.md](./DEPLOY.md)
- 一键发布脚本：`deploy.sh`（`/opt/apps/nav.lengziyu.cn` 目录执行）
- 静态更新脚本：`update-static.sh`（只构建并重启，不跑数据库）
- Nginx 模板：`deploy/nginx/nav.lengziyu.cn.conf`
- PM2 模板：`deploy/pm2/ecosystem.config.cjs`
