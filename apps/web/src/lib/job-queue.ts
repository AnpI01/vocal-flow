import { PgBoss } from "pg-boss";

import { prisma } from "@/lib/db";
import { generateClonedVoice, fetchGeneratedAudio, TtsApiError } from "@/lib/tts-client";
import { saveGeneratedAudio } from "@/lib/generated-audio-storage";

export const GENERATION_QUEUE = "generate-voice-audio";

type GenerationJobData = {
  jobId: string;
};

let bossInstance: PgBoss | null = null;
let startPromise: Promise<PgBoss> | null = null;

/**
 * Returns a started, singleton PgBoss instance. Safe to call repeatedly -
 * only actually starts the connection/worker once per server process.
 */
export async function getBoss(): Promise<PgBoss> {
  if (bossInstance) return bossInstance;

  if (!startPromise) {
    startPromise = (async () => {
      const boss = new PgBoss(process.env.DATABASE_URL as string);
      boss.on("error", (err) => console.error("[pg-boss] error", err));

      await boss.start();
      await boss.createQueue(GENERATION_QUEUE);

      await boss.work<GenerationJobData>(GENERATION_QUEUE, async ([job]) => {
        await processGenerationJob(job.data.jobId);
      });

      bossInstance = boss;
      return boss;
    })();
  }

  return startPromise;
}

export async function enqueueGenerationJob(jobId: string): Promise<void> {
  const boss = await getBoss();
  await boss.send(GENERATION_QUEUE, { jobId } satisfies GenerationJobData);
}

async function processGenerationJob(jobId: string): Promise<void> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: { voice: true },
  });

  if (!job) {
    console.error(`[worker] GenerationJob ${jobId} not found`);
    return;
  }

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });

  try {
    // The Python service expects "<voice_request_id>::<transaction_id>".
    // voice_request_id looks up the cached voice-clone prompt; transaction_id
    // (this job's own id) guarantees a unique output filename, so concurrent
    // or repeated generations for the same voice never collide.
    const combinedRequestId = `${job.voice.ttsRequestId}::${job.id}`;

    const result = await generateClonedVoice(
      combinedRequestId,
      job.scriptText,
      job.scriptLang
    );

    const audioBytes = await fetchGeneratedAudio(result.audio_file);
    const audioUrl = await saveGeneratedAudio(job.id, audioBytes);

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        audioFilename: audioUrl,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const message =
      err instanceof TtsApiError ? err.message : "Generation failed unexpectedly";

    console.error(`[worker] Job ${jobId} failed:`, err);

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      },
    });
  }
}
