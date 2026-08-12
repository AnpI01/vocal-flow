import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const VOICE_SAMPLES_DIR = path.join(process.cwd(), "public", "voice-samples");

export async function saveVoiceSample(requestId: string, audioFile: File): Promise<string> {
  await mkdir(VOICE_SAMPLES_DIR, { recursive: true });

  const buffer = Buffer.from(await audioFile.arrayBuffer());
  const filename = `${requestId}.wav`;
  await writeFile(path.join(VOICE_SAMPLES_DIR, filename), buffer);

  return `/api/voice-samples/${filename}`;
}

export async function deleteVoiceSample(requestId: string): Promise<void> {
  const filePath = path.join(VOICE_SAMPLES_DIR, `${requestId}.wav`);
  await unlink(filePath).catch(() => {
    // Fine if it's already gone
  });
}
