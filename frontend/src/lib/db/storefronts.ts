import fs from "fs/promises";
import path from "path";
import { getSupabase } from "@/lib/supabase";
import type { BusinessProfile, ProductItem, BusinessCategory, BusinessHours, GooglePlaceCandidate } from "@/types/business";

/**
 * Fetch a storefront by slug.
 * Checks Supabase first; if not configured or not found, falls back to public/temp_sites/{slug}.json.
 */
export async function getStorefrontBySlug(slug: string): Promise<BusinessProfile | null> {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeSlug) return null;

  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: sf, error } = await supabase
        .from("storefronts")
        .select(`
          *,
          products (*)
        `)
        .eq("slug", safeSlug)
        .maybeSingle();

      if (!error && sf) {
        // Map Supabase row into BusinessProfile
        const mappedProducts: ProductItem[] = (sf.products || [])
          .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((p: any) => ({
            name: p.name,
            price: p.price != null ? Number(p.price) : null,
            unit: p.unit || null,
            item_type: p.item_type === "service" ? "service" : "product",
            description: p.description || null,
            category: p.category || null,
          }));

        const profile: BusinessProfile = {
          shop_name: sf.shop_name,
          owner_name: sf.owner_name || null,
          category: (sf.category as BusinessCategory) || "product",
          template_id: sf.template_id || "product-classic",
          primary_color: sf.primary_color || null,
          accent_color: sf.accent_color || null,
          tagline: sf.tagline || null,
          locality: sf.locality || null,
          city: sf.city || null,
          address: sf.address || null,
          phone: sf.phone || null,
          whatsapp: sf.whatsapp || null,
          hours: (sf.hours as BusinessHours) || {
            days: "Monday - Saturday",
            open_time: "09:00 AM",
            close_time: "09:00 PM",
            closed_days: ["Sunday"],
          },
          products: mappedProducts,
          offers: Array.isArray(sf.offers) ? sf.offers : [],
          rating: sf.rating != null ? Number(sf.rating) : null,
          total_reviews: sf.total_reviews != null ? Number(sf.total_reviews) : null,
          places_id: sf.places_id || null,
          verified_via_places: Boolean(sf.verified_via_places),
          google_candidates: (sf.google_candidates as GooglePlaceCandidate[]) || [],
          wants_google_review_help: sf.wants_google_review_help != null ? Boolean(sf.wants_google_review_help) : null,
          temp_slug: sf.slug,
          temp_url: `/temp/${sf.slug}`,
          interview_complete: Boolean(sf.interview_complete),
          user_id: sf.user_id || null,
          approved: Boolean(sf.approved),
          approved_at: sf.approved_at || null,
          sections: sf.sections || undefined,
          header_image: sf.header_image || null,
        };

        return profile;
      }
    } catch (err) {
      console.warn("[DB] Supabase query error, falling back to filesystem:", err);
    }
  }

  // Fallback: local JSON file
  try {
    const tempSitesDir = path.join(process.cwd(), "public", "temp_sites");
    const filePath = path.join(tempSitesDir, `${safeSlug}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data) as BusinessProfile;
    if (parsed?.shop_name) return parsed;
  } catch {
    // File not found
  }

  return null;
}

/**
 * Save or update a storefront profile in Supabase & local filesystem.
 */
export async function saveStorefront(profile: BusinessProfile): Promise<{ success: boolean; error?: string }> {
  const slug = profile.temp_slug || "";
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeSlug) {
    return { success: false, error: "Invalid slug" };
  }

  // 1. Save to local public/temp_sites as cache for preview (safely ignored on serverless/read-only environments like Vercel)
  try {
    const tempSitesDir = path.join(process.cwd(), "public", "temp_sites");
    await fs.mkdir(tempSitesDir, { recursive: true });
    const filePath = path.join(tempSitesDir, `${safeSlug}.json`);
    await fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8");
  } catch (fsErr) {
    // Vercel / serverless environment has a read-only filesystem; this is expected and safe to ignore
    console.warn("[DB] Local JSON write skipped (expected on read-only serverless hosts):", fsErr);
  }

  // 2. Persist to Supabase if configured (persists drafts, guest sites, and approved sites)
  const supabase = getSupabase();
  if (!supabase) {
    return { success: true };
  }

  try {
    // Upsert into storefronts table
    const upsertPayload: Record<string, any> = {
      slug: safeSlug,
      shop_name: profile.shop_name,
      owner_name: profile.owner_name || null,
      category: profile.category || "product",
      template_id: profile.template_id || "product-classic",
      primary_color: profile.primary_color || null,
      accent_color: profile.accent_color || null,
      header_image: profile.header_image || null,
      tagline: profile.tagline || null,
      locality: profile.locality || null,
      city: profile.city || null,
      address: profile.address || null,
      phone: profile.phone || null,
      whatsapp: profile.whatsapp || null,
      hours: profile.hours || {},
      offers: profile.offers || [],
      rating: profile.rating || null,
      total_reviews: profile.total_reviews || null,
      places_id: profile.places_id || null,
      verified_via_places: Boolean(profile.verified_via_places),
      google_candidates: profile.google_candidates || [],
      wants_google_review_help: profile.wants_google_review_help,
      interview_complete: Boolean(profile.interview_complete),
      updated_at: new Date().toISOString(),
    };

    if (profile.user_id) {
      upsertPayload.user_id = profile.user_id;
    }
    if (profile.approved != null) {
      upsertPayload.approved = Boolean(profile.approved);
    }
    if (profile.approved_at) {
      upsertPayload.approved_at = profile.approved_at;
    }
    if (profile.sections) {
      upsertPayload.sections = profile.sections;
    }

    let finalStorefrontId: string | null = null;

    const { data: sfData, error: sfError } = await supabase
      .from("storefronts")
      .upsert(upsertPayload, { onConflict: "slug" })
      .select("id")
      .single();

    if (sfError || !sfData) {
      // If error is about missing columns in existing Supabase schema, try core columns only
      console.warn("[DB] Supabase full upsert warning, retrying core columns:", sfError?.message);
      const corePayload: Record<string, any> = {
        slug: safeSlug,
        shop_name: profile.shop_name,
        user_id: profile.user_id || null,
        owner_name: profile.owner_name || null,
        category: profile.category || "product",
        template_id: profile.template_id || "product-classic",
        primary_color: profile.primary_color || null,
        accent_color: profile.accent_color || null,
        tagline: profile.tagline || null,
        locality: profile.locality || null,
        city: profile.city || null,
        address: profile.address || null,
        phone: profile.phone || null,
        whatsapp: profile.whatsapp || null,
        hours: profile.hours || {},
        offers: profile.offers || [],
        rating: profile.rating || null,
        total_reviews: profile.total_reviews || null,
        places_id: profile.places_id || null,
        verified_via_places: Boolean(profile.verified_via_places),
        interview_complete: Boolean(profile.interview_complete),
        updated_at: new Date().toISOString(),
      };
      const { data: fallbackData } = await supabase
        .from("storefronts")
        .upsert(corePayload, { onConflict: "slug" })
        .select("id")
        .single();

      if (fallbackData?.id) {
        finalStorefrontId = fallbackData.id;
      }
    } else {
      finalStorefrontId = sfData.id;
    }

    const storefrontId = finalStorefrontId;
    if (storefrontId) {
      // Delete existing products and insert updated list
      await supabase.from("products").delete().eq("storefront_id", storefrontId);

      if (profile.products && profile.products.length > 0) {
        const productRows = profile.products.map((p, idx) => ({
          storefront_id: storefrontId,
          name: p.name,
          price: p.price != null ? Number(p.price) : null,
          unit: p.unit || null,
          item_type: p.item_type === "service" ? "service" : "product",
          description: p.description || null,
          category: p.category || null,
          display_order: idx,
        }));

        await supabase.from("products").insert(productRows);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("[DB] Unexpected Supabase save error:", err);
    // Local JSON was saved regardless
    return { success: true, error: err?.message };
  }
}

/**
 * List all storefronts for a given authenticated user.
 * If userId is not provided, returns empty array (strict privacy: no unauthenticated draft listing).
 */
export async function listStorefronts(userId?: string | null): Promise<BusinessProfile[]> {
  if (!userId) {
    return [];
  }

  const sitesMap = new Map<string, BusinessProfile>();

  // 1. Fetch from Supabase strictly for this user_id
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("storefronts")
        .select("*, products (*)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        for (const sf of data) {
          const mappedProducts: ProductItem[] = (sf.products || [])
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((p: any) => ({
              name: p.name,
              price: p.price != null ? Number(p.price) : null,
              unit: p.unit || null,
              item_type: p.item_type === "service" ? "service" : "product",
              description: p.description || null,
              category: p.category || null,
            }));

          sitesMap.set(sf.slug, {
            shop_name: sf.shop_name,
            owner_name: sf.owner_name || null,
            category: (sf.category as BusinessCategory) || "product",
            template_id: sf.template_id || "product-classic",
            primary_color: sf.primary_color || null,
            accent_color: sf.accent_color || null,
            tagline: sf.tagline || null,
            locality: sf.locality || null,
            city: sf.city || null,
            address: sf.address || null,
            phone: sf.phone || null,
            whatsapp: sf.whatsapp || null,
            hours: (sf.hours as BusinessHours) || {},
            products: mappedProducts,
            offers: Array.isArray(sf.offers) ? sf.offers : [],
            rating: sf.rating != null ? Number(sf.rating) : null,
            total_reviews: sf.total_reviews != null ? Number(sf.total_reviews) : null,
            places_id: sf.places_id || null,
            verified_via_places: Boolean(sf.verified_via_places),
            temp_slug: sf.slug,
            temp_url: `/temp/${sf.slug}`,
            interview_complete: Boolean(sf.interview_complete),
            user_id: sf.user_id || null,
            approved: Boolean(sf.approved),
            approved_at: sf.approved_at || null,
            sections: sf.sections || undefined,
            header_image: sf.header_image || null,
          });
        }
      }
    } catch (e) {
      console.warn("[DB] Could not list from Supabase:", e);
    }
  }

  // 2. Also check public/temp_sites strictly for this user_id
  try {
    const tempDir = path.join(process.cwd(), "public", "temp_sites");
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const slug = file.replace(/\.json$/, "");
      if (sitesMap.has(slug)) continue;

      try {
        const content = await fs.readFile(path.join(tempDir, file), "utf-8");
        const prof = JSON.parse(content) as BusinessProfile;
        if (prof?.shop_name && prof.shop_name !== "मेरी दुकान" && prof.user_id === userId) {
          sitesMap.set(slug, {
            ...prof,
            temp_slug: prof.temp_slug || slug,
            temp_url: `/temp/${prof.temp_slug || slug}`,
          });
        }
      } catch {}
    }
  } catch {}

  return Array.from(sitesMap.values());
}
