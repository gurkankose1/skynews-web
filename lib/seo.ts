// lib/seo.ts
// Basit, ücretsiz, kural tabanlı TR "editoryal yeniden yazım" yardımcıları.
// Amaç: özgünlük + SEO uyumu + kaynak atfı. LLM yok, API yok.

// Çok temel EN->TR sözcük eşleştirme (bilgilendirici başlık için yeterli)
const EN_TR = [
  [/announces?/gi, "duyurdu"],
  [/launch(es|ed|ing)?/gi, "başlattı"],
  [/introduc(es|ed|ing|e)?/gi, "tanıttı"],
  [/expand(s|ed|ing|s)?/gi, "genişledi"],
  [/adds?/gi, "ekledi"],
  [/opens?/gi, "açtı"],
  [/routes?/gi, "hat"],
  [/flights?/gi, "uçuş"],
  [/orders?/gi, "sipariş"],
  [/deliver(y|ies)/gi, "teslimat"],
  [/investment/gi, "yatırım"],
  [/stake/gi, "hisse"],
  [/judge/gi, "mahkeme"],
  [/dismiss(es|ed|ing)?/gi, "düşürdü"],
  [/crash/gi, "kaza"],
  [/investigation/gi, "soruşturma"],
  [/fleet/gi, "filo"],
  [/farewell/gi, "veda"],
  [/final/gi, "son"],
  [/expands?/gi, "genişliyor"],
  [/cuts?/gi, "kesti"],
  [/cancellations?/gi, "iptaller"],
  [/summer/gi, "yaz"],
  [/winter/gi, "kış"],
];

function enToTrLite(s: string): string {
  let out = s;
  for (const [re, tr] of EN_TR) out = out.replace(re as RegExp, tr as string);
  return out;
}

function hostToName(host: string): string {
  const h = host.replace(/^www\./, "");
  if (h.includes("simpleflying")) return "Simple Flying";
  if (h.includes("aviation24")) return "Aviation24";
  if (h.includes("airporthaber")) return "AirportHaber";
  return h;
}

function formatDateTR(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return iso; }
}

export function rewriteEditorialTR(a: {
  title: string;
  summary?: string;
  link: string;
  source: string;
  published: string;
}) {
  const hostName = hostToName(a.source || "");
  const trTitleCore = enToTrLite(a.title || "").trim();

  // SEO başlık (özgün, editor üslubu, marka/tema + tarih)
  const seoTitle = `${trTitleCore || a.title} | ${hostName} özeti – ${formatDateTR(a.published)}`;

  // Özgün TR özet (kaynak atfı + tarafsız, kısa paragraf)
  const cleanSummary = (a.summary || "").replace(/<[^>]+>/g, "").trim();
  const seoSummary =
    `${hostName} tarafından aktarılan gelişmeye göre: ` +
    `${cleanSummary ? enToTrLite(cleanSummary) : "Haber detayları kaynakta yer alıyor."} ` +
    `Bu içerik SkyNews.Tr editoryal ekibi tarafından otomatik özetlenmiştir; ` +
    `tüm detaylar için kaynağa gidiniz.`;

  // SEO açıklama (meta description gibi, 150-170 karakter hedef)
  const metaDescription = `${trTitleCore || a.title} – ${hostName} haberinden derlenen kısa özet. Tüm ayrıntılar ve özgün metin için kaynağı ziyaret ediniz.`;

  return {
    ...a,
    title: seoTitle,
    summary: seoSummary,
    metaDescription,
    attribution: hostName,
  };
}
