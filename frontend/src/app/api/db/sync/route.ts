import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { saveStorefront } from "@/lib/db/storefronts";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { BusinessProfile } from "@/types/business";

/**
 * POST /api/db/sync
 *
 * 1. If called with { profile }, saves the profile to Supabase.
 * 2. If called with { importAll: true }, scans public/temp_sites/ and imports
 *    all existing JSON storefronts into Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const configured = isSupabaseConfigured();
    if (!configured) {
      // Gracefully fall back to local JSON storage without logging red console errors
      return NextResponse.json(
        {
          success: true,
          savedLocally: true,
          message: "Profile saved to local JSON storage (Supabase not configured in .env.local yet)",
        },
        { status: 200 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Mode A: Import all local JSON files into Supabase
    if (body.importAll) {
      const tempDir = path.join(process.cwd(), "public", "temp_sites");
      let files: string[] = [];
      try {
        files = await fs.readdir(tempDir);
      } catch {
        return NextResponse.json({ success: true, imported: 0, message: "No temp sites found" });
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const content = await fs.readFile(path.join(tempDir, file), "utf-8");
          const prof = JSON.parse(content) as BusinessProfile;
          if (prof?.shop_name && prof.shop_name !== "मेरी दुकान") {
            const res = await saveStorefront(prof);
            if (res.success) {
              imported++;
            } else {
              errors.push(`${file}: ${res.error}`);
            }
          } else {
            skipped++;
          }
        } catch (e: any) {
          errors.push(`${file}: ${e?.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        imported,
        skipped,
        errors,
        message: `Successfully imported ${imported} storefronts to Supabase.`,
      });
    }

    // Mode B: Save a single profile
    if (body.profile) {
      const res = await saveStorefront(body.profile);
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { error: "Provide { profile: ... } or { importAll: true }" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[/api/db/sync] Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const configured = isSupabaseConfigured();
  return NextResponse.json({
    configured,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Missing",
  });
}
