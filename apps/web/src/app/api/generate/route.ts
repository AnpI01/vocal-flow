import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueueGenerationJob } from "@/lib/job-queue";

const MAX_SCRIPT_LENGTH = 5000; // matches settings.MAX_SCRIPT_LENGTH in the Python service
const SUPPORTED_LANGUAGES = ["English", "Chinese", "Japanese", "Korean"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const voiceId = body?.voiceId as string | undefined;
  const scriptText = (body?.scriptText as string | undefined)?.trim();
  const scriptLang = (body?.scriptLang as string | undefined) ?? "English";

  if (!voiceId) {
    return NextResponse.json({ error: "A voice must be selected" }, { status: 400 });
  }

  if (!scriptText) {
    return NextResponse.json({ error: "Script text is required" }, { status: 400 });
  }

  if (scriptText.length > MAX_SCRIPT_LENGTH) {
    return NextResponse.json(
      { error: `Script exceeds the ${MAX_SCRIPT_LENGTH} character limit` },
      { status: 400 }
    );
  }

  if (!SUPPORTED_LANGUAGES.includes(scriptLang)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  // Voice must exist and be usable by this user - either owned or public
  const voice = await prisma.voice.findUnique({ where: { id: voiceId } });

  if (!voice || (voice.ownerId !== session.user.id && !voice.isPublic)) {
    return NextResponse.json({ error: "Voice not found" }, { status: 404 });
  }

  const job = await prisma.generationJob.create({
    data: {
      scriptText,
      scriptLang,
      ownerId: session.user.id,
      voiceId: voice.id,
      status: "QUEUED",
    },
  });

  await enqueueGenerationJob(job.id);

  return NextResponse.json({ jobId: job.id }, { status: 201 });
}
