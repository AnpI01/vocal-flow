import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const GENERATED_AUDIO_DIR = path.join(process.cwd(), "public", "generated-audio");

export async function saveGeneratedAudio(jobId: string, audioBytes: Buffer): Promise<string> {
  await mkdir(GENERATED_AUDIO_DIR, { recursive: true });

  const filename = `${jobId}.wav`;
  await writeFile(path.join(GENERATED_AUDIO_DIR, filename), audioBytes);

  return `/api/generated-audio/${filename}`;
}

export async function deleteGeneratedAudio(jobId: string): Promise<void> {
  const filePath = path.join(GENERATED_AUDIO_DIR, `${jobId}.wav`);
  await unlink(filePath).catch(() => {});
}
