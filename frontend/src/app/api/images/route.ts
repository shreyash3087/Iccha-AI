import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyAMoyRxCvO3v7IEdoi8RHM7cf3s9T3ZFh8";
  const googleCx = process.env.GOOGLE_CUSTOM_SEARCH_CX;

  // 1. Try Google Custom Search if configured
  if (googleCx && googleKey) {
    try {
      const gRes = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&searchType=image&num=1`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.items && gData.items.length > 0) {
          return NextResponse.json({
            url: gData.items[0].link,
            thumb: gData.items[0].image?.thumbnailLink,
            alt: gData.items[0].title || query,
            source: "google",
          });
        }
      }
    } catch (e) {
      console.warn("[Google Custom Search] fetch error:", e);
    }
  }

  // 2. Unsplash API Search
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || "4_GkdKwb1pjRfIki9p3WkwtObsQaVSBCkQgyM8lPZOU";

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: { Authorization: `Client-ID ${unsplashKey}` },
        next: { revalidate: 86400 }, // Cache 24 hours
      }
    );

    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      if (results.length > 0) {
        return NextResponse.json({
          url: results[0].urls?.regular || results[0].urls?.small,
          thumb: results[0].urls?.thumb,
          alt: results[0].alt_description || query,
          source: "unsplash",
        });
      }
    }
  } catch (err: any) {
    console.warn("[/api/images] Unsplash fetch error:", err);
  }

  return NextResponse.json({ url: null }, { status: 404 });
}
