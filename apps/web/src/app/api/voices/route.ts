import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createVoicePrompt, TtsApiError } from "@/lib/tts-client";
import { saveVoiceSample, deleteVoiceSample } from "@/lib/voice-storage";

const MAX_NAME_LENGTH = 60;

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const voices = await prisma.voice.findMany({
    where: {
      OR: [{ ownerId: session.user.id }, { isPublic: true }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true } },
    },
  });

  return NextResponse.json({ voices });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();

  const name = (formData.get("name") as string | null)?.trim();
  const isPublic = formData.get("isPublic") === "true";
  const sampleAudio = formData.get("sample_audio") as File | null;
  const transcriptText = (formData.get("transcript") as string | null)?.trim();

  // --------------------------------
  // Validate
  // --------------------------------
  if (!name || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Name is required (max ${MAX_NAME_LENGTH} characters)` },
      { status: 400 }
    );
  }

  if (!sampleAudio || sampleAudio.size === 0) {
    return NextResponse.json({ error: "A sample audio file is required" }, { status: 400 });
  }

  if (!sampleAudio.name.toLowerCase().endsWith(".wav")) {
    return NextResponse.json({ error: "Only WAV files are supported" }, { status: 400 });
  }

  if (!transcriptText) {
    return NextResponse.json(
      { error: "A transcript of the sample audio is required" },
      { status: 400 }
    );
  }

  const requestId = randomUUID();
  let sampleAudioUrl: string | null = null;

  try {
    // Save a local copy for in-browser playback
    sampleAudioUrl = await saveVoiceSample(requestId, sampleAudio);

    // Forward to the Python service to actually build the voice-clone prompt
    await createVoicePrompt(requestId, sampleAudio, transcriptText);

    const voice = await prisma.voice.create({
      data: {
        name,
        isPublic,
        ttsRequestId: requestId,
        sampleAudioUrl,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ voice }, { status: 201 });
  } catch (err) {
    // Roll back the saved sample file if anything downstream failed
    if (sampleAudioUrl) {
      await deleteVoiceSample(requestId);
    }

    if (err instanceof TtsApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 500 ? 502 : err.status });
    }

    console.error("Voice creation failed", err);
    return NextResponse.json({ error: "Failed to create voice" }, { status: 500 });
  }
}
