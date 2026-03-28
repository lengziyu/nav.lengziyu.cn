import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_API_URL = "https://api.github.com/repos/xx025/carrot";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, process.argv[2] ?? "data/carrot-snapshot.json");

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function parseEntries(markdown) {
  const sections = markdown.split(/^##\s+/m).slice(1);
  const entries = [];

  for (const sectionBlock of sections) {
    const [rawTitle, ...rest] = sectionBlock.split("\n");
    const section = rawTitle.trim();
    const body = rest.join("\n");
    const rows = body.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];

    for (const row of rows) {
      const cells = [...row.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((match) => match[1].trim());
      if (cells.length < 6) {
        continue;
      }

      const rank = Number.parseInt(stripHtml(cells[0]), 10);
      const coverMatch = cells[1].match(/<img[^>]*src="([^"]+)"/i);
      const linkMatch = cells[2].match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);

      if (!linkMatch) {
        continue;
      }

      entries.push({
        section,
        rank: Number.isNaN(rank) ? null : rank,
        title: stripHtml(linkMatch[2]),
        url: linkMatch[1].trim(),
        coverImageUrl: coverMatch?.[1]?.trim() ?? "",
        description: stripHtml(cells[3]),
      });
    }
  }

  return entries;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "nav-lengziyu-carrot-sync",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/plain",
      "User-Agent": "nav-lengziyu-carrot-sync",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

const repo = await fetchJson(REPO_API_URL);
const readme = await fetchText(
  `https://raw.githubusercontent.com/xx025/carrot/${repo.default_branch ?? "main"}/README.md`,
);
const entries = parseEntries(readme);
const sectionCounts = entries.reduce((result, entry) => {
  result[entry.section] = (result[entry.section] ?? 0) + 1;
  return result;
}, {});

const snapshot = {
  source: "https://github.com/xx025/carrot",
  fetchedAt: new Date().toISOString(),
  repoStars: repo.stargazers_count ?? 0,
  repoUpdatedAt: repo.updated_at ?? null,
  sectionCounts,
  entries,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.info(`Wrote ${entries.length} carrot entries to ${outputPath}`);
