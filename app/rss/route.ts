// Basit RSS export (rewritten Türkçe içerikle)
import { headers } from "next/headers";

export async function GET() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/^https?:\/\//, "") || "localhost:3000";
  const origin = `${proto}://${host}`;

  const res = await fetch(`${origin}/api/articles?turkey_first=true&rewrite=tr`, { cache: "no-store" });
  if (!res.ok) return new Response("Failed", { status: 500 });

  const articles = await res.json();
  const items = articles.slice(0, 50).map((a: any) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${origin}/news/${a.slug}</link>
      <guid>${a.url}</guid>
      <pubDate>${new Date(a.published).toUTCString()}</pubDate>
      <description><![CDATA[${a.summary}]]></description>
    </item>
  `).join("\n");

  const rss = `<?xml version="1.0" encoding="1.0" ?>
  <rss version="2.0">
    <channel>
      <title>SkyNews.Tr - Türkçe Havacılık Haberleri</title>
      <link>${origin}</link>
      <description>Güncel havacılık haberlerinin Türkçe, özgün özetleri</description>
      ${items}
    </channel>
  </rss>
  `;

  return new Response(rss, {
    headers: { "Content-Type": "application/rss+xml", "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}