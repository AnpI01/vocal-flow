"use client";

import { useCallback, useState } from "react";

import { JobStatusPoller } from "@/components/JobStatusPoller";

const MAX_SCRIPT_LENGTH = 5000;

const LANGUAGES = [
  "English",
  "Chinese",
  "Japanese",
  "Korean",
];

type VoiceOption = {
  id: string;
  name: string;
  isPublic: boolean;
  ownerEmail: string;
  isMine: boolean;
};

export function GenerateForm({
  voices,
}: {
  voices: VoiceOption[];
}) {
  const [voiceId, setVoiceId] = useState(
    voices[0]?.id ?? ""
  );

  const [scriptText, setScriptText] = useState("");

  const [scriptLang, setScriptLang] =
    useState("English");

  const [error, setError] =
    useState<string | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [activeJobId, setActiveJobId] =
    useState<string | null>(null);

  const remaining =
    MAX_SCRIPT_LENGTH - scriptText.length;

  const handleActiveChange = useCallback(
    (isActive: boolean) => {
      setIsGenerating(isActive);
    },
    []
  );

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError(null);

    if (!voiceId) {
      setError("Choose a voice");
      return;
    }

    if (!scriptText.trim()) {
      setError("Enter some text to generate");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voiceId,
            scriptText,
            scriptLang,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ?? "Something went wrong"
        );

        setIsGenerating(false);
        return;
      }

      setActiveJobId(data.jobId);
    } catch {
      setError(
        "Couldn't reach the server. Check your connection and try again."
      );

      setIsGenerating(false);
    }
  }

  if (voices.length === 0) {
    return (
      <p className="text-sm text-[#9AA1B2]">
        No voices available yet. Upload one first
        from the Voices page.
      </p>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Voice */}

        <div>
          <label
            htmlFor="voice"
            className="block text-sm font-medium text-[#151823]"
          >
            Voice
          </label>

          <select
            id="voice"
            value={voiceId}
            onChange={(e) =>
              setVoiceId(e.target.value)
            }
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent"
          >
            {voices.map((voice) => (
              <option
                key={voice.id}
                value={voice.id}
              >
                {voice.name}

                {!voice.isMine
                  ? ` (public, by ${voice.ownerEmail})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Script */}

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="script"
              className="block text-sm font-medium text-[#151823]"
            >
              Script
            </label>

            <span
              className={`text-xs ${
                remaining < 0
                  ? "text-[#DC2626]"
                  : "text-[#9AA1B2]"
              }`}
            >
              {remaining} characters left
            </span>
          </div>

          <textarea
            id="script"
            required
            rows={8}
            value={scriptText}
            onChange={(e) =>
              setScriptText(e.target.value)
            }
            placeholder="Type or paste the text you want spoken..."
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent resize-none"
          />
        </div>

        {/* Language */}

        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-[#151823]"
          >
            Language
          </label>

          <select
            id="language"
            value={scriptLang}
            onChange={(e) =>
              setScriptLang(e.target.value)
            }
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent"
          >
            {LANGUAGES.map((lang) => (
              <option
                key={lang}
                value={lang}
              >
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}

        {error && (
          <p
            role="alert"
            className="text-sm text-[#DC2626]"
          >
            {error}
          </p>
        )}

        {/* Generate button */}

        <button
          type="submit"
          disabled={
            isGenerating || remaining < 0
          }
          className="w-full rounded-lg bg-[#151823] text-white text-sm font-medium py-2.5 hover:bg-[#252A3A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating
            ? "Generating..."
            : "Generate audio"}
        </button>
      </form>

      {/* Job result */}

      {activeJobId && (
        <div>
          <h2 className="text-sm font-medium text-[#4B5262] uppercase tracking-wide mb-3">
            Result
          </h2>

          <JobStatusPoller
            jobId={activeJobId}
            onActiveChange={
              handleActiveChange
            }
          />
        </div>
      )}
    </div>
  );
}
