// Basit, deterministik ve çakışma riski düşük slug üreticisi.
// Kullanım: generateSlug(title, source, published)
// Not: publish tarihi ISO string veya Date olabilir.
export function generateSlug(title: string, source = "", published?: string | Date) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // accent removal
      .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\\s-]/g, "") // allowed chars (turkish included via normalization map)
      .trim()
      .replace(/\\s+/g, "-")
      .replace(/-+/g, "-");

  const datePart = published ? new Date(published).toISOString().slice(0, 10) : "";
  const base = normalize(title).slice(0, 140);
  const src = normalize(source).slice(0, 40);

  // Small deterministic hash to reduce collisions (cyrb53)
  function cyrb53(str: string, seed = 0) {
    let h1 = 0xDEADBEEF ^ seed, h2 = 0x41C6CE57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  const hash = Math.abs(cyrb53(title + "|" + source + "|" + (published ?? ""))).toString(36).slice(0, 6);

  const parts = [base];
  if (src) parts.push(src);
  if (datePart) parts.push(datePart);
  parts.push(hash);

  return parts.filter(Boolean).join("-").replace(/-+$/, "");
}