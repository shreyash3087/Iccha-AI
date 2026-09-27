import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
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

    // Call Python backend vision extraction tool if locally available, otherwise fallback to Groq Vision
    let items: any[] = [];
    const apiKey = process.env.GROQ_API_KEY;

    try {
      const backendDir = path.resolve(process.cwd(), "..", "backend");
      items = await new Promise<any[]>((resolve) => {
        const py = spawn("uv", ["run", "python", "-m", "iccha.tools.vision_cli"], {
          cwd: backendDir,
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        py.stdout.on("data", (chunk) => {
          stdout += chunk.toString();
        });

        py.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });

        py.on("close", (code) => {
          if (code !== 0) {
            resolve([]);
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim() || "[]");
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch {
            resolve([]);
          }
        });

        py.on("error", () => {
          resolve([]);
        });

        const payload = JSON.stringify({
          image: imageBase64,
          mime_type: mimeType,
          business_type: businessType,
        });
        py.stdin.write(payload);
        py.stdin.end();
      });
    } catch {
      items = [];
    }

    // Cloud fallback on Vercel/serverless using Groq Vision API directly
    if (items.length === 0 && apiKey) {
      try {
        const visionRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
        console.warn("[Vision API] Groq cloud fallback error:", cloudErr);
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
