// app/page.tsx
"use client";
import { useEffect, useState } from "react";

type Article = {
  id: string;
  title: string;
  link: string;
  source: string;
  published: string;
  summary?: string;
  category?: string;
};

export default function HomePage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Next.js içindeki kendi API route'unu çağırıyoruz
    const url = `/api/articles?turkey_first=true`;

    (async () => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) {
          const txt = await r.text();
          throw new Error(`HTTP ${r.status} – ${txt}`);
        }
        const data = await r.json();
        // API bazen doğrudan dizi, bazen {articles: []} dönebilir; ikisini de destekle
        const list: Article[] = Array.isArray(data) ? data : (data.articles ?? []);
        setItems(list);
      } catch (e: any) {
        setError(e?.message ?? "Bilinmeyen hata");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Yükleniyor…</div>;
  if (error) return <div className="p-6 text-red-400">Hata: {error}</div>;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <header className="rounded-2xl border border-white/10 p-6 bg-white/5">
        <h1 className="text-2xl font-semibold mb-2">Son Havacılık Haberleri</h1>
        <p className="text-sm text-slate-300">
          İndekste Türkiye kaynakları önceliklidir.
        </p>
      </header>

      <main className="grid gap-6 md:grid-cols-2">
        {items.map((a) => (
          <a
            key={a.id}
            href={a.link}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20 hover:shadow-md transition"
          >
            <div className="text-xs text-slate-300 mb-2">
              {a.source} • {new Date(a.published).toLocaleString("tr-TR")}
            </div>
            <h2 className="text-lg font-medium">{a.title}</h2>
            {a.summary && (
              <p className="mt-2 text-sm text-slate-200 line-clamp-3">
                {a.summary}
              </p>
            )}
          </a>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-slate-300">
            Şu an listelenecek haber bulunamadı.
          </div>
        )}
      </main>

      <footer className="mt-8 text-xs text-slate-400">
        © 2025 SkyNews.Tr — Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
