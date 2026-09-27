import { NextRequest, NextResponse } from "next/server";
import { getStorefrontBySlug, saveStorefront } from "@/lib/db/storefronts";
import type { BusinessProfile } from "@/types/business";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured on server" },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let slug = "";
    let audioBlob: Blob | null = null;
    let manualTranscript = "";
    let screenshotBase64 = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      slug = (formData.get("slug") as string) || "";
      manualTranscript = (formData.get("transcript") as string) || "";
      screenshotBase64 = (formData.get("screenshot") as string) || "";
      const file = formData.get("audio") as File | null;
      if (file && file.size > 0) {
        audioBlob = file;
      }
    } else {
      const body = await req.json();
      slug = body.slug || "";
      manualTranscript = body.transcript || "";
      screenshotBase64 = body.screenshot || "";
      if (body.audio_base64) {
        const buffer = Buffer.from(body.audio_base64, "base64");
        audioBlob = new Blob([buffer], { type: body.mime_type || "audio/webm" });
      }
    }

    if (!slug) {
      return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
    }

    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");

    // 1. Read existing profile via DB layer (Supabase first, fallback local)
    const currentProfile = await getStorefrontBySlug(safeSlug);
    if (!currentProfile) {
      return NextResponse.json({ error: `Storefront with slug '${safeSlug}' not found` }, { status: 404 });
    }

    // 2. Transcribe voice if audio provided
    let transcript = manualTranscript;
    if (audioBlob && !transcript) {
      try {
        const groqForm = new FormData();
        groqForm.append("file", audioBlob, "audio.webm");
        groqForm.append("model", "whisper-large-v3");
        groqForm.append("prompt", "ICCHA AI shop edit: दुकान का नाम, रेट, रंग, मेन्यू, फ़ोन नंबर, टेम्पलेट");

        const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: groqForm,
        });

        if (sttRes.ok) {
          const sttData = await sttRes.json();
          transcript = (sttData.text || "").trim();
        } else {
          const errText = await sttRes.text();
          console.error("[VoiceEdit API] Whisper error:", errText);
        }
      } catch (err) {
        console.error("[VoiceEdit API] STT fetch error:", err);
      }
    }

    if (!transcript) {
      return NextResponse.json({ error: "Could not transcribe audio or no voice input received" }, { status: 400 });
    }

    // 3. Use LLM to apply edits to profile
    const systemPrompt = `You are an expert digital storefront editor for small Indian merchants (kiranas, tailors, eateries, salons, repair shops).
The user is speaking natural Hindi, Hinglish, English, or another Indian language to edit their live website.

CURRENT BUSINESS PROFILE:
${JSON.stringify(currentProfile, null, 2)}

INSTRUCTIONS:
1. Understand the user's edit intent from the transcript.
2. Edit the profile JSON accordingly while preserving all other existing fields:
   - "primary_color": Hex color code or CSS color if user asks to change theme or color (e.g. maroon -> "#800000", navy blue -> "#1e3a8a", green -> "#15803d", yellow -> "#eab308", etc.)
   - "accent_color": Complementary accent color if needed
   - "template_id": If user asks to change style/template/look, select the best matching template ID:
     * Product: "product-classic", "product-bold", "product-minimal", "product-warm", "product-fresh"
     * Service: "service-elegant", "service-modern", "service-warm", "service-bold", "service-clean"
     * Other: "other-simple", "other-grid", "other-card", "other-minimal", "other-flex"
   - "products": Add, modify, or remove items. For each item: { "name": string, "price": number | null, "unit": string | null, "item_type": "product" | "service", "description": string | null }
   - "shop_name", "tagline", "phone", "whatsapp", "address", "locality", "city", "offers": Update if mentioned.
   - "hours": Update open_time, close_time, closed_days, days if mentioned.
3. Return ONLY a valid JSON object in this exact schema without any markdown fence or commentary:
{
  "updated_profile": { ...full updated profile... },
  "summary": "Short conversational 1-sentence confirmation of what was updated in the language user spoke"
}`;

    const llmRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voice edit request: "${transcript}"` },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!llmRes.ok) {
      const errBody = await llmRes.text();
      console.error("[VoiceEdit API] LLM error:", errBody);
      return NextResponse.json({ error: `AI error: ${errBody}` }, { status: 500 });
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawContent);

    const updatedProfile = parsed.updated_profile || currentProfile;
    const summary = parsed.summary || "आपकी वेबसाइट अपडेट कर दी गई है।";

    // Ensure temp_slug remains consistent
    updatedProfile.temp_slug = safeSlug;
    updatedProfile.temp_url = `/temp/${safeSlug}`;

    // 4. Save updated profile (persists to Supabase & caches locally)
    await saveStorefront(updatedProfile);

    return NextResponse.json({
      success: true,
      transcript,
      summary,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("[VoiceEdit API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
