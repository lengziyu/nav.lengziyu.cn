import { slugify } from "@/lib/utils";

type TagClient = {
  tag: {
    upsert: (args: {
      where: { name: string };
      update: Record<string, never>;
      create: { name: string; slug: string };
      select: { id: true };
    }) => Promise<{ id: string }>;
  };
};

function buildTagSlug(name: string) {
  const baseSlug = slugify(name) || "tag";
  return `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function ensureTagIds(client: TagClient, tagNames: string[]) {
  if (tagNames.length === 0) {
    return [];
  }

  const tagIds: string[] = [];

  for (const tagName of tagNames) {
    const tag = await client.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        slug: buildTagSlug(tagName),
      },
      select: { id: true },
    });
    tagIds.push(tag.id);
  }

  return tagIds;
}
