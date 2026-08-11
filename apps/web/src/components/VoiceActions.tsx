"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function VoiceActions({
  voiceId,
  isPublic,
}: {
  voiceId: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggleVisibility() {
    setError(null);
    const response = await fetch(`/api/voices/${voiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });

    if (!response.ok) {
      setError("Couldn't update visibility");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!confirm("Delete this voice? This can't be undone.")) return;

    setError(null);
    const response = await fetch(`/api/voices/${voiceId}`, { method: "DELETE" });

    if (!response.ok) {
      setError("Couldn't delete this voice");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleVisibility}
        disabled={isPending}
        className="text-xs font-medium text-[#4B5262] hover:text-[#151823] disabled:opacity-50"
      >
        Make {isPublic ? "private" : "public"}
      </button>
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
