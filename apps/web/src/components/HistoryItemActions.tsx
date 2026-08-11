"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function HistoryItemActions({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this generation? This can't be undone.")) return;

    setError(null);
    const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });

    if (!response.ok) {
      setError("Couldn't delete");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs font-medium text-[#DC2626] hover:text-[#991B1B] disabled:opacity-50"
      >
        Delete
      </button>
      {error && <span className="text-xs text-[#DC2626]">{error}</span>}
    </div>
  );
}
