import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GenerateForm } from "@/components/GenerateForm";

export default async function GeneratePage() {
  const session = await auth();
  const userId = session!.user.id;

  const voices = await prisma.voice.findMany({
    where: {
      OR: [{ ownerId: userId }, { isPublic: true }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true } },
    },
  });

  const voiceOptions = voices.map((v) => ({
    id: v.id,
    name: v.name,
    isPublic: v.isPublic,
    ownerEmail: v.owner.email,
    isMine: v.ownerId === userId,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#151823] tracking-tight">
        Generate audio
      </h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Pick a voice, enter your script, and generate the audio.
      </p>

      <div className="mt-8">
        <GenerateForm voices={voiceOptions} />
      </div>
    </div>
  );
}
