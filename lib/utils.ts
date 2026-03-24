const FALLBACK_COLORS = [
  "#B6D8F2",
  "#F4C6B5",
  "#D7E7B6",
  "#F2D7EE",
  "#C7DDF7",
  "#F7DEB8",
  "#CFE8E8",
  "#DCCEF4",
];

const GUEST_ALIASES = ["访客甲", "访客乙", "访客丙", "访客丁", "访客戊", "访客己", "访客庚", "访客辛"];

export function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getFallbackColor(seed: string) {
  if (!seed.trim()) {
    return FALLBACK_COLORS[0];
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export function pickGuestAlias(seed?: string) {
  if (!seed) {
    const index = Math.floor(Math.random() * GUEST_ALIASES.length);
    return GUEST_ALIASES[index];
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  return GUEST_ALIASES[Math.abs(hash) % GUEST_ALIASES.length];
}

export function normalizeTagList(tags: string[]) {
  const seen = new Set<string>();

  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
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
