// sitemap.xml üretimi: tüm makalelerin slug'larından sitemap oluşturur.
import { headers } from "next/headers";

export async function GET() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/^https?:\/\//, "") || "localhost:3000";
  const origin = `${proto}://${host}`;

  const res = await fetch(`${origin}/api/articles?turkey_first=true&rewrite=tr`, { cache: "no-store" });
  if (!res.ok) return new Response("Failed", { status: 500 });

  const articles = await res.json();
  const urls = articles.map((a: any) => `${origin}/news/${a.slug}`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `
      <url>
        <loc>${u}</loc>
      </url>
    `).join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}