// Anasayfa (server component) — ToggleRewrite client component'i kullanır.
// Server component olarak fetch ile rewrite param'ını okur ve API'yi çağırır.
import React from "react";
import ToggleRewrite from "./components/ToggleRewrite";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function fetchArticles(rewrite: string | null) {
  // Server side origin detection
  const host = process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://skynews-tr.vercel.app";
  const q = rewrite ? `?rewrite=${rewrite}` : "";
  const res = await fetch(`${host}/api/articles${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("API fetch failed");
  return res.json();
}

export default async function Home({ searchParams }: { searchParams?: { [k: string]: string } }) {
  const rewrite = searchParams?.rewrite ?? "tr";
  const articles = await fetchArticles(rewrite === "tr" ? "tr" : null);

  return (
    <main>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>SkyNews.Tr</h1>
        <ToggleRewrite />
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
        {articles.map((a: any) => (
          <article key={a.slug} style={{ padding: 12, background: "rgba(255,255,255,0.9)", borderRadius: 8 }}>
            <h2><Link href={`/news/${a.slug}`}>{a.title}</Link></h2>
            <p>{a.summary}</p>
            <small>{a.source} • {new Date(a.published).toLocaleDateString("tr-TR")}</small>
          </article>
        ))}
      </section>
    </main>
  );
}