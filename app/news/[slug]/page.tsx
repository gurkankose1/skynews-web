// Detay sayfası: SSR'de mutlak URL ile /api/articles fetch yapılmalı.
// Bu dosya server component olarak kalabilir.
import React from "react";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function fetchArticles() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/^https?:\/\//, "") || "localhost:3000";
  const origin = `${proto}://${host}`;
  const res = await fetch(`${origin}/api/articles?turkey_first=true&rewrite=tr`, { cache: "no-store" });
  if (!res.ok) throw new Error("Articles fetch failed");
  return res.json();
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let article;
  try {
    const articles = await fetchArticles();
    article = articles.find((a: any) => a.slug === slug);
  } catch (e) {
    console.error(e);
  }

  if (!article) {
    return (
      <div>
        <h1>Haber bulunamadı</h1>
        <p>İstenen haber mevcut değil veya slug yanlış: {slug}</p>
        <p><Link href="/">Ana Sayfa</Link></p>
      </div>
    );
  }

  return (
    <article>
      <h1>{article.title}</h1>
      <p><em>{article.source} — {new Date(article.published).toLocaleString("tr-TR")}</em></p>
      <div dangerouslySetInnerHTML={{ __html: article.summary }} />
      <p><a href={article.url} target="_blank" rel="noopener noreferrer">Orijinal kaynağa git</a></p>
    </article>
  );
}