// app/news/[slug]/page.tsx
import type { Metadata } from "next";

type Article = {
  id: string;
  title: string;
  link: string;
  source: string;
  published: string;
  summary?: string;
  category?: string;
  metaDescription?: string;
  attribution?: string;
  slug: string;
  originalLink?: string;
};

async function getArticles(): Promise<Article[]> {
  // Aynı sunucudaki API'den TR yeniden yazılmış listeyi al
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_ORIGIN ?? ""}/api/articles?turkey_first=true&rewrite=tr`, {
    // prod’da 2 dk’da bir yenile
    next: { revalidate: 120 },
  }).catch(() => null as any);

  if (!res || !res.ok) {
    // Origin env yoksa göreli fetch’e düş
    const fallback = await fetch(`/api/articles?turkey_first=true&rewrite=tr`, { cache: "no-store" }).catch(() => null as any);
    if (!fallback || !fallback.ok) return [];
    return (await fallback.json()) as Article[];
  }

  return (await res.json()) as Article[];
}

async function getBySlug(slug: string): Promise<Article | null> {
  const list = await getArticles();
  return list.find((a) => a.slug === slug) ?? null;
}

// SEO meta
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = await getBySlug(params.slug);
  if (!item) return { title: "Haber Bulunamadı | SkyNews.Tr" };

  const title = item.title;
  const desc = item.metaDescription || item.summary || "";
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN || "";
  const url = `${origin}/news/${item.slug}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url || `/news/${item.slug}` },
    openGraph: {
      title,
      description: desc,
      url: url || `/news/${item.slug}`,
      siteName: "SkyNews.Tr",
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function NewsDetail({ params }: { params: { slug: string } }) {
  const item = await getBySlug(params.slug);

  if (!item) {
    return <main className="max-w-3xl mx-auto p-4 md:p-6">Haber bulunamadı.</main>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    datePublished: item.published,
    dateModified: item.published,
    mainEntityOfPage: `/news/${item.slug}`,
    publisher: { "@type": "Organization", name: "SkyNews.Tr" },
    description: item.metaDescription || item.summary || "",
  };

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="text-xs text-slate-400 mb-2">
        {item.source} • {new Date(item.published).toLocaleString("tr-TR")}
      </div>

      <h1 className="text-2xl font-semibold">{item.title}</h1>

      {item.summary && (
        <p className="mt-4 text-base text-slate-200">{item.summary}</p>
      )}

      <div className="mt-6 text-sm text-slate-400">
        Bu içerik SkyNews.Tr editoryal ekibi tarafından otomatik olarak yeniden yazılmıştır.
        Tüm ayrıntılar ve özgün metin için kaynağı ziyaret edin:{" "}
        <a className="underline" href={item.originalLink ?? item.link} target="_blank" rel="noreferrer">
          {item.originalLink ?? item.link}
        </a>
      </div>

      <div className="mt-8">
        <a href="/" className="text-sm underline">← Ana sayfaya dön</a>
      </div>
    </main>
  );
}
