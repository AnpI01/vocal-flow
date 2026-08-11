import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteVoiceSample } from "@/lib/voice-storage";

async function getOwnedVoice(voiceId: string, userId: string) {
  const voice = await prisma.voice.findUnique({ where: { id: voiceId } });

  if (!voice || voice.ownerId !== userId) {
    return null;
  }

  return voice;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const voice = await getOwnedVoice(id, session.user.id);

  if (!voice) {
    return NextResponse.json({ error: "Voice not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const isPublic = body?.isPublic;

  if (typeof isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic must be a boolean" }, { status: 400 });
  }

  const updated = await prisma.voice.update({
    where: { id },
    data: { isPublic },
  });

  return NextResponse.json({ voice: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const voice = await getOwnedVoice(id, session.user.id);

  if (!voice) {
    return NextResponse.json({ error: "Voice not found" }, { status: 404 });
  }

  // Voice deletion cascades to GenerationJob rows via the schema's onDelete: Cascade
  await prisma.voice.delete({ where: { id } });
  await deleteVoiceSample(voice.ttsRequestId);

  return NextResponse.json({ success: true });
}
