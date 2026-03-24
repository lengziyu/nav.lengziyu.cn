import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getFallbackColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      sites: {
        where: { status: "APPROVED" },
        orderBy: [{ publishedAt: "desc" }],
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  const data = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    style: category.style,
    description: category.description,
    sites: category.sites.map((site) => ({
      id: site.id,
      title: site.title,
      description: site.description,
      url: site.url,
      coverImageUrl: site.coverImageUrl,
      fallbackColor: site.fallbackColor ?? getFallbackColor(site.title),
      likes: site.likes,
      views: site.views,
      publisherName: site.publisherName,
      publisherType: site.publisherType,
      tags: site.tags,
    })),
  }));

  return NextResponse.json({ categories: data });
}
