import { NextRequest, NextResponse } from "next/server";
import { listStorefronts, saveStorefront, getStorefrontBySlug } from "@/lib/db/storefronts";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const slug = searchParams.get("slug");

    if (slug) {
      const site = await getStorefrontBySlug(slug);
      if (!site) {
        return NextResponse.json({ error: "Storefront not found" }, { status: 404 });
      }
      return NextResponse.json({ site });
    }

    if (!userId) {
      return NextResponse.json({ sites: [] });
    }

    const sites = await listStorefronts(userId);
    return NextResponse.json({ sites });
  } catch (error: any) {
    console.error("[/api/storefronts GET] Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, slug, userId, userEmail } = body;

    if (action === "approve" && slug) {
      const site = await getStorefrontBySlug(slug);
      if (!site) {
        return NextResponse.json({ error: "Storefront not found" }, { status: 404 });
      }

      site.approved = true;
      site.approved_at = new Date().toISOString();
      if (userId) site.user_id = userId;
      if (userEmail) site.user_email = userEmail;

      const res = await saveStorefront(site);
      return NextResponse.json({ site, ...res });
    }

    if (body.profile) {
      const res = await saveStorefront(body.profile);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action or payload" }, { status: 400 });
  } catch (error: any) {
    console.error("[/api/storefronts POST] Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
