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
    const API = process.env.NEXT_PUBLIC_API_URL ?? "https://skynews-backend.onrender.com";
    const url = `${API}/articles?turkey_first=true`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setItems(data.articles || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Yükleniyor…</div>;
  if (error) return <div>Hata: {error}</div>;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 p-6 bg-white/5">
        <h1 className="text-2xl font-semibold mb-2">Son Havacılık Haberleri</h1>
        <p className="text-sm text-slate-300">
          İndekste Türkiye kaynakları önceliklidir.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {items.map((a) => (
          <a
            key={a.id}
            href={a.link}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20"
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
      </section>
    </div>
  );
}
