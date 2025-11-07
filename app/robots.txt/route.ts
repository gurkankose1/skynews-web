export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://skynews-tr.vercel.app";
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`;
  return new Response(content, {
    headers: { "Content-Type": "text/plain" },
  });
}