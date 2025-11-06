import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turkeyFirst = searchParams.get("turkey_first") === "true";

  const data = [
    {
      id: "1",
      title: "Örnek Haber",
      link: "https://example.com/haber",
      source: "SkyNews.Tr",
      published: new Date().toISOString(),
      summary: "Bu bir örnek haber özetidir.",
      category: turkeyFirst ? "TR" : "GL",
    },
  ];

  return NextResponse.json(data);
}
