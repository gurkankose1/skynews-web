// rewriteEditorialTR: kural tabanlı, deterministik, API gerektirmez.
// Girdi: title (orijinal), summary (orijinal), source, url, published
// Çıktı: { title: string, summary: string, seoTitle: string, seoDescription: string }
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const TERM_MAP: Record<string, string> = {
  "aircraft": "uçak",
  "airline": "havayolu",
  "pilot": "pilot",
  "flight": "uçuş",
  "airport": "havaalanı",
  "cargo": "kargo",
  "left": "ayrıldı",
  "right": "sağ",
  "crash": "kaza",
  "deal": "anlaşma",
  "order": "sipariş",
  "fleet": "filo",
  "contract": "sözleşme",
  "deliveries": "teslimatlar",
  "deliver": "teslim etmek",
  "chief": "baş",
  "CEO": "CEO",
  "cost": "maliyet",
  "operating cost": "işletme maliyeti",
  "prices": "fiyatlar",
  // ekleyin: sık kullanılan aviation terimleri
};

// Basit kelime eşleme
function translateTerms(text = "") {
  if (!text) return "";
  let out = text;
  for (const [en, trTerm] of Object.entries(TERM_MAP)) {
    const re = new RegExp(`\\b${escapeRegExp(en)}\\b`, "ig");
    out = out.replace(re, (m) => {
      // koruma: uppercase uygunsa aynı şekilde bırak
      if (m === m.toUpperCase()) return trTerm.toUpperCase();
      if (m[0] === m[0].toUpperCase()) return trTerm.charAt(0).toUpperCase() + trTerm.slice(1);
      return trTerm;
    });
  }
  return out;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Özlü, aktif cümle kurmak için basit dönüşümler
function makeActiveVoice(summary = "") {
  // Çok basit: passive çubuk ifadelerini değiştir
  // örn: "was delivered" -> "teslim edildi" (kısa)
  let s = summary;
  s = s.replace(/\\bwas\\b\\s+([a-z]+)/ig, (m, p1) => `${p1} edildi`);
  s = s.replace(/\\bwere\\b\\s+([a-z]+)/ig, (m, p1) => `${p1} edildi`);
  // küçük eklemeler:
  s = s.replace(/\\bhas been\\b/ig, "zaten");
  return s;
}

export function rewriteEditorialTR(params: {
  title: string;
  summary?: string;
  url?: string;
  source?: string;
  published?: string | Date;
}) {
  const { title, summary = "", url = "", source = "", published } = params;

  // 1. Başlık için çeviri + SEO düzeni: "Konu — Kaynak özeti — GG AAA"
  const translatedTitle = translateTerms(title);
  const datePart = published ? format(new Date(published), "dd MMM yyyy", { locale: tr }) : "";
  const seoTitle = `${translatedTitle} — ${source ? source : "Haber"}${datePart ? " — " + datePart : ""}`;

  // 2. Özet: temel çeviriler + aktif yapı + 1-2 cümle, 140-200 karakter arası (kısalt)
  let tSummary = translateTerms(summary);
  tSummary = makeActiveVoice(tSummary);
  // Temizlik: HTML etiketleri temizle
  tSummary = tSummary.replace(/<\/?!?[^>]+(>|$)/g, "");
  // Kısalt (yaklaşık)
  if (tSummary.length > 220) {
    tSummary = tSummary.slice(0, 210).trim();
    const lastSpace = tSummary.lastIndexOf(" ");
    if (lastSpace > 150) tSummary = tSummary.slice(0, lastSpace) + "...";
  }

  // 3. meta description daha kısa
  let seoDesc = tSummary;
  if (!seoDesc && title) {
    seoDesc = translateTerms(title);
  }

  return {
    title: translatedTitle,
    summary: tSummary,
    seoTitle,
    seoDescription: seoDesc,
    source,
    url,
    published: published ? new Date(published).toISOString() : undefined,
  };
}