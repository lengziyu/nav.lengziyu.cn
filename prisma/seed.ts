import { PrismaClient } from "@prisma/client";

import { getFallbackColor, slugify } from "../lib/utils";

const prisma = new PrismaClient();

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  style: "CARD" | "LIST";
};

type SeedSite = {
  categorySlug: string;
  title: string;
  description: string;
  url: string;
  coverImageUrl?: string;
  likes?: number;
  views?: number;
  tags: string[];
};

const categories: SeedCategory[] = [
  {
    name: "AI 对话与搜索",
    slug: "ai-chat-search",
    description: "主流大模型助手、联网搜索与问答工具",
    style: "CARD",
  },
  {
    name: "AI 编程开发",
    slug: "ai-coding-dev",
    description: "代码补全、AI IDE 与工程效率工具",
    style: "CARD",
  },
  {
    name: "AI 图像与视频",
    slug: "ai-image-video",
    description: "生成式绘图、视频创作与视觉工作流",
    style: "CARD",
  },
  {
    name: "AI Agent 自动化",
    slug: "ai-agent-automation",
    description: "Agent 编排、自动化平台与智能工作流",
    style: "CARD",
  },
  {
    name: "前端开发",
    slug: "frontend-dev",
    description: "框架、组件库、样式与工程化工具",
    style: "CARD",
  },
  {
    name: "设计灵感",
    slug: "design-inspiration",
    description: "视觉灵感、交互案例与创意素材",
    style: "LIST",
  },
];

const sites: SeedSite[] = [
  {
    categorySlug: "ai-chat-search",
    title: "ChatGPT",
    description: "多模态 AI 助手，适合写作、分析、编程与日常问答。",
    url: "https://chatgpt.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    likes: 128,
    views: 3210,
    tags: ["对话", "多模态", "生产力"],
  },
  {
    categorySlug: "ai-chat-search",
    title: "Claude",
    description: "擅长长文本理解与写作辅助，适合文档分析和总结。",
    url: "https://claude.ai",
    coverImageUrl:
      "https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=1200&q=80",
    likes: 101,
    views: 2680,
    tags: ["写作", "分析", "助手"],
  },
  {
    categorySlug: "ai-chat-search",
    title: "Gemini",
    description: "Google 生态内的 AI 助手，支持多模态与搜索整合。",
    url: "https://gemini.google.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?auto=format&fit=crop&w=1200&q=80",
    likes: 96,
    views: 2370,
    tags: ["Google", "搜索", "多模态"],
  },
  {
    categorySlug: "ai-chat-search",
    title: "Perplexity",
    description: "AI 搜索引擎，答案可追溯来源，适合调研与知识检索。",
    url: "https://www.perplexity.ai",
    coverImageUrl:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    likes: 89,
    views: 2142,
    tags: ["AI 搜索", "问答", "调研"],
  },
  {
    categorySlug: "ai-chat-search",
    title: "Open WebUI (GitHub)",
    description: "本地/云端统一 AI 对话界面，支持 Ollama 与 OpenAI API。",
    url: "https://github.com/open-webui/open-webui",
    likes: 126,
    views: 128465,
    tags: ["GitHub", "开源", "对话界面"],
  },
  {
    categorySlug: "ai-chat-search",
    title: "LobeHub (GitHub)",
    description: "多模型聊天与 Agent 协作空间，支持插件和团队工作流。",
    url: "https://github.com/lobehub/lobehub",
    likes: 95,
    views: 74219,
    tags: ["GitHub", "多模型", "Agent"],
  },
  {
    categorySlug: "ai-chat-search",
    title: "NextChat (GitHub)",
    description: "轻量快速的 ChatGPT 风格客户端，支持多端部署。",
    url: "https://github.com/ChatGPTNextWeb/NextChat",
    likes: 101,
    views: 87571,
    tags: ["GitHub", "聊天客户端", "多端"],
  },
  {
    categorySlug: "ai-chat-search",
    title: "GPT Researcher (GitHub)",
    description: "自动化深度调研 Agent，可根据主题生成结构化研究结果。",
    url: "https://github.com/assafelovic/gpt-researcher",
    likes: 72,
    views: 25990,
    tags: ["GitHub", "研究 Agent", "自动化"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "GitHub Copilot",
    description: "主流 AI 编程助手，深度集成编辑器与 GitHub 工作流。",
    url: "https://github.com/features/copilot",
    coverImageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    likes: 118,
    views: 2980,
    tags: ["编程助手", "IDE", "代码补全"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "Cursor",
    description: "面向开发者的 AI 编辑器，支持上下文理解和代码生成。",
    url: "https://www.cursor.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    likes: 112,
    views: 2875,
    tags: ["AI IDE", "代码生成", "重构"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "Windsurf",
    description: "Codeium 推出的 AI 开发环境，强调快速迭代和协同开发。",
    url: "https://codeium.com/windsurf",
    coverImageUrl:
      "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
    likes: 87,
    views: 1968,
    tags: ["AI IDE", "效率", "团队协作"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "Aider",
    description: "终端内 AI 结对编程工具，适合 Git 驱动的工程化流程。",
    url: "https://aider.chat",
    coverImageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    likes: 76,
    views: 1740,
    tags: ["CLI", "Git", "结对编程"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "Continue (GitHub)",
    description: "开源 AI 编码助手框架，支持可控规则与 CI 检查流程。",
    url: "https://github.com/continuedev/continue",
    likes: 80,
    views: 32029,
    tags: ["GitHub", "编码助手", "CI"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "Aider (GitHub)",
    description: "终端 AI 结对编程工具，基于 Git 工作流修改真实代码库。",
    url: "https://github.com/Aider-AI/aider",
    likes: 90,
    views: 42320,
    tags: ["GitHub", "CLI", "结对编程"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "Tabby (GitHub)",
    description: "可自托管的 AI 编程助手，兼容主流 IDE 与团队场景。",
    url: "https://github.com/TabbyML/tabby",
    likes: 82,
    views: 33042,
    tags: ["GitHub", "自托管", "IDE"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "OpenHands (GitHub)",
    description: "面向软件开发任务的 AI 工程代理，可执行端到端开发流程。",
    url: "https://github.com/OpenHands/OpenHands",
    likes: 104,
    views: 69654,
    tags: ["GitHub", "开发 Agent", "工程化"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "Open Interpreter (GitHub)",
    description: "通过自然语言驱动电脑执行任务，适合自动化脚本与开发场景。",
    url: "https://github.com/openinterpreter/open-interpreter",
    likes: 92,
    views: 62847,
    tags: ["GitHub", "自动化", "终端"],
  },
  {
    categorySlug: "ai-coding-dev",
    title: "MarkItDown (GitHub)",
    description: "微软开源文档转 Markdown 工具，适合 AI 知识入库预处理。",
    url: "https://github.com/microsoft/markitdown",
    likes: 106,
    views: 92025,
    tags: ["GitHub", "文档处理", "知识库"],
  },
  {
    categorySlug: "ai-image-video",
    title: "Midjourney",
    description: "高质量图像生成工具，适合概念设计与视觉探索。",
    url: "https://www.midjourney.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    likes: 132,
    views: 3365,
    tags: ["AI 绘图", "创意", "视觉"],
  },
  {
    categorySlug: "ai-image-video",
    title: "Runway",
    description: "AI 视频创作平台，支持文生视频、抠像和素材编辑。",
    url: "https://runwayml.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    likes: 99,
    views: 2590,
    tags: ["视频生成", "创作", "后期"],
  },
  {
    categorySlug: "ai-image-video",
    title: "Pika",
    description: "轻量级视频生成工具，适合社媒短视频和快速创意出图。",
    url: "https://pika.art",
    coverImageUrl:
      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=1200&q=80",
    likes: 81,
    views: 1880,
    tags: ["短视频", "AIGC", "快速生成"],
  },
  {
    categorySlug: "ai-image-video",
    title: "Leonardo AI",
    description: "面向设计和游戏资产的图像生成平台，支持风格训练。",
    url: "https://leonardo.ai",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    likes: 84,
    views: 1936,
    tags: ["游戏资产", "图像生成", "风格化"],
  },
  {
    categorySlug: "ai-image-video",
    title: "ComfyUI (GitHub)",
    description: "节点化扩散模型工作流平台，适合复杂图像/视频生成编排。",
    url: "https://github.com/Comfy-Org/ComfyUI",
    likes: 113,
    views: 106782,
    tags: ["GitHub", "工作流", "扩散模型"],
  },
  {
    categorySlug: "ai-image-video",
    title: "Stable Diffusion WebUI (GitHub)",
    description: "最流行的 Stable Diffusion Web 界面之一，生态插件丰富。",
    url: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    likes: 138,
    views: 161968,
    tags: ["GitHub", "Stable Diffusion", "社区生态"],
  },
  {
    categorySlug: "ai-image-video",
    title: "Fooocus (GitHub)",
    description: "聚焦高质量出图体验的开源项目，降低提示词使用门槛。",
    url: "https://github.com/lllyasviel/Fooocus",
    likes: 89,
    views: 47905,
    tags: ["GitHub", "出图工具", "易用性"],
  },
  {
    categorySlug: "ai-image-video",
    title: "Diffusers (GitHub)",
    description: "Hugging Face 扩散模型库，覆盖图像/视频/音频生成。",
    url: "https://github.com/huggingface/diffusers",
    likes: 83,
    views: 33140,
    tags: ["GitHub", "模型库", "生成式 AI"],
  },
  {
    categorySlug: "ai-image-video",
    title: "AnimateDiff (GitHub)",
    description: "文生视频方向的经典开源实现，适合动画生成实验与研究。",
    url: "https://github.com/guoyww/AnimateDiff",
    likes: 69,
    views: 12076,
    tags: ["GitHub", "文生视频", "研究"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "Dify",
    description: "开源 LLM 应用平台，支持流程编排、知识库与多模型接入。",
    url: "https://dify.ai",
    coverImageUrl:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
    likes: 93,
    views: 2445,
    tags: ["开源", "工作流", "LLM 应用"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "LangChain",
    description: "Agent 与应用开发框架，适合构建复杂推理和工具调用链。",
    url: "https://www.langchain.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80",
    likes: 90,
    views: 2331,
    tags: ["Agent", "框架", "RAG"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "n8n",
    description: "自动化编排工具，可结合 AI 节点快速搭建业务流程。",
    url: "https://n8n.io",
    coverImageUrl:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80",
    likes: 88,
    views: 2280,
    tags: ["自动化", "工作流", "集成"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "Zapier AI",
    description: "无代码自动化平台，结合 AI 能力连接常见 SaaS 服务。",
    url: "https://zapier.com/ai",
    coverImageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    likes: 72,
    views: 1810,
    tags: ["无代码", "集成", "自动化"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "AutoGen (GitHub)",
    description: "微软开源 Agent 编程框架，支持多角色协作与任务编排。",
    url: "https://github.com/microsoft/autogen",
    likes: 96,
    views: 56123,
    tags: ["GitHub", "Agent 框架", "多角色"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "CrewAI (GitHub)",
    description: "面向团队协作的 Agent 编排框架，适合分工式任务执行。",
    url: "https://github.com/crewAIInc/crewAI",
    likes: 88,
    views: 47052,
    tags: ["GitHub", "Agent 协作", "编排"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "LangGraph (GitHub)",
    description: "基于图结构构建可恢复 Agent 流程，适合复杂状态机任务。",
    url: "https://github.com/langchain-ai/langgraph",
    likes: 79,
    views: 27331,
    tags: ["GitHub", "状态图", "Agent"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "LangChain (GitHub)",
    description: "LLM 应用与 Agent 开发核心框架，生态成熟、扩展丰富。",
    url: "https://github.com/langchain-ai/langchain",
    likes: 120,
    views: 130855,
    tags: ["GitHub", "框架", "生态"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "Flowise (GitHub)",
    description: "可视化搭建 AI Agent 与流程，适合快速原型和业务集成。",
    url: "https://github.com/FlowiseAI/Flowise",
    likes: 92,
    views: 51035,
    tags: ["GitHub", "可视化", "工作流"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "AutoGPT (GitHub)",
    description: "早期现象级自主 Agent 项目，提供任务驱动自动执行思路。",
    url: "https://github.com/Significant-Gravitas/AutoGPT",
    likes: 142,
    views: 182776,
    tags: ["GitHub", "自主 Agent", "经典项目"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "Browser Use (GitHub)",
    description: "让 AI Agent 可直接操作网站与页面，适合浏览器自动化任务。",
    url: "https://github.com/browser-use/browser-use",
    likes: 104,
    views: 84102,
    tags: ["GitHub", "浏览器自动化", "Agent"],
  },
  {
    categorySlug: "ai-agent-automation",
    title: "Mem0 (GitHub)",
    description: "AI Agent 通用记忆层，帮助系统构建长期上下文与用户画像。",
    url: "https://github.com/mem0ai/mem0",
    likes: 91,
    views: 50894,
    tags: ["GitHub", "记忆系统", "长期上下文"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Vue",
    description: "渐进式前端框架，生态完善，适合中后台与组件化开发。",
    url: "https://vuejs.org",
    coverImageUrl:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    likes: 80,
    views: 1870,
    tags: ["框架", "组件化", "生态"],
  },
  {
    categorySlug: "frontend-dev",
    title: "React",
    description: "组件驱动 UI 库，社区活跃，适合构建复杂前端应用。",
    url: "https://react.dev",
    coverImageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
    likes: 84,
    views: 2032,
    tags: ["组件", "状态管理", "生态"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Tailwind CSS",
    description: "原子化 CSS 工具集，快速构建高一致性的界面。",
    url: "https://tailwindcss.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    likes: 76,
    views: 1690,
    tags: ["CSS", "UI", "工程化"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Vite",
    description: "新一代前端构建工具，启动快、热更新快，开发体验好。",
    url: "https://vite.dev",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80",
    likes: 69,
    views: 1518,
    tags: ["构建工具", "前端工程化", "开发体验"],
  },
  {
    categorySlug: "frontend-dev",
    title: "MDN Web Docs",
    description: "前端标准文档与示例，HTML/CSS/JS 权威参考。",
    url: "https://developer.mozilla.org",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80",
    likes: 73,
    views: 1635,
    tags: ["文档", "Web 标准", "JavaScript"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Next.js (GitHub)",
    description: "Vercel 维护的全栈 React 框架，支持 SSR/ISR 与 App Router。",
    url: "https://github.com/vercel/next.js",
    likes: 127,
    views: 138445,
    tags: ["GitHub", "React", "全栈框架"],
  },
  {
    categorySlug: "frontend-dev",
    title: "React (GitHub)",
    description: "组件化 UI 库，现代前端生态核心基础设施之一。",
    url: "https://github.com/facebook/react",
    likes: 156,
    views: 244146,
    tags: ["GitHub", "UI 库", "组件化"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Vue Core (GitHub)",
    description: "Vue 核心仓库，适合跟踪框架能力演进与最佳实践。",
    url: "https://github.com/vuejs/core",
    likes: 88,
    views: 53306,
    tags: ["GitHub", "Vue", "框架内核"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Vite (GitHub)",
    description: "极速前端构建工具，适合开发与构建流程优化。",
    url: "https://github.com/vitejs/vite",
    likes: 97,
    views: 79305,
    tags: ["GitHub", "构建工具", "工程化"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Tailwind CSS (GitHub)",
    description: "实用优先 CSS 框架，帮助快速搭建一致性 UI 系统。",
    url: "https://github.com/tailwindlabs/tailwindcss",
    likes: 103,
    views: 94173,
    tags: ["GitHub", "CSS", "设计系统"],
  },
  {
    categorySlug: "design-inspiration",
    title: "Dribbble",
    description: "设计师作品社区，适合收集配色和版式灵感。",
    url: "https://dribbble.com",
    likes: 48,
    views: 936,
    tags: ["设计", "灵感", "UI"],
  },
  {
    categorySlug: "design-inspiration",
    title: "Behance",
    description: "Adobe 旗下作品展示平台，覆盖品牌与交互案例。",
    url: "https://www.behance.net",
    likes: 39,
    views: 874,
    tags: ["作品集", "视觉", "创意"],
  },
  {
    categorySlug: "design-inspiration",
    title: "Awwwards",
    description: "收录高质量网站设计案例，适合参考交互与动效细节。",
    url: "https://www.awwwards.com",
    likes: 36,
    views: 842,
    tags: ["网站案例", "交互", "动效"],
  },
  {
    categorySlug: "design-inspiration",
    title: "Mobbin",
    description: "移动端和 Web 界面模式库，适合产品设计拆解与对标。",
    url: "https://mobbin.com",
    likes: 44,
    views: 961,
    tags: ["产品设计", "UI 模式", "案例库"],
  },
  {
    categorySlug: "design-inspiration",
    title: "Land-book",
    description: "聚焦落地页设计的灵感站，适合营销页与品牌页参考。",
    url: "https://land-book.com",
    likes: 33,
    views: 812,
    tags: ["落地页", "营销设计", "品牌"],
  },
  {
    categorySlug: "design-inspiration",
    title: "Godly",
    description: "精选创意网站合集，适合寻找大胆排版和视觉风格灵感。",
    url: "https://godly.website",
    likes: 31,
    views: 765,
    tags: ["创意网站", "排版", "视觉风格"],
  },
];

async function main() {
  await prisma.site.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();

  const categoryMap = new Map<string, string>();

  for (const [index, category] of categories.entries()) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        style: category.style,
        sortOrder: index,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    categoryMap.set(created.slug, created.id);
  }

  for (const site of sites) {
    const categoryId = categoryMap.get(site.categorySlug);

    if (!categoryId) {
      throw new Error(`Category not found for slug ${site.categorySlug}`);
    }

    await prisma.site.create({
      data: {
        title: site.title,
        description: site.description,
        url: site.url,
        coverImageUrl: site.coverImageUrl,
        fallbackColor: getFallbackColor(site.title),
        likes: site.likes ?? 0,
        views: site.views ?? 0,
        categoryId,
        publisherType: "ADMIN",
        publisherName: "管理员",
        tags: {
          connectOrCreate: site.tags.map((tag) => ({
            where: { name: tag },
            create: {
              name: tag,
              slug: slugify(tag) || `tag-${Math.random().toString(36).slice(2, 8)}`,
            },
          })),
        },
      },
    });
  }

  console.info("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
