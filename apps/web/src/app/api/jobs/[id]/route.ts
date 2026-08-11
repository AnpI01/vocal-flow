import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteGeneratedAudio } from "@/lib/generated-audio-storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const job = await prisma.generationJob.findUnique({ where: { id } });

  if (!job || job.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    audioFilename: job.audioFilename,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
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

  const job = await prisma.generationJob.findUnique({ where: { id } });

  if (!job || job.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await prisma.generationJob.delete({ where: { id } });
  await deleteGeneratedAudio(job.id);

  return NextResponse.json({ success: true });
}
