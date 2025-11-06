// lib/slug.ts
const trMap: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i",
  İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u"
};

export function makeSlug(input: string) {
  return (input || "")
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, ch => trMap[ch] || ch)
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
