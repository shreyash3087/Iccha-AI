import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const VISION_PROMPT = `You are an expert OCR and business catalog extractor for Indian small businesses.
Analyze the attached image and extract all products or services listed.
Return ONLY a valid JSON array of objects without any markdown formatting or explanations:
[{"name":"...","price":100,"unit":"kg","item_type":"product","description":null}]
Keys: name (string), price (number or null), unit (string or null), item_type ("product" or "service"), description (string or null).`;

export async function POST(req: NextRequest) {
  try {
    let imageBase64 = "";
    let mimeType = "image/jpeg";
    let businessType = "general";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      mimeType = file.type || "image/jpeg";
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
      businessType = (formData.get("business_type") as string) || "general";
    } else {
      const body = await req.json();
      imageBase64 = body.image || "";
      mimeType = body.mime_type || "image/jpeg";
      businessType = body.business_type || "general";
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    let items: any[] = [];

    // ── Path 1: Local Python subprocess (works on dev / self-hosted) ──────────
    const tmpFile = path.join(
      os.tmpdir(),
      `iccha_vis_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
    );

    try {
      await fs.writeFile(
        tmpFile,
        JSON.stringify({ image: imageBase64, mime_type: mimeType, business_type: businessType }),
        "utf-8"
      );

      const backendDir = path.resolve(process.cwd(), "..", "backend");
      const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

      items = await new Promise<any[]>((resolve) => {
        const py = spawn("uv", ["run", "python", "-m", "iccha.tools.vision_cli", tmpFile], {
          cwd: backendDir,
          env: {
            ...process.env,
            ...(livekitUrl ? { LIVEKIT_URL: livekitUrl } : {}),
            PYTHONIOENCODING: "utf-8",
            PYTHONUTF8: "1",
          },
        });

        let stdout = "";
        let stderr = "";

        py.stdout.setEncoding("utf-8");
        py.stderr.setEncoding("utf-8");

        py.stdout.on("data", (chunk) => { stdout += chunk; });
        py.stderr.on("data", (chunk) => { stderr += chunk; });

        py.on("close", (code) => {
          if (code !== 0) {
            console.error("[Vision API] Python runner exit code:", code, stderr.slice(0, 300));
            resolve([]);
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim() || "[]");
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch (err) {
            console.error("[Vision API] JSON parse error:", err, stdout.slice(0, 200));
            resolve([]);
          }
        });

        py.on("error", (err) => {
          console.error("[Vision API] Spawn error:", err.message);
          resolve([]);
        });
      });
    } catch (spawnErr) {
      console.error("[Vision API] Exception in spawn:", spawnErr);
      items = [];
    } finally {
      await fs.unlink(tmpFile).catch(() => {});
    }

    // ── Path 2: Backend Railway / Render HTTP endpoint (works on Vercel/serverless) ────
    const rawBackendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    const backendUrl = rawBackendUrl?.trim().replace(/\/+$/, "");
    if (items.length === 0 && backendUrl) {
      try {
        console.log("[Vision API] Calling backend HTTP endpoint:", `${backendUrl}/vision`);
        const vRes = await fetch(`${backendUrl}/vision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageBase64, mime_type: mimeType, business_type: businessType }),
          signal: AbortSignal.timeout(30000),
        });

        if (vRes.ok) {
          const vData = await vRes.json();
          if (Array.isArray(vData.items)) {
            items = vData.items;
            console.log("[Vision API] Backend fallback returned", items.length, "items");
          }
        } else {
          const errText = await vRes.text();
          console.warn("[Vision API] Backend fallback HTTP error:", vRes.status, errText.slice(0, 200));
        }
      } catch (backendErr: any) {
        console.warn("[Vision API] Backend fallback failed:", backendErr?.message || backendErr);
      }
    }

    // ── Path 3: Gemini REST API (works if GEMINI_API_KEY is set in Vercel env) ──
    const geminiKey = process.env.GEMINI_API_KEY;
    if (items.length === 0 && geminiKey) {
      try {
        console.log("[Vision API] Falling back to Gemini REST API");
        // Strip data URI prefix to get pure base64
        const b64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: `${VISION_PROMPT}\n\nContext: business type is '${businessType}'. Extract up to 10 items.` },
                  { inline_data: { mime_type: mimeType, data: b64 } },
                ],
              }],
              generationConfig: { temperature: 0.1 },
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (gemRes.ok) {
          const gemData = await gemRes.json();
          const content = gemData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
          const match = cleaned.match(/\[[\s\S]*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed)) {
              items = parsed;
              console.log("[Vision API] Gemini fallback returned", items.length, "items");
            }
          }
        } else {
          const errText = await gemRes.text();
          console.warn("[Vision API] Gemini fallback error:", gemRes.status, errText.slice(0, 200));
        }
      } catch (gemErr: any) {
        console.warn("[Vision API] Gemini fallback failed:", gemErr?.message || gemErr);
      }
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("[Vision API] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
