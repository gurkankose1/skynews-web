import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { rewriteEditorialTR } from "../../../lib/seo";

/** Basit alan birleştirici */
function textOf(x: any) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  if (x["#text"]) return x["#text"];
  return "";
}

function getDomain(u: string) {
  try { return new URL(u).hostname; } catch { return ""; }
}

function isTurkishDomain(url: string) {
  const d = getDomain(url).toLowerCase();
  return d.endsWith(".tr") || d.includes(".gov.tr") || d.includes(".edu.tr");
}

/** RSS/Atom öğesini normalize et */
function normalize(item: any) {
  const title =
    textOf(item.title) ||
    textOf(item["title"]) ||
    "";

  // Link alanı RSS/Atom’da farklılaşabilir
  let link =
    (item.link && (item.link["@_href"] || item.link.href)) ||
    (typeof item.link === "string" ? item.link : "") ||
    textOf(item.id) || "";

  const pubRaw =
    item.pubDate ||
    item.published ||
    item.updated ||
    item["dc:date"] ||
    "";

  const published = pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString();

  const summary =
    textOf(item.description) ||
    textOf(item.summary) ||
    textOf(item.content) ||
    "";

  return {
    id: link || title || published,
    title: String(title).trim(),
    link: String(link).trim(),
    source: getDomain(String(link)) || "RSS",
    published,
    summary: String(summary).replace(/<[^>]+>/g, "").slice(0, 500),
    category: "",
  };
}

/** Tek bir feed URL'ini çekip normalize edilmiş liste döndür */
async function fetchFeed(url: string) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Feed fetch failed ${res.status} for ${url}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
  });
  const data = parser.parse(xml);

  // RSS 2.0
  const rssItems = data?.rss?.channel?.item;
  if (Array.isArray(rssItems)) return rssItems.map(normalize);
  if (rssItems) return [normalize(rssItems)];

  // Atom
  const atomEntries = data?.feed?.entry;
  if (Array.isArray(atomEntries)) return atomEntries.map(normalize);
  if (atomEntries) return [normalize(atomEntries)];

  // Bazı WordPress varyasyonları
  const chItems = data?.channel?.item;
  if (Array.isArray(chItems)) return chItems.map(normalize);
  if (chItems) return [normalize(chItems)];

  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rewrite = searchParams.get("rewrite");         // "tr" gelirse kural tabanlı yeniden yazım
  const turkeyFirst = searchParams.get("turkey_first") === "true"; // TR kaynakları üste

  // Çalıştığı bilinen 2 örnek kaynak (isteyince çoğaltırız veya FEEDS env ile yönetiriz)
  const FEEDS = [
    "https://www.aviation24.be/feed/",
    "https://simpleflying.com/feed/",
  ];

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const merged = results.flatMap(r => (r.status === "fulfilled" ? r.value : []));

  // link/id bazlı uniq
  const seen = new Set<string>();
  const unique = merged.filter(a => {
    const k = a.link || a.id;
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // yeni → eski
  unique.sort((a, b) => (a.published > b.published ? -1 : 1));

  // TR kaynaklarını üste al (isteğe bağlı)
  let ordered = turkeyFirst
    ? [...unique.filter(x => isTurkishDomain(x.link)), ...unique.filter(x => !isTurkishDomain(x.link))]
    : unique;

  // 30’a kes
  let data = ordered.slice(0, 30);

  // "rewrite=tr" ise başlık/özetleri kural tabanlı TR editoryal biçimde yeniden yaz
  if (rewrite === "tr") {
    data = data.map(a => rewriteEditorialTR(a));
  }

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
