import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "src", "data", "vimeoProfileVideos.ts");

const defaultProfileUrl = process.argv[2] ?? "https://vimeo.com/user71716690/videos";

const decodeHtml = (value = "") =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, "\"")
    .replace(/&ldquo;/g, "\"")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeTsString = (value = "") => JSON.stringify(value);

const ensureAbsoluteUrl = (value) => {
  if (!value) {
    return "";
  }
  return value.startsWith("http") ? value : `https://vimeo.com${value}`;
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; FlipSystem/1.0; +https://example.com)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }

  return response.text();
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; FlipSystem/1.0; +https://example.com)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }

  return response.json();
};

const extractItemList = (html) => {
  const match = html.match(/<script type="application\/ld\+json">\s*(\[[\s\S]*?\])\s*<\/script>/i);
  if (!match) {
    return [];
  }

  const payload = JSON.parse(match[1]);
  const itemList = payload.find((entry) => entry["@type"] === "ItemList");
  return itemList?.itemListElement ?? [];
};

const extractNextPageUrl = (html) => {
  const match = html.match(/<link rel="next" href="([^"]+)"/i);
  return match ? ensureAbsoluteUrl(match[1]) : "";
};

const extractEmbedUrl = (html) => {
  const match = html.match(/src="(https:\/\/player\.vimeo\.com\/video\/\d+[^"]*)"/i);
  return match?.[1] ?? "";
};

const getVideoIds = async (profileUrl) => {
  const seen = new Set();
  const ids = [];
  let nextUrl = profileUrl;

  while (nextUrl) {
    const html = await fetchText(nextUrl);
    const items = extractItemList(html);

    for (const item of items) {
      const relativeUrl = item.url ?? item.item?.url ?? item.item?.["@id"];
      const videoId = `${relativeUrl ?? ""}`.replace(/^\/+/, "").trim();
      if (!videoId || seen.has(videoId)) {
        continue;
      }

      seen.add(videoId);
      ids.push(videoId);
    }

    nextUrl = extractNextPageUrl(html);
  }

  return ids;
};

const getVideoEntry = async (videoId) => {
  const pageUrl = `https://vimeo.com/${videoId}`;
  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`;
  const [oembed, pageHtml] = await Promise.all([fetchJson(oembedUrl), fetchText(pageUrl)]);
  const embedUrl = extractEmbedUrl(oembed.html) || extractEmbedUrl(pageHtml);

  return {
    id: `vimeo-${videoId}`,
    title: decodeHtml(oembed.title),
    description: decodeHtml(oembed.description || `Vimeo video from ${oembed.author_name || "Aureus Alliance Holdings"}.`),
    contentUrl: pageUrl,
    contentKind: "video",
    fileName: `${videoId}.vimeo`,
    provider: "vimeo",
    embedUrl,
    externalUrl: pageUrl,
    posterUrl: oembed.thumbnail_url || "",
    durationSeconds: Number(oembed.duration) || 0
  };
};

const main = async () => {
  const ids = await getVideoIds(defaultProfileUrl);
  const entries = [];

  for (const videoId of ids) {
    entries.push(await getVideoEntry(videoId));
  }

  const fileBody = `import type { ContentPage } from "../types";

export const vimeoProfileLabel = ${escapeTsString(defaultProfileUrl)};

export const vimeoProfileVideos: ContentPage[] = [
${entries
  .map(
    (entry) => `  {
    id: ${escapeTsString(entry.id)},
    title: ${escapeTsString(entry.title)},
    description: ${escapeTsString(entry.description)},
    contentUrl: ${escapeTsString(entry.contentUrl)},
    contentKind: "video",
    fileName: ${escapeTsString(entry.fileName)},
    provider: "vimeo",
    embedUrl: ${escapeTsString(entry.embedUrl)},
    externalUrl: ${escapeTsString(entry.externalUrl)},
    posterUrl: ${escapeTsString(entry.posterUrl)},
    durationSeconds: ${entry.durationSeconds}
  }`
  )
  .join(",\n")}
];
`;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, fileBody, "utf8");
  console.log(`Wrote ${entries.length} Vimeo videos to ${outputPath}`);
};

await main();
