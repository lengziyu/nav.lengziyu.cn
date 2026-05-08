import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";

type CarrotSnapshot = {
  entries?: Array<{
    url?: string;
  }>;
};

type ParsedArgs = {
  apply: boolean;
  snapshotPath: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  let apply = false;
  let snapshotPath = "data/carrot-snapshot.json";

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--apply") {
      apply = true;
      continue;
    }

    if (current === "--snapshot") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("缺少 --snapshot 参数值");
      }
      snapshotPath = next;
      index += 1;
    }
  }

  return { apply, snapshotPath };
}

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

async function loadCarrotUrlKeys(snapshotPath: string) {
  const absolutePath = resolve(process.cwd(), snapshotPath);
  const text = await readFile(absolutePath, "utf8");
  const snapshot = JSON.parse(text) as CarrotSnapshot;
  const urlSet = new Set<string>();

  for (const entry of snapshot.entries ?? []) {
    const url = entry.url?.trim() ?? "";
    if (!url) {
      continue;
    }
    urlSet.add(normalizeUrlKey(url));
  }

  return {
    absolutePath,
    urlSet,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    const { absolutePath, urlSet } = await loadCarrotUrlKeys(args.snapshotPath);

    if (urlSet.size === 0) {
      console.info(`未在快照中解析到可用 URL：${absolutePath}`);
      return;
    }

    const sites = await prisma.site.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const matchedSites = sites.filter((site) => urlSet.has(normalizeUrlKey(site.url)));
    const matchedSiteIds = matchedSites.map((site) => site.id);
    const affectedCategoryIds = [...new Set(matchedSites.map((site) => site.categoryId))];

    const categorySummary = await Promise.all(
      affectedCategoryIds.map(async (categoryId) => {
        const [siteCountAfterDelete, submissionCount] = await Promise.all([
          prisma.site.count({
            where: {
              categoryId,
              id: {
                notIn: matchedSiteIds,
              },
            },
          }),
          prisma.submission.count({
            where: { categoryId },
          }),
        ]);

        const category = matchedSites.find((site) => site.categoryId === categoryId)?.category;
        const canDelete = siteCountAfterDelete === 0 && submissionCount === 0;

        return {
          categoryId,
          categoryName: category?.name ?? categoryId,
          remainingSiteCount: siteCountAfterDelete,
          submissionCount,
          canDelete,
        };
      }),
    );

    const categoriesToDelete = categorySummary.filter((item) => item.canDelete).map((item) => item.categoryId);

    console.info(`快照文件: ${absolutePath}`);
    console.info(`匹配到待删除 carrot 站点: ${matchedSites.length} 条`);
    console.info(`受影响分类: ${categorySummary.length} 个`);

    for (const item of categorySummary) {
      const action = item.canDelete ? "将删除分类" : "保留分类";
      console.info(
        ` - ${item.categoryName}: 清理后剩余站点 ${item.remainingSiteCount}，投稿 ${item.submissionCount} -> ${action}`,
      );
    }

    if (!args.apply) {
      console.info("当前为预览模式，未执行删除。加 --apply 才会真正写入数据库。");
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (matchedSiteIds.length > 0) {
        await tx.site.deleteMany({
          where: {
            id: {
              in: matchedSiteIds,
            },
          },
        });
      }

      if (categoriesToDelete.length > 0) {
        await tx.category.deleteMany({
          where: {
            id: {
              in: categoriesToDelete,
            },
          },
        });
      }
    });

    console.info(`已删除站点: ${matchedSiteIds.length} 条`);
    console.info(`已删除分类: ${categoriesToDelete.length} 个`);
    console.info("清理完成。");
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error("清理失败:", error);
  process.exit(1);
});
