import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

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
    const tmpFile = path.join(
      os.tmpdir(),
      `iccha_vis_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
    );

    try {
      await fs.writeFile(
        tmpFile,
        JSON.stringify({
          image: imageBase64,
          mime_type: mimeType,
          business_type: businessType,
        }),
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

        py.stdout.on("data", (chunk) => {
          stdout += chunk;
        });

        py.stderr.on("data", (chunk) => {
          stderr += chunk;
        });

        py.on("close", (code) => {
          if (code !== 0) {
            console.error("[Vision API] Python runner error code:", code, stderr);
            resolve([]);
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim() || "[]");
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch (err) {
            console.error("[Vision API] JSON parse error:", err, stdout);
            resolve([]);
          }
        });

        py.on("error", (err) => {
          console.error("[Vision API] Spawn error:", err);
          resolve([]);
        });
      });
    } catch (spawnErr) {
      console.error("[Vision API] Exception in spawn:", spawnErr);
      items = [];
    } finally {
      await fs.unlink(tmpFile).catch(() => {});
    }

    // Optional cloud fallback if local python runner is not available (e.g., Vercel serverless)
    const groqKey = process.env.GROQ_API_KEY;
    if (items.length === 0 && groqKey) {
      try {
        const visionRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are an OCR and catalog extractor for Indian retail shops and restaurants. Extract all items/services from the image. Return ONLY a valid JSON array of objects with keys: "name" (string), "price" (number or null), "unit" (string or null), "item_type" ("product" or "service"), "description" (string or null). No markdown, no commentary, just the JSON array.`,
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageBase64 },
                  },
                ],
              },
            ],
            temperature: 0.1,
          }),
        });

        if (visionRes.ok) {
          const vData = await visionRes.json();
          const content = vData.choices?.[0]?.message?.content || "";
          const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            items = parsed;
          }
        }
      } catch (cloudErr) {
        console.warn("[Vision API] Cloud fallback error:", cloudErr);
      }
    }

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("[Vision API] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
