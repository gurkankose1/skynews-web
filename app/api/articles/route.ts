import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { rewriteEditorialTR } from "../../../lib/seo";
import { makeSlug } from "../../../lib/slug";

/** helpers */
function textOf(x: any) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  if ((x as any)["#text"]) return (x as any)["#text"];
  return "";
}
function getDomain(u: string) {
  try { return new URL(u).hostname; } catch { return ""; }
}
function isTurkishDomain(url: string) {
  const d = getDomain(url).toLowerCase();
  return d.endsWith(".tr") || d.includes(".gov.tr") || d.includes(".edu.tr");
}

/** normalize one item */
function normalize(item: any) {
  const title = textOf(item.title) || textOf(item["title"]) || "";
  const link =
    (item.link && (item.link["@_href"] || item.link.href)) ||
    (typeof item.link === "string" ? item.link : "") ||
    textOf(item.id) || "";
  const pubRaw = item.pubDate || item.published || item.updated || item["dc:date"] || "";
  const published = pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString();
  const summary = textOf(item.description) || textOf(item.summary) || textOf(item.content) || "";

  return {
    id: link || title || published,
    title: String(title).trim(),
    link: String(link).trim(),
    source: getDomain(String(link)) || "RSS",
    published,
    summary: String(summary).replace(/<[^>]+>/g, "").slice(0, 500),
    category: "",
    metaDescription: "",
    attribution: "",
    slug: "",              // eklenecek
    originalLink: String(link).trim()
  };
}

/** fetch one feed */
async function fetchFeed(url: string) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Feed fetch failed ${res.status} for ${url}`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });
  const data = parser.parse(xml);

  const rssItems = (data as any)?.rss?.channel?.item;
  if (Array.isArray(rssItems)) return rssItems.map(normalize);
  if (rssItems) return [normalize(rssItems)];

  const atomEntries = (data as any)?.feed?.entry;
  if (Array.isArray(atomEntries)) return atomEntries.map(normalize);
  if (atomEntries) return [normalize(atomEntries)];

  const chItems = (data as any)?.channel?.item;
  if (Array.isArray(chItems)) return chItems.map(normalize);
  if (chItems) return [normalize(chItems)];

  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rewrite = searchParams.get("rewrite");                 // "tr" ise kural tabanlı yeniden yaz
  const turkeyFirst = searchParams.get("turkey_first") === "true";

  // kaynaklar: FEEDS env varsa onu kullan
  const envFeeds = process.env.FEEDS?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
  const FEEDS = envFeeds.length ? envFeeds : [
    "https://www.aviation24.be/feed/",
    "https://simpleflying.com/feed/",
    "https://www.airporthaber.com/rss/haber"
  ];

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const merged = results.flatMap(r => (r.status === "fulfilled" ? r.value : []));

  // uniq
  const seen = new Set<string>();
  const unique = merged.filter(a => {
    const k = a.link || a.id;
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // tarihe göre
  unique.sort((a, b) => (a.published > b.published ? -1 : 1));

  // TR üstte
  let ordered = turkeyFirst
    ? [...unique.filter(x => isTurkishDomain(x.link)), ...unique.filter(x => !isTurkishDomain(x.link))]
    : unique;

  // 50'ye kes
  let data = ordered.slice(0, 50);

  // rewrite=tr ise başlık/özet/meta'yı kural tabanlı TR yeniden yaz
  if (rewrite === "tr") {
    data = data.map((a) => {
      const r = rewriteEditorialTR(a);
      const titleForSlug = r?.title || a.title;
      return {
        ...a,
        ...r,
        slug: makeSlug(titleForSlug),
        id: a.id,
        category: a.category ?? "",
      };
    });
  } else {
    data = data.map(a => ({ ...a, slug: makeSlug(a.title) }));
  }

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
