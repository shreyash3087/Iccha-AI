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

    // Call Python backend vision extraction tool via child_process
    const backendDir = path.resolve(process.cwd(), "..", "backend");

    const result = await new Promise<{ items: any[] }>((resolve, reject) => {
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
          console.error("[Vision API] Python runner error:", stderr);
          resolve({ items: [] });
          return;
        }
        try {
          const parsed = JSON.parse(stdout.trim() || "[]");
          resolve({ items: Array.isArray(parsed) ? parsed : [] });
        } catch (err) {
          console.error("[Vision API] Failed to parse stdout:", stdout, err);
          resolve({ items: [] });
        }
      });

      py.on("error", (err) => {
        console.error("[Vision API] Spawn error:", err);
        resolve({ items: [] });
      });

      // Write payload to python stdin
      const payload = JSON.stringify({
        image: imageBase64,
        mime_type: mimeType,
        business_type: businessType,
      });
      py.stdin.write(payload);
      py.stdin.end();
    });

    return NextResponse.json({
      success: true,
      items: result.items,
    });
  } catch (error) {
    console.error("[Vision API] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
