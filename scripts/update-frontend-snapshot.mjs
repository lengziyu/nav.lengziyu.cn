import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoConfigs = [
  ["vercel/next.js", "Next.js", "https://nextjs.org", "React 全栈框架，App Router、SSR 与边缘渲染生态成熟。", ["React", "全栈框架", "SSR"]],
  ["facebook/react", "React", "https://react.dev", "组件驱动 UI 基础设施，社区最活跃的前端生态之一。", ["组件", "UI", "生态"]],
  ["vuejs/core", "Vue", "https://vuejs.org", "渐进式前端框架，适合中后台、内容型应用与组件化开发。", ["框架", "渐进式", "组件化"]],
  ["vitejs/vite", "Vite", "https://vite.dev", "下一代前端构建工具，冷启动与热更新体验非常强。", ["构建工具", "开发体验", "工程化"]],
  ["tailwindlabs/tailwindcss", "Tailwind CSS", "https://tailwindcss.com", "原子化 CSS 体系，适合快速搭建设计系统和中大型界面。", ["CSS", "设计系统", "UI"]],
  ["withastro/astro", "Astro", "https://astro.build", "内容驱动网站框架，适合博客、官网与营销页性能优化。", ["静态站点", "内容站", "性能"]],
  ["nuxt/nuxt", "Nuxt", "https://nuxt.com", "Vue 生态的全栈框架，适合服务端渲染与内容应用。", ["Vue", "全栈框架", "SSR"]],
  ["storybookjs/storybook", "Storybook", "https://storybook.js.org", "组件开发与文档工作台，适合设计系统和 UI 测试流程。", ["组件库", "文档", "测试"]],
  ["shadcn-ui/ui", "shadcn/ui", "https://ui.shadcn.com", "开源组件与代码分发平台，适合快速组装现代 React 界面。", ["组件", "React", "UI"]],
  ["TanStack/query", "TanStack Query", "https://tanstack.com/query", "服务端状态与异步数据管理利器，React/Vue/Svelte 都能用。", ["状态管理", "数据请求", "跨框架"]],
  ["web-infra-dev/rspack", "Rspack", "https://rspack.rs", "Rust 驱动的现代打包器，兼顾 webpack 生态兼容与速度。", ["打包器", "Rust", "工程化"]],
  ["unocss/unocss", "UnoCSS", "https://unocss.dev", "按需原子化 CSS 引擎，适合追求极致灵活度的样式体系。", ["CSS", "原子化", "样式引擎"]],
  ["sveltejs/kit", "SvelteKit", "https://svelte.dev/docs/kit", "Svelte 官方应用框架，适合追求轻量和高性能的 Web 项目。", ["Svelte", "应用框架", "性能"]]
];

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "data/frontend-snapshot.json");

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "nav-lengziyu-frontend-sync",
};

const repos = [];

for (const [repo, title, homepage, description, tags] of repoConfigs) {
  const response = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${repo}: ${response.status}`);
  }

  const json = await response.json();
  repos.push({
    title,
    repo,
    url: homepage || json.homepage || json.html_url,
    sourceUrl: json.html_url,
    coverImageUrl: `https://opengraph.githubassets.com/1/${repo}`,
    description,
    stars: json.stargazers_count ?? 0,
    pushedAt: json.pushed_at ?? new Date().toISOString(),
    tags,
  });
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({ source: "https://api.github.com", fetchedAt: new Date().toISOString(), repos }, null, 2)}\n`,
  "utf8",
);

console.info(`Wrote ${repos.length} frontend repos to ${outputPath}`);
