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
  { name: "前端开发", description: "框架、组件库、样式与工程化工具", style: "CARD", defaultSort: "HOT" },
  { name: "动画交互", description: "动效、3D、交互原型与视觉动画工具", style: "CARD", defaultSort: "LATEST" },
  { name: "好玩 AI", description: "适合探索、娱乐、创作和分享的趣味 AI 产品", style: "CARD", defaultSort: "LATEST" },
  { name: "设计灵感", description: "视觉灵感、交互案例与创意素材", style: "LIST", defaultSort: "LATEST" },
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

const MORE_HOT_SITES: HotSite[] = [
  { categoryName: "AI 对话与搜索", title: "Poe", description: "Quora 推出的多模型聊天平台，可快速切换主流 AI 模型。", url: "https://poe.com", tags: ["多模型", "对话", "Quora"], hotScore: 89 },
  { categoryName: "AI 对话与搜索", title: "You.com", description: "集搜索、聊天、研究与写作于一体的 AI 搜索平台。", url: "https://you.com", tags: ["AI 搜索", "研究", "写作"], hotScore: 86 },
  { categoryName: "AI 对话与搜索", title: "Phind", description: "面向开发者的 AI 搜索与技术问答工具。", url: "https://www.phind.com", tags: ["技术问答", "搜索", "开发者"], hotScore: 84 },
  { categoryName: "AI 对话与搜索", title: "DeepSeek", description: "DeepSeek 官方对话入口，适合推理、编程与中文场景。", url: "https://chat.deepseek.com", tags: ["对话", "推理", "中文"], hotScore: 88 },
  { categoryName: "AI 对话与搜索", title: "Qwen Chat", description: "阿里通义千问官方聊天入口，覆盖多模态与长文本任务。", url: "https://chat.qwen.ai", tags: ["对话", "多模态", "中文"], hotScore: 84 },
  { categoryName: "AI 对话与搜索", title: "Le Chat", description: "Mistral 官方 AI 助手，适合对话、搜索和欧洲模型生态体验。", url: "https://chat.mistral.ai", tags: ["Mistral", "对话", "模型"], hotScore: 82 },
  { categoryName: "AI 对话与搜索", title: "Kimi", description: "月之暗面推出的长文本 AI 助手。", url: "https://kimi.moonshot.cn", tags: ["长文本", "中文", "助手"], hotScore: 83 },
  { categoryName: "AI 对话与搜索", title: "Genspark", description: "面向研究与任务执行的 AI 搜索和 Agent 产品。", url: "https://www.genspark.ai", tags: ["AI 搜索", "Agent", "研究"], hotScore: 85 },

  { categoryName: "AI Agent 自动化", title: "Dify", description: "开源 LLM 应用开发平台，支持工作流、Agent 与 RAG。", url: "https://github.com/langgenius/dify", tags: ["GitHub", "Agent", "RAG"], hotScore: 91 },
  { categoryName: "AI Agent 自动化", title: "Flowise", description: "可视化构建 LLM 流程与 Agent 的开源工具。", url: "https://flowiseai.com", tags: ["可视化", "工作流", "Agent"], hotScore: 89 },
  { categoryName: "AI Agent 自动化", title: "Langflow", description: "用于构建多 Agent 与 LLM 工作流的可视化平台。", url: "https://www.langflow.org", tags: ["Agent", "可视化", "工作流"], hotScore: 86 },
  { categoryName: "AI Agent 自动化", title: "Browser Use", description: "热门开源浏览器 Agent 框架，可让 AI 操作网页完成任务。", url: "https://github.com/browser-use/browser-use", tags: ["GitHub", "浏览器 Agent", "自动化"], hotScore: 90 },
  { categoryName: "AI Agent 自动化", title: "OpenHands", description: "开源软件开发 Agent，可执行端到端开发任务。", url: "https://github.com/OpenHands/OpenHands", tags: ["GitHub", "开发 Agent", "自动化"], hotScore: 88 },
  { categoryName: "AI Agent 自动化", title: "Composio", description: "为 AI Agent 提供工具集成和动作执行能力的平台。", url: "https://composio.dev", tags: ["Agent 工具", "集成", "自动化"], hotScore: 84 },
  { categoryName: "AI Agent 自动化", title: "Mastra", description: "面向 TypeScript 的 AI Agent 与工作流框架。", url: "https://mastra.ai", tags: ["TypeScript", "Agent", "工作流"], hotScore: 83 },
  { categoryName: "AI Agent 自动化", title: "Pydantic AI", description: "Pydantic 团队推出的类型安全 Agent 框架。", url: "https://ai.pydantic.dev", tags: ["Python", "Agent", "框架"], hotScore: 82 },
  { categoryName: "AI Agent 自动化", title: "Activepieces", description: "开源自动化平台，支持 AI 工作流和自托管。", url: "https://www.activepieces.com", tags: ["自动化", "开源", "工作流"], hotScore: 81 },

  { categoryName: "AI 编程开发", title: "Claude Code", description: "Anthropic 的终端编码 Agent，可读写代码并运行命令。", url: "https://docs.anthropic.com/en/docs/claude-code", tags: ["编码 Agent", "终端", "Anthropic"], hotScore: 97 },
  { categoryName: "AI 编程开发", title: "OpenAI Codex", description: "OpenAI 面向软件工程任务的编码 Agent。", url: "https://openai.com/codex", tags: ["编码 Agent", "OpenAI", "开发"], hotScore: 96 },
  { categoryName: "AI 编程开发", title: "Kiro", description: "AWS 推出的 agentic AI IDE，强调从规格到实现的开发流程。", url: "https://kiro.dev", tags: ["AI IDE", "AWS", "Agent"], hotScore: 91 },
  { categoryName: "AI 编程开发", title: "Augment Code", description: "面向大型代码库的 AI 编程助手和 Agent。", url: "https://www.augmentcode.com", tags: ["编程助手", "Agent", "代码库"], hotScore: 90 },
  { categoryName: "AI 编程开发", title: "Devin", description: "Cognition 推出的软件工程 Agent。", url: "https://devin.ai", tags: ["开发 Agent", "自动化", "编程"], hotScore: 93 },
  { categoryName: "AI 编程开发", title: "Qodo", description: "面向测试、代码审查和质量提升的 AI 开发工具。", url: "https://www.qodo.ai", tags: ["测试", "代码审查", "质量"], hotScore: 83 },
  { categoryName: "AI 编程开发", title: "CodeRabbit", description: "AI 代码审查工具，自动总结 PR 并给出审查建议。", url: "https://www.coderabbit.ai", tags: ["代码审查", "PR", "GitHub"], hotScore: 82 },
  { categoryName: "AI 编程开发", title: "Tabnine", description: "企业级 AI 代码补全与开发助手。", url: "https://www.tabnine.com", tags: ["代码补全", "企业", "IDE"], hotScore: 81 },
  { categoryName: "AI 编程开发", title: "Sourcegraph Cody", description: "Sourcegraph 的 AI 编码助手，适合大代码库问答和补全。", url: "https://sourcegraph.com/cody", tags: ["代码搜索", "补全", "大代码库"], hotScore: 80 },

  { categoryName: "AI 图像与视频", title: "Krea", description: "实时图像生成、增强和创意视觉工作台。", url: "https://www.krea.ai", tags: ["图像生成", "实时", "设计"], hotScore: 90 },
  { categoryName: "AI 图像与视频", title: "Ideogram", description: "擅长文字排版和海报创作的 AI 图像生成平台。", url: "https://ideogram.ai", tags: ["图像生成", "字体", "海报"], hotScore: 89 },
  { categoryName: "AI 图像与视频", title: "Higgsfield", description: "面向移动和社交内容的视频生成与运镜工具。", url: "https://higgsfield.ai", tags: ["视频生成", "运镜", "创作"], hotScore: 86 },
  { categoryName: "AI 图像与视频", title: "Hedra", description: "AI 角色视频和口型动画生成工具。", url: "https://www.hedra.com", tags: ["角色视频", "口型", "动画"], hotScore: 85 },
  { categoryName: "AI 图像与视频", title: "HeyGen", description: "AI 数字人视频、翻译和口型同步平台。", url: "https://www.heygen.com", tags: ["数字人", "视频", "翻译"], hotScore: 90 },
  { categoryName: "AI 图像与视频", title: "Synthesia", description: "企业级 AI 数字人视频生成平台。", url: "https://www.synthesia.io", tags: ["数字人", "企业", "视频"], hotScore: 88 },
  { categoryName: "AI 图像与视频", title: "Viggle", description: "用 AI 生成角色动作和趣味视频的创作工具。", url: "https://viggle.ai", tags: ["动作生成", "趣味", "视频"], hotScore: 86 },
  { categoryName: "AI 图像与视频", title: "Civitai", description: "AI 图像模型、LoRA 和创作社区。", url: "https://civitai.com", tags: ["模型社区", "图像", "LoRA"], hotScore: 87 },
  { categoryName: "AI 图像与视频", title: "Freepik AI", description: "Freepik 的 AI 图像、视频和设计生成套件。", url: "https://www.freepik.com/ai", tags: ["设计", "图像", "素材"], hotScore: 82 },

  { categoryName: "AI 模型与平台", title: "fal.ai", description: "面向生成式媒体的高速推理平台，覆盖图像、视频、音频和 3D。", url: "https://fal.ai", tags: ["推理", "媒体生成", "API"], hotScore: 92 },
  { categoryName: "AI 模型与平台", title: "Together AI", description: "开放模型训练、微调和推理平台。", url: "https://www.together.ai", tags: ["推理", "模型", "API"], hotScore: 89 },
  { categoryName: "AI 模型与平台", title: "GroqCloud", description: "高速 LLM 推理平台。", url: "https://console.groq.com", tags: ["推理", "LLM", "API"], hotScore: 88 },
  { categoryName: "AI 模型与平台", title: "Fireworks AI", description: "面向开发者的模型推理与部署平台。", url: "https://fireworks.ai", tags: ["推理", "部署", "API"], hotScore: 86 },
  { categoryName: "AI 模型与平台", title: "Modal", description: "用于运行 AI 工作负载和云函数的开发平台。", url: "https://modal.com", tags: ["云函数", "GPU", "部署"], hotScore: 84 },
  { categoryName: "AI 模型与平台", title: "Baseten", description: "机器学习模型部署和推理基础设施。", url: "https://www.baseten.co", tags: ["模型部署", "推理", "MLOps"], hotScore: 82 },
  { categoryName: "AI 模型与平台", title: "Cerebras Inference", description: "Cerebras 提供的高速 AI 推理服务。", url: "https://inference.cerebras.ai", tags: ["推理", "高速", "模型"], hotScore: 80 },
  { categoryName: "AI 模型与平台", title: "Vercel AI SDK", description: "构建 AI 应用的 TypeScript SDK，支持多模型供应商。", url: "https://sdk.vercel.ai", tags: ["SDK", "前端", "AI 应用"], hotScore: 87 },

  { categoryName: "AI 应用与工作台", title: "Manus", description: "通用 AI Agent 产品，面向复杂任务处理和自动化执行。", url: "https://manus.im", tags: ["Agent", "工作台", "自动化"], hotScore: 90 },
  { categoryName: "AI 应用与工作台", title: "Monica", description: "浏览器和桌面上的 AI 助手，覆盖网页总结、写作和搜索。", url: "https://monica.im", tags: ["浏览器", "助手", "效率"], hotScore: 84 },
  { categoryName: "AI 应用与工作台", title: "Tana", description: "AI 原生知识管理和任务工作台。", url: "https://tana.inc", tags: ["知识管理", "笔记", "工作台"], hotScore: 83 },
  { categoryName: "AI 应用与工作台", title: "Mem", description: "AI 笔记和个人知识管理工具。", url: "https://mem.ai", tags: ["笔记", "知识管理", "AI"], hotScore: 80 },
  { categoryName: "AI 应用与工作台", title: "Fireflies.ai", description: "会议录音、转写和智能总结工具。", url: "https://fireflies.ai", tags: ["会议", "转写", "总结"], hotScore: 84 },
  { categoryName: "AI 应用与工作台", title: "Otter.ai", description: "会议转写和 AI 会议助手。", url: "https://otter.ai", tags: ["会议", "转写", "音频"], hotScore: 83 },
  { categoryName: "AI 应用与工作台", title: "Reclaim AI", description: "智能日程和时间管理工具。", url: "https://reclaim.ai", tags: ["日程", "效率", "自动化"], hotScore: 79 },

  { categoryName: "AI 辅助工具", title: "DeepL Write", description: "DeepL 的 AI 写作润色和改写工具。", url: "https://www.deepl.com/write", tags: ["写作", "翻译", "润色"], hotScore: 84 },
  { categoryName: "AI 辅助工具", title: "Grammarly", description: "AI 写作辅助和语法检查工具。", url: "https://www.grammarly.com", tags: ["写作", "语法", "效率"], hotScore: 86 },
  { categoryName: "AI 辅助工具", title: "Tome", description: "AI 叙事演示和内容生成工具。", url: "https://tome.app", tags: ["演示", "内容", "创作"], hotScore: 82 },
  { categoryName: "AI 辅助工具", title: "Beautiful.ai", description: "AI 演示文稿设计工具。", url: "https://www.beautiful.ai", tags: ["演示", "设计", "办公"], hotScore: 80 },
  { categoryName: "AI 辅助工具", title: "Durable", description: "用 AI 快速生成商业网站和营销内容。", url: "https://durable.co", tags: ["建站", "营销", "AI"], hotScore: 78 },
  { categoryName: "AI 辅助工具", title: "Looka", description: "AI Logo 和品牌视觉生成工具。", url: "https://looka.com", tags: ["Logo", "品牌", "设计"], hotScore: 77 },
  { categoryName: "AI 辅助工具", title: "Cleanup.pictures", description: "在线 AI 图片去除和修复工具。", url: "https://cleanup.pictures", tags: ["图片修复", "去除", "设计"], hotScore: 76 },

  { categoryName: "AI 音频", title: "Deepgram", description: "语音识别、语音理解和语音 AI API。", url: "https://deepgram.com", tags: ["ASR", "语音识别", "API"], hotScore: 89 },
  { categoryName: "AI 音频", title: "AssemblyAI", description: "语音转文本、音频理解和语音智能 API。", url: "https://www.assemblyai.com", tags: ["ASR", "音频理解", "API"], hotScore: 86 },
  { categoryName: "AI 音频", title: "Resemble AI", description: "语音克隆和 AI 配音平台。", url: "https://www.resemble.ai", tags: ["语音克隆", "配音", "TTS"], hotScore: 82 },
  { categoryName: "AI 音频", title: "Murf AI", description: "AI 配音和文本转语音平台。", url: "https://murf.ai", tags: ["TTS", "配音", "音频"], hotScore: 80 },
  { categoryName: "AI 音频", title: "Descript", description: "音视频编辑、转写和 AI 配音工具。", url: "https://www.descript.com", tags: ["转写", "编辑", "配音"], hotScore: 85 },
  { categoryName: "AI 音频", title: "Podcastle", description: "播客录制、编辑和 AI 音频增强平台。", url: "https://podcastle.ai", tags: ["播客", "录音", "音频增强"], hotScore: 79 },
  { categoryName: "AI 音频", title: "Krisp", description: "AI 降噪和会议语音增强工具。", url: "https://krisp.ai", tags: ["降噪", "会议", "音频"], hotScore: 78 },
  { categoryName: "AI 音频", title: "Stable Audio", description: "Stability AI 的音乐和音效生成工具。", url: "https://www.stableaudio.com", tags: ["音乐生成", "音效", "AI"], hotScore: 81 },

  { categoryName: "前端开发", title: "v0", description: "Vercel 的 AI UI 生成工具，适合快速生成 React 和 shadcn 界面。", url: "https://v0.dev", tags: ["AI UI", "React", "Vercel"], hotScore: 96 },
  { categoryName: "前端开发", title: "Bolt.new", description: "StackBlitz 推出的浏览器内 AI 全栈开发工具。", url: "https://bolt.new", tags: ["AI 开发", "浏览器 IDE", "全栈"], hotScore: 95 },
  { categoryName: "前端开发", title: "Lovable", description: "用自然语言快速生成全栈 Web 应用。", url: "https://lovable.dev", tags: ["AI 建站", "全栈", "前端"], hotScore: 94 },
  { categoryName: "前端开发", title: "Replit Agent", description: "Replit 的 AI 应用构建和在线开发 Agent。", url: "https://replit.com/ai", tags: ["AI 开发", "在线 IDE", "Agent"], hotScore: 90 },
  { categoryName: "前端开发", title: "Tempo", description: "面向 React 的 AI UI 构建和设计到代码工具。", url: "https://www.tempo.new", tags: ["React", "AI UI", "设计到代码"], hotScore: 82 },
  { categoryName: "前端开发", title: "Create", description: "用 AI 生成可发布的网站和应用。", url: "https://www.create.xyz", tags: ["AI 建站", "应用生成", "前端"], hotScore: 81 },
  { categoryName: "前端开发", title: "Builder.io Visual Copilot", description: "把 Figma 设计转换为前端代码的 AI 工具。", url: "https://www.builder.io/m/design-to-code", tags: ["设计到代码", "Figma", "前端"], hotScore: 80 },
  { categoryName: "前端开发", title: "Locofy", description: "设计稿转前端代码和组件的工具。", url: "https://www.locofy.ai", tags: ["设计到代码", "前端", "组件"], hotScore: 76 },
  { categoryName: "前端开发", title: "CodeSandbox", description: "浏览器内前端开发环境，适合快速原型和协作。", url: "https://codesandbox.io", tags: ["在线 IDE", "前端", "协作"], hotScore: 79 },
  { categoryName: "前端开发", title: "StackBlitz", description: "WebContainers 驱动的在线前端开发环境。", url: "https://stackblitz.com", tags: ["在线 IDE", "前端", "WebContainers"], hotScore: 80 },

  { categoryName: "动画交互", title: "Rive", description: "交互式矢量动画设计与运行时平台。", url: "https://rive.app", tags: ["交互动画", "动效", "设计"], hotScore: 92 },
  { categoryName: "动画交互", title: "LottieFiles", description: "Lottie 动画资源、编辑和协作平台。", url: "https://lottiefiles.com", tags: ["Lottie", "动画", "素材"], hotScore: 90 },
  { categoryName: "动画交互", title: "Jitter", description: "快速制作界面动效和社交动画的设计工具。", url: "https://jitter.video", tags: ["动效", "视频", "设计"], hotScore: 84 },
  { categoryName: "动画交互", title: "Spline", description: "浏览器内 3D 设计与交互原型工具。", url: "https://spline.design", tags: ["3D", "交互", "设计"], hotScore: 89 },
  { categoryName: "动画交互", title: "Dora", description: "面向 3D 和动效网站的可视化建站工具。", url: "https://www.dora.run", tags: ["3D 网站", "动效", "建站"], hotScore: 86 },
  { categoryName: "动画交互", title: "Framer", description: "高质量动效网站与交互原型构建工具。", url: "https://www.framer.com", tags: ["动效", "网站", "原型"], hotScore: 88 },
  { categoryName: "动画交互", title: "Motion", description: "Framer Motion 的新一代动画库入口。", url: "https://motion.dev", tags: ["动画库", "React", "前端"], hotScore: 83 },
  { categoryName: "动画交互", title: "GSAP", description: "专业 Web 动画库，适合复杂时间线和交互动效。", url: "https://gsap.com", tags: ["动画库", "前端", "交互"], hotScore: 85 },
  { categoryName: "动画交互", title: "Theatre.js", description: "用于网页动画和 3D 场景编排的时间线工具。", url: "https://www.theatrejs.com", tags: ["时间线", "动画", "3D"], hotScore: 78 },
  { categoryName: "动画交互", title: "Three.js", description: "Web 3D 图形和交互体验的核心 JavaScript 库。", url: "https://threejs.org", tags: ["3D", "WebGL", "前端"], hotScore: 91 },

  { categoryName: "好玩 AI", title: "Character.AI", description: "创建和扮演虚拟角色的 AI 社区。", url: "https://character.ai", tags: ["角色", "聊天", "娱乐"], hotScore: 92 },
  { categoryName: "好玩 AI", title: "Replika", description: "个性化 AI 伙伴和对话产品。", url: "https://replika.com", tags: ["AI 伙伴", "聊天", "娱乐"], hotScore: 80 },
  { categoryName: "好玩 AI", title: "Caveduck", description: "AI 角色聊天与剧情互动平台。", url: "https://caveduck.io", tags: ["角色", "互动", "娱乐"], hotScore: 76 },
  { categoryName: "好玩 AI", title: "Glif", description: "可组合的 AI 小工具和趣味生成器社区。", url: "https://glif.app", tags: ["生成器", "趣味", "社区"], hotScore: 84 },
  { categoryName: "好玩 AI", title: "Civitai Generator", description: "模型社区里的 AI 图像生成和分享体验。", url: "https://civitai.com/generate", tags: ["图像生成", "社区", "趣味"], hotScore: 82 },
  { categoryName: "好玩 AI", title: "Bing Image Creator", description: "微软提供的 AI 图像生成入口。", url: "https://www.bing.com/images/create", tags: ["图像生成", "Microsoft", "娱乐"], hotScore: 80 },
  { categoryName: "好玩 AI", title: "Google Labs", description: "Google 实验性 AI 产品和创意工具集合。", url: "https://labs.google", tags: ["实验室", "Google", "AI"], hotScore: 81 },
  { categoryName: "好玩 AI", title: "Luma Genie", description: "Luma 的 3D 和创意生成体验入口。", url: "https://lumalabs.ai/genie", tags: ["3D", "生成", "趣味"], hotScore: 79 },
  { categoryName: "好玩 AI", title: "Suno Explore", description: "探索和创作 AI 音乐的社区体验。", url: "https://suno.com/explore", tags: ["音乐", "社区", "创作"], hotScore: 83 },
  { categoryName: "好玩 AI", title: "Google MusicFX", description: "Google Labs 的 AI 音乐生成实验。", url: "https://aitestkitchen.withgoogle.com/tools/music-fx", tags: ["音乐生成", "Google", "实验"], hotScore: 78 },

  { categoryName: "设计灵感", title: "Mobbin", description: "移动端和 Web 界面模式库，适合产品设计拆解。", url: "https://mobbin.com", tags: ["产品设计", "UI", "案例库"], hotScore: 88 },
  { categoryName: "设计灵感", title: "Godly", description: "精选创意网站合集，适合寻找大胆排版和视觉风格。", url: "https://godly.website", tags: ["创意网站", "排版", "视觉"], hotScore: 84 },
  { categoryName: "设计灵感", title: "Land-book", description: "高质量落地页和品牌页设计灵感库。", url: "https://land-book.com", tags: ["落地页", "品牌", "设计"], hotScore: 82 },
  { categoryName: "设计灵感", title: "Awwwards", description: "高质量网站设计奖项和案例库。", url: "https://www.awwwards.com", tags: ["网站案例", "动效", "设计"], hotScore: 86 },
  { categoryName: "设计灵感", title: "Refero", description: "SaaS 和网页界面设计参考库。", url: "https://refero.design", tags: ["SaaS", "UI", "设计参考"], hotScore: 78 },
  { categoryName: "设计灵感", title: "Page Flows", description: "产品用户流程和界面录屏案例库。", url: "https://pageflows.com", tags: ["用户流程", "产品设计", "案例"], hotScore: 77 },
  { categoryName: "设计灵感", title: "UIverse", description: "前端 UI 组件和交互动效灵感社区。", url: "https://uiverse.io", tags: ["UI", "组件", "动效"], hotScore: 79 },
  { categoryName: "设计灵感", title: "Lapa Ninja", description: "落地页设计灵感和模板集合。", url: "https://www.lapa.ninja", tags: ["落地页", "灵感", "模板"], hotScore: 76 },
];

const ALL_HOT_SITES = [...HOT_SITES, ...MORE_HOT_SITES];

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

function getLogoUrl(rawUrl: string) {
  try {
    const { hostname } = new URL(cleanSiteUrl(rawUrl));
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=256`;
  } catch {
    return null;
  }
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

    const sortedSites = [...ALL_HOT_SITES].sort((a, b) => b.hotScore - a.hotScore);
    const candidates = sortedSites.filter((site) => !existingUrlKeys.has(normalizeUrlKey(site.url)));

    const categoryStats = new Map<string, number>();
    for (const item of ALL_HOT_SITES) {
      categoryStats.set(item.categoryName, (categoryStats.get(item.categoryName) ?? 0) + 1);
    }

    console.info(`候选热门站点总数: ${ALL_HOT_SITES.length}`);
    console.info(`去重后可新增: ${candidates.length}`);
    console.info(`覆盖分类: ${[...new Set(ALL_HOT_SITES.map((item) => item.categoryName))].length}`);

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
          coverImageUrl: site.coverImageUrl || getLogoUrl(site.url),
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
