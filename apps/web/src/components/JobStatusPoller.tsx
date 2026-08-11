"use client";

import { useEffect, useState } from "react";

type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

type JobData = {
  id: string;
  status: JobStatus;
  audioFilename: string | null;
  errorMessage: string | null;
};

const POLL_INTERVAL_MS = 2500;

const STATUS_LABEL: Record<JobStatus, string> = {
  QUEUED: "Queued...",
  PROCESSING: "Generating audio...",
  COMPLETED: "Done",
  FAILED: "Failed",
};

export function JobStatusPoller({
  jobId,
  onActiveChange,
}: {
  jobId: string;
  onActiveChange: (isActive: boolean) => void;
}) {
  const [job, setJob] = useState<JobData | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);

        if (!response.ok) {
          if (!cancelled) {
            timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
          }
          return;
        }

        const data: JobData = await response.json();

        if (cancelled) return;

        setJob(data);

        const isActive =
          data.status === "QUEUED" ||
          data.status === "PROCESSING";

        onActiveChange(isActive);

        if (isActive) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [jobId, onActiveChange]);

  if (!job) {
    return (
      <p className="text-sm text-[#9AA1B2]">
        Checking status...
      </p>
    );
  }

  const isActive =
    job.status === "QUEUED" ||
    job.status === "PROCESSING";

  return (
    <div className="rounded-xl border border-[#E3E6EC] bg-white p-4">
      <div className="flex items-center gap-2">
        {isActive && (
          <span className="h-2 w-2 rounded-full bg-[#2FD4C4] animate-pulse" />
        )}

        <span
          className={`text-sm font-medium ${
            job.status === "FAILED"
              ? "text-[#DC2626]"
              : "text-[#151823]"
          }`}
        >
          {STATUS_LABEL[job.status]}
        </span>
      </div>

      {job.status === "FAILED" && job.errorMessage && (
        <p className="mt-2 text-sm text-[#DC2626]">
          {job.errorMessage}
        </p>
      )}

      {job.status === "COMPLETED" && job.audioFilename && (
        <div className="mt-3 space-y-3">
          <audio
            controls
            src={job.audioFilename}
            className="w-full h-10"
          />

          <a
            href={job.audioFilename}
            download
            className="inline-block text-sm font-medium text-[#151823] hover:text-[#2FD4C4]"
          >
            Download audio
          </a>
        </div>
      )}
    </div>
  );
}

