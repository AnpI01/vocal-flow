"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadVoicePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioPreviewUrl = audioFile ? URL.createObjectURL(audioFile) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!audioFile) {
      setError("Choose a WAV sample of the voice");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("isPublic", String(isPublic));
    formData.append("sample_audio", audioFile);
    formData.append("transcript", transcript);

    try {
      const response = await fetch("/api/voices", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      router.push("/voices");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/voices" className="text-sm text-[#6B7280] hover:text-[#151823]">
        ← Back to voices
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-[#151823] tracking-tight">
        Upload a voice
      </h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Provide a clean WAV sample and its exact transcript. The clearer the
        recording, the better the clone.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#151823]">
            Voice name
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Narrator"
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="audio" className="block text-sm font-medium text-[#151823]">
            Sample audio (.wav)
          </label>
          <input
            id="audio"
            type="file"
            accept=".wav,audio/wav"
            required
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            className="mt-1.5 w-full text-sm text-[#4B5262] file:mr-3 file:rounded-lg file:border-0 file:bg-[#151823] file:text-white file:text-sm file:font-medium file:px-3.5 file:py-2 hover:file:bg-[#252A3A]"
          />
          {audioPreviewUrl && (
            <audio controls src={audioPreviewUrl} className="mt-3 w-full h-10" />
          )}
        </div>

        <div>
          <label htmlFor="transcript" className="block text-sm font-medium text-[#151823]">
            Transcript
          </label>
          <textarea
            id="transcript"
            required
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type exactly what's spoken in the sample audio"
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent resize-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[#151823]">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-[#D6DAE3] text-[#2FD4C4] focus:ring-[#2FD4C4]"
          />
          Make this voice public (visible to all users)
        </label>

        {error && (
          <p role="alert" className="text-sm text-[#DC2626]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#151823] text-white text-sm font-medium py-2.5 hover:bg-[#252A3A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating voice prompt... this can take a moment" : "Upload voice"}
        </button>
      </form>
    </div>
  );
}
