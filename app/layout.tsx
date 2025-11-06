// app/layout.tsx
import React from "react";
import "./globals.css";

export const metadata = {
  title: "SkyNews.Tr",
  description: "Premium aviation news with a Turkey-first index",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-[#0A1B2E] text-white">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A1B2E]/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <span className="inline-block h-8 w-8 rounded bg-white/10" />
              <span className="font-semibold tracking-wide">SkyNews.Tr</span>
            </a>
            <nav className="hidden md:flex gap-6 text-sm text-slate-200">
              <a href="/kategori/turkiye" className="hover:text-white">Türkiye</a>
              <a href="/kategori/kuresel" className="hover:text-white">Küresel</a>
              <a href="/kategori/havayollari" className="hover:text-white">Havayolları</a>
              <a href="/kategori/havalimanlari" className="hover:text-white">Havalimanları</a>
              <a href="/hakkimizda" className="hover:text-white">Hakkımızda</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-300">
          © {new Date().getFullYear()} SkyNews.Tr — Tüm hakları saklıdır.
        </footer>
      </body>
    </html>
  );
}
