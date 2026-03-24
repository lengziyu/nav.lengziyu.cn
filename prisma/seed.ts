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
    name: "AI 工具",
    slug: "ai-tools",
    description: "大模型、AI 生产力与 Agent 工具导航",
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
    categorySlug: "ai-tools",
    title: "OpenAI",
    description: "AI 模型与 API 平台，支持文本、图像与多模态能力。",
    url: "https://openai.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    likes: 86,
    views: 1920,
    tags: ["AI", "LLM", "API"],
  },
  {
    categorySlug: "ai-tools",
    title: "Hugging Face",
    description: "开源模型社区，提供模型托管、推理和训练生态。",
    url: "https://huggingface.co",
    coverImageUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    likes: 74,
    views: 1498,
    tags: ["模型", "开源", "机器学习"],
  },
  {
    categorySlug: "frontend-dev",
    title: "MDN Web Docs",
    description: "前端标准文档与示例，HTML/CSS/JS 权威参考。",
    url: "https://developer.mozilla.org",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    likes: 52,
    views: 1106,
    tags: ["文档", "Web 标准", "JavaScript"],
  },
  {
    categorySlug: "frontend-dev",
    title: "Tailwind CSS",
    description: "原子化 CSS 工具集，快速构建高一致性的界面。",
    url: "https://tailwindcss.com",
    coverImageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    likes: 61,
    views: 1308,
    tags: ["CSS", "UI", "前端"],
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
