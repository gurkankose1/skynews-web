// app/news/[slug]/page.tsx
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // sayfayı her istekte tazele

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
  // Önce göreli istek (aynı origin), cache kapalı
  const res = await fetch(`/api/articles?turkey_first=true&rewrite=tr`, {
    cache: "no-store",
  }).catch(() => null as any);

  if (res && res.ok) {
    return (await res.json()) as Article[];
  }

  // (Opsiyonel) Env varsa mutlak URL ile bir kez daha dene
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN || "";
  if (origin) {
    const res2 = await fetch(
      `${origin}/api/articles?turkey_first=true&rewrite=tr`,
      { cache: "no-store" }
    ).catch(() => null as any);
    if (res2 && res2.ok) {
      return (await res2.json()) as Article[];
    }
  }

  return [];
}

async function getBySlug(slug: string): Promise<Article | null> {
  const list = await getArticles();
  return list.find((a) => a.slug === slug) ?? null;
}

/** SEO meta */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const item = await getBySlug(params.slug);
  if (!item) return { title: "Haber Bulunamadı | SkyNews.Tr" };

  const title = item.title;
  const desc = item.metaDescription || item.summary || "";
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN || "";
  const url = `${origin ? origin : ""}/news/${item.slug}`;

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

export default async function NewsDetail({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getBySlug(params.slug);

  if (!item) {
    // Kullanıcıya temiz mesaj
    return (
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-2">Haber bulunamadı</h1>
        <p className="text-slate-300">
          Bu slug için içerik bulunamadı. Lütfen ana sayfadan tekrar deneyin.
        </p>
        <div className="mt-6">
          <a href="/" className="text-sm underline">
            ← Ana sayfaya dön
          </a>
        </div>
      </main>
    );
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="text-xs text-slate-400 mb-2">
        {item.source} • {new Date(item.published).toLocaleString("tr-TR")}
      </div>

      <h1 className="text-2xl font-semibold">{item.title}</h1>

      {item.summary && (
        <p className="mt-4 text-base text-slate-200">{item.summary}</p>
      )}

      <div className="mt-6 text-sm text-slate-400">
        Bu içerik SkyNews.Tr editoryal ekibi tarafından otomatik yeniden yazılmıştır.
        Tüm ayrıntılar ve özgün metin için kaynağı ziyaret edin:{" "}
        <a
          className="underline"
          href={item.originalLink ?? item.link}
          target="_blank"
          rel="noreferrer"
        >
          {item.originalLink ?? item.link}
        </a>
      </div>

      <div className="mt-8">
        <a href="/" className="text-sm underline">
          ← Ana sayfaya dön
        </a>
      </div>
    </main>
  );
}
