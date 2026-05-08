import { PrismaClient } from "@prisma/client";

type SeedCategory = {
  name: string;
  description: string;
  style: "CARD" | "LIST";
  defaultSort: "HOT" | "LATEST";
};

type HotSite = {
  categoryName: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  coverImageUrl?: string;
  hotScore: number;
};

const CATEGORIES: SeedCategory[] = [
  { name: "AI 对话与搜索", description: "主流大模型助手、联网搜索与问答工具", style: "CARD", defaultSort: "HOT" },
  { name: "AI Agent 自动化", description: "Agent 编排、自动化平台与智能工作流", style: "CARD", defaultSort: "HOT" },
  { name: "AI 编程开发", description: "代码补全、AI IDE 与工程效率工具", style: "CARD", defaultSort: "HOT" },
  { name: "AI 图像与视频", description: "生成式绘图、视频创作与视觉工作流", style: "CARD", defaultSort: "HOT" },
  { name: "AI 模型与平台", description: "模型入口、平台能力与智能体搭建工具", style: "CARD", defaultSort: "HOT" },
  { name: "AI 应用与工作台", description: "行业应用、AI 工作台与一站式工具集合", style: "CARD", defaultSort: "LATEST" },
  { name: "AI 辅助工具", description: "AI 增强效率插件、生产力工具与配套服务", style: "CARD", defaultSort: "LATEST" },
  { name: "AI 音频", description: "语音识别、语音合成、音乐生成与音频工作流", style: "CARD", defaultSort: "LATEST" },
];

const HOT_SITES: HotSite[] = [
  {
    categoryName: "AI 对话与搜索",
    title: "ChatGPT",
    description: "OpenAI 多模态助手，支持对话、写作、编程与工具调用。",
    url: "https://chatgpt.com",
    tags: ["对话", "多模态", "OpenAI"],
    hotScore: 100,
  },
  {
    categoryName: "AI 对话与搜索",
    title: "Claude",
    description: "Anthropic 助手，长文本理解与写作体验优秀。",
    url: "https://claude.ai",
    tags: ["对话", "写作", "Anthropic"],
    hotScore: 98,
  },
  {
    categoryName: "AI 对话与搜索",
    title: "Gemini",
    description: "Google Gemini 助手，支持搜索与多模态内容理解。",
    url: "https://gemini.google.com",
    tags: ["Google", "多模态", "搜索"],
    hotScore: 95,
  },
  {
    categoryName: "AI 对话与搜索",
    title: "Perplexity",
    description: "AI 搜索产品，强调可追溯引用与实时调研。",
    url: "https://www.perplexity.ai",
    tags: ["AI 搜索", "引用", "调研"],
    hotScore: 93,
  },
  {
    categoryName: "AI 对话与搜索",
    title: "Grok",
    description: "xAI 对话助手，强调实时信息与推理能力。",
    url: "https://grok.com",
    tags: ["xAI", "对话", "实时"],
    hotScore: 90,
  },

  {
    categoryName: "AI Agent 自动化",
    title: "OpenAI Agents",
    description: "OpenAI 官方 Agents 平台与工具链入口。",
    url: "https://platform.openai.com/docs/agents",
    tags: ["Agent", "OpenAI", "自动化"],
    hotScore: 99,
  },
  {
    categoryName: "AI Agent 自动化",
    title: "n8n AI Agents",
    description: "n8n 自动化与 AI Agent 工作流编排平台。",
    url: "https://n8n.io",
    tags: ["工作流", "自动化", "Agent"],
    hotScore: 90,
  },
  {
    categoryName: "AI Agent 自动化",
    title: "LangGraph",
    description: "LangChain 生态 Agent 编排框架。",
    url: "https://github.com/langchain-ai/langgraph",
    tags: ["GitHub", "Agent", "编排"],
    hotScore: 92,
  },
  {
    categoryName: "AI Agent 自动化",
    title: "CrewAI",
    description: "多 Agent 协作框架，支持任务分工与流程化执行。",
    url: "https://github.com/crewAIInc/crewAI",
    tags: ["GitHub", "多 Agent", "自动化"],
    hotScore: 88,
  },
  {
    categoryName: "AI Agent 自动化",
    title: "AutoGen",
    description: "微软推出的多 Agent 交互框架。",
    url: "https://github.com/microsoft/autogen",
    tags: ["GitHub", "Microsoft", "多 Agent"],
    hotScore: 87,
  },

  {
    categoryName: "AI 编程开发",
    title: "GitHub Copilot",
    description: "主流 AI 编程助手，支持 IDE 与代码协作。",
    url: "https://github.com/features/copilot",
    tags: ["编程助手", "GitHub", "IDE"],
    hotScore: 98,
  },
  {
    categoryName: "AI 编程开发",
    title: "Cursor",
    description: "面向开发者的 AI IDE，支持上下文代码生成与重构。",
    url: "https://www.cursor.com",
    tags: ["AI IDE", "编程", "重构"],
    hotScore: 97,
  },
  {
    categoryName: "AI 编程开发",
    title: "Windsurf",
    description: "Codeium 推出的 AI 开发环境，强调速度与协作。",
    url: "https://codeium.com/windsurf",
    tags: ["AI IDE", "Codeium", "效率"],
    hotScore: 92,
  },
  {
    categoryName: "AI 编程开发",
    title: "Aider",
    description: "终端 AI 结对编程工具，直接在真实代码仓库上工作。",
    url: "https://aider.chat",
    tags: ["CLI", "Git", "编程助手"],
    hotScore: 91,
  },
  {
    categoryName: "AI 编程开发",
    title: "Continue",
    description: "开源 AI 编程助手框架，可自定义规则与模型。",
    url: "https://github.com/continuedev/continue",
    tags: ["GitHub", "开源", "编程助手"],
    hotScore: 89,
  },

  {
    categoryName: "AI 图像与视频",
    title: "Midjourney",
    description: "高质量 AI 图像生成平台。",
    url: "https://www.midjourney.com",
    tags: ["图像生成", "创意", "设计"],
    hotScore: 97,
  },
  {
    categoryName: "AI 图像与视频",
    title: "Runway",
    description: "AI 视频生成与编辑平台。",
    url: "https://runwayml.com",
    tags: ["视频生成", "创作", "编辑"],
    hotScore: 95,
  },
  {
    categoryName: "AI 图像与视频",
    title: "Pika",
    description: "文本到视频与视频特效生成工具。",
    url: "https://pika.art",
    tags: ["视频生成", "特效", "创作"],
    hotScore: 90,
  },
  {
    categoryName: "AI 图像与视频",
    title: "Leonardo AI",
    description: "面向设计与游戏资产的 AI 图像平台。",
    url: "https://leonardo.ai",
    tags: ["图像生成", "设计", "游戏美术"],
    hotScore: 89,
  },
  {
    categoryName: "AI 图像与视频",
    title: "Luma Dream Machine",
    description: "Luma 推出的高质量文本视频生成工具。",
    url: "https://lumalabs.ai/dream-machine",
    tags: ["视频生成", "创作", "AI"],
    hotScore: 88,
  },

  {
    categoryName: "AI 模型与平台",
    title: "Hugging Face",
    description: "开源模型与数据集生态，覆盖 NLP/多模态/推理部署。",
    url: "https://huggingface.co",
    tags: ["模型平台", "开源", "部署"],
    hotScore: 99,
  },
  {
    categoryName: "AI 模型与平台",
    title: "Replicate",
    description: "模型托管与 API 推理平台，适合快速集成。",
    url: "https://replicate.com",
    tags: ["模型部署", "API", "推理"],
    hotScore: 92,
  },
  {
    categoryName: "AI 模型与平台",
    title: "OpenRouter",
    description: "多模型统一调用网关，便于快速切换模型供应商。",
    url: "https://openrouter.ai",
    tags: ["模型网关", "多模型", "API"],
    hotScore: 91,
  },
  {
    categoryName: "AI 模型与平台",
    title: "Ollama",
    description: "本地运行 LLM 的热门工具链。",
    url: "https://ollama.com",
    tags: ["本地模型", "LLM", "开源"],
    hotScore: 93,
  },
  {
    categoryName: "AI 模型与平台",
    title: "Google AI Studio",
    description: "Google Gemini 模型开发与测试平台。",
    url: "https://aistudio.google.com",
    tags: ["Gemini", "模型平台", "Google"],
    hotScore: 88,
  },

  {
    categoryName: "AI 应用与工作台",
    title: "Notion AI",
    description: "集成在 Notion 中的写作与知识管理 AI。",
    url: "https://www.notion.so/product/ai",
    tags: ["知识管理", "写作", "办公"],
    hotScore: 91,
  },
  {
    categoryName: "AI 应用与工作台",
    title: "Microsoft Copilot",
    description: "微软办公与系统生态中的 AI 助手。",
    url: "https://copilot.microsoft.com",
    tags: ["办公", "微软", "效率"],
    hotScore: 94,
  },
  {
    categoryName: "AI 应用与工作台",
    title: "Canva AI",
    description: "Canva 的 AI 设计与内容生成能力集合。",
    url: "https://www.canva.com/magic-studio/",
    tags: ["设计", "办公", "内容创作"],
    hotScore: 90,
  },
  {
    categoryName: "AI 应用与工作台",
    title: "Zapier AI",
    description: "基于 Zapier 的自动化与 AI 工作流场景。",
    url: "https://zapier.com/ai",
    tags: ["自动化", "工作流", "效率"],
    hotScore: 88,
  },
  {
    categoryName: "AI 应用与工作台",
    title: "Google NotebookLM",
    description: "Google 的 AI 笔记与知识理解工具。",
    url: "https://notebooklm.google.com",
    tags: ["知识库", "笔记", "Google"],
    hotScore: 92,
  },

  {
    categoryName: "AI 辅助工具",
    title: "Flowith",
    description: "面向知识工作者的 AI 工作流与创作辅助工具。",
    url: "https://flowith.io",
    tags: ["工作流", "效率", "创作"],
    hotScore: 86,
  },
  {
    categoryName: "AI 辅助工具",
    title: "Gamma",
    description: "AI 演示文档生成工具，适合快速出稿。",
    url: "https://gamma.app",
    tags: ["演示", "文档", "生成"],
    hotScore: 87,
  },
  {
    categoryName: "AI 辅助工具",
    title: "Perplexity Pages",
    description: "从调研结果快速生成结构化页面内容。",
    url: "https://www.perplexity.ai/pages",
    tags: ["调研", "页面生成", "内容"],
    hotScore: 85,
  },
  {
    categoryName: "AI 辅助工具",
    title: "Figma AI",
    description: "Figma 中的 AI 设计辅助能力。",
    url: "https://www.figma.com/ai/",
    tags: ["设计", "协作", "UI"],
    hotScore: 89,
  },
  {
    categoryName: "AI 辅助工具",
    title: "Raycast AI",
    description: "桌面效率工具中的 AI 指令与自动化能力。",
    url: "https://www.raycast.com/ai",
    tags: ["效率", "桌面", "自动化"],
    hotScore: 84,
  },

  {
    categoryName: "AI 音频",
    title: "ElevenLabs",
    description: "高质量语音合成与配音平台。",
    url: "https://elevenlabs.io",
    tags: ["TTS", "语音合成", "配音"],
    hotScore: 96,
  },
  {
    categoryName: "AI 音频",
    title: "Suno",
    description: "热门 AI 音乐生成平台。",
    url: "https://suno.com",
    tags: ["音乐生成", "AI 音频", "创作"],
    hotScore: 95,
  },
  {
    categoryName: "AI 音频",
    title: "Udio",
    description: "AI 音乐创作工具，支持多风格生成。",
    url: "https://www.udio.com",
    tags: ["音乐生成", "创作", "AI"],
    hotScore: 90,
  },
  {
    categoryName: "AI 音频",
    title: "Whisper",
    description: "OpenAI 开源语音识别模型生态入口。",
    url: "https://github.com/openai/whisper",
    tags: ["ASR", "语音识别", "开源"],
    hotScore: 88,
  },
  {
    categoryName: "AI 音频",
    title: "PlayHT",
    description: "文本转语音与声音克隆平台。",
    url: "https://play.ht",
    tags: ["TTS", "语音克隆", "音频"],
    hotScore: 86,
  },
];

function cleanSiteUrl(rawUrl: string) {
  const input = rawUrl.trim();
  if (!input) {
    return "";
  }

  try {
    const parsed = new URL(input);
    const pathname = parsed.pathname.replace(/\/+$/g, "") || "/";
    const base = `${parsed.protocol}//${parsed.host}`;
    return `${base}${pathname === "/" ? "" : pathname}`;
  } catch {
    return input;
  }
}

function normalizeUrlKey(rawUrl: string) {
  return cleanSiteUrl(rawUrl).toLowerCase();
}

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeTagList(tags: string[]) {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function getFallbackColor(seed: string) {
  const colors = ["#B6D8F2", "#F4C6B5", "#D7E7B6", "#F2D7EE", "#C7DDF7", "#F7DEB8", "#CFE8E8", "#DCCEF4"];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

function parseArgs(argv: string[]) {
  return {
    apply: argv.includes("--apply"),
  };
}

async function ensureCategoryId(
  prisma: PrismaClient,
  categoryMap: Map<string, { id: string; style: "CARD" | "LIST" }>,
  category: SeedCategory,
) {
  const cached = categoryMap.get(category.name);
  if (cached) {
    return cached;
  }

  const existed = await prisma.category.findFirst({
    where: { name: category.name },
    select: { id: true, style: true },
  });

  if (existed) {
    const saved = { id: existed.id, style: existed.style };
    categoryMap.set(category.name, saved);
    return saved;
  }

  const count = await prisma.category.count();
  const created = await prisma.category.create({
    data: {
      name: category.name,
      slug: `${slugify(category.name) || "category"}-${Date.now().toString(36).slice(-6)}`,
      description: category.description,
      style: category.style,
      defaultSort: category.defaultSort,
      sortOrder: count,
    },
    select: { id: true, style: true },
  });

  const saved = { id: created.id, style: created.style };
  categoryMap.set(category.name, saved);
  return saved;
}

async function ensureTagIds(prisma: PrismaClient, tags: string[]) {
  const tagIds: string[] = [];

  for (const tagName of normalizeTagList(tags)) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        slug: `${slugify(tagName) || "tag"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      },
      select: { id: true },
    });
    tagIds.push(tag.id);
  }

  return tagIds;
}

async function main() {
  const prisma = new PrismaClient();
  const args = parseArgs(process.argv.slice(2));

  try {
    const existingSites = await prisma.site.findMany({
      select: { id: true, url: true, title: true },
    });

    const existingUrlKeys = new Set(existingSites.map((site) => normalizeUrlKey(site.url)).filter(Boolean));
    const categoryMap = new Map<string, { id: string; style: "CARD" | "LIST" }>();

    const sortedSites = [...HOT_SITES].sort((a, b) => b.hotScore - a.hotScore);
    const candidates = sortedSites.filter((site) => !existingUrlKeys.has(normalizeUrlKey(site.url)));

    const categoryStats = new Map<string, number>();
    for (const item of HOT_SITES) {
      categoryStats.set(item.categoryName, (categoryStats.get(item.categoryName) ?? 0) + 1);
    }

    console.info(`候选热门站点总数: ${HOT_SITES.length}`);
    console.info(`去重后可新增: ${candidates.length}`);
    console.info(`覆盖分类: ${[...new Set(HOT_SITES.map((item) => item.categoryName))].length}`);

    if (!args.apply) {
      console.info("当前为预览模式，未写入数据库。加 --apply 才会执行导入。");
      return;
    }

    let createdCount = 0;

    for (const site of candidates) {
      const targetCategory = CATEGORIES.find((category) => category.name === site.categoryName);
      if (!targetCategory) {
        continue;
      }

      const category = await ensureCategoryId(prisma, categoryMap, targetCategory);
      const tagIds = await ensureTagIds(prisma, [...site.tags, "热门"]);

      await prisma.site.create({
        data: {
          title: site.title,
          description: site.description,
          url: cleanSiteUrl(site.url),
          coverImageUrl: site.coverImageUrl || null,
          fallbackColor: getFallbackColor(site.title),
          categoryId: category.id,
          publisherType: "ADMIN",
          publisherName: "管理员",
          tags: {
            connect: tagIds.map((id) => ({ id })),
          },
        },
      });

      createdCount += 1;
    }

    console.info(`导入完成: 新增站点 ${createdCount} 条`);
    for (const [categoryName, total] of categoryStats.entries()) {
      console.info(` - ${categoryName}: 模板内 ${total} 条`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error("导入失败:", error);
  process.exit(1);
});
