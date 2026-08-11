import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VoiceActions } from "@/components/VoiceActions";

export default async function VoicesPage() {
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

  const myVoices = voices.filter((v) => v.ownerId === userId);
  const publicVoices = voices.filter((v) => v.ownerId !== userId && v.isPublic);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#151823] tracking-tight">Voices</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage your cloned voices, or use ones shared publicly.
          </p>
        </div>
        <Link
          href="/voices/upload"
          className="rounded-lg bg-[#151823] text-white text-sm font-medium px-4 py-2.5 hover:bg-[#252A3A] transition-colors"
        >
          Upload voice
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-[#4B5262] uppercase tracking-wide">
          My voices
        </h2>
        {myVoices.length === 0 ? (
          <p className="mt-3 text-sm text-[#9AA1B2]">
            You haven&apos;t uploaded a voice yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E3E6EC] rounded-xl border border-[#E3E6EC] bg-white">
            {myVoices.map((voice) => (
              <li key={voice.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#151823] truncate">{voice.name}</p>
                  {voice.sampleAudioUrl && (
                    <audio controls src={voice.sampleAudioUrl} className="mt-2 h-8" />
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      voice.isPublic
                        ? "bg-[#ECFDF5] text-[#047857]"
                        : "bg-[#F1F2F5] text-[#4B5262]"
                    }`}
                  >
                    {voice.isPublic ? "Public" : "Private"}
                  </span>
                  <VoiceActions voiceId={voice.id} isPublic={voice.isPublic} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-[#4B5262] uppercase tracking-wide">
          Public voices from other users
        </h2>
        {publicVoices.length === 0 ? (
          <p className="mt-3 text-sm text-[#9AA1B2]">No public voices available yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E3E6EC] rounded-xl border border-[#E3E6EC] bg-white">
            {publicVoices.map((voice) => (
              <li key={voice.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#151823] truncate">{voice.name}</p>
                  <p className="text-xs text-[#9AA1B2]">by {voice.owner.email}</p>
                  {voice.sampleAudioUrl && (
                    <audio controls src={voice.sampleAudioUrl} className="mt-2 h-8" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
