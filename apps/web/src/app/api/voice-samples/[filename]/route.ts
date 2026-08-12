import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const VOICE_SAMPLES_DIR = path.join(process.cwd(), "public", "voice-samples");

// Served dynamically (not from the `public/` folder) because output:
// "standalone" resolves public assets from a manifest built at `next build`
// time - files uploaded here at runtime, after the image was built, are
// invisible to that manifest and 404 forever.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const filePath = path.join(VOICE_SAMPLES_DIR, path.basename(filename));

  try {
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(data.length),
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "Voice sample not found" }, { status: 404 });
  }
}
