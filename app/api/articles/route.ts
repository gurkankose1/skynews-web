// Önemli: Her article objesine slug ekleyin.
// (Aşağıda sadece ilgili parça yer alıyor — repo'nuzdaki mevcut parsing mantığını koruyun ve slug üretimini ekleyin.)
import { NextResponse } from "next/server";
import { generateSlug } from "../../../lib/slug";
import { rewriteEditorialTR } from "../../../lib/seo";

export async function GET(req: Request) {
  // mevcut feed parsing kodunuz...
  // parsedItems değişkeni: RSS'den parse ettiğiniz article array'i (title, link, summary/description, source, published vb.)
  // Aşağıdaki mapping kısmını mevcut parsing kodunuzun çıkışına entegre edin.
  const parsedItems: any[] = []; // <-- burayı kendi parsing çıktınız ile değiştirin

  // Örnek: parsedItems'i oluşturduğunuz yerde slug ve rewrite ekleyin
  const articles = parsedItems.map(item => {
    const slug = generateSlug(item.title, item.source || item.author || "", item.published);
    const rewritten = rewriteEditorialTR({
      title: item.title,
      summary: item.summary || item.description || "",
      url: item.link,
      source: item.source || item.author || "",
      published: item.published
    });
    return {
      ...item,
      ...rewritten,
      slug,
    };
  });

  const body = JSON.stringify(articles.slice(0, 60));
  return new NextResponse(body, { status: 200, headers: { "content-type": "application/json" } });
}