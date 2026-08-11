import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HistoryItemActions } from "@/components/HistoryItemActions";
import { JobStatusPoller } from "@/components/JobStatusPoller";

const STATUS_STYLES: Record<string, string> = {
  QUEUED: "bg-[#F1F2F5] text-[#4B5262]",
  PROCESSING: "bg-[#FEF3C7] text-[#92400E]",
  COMPLETED: "bg-[#ECFDF5] text-[#047857]",
  FAILED: "bg-[#FEE2E2] text-[#991B1B]",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user.id;

  const jobs = await prisma.generationJob.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      voice: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#151823] tracking-tight">History</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Your past audio generations.
      </p>

      {jobs.length === 0 ? (
        <p className="mt-8 text-sm text-[#9AA1B2]">
          No generations yet. Head to the Generate page to create your first one.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {jobs.map((job) => {
            const isActive = job.status === "QUEUED" || job.status === "PROCESSING";

            return (
              <li
                key={job.id}
                className="rounded-xl border border-[#E3E6EC] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#151823]">
                        {job.voice.name}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          STATUS_STYLES[job.status]
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-[#9AA1B2]">{job.scriptLang}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#4B5262]">
                      {truncate(job.scriptText, 160)}
                    </p>
                    <p className="mt-1.5 text-xs text-[#9AA1B2]">
                      {formatDate(job.createdAt)}
                    </p>
                  </div>

                  <HistoryItemActions jobId={job.id} />
                </div>

                <div className="mt-3">
                  {isActive && <JobStatusPoller jobId={job.id} />}

                  {job.status === "COMPLETED" && job.audioFilename && (
                    <div className="space-y-2">
                      <audio controls src={job.audioFilename} className="w-full h-10" />
                      <a
                        href={job.audioFilename}
                        download
                        className="inline-block text-sm font-medium text-[#151823] hover:text-[#2FD4C4]"
                      >
                        Download audio
                      </a>
                    </div>
                  )}

                  {job.status === "FAILED" && job.errorMessage && (
                    <p className="text-sm text-[#DC2626]">{job.errorMessage}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
