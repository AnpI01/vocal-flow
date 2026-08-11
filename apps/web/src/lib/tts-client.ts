const TTS_API_URL = process.env.TTS_API_URL ?? "http://localhost:8000";
const TTS_API_KEY = process.env.TTS_API_KEY ?? "";

class TtsApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Calls the Python service's /prompt endpoint to create a voice-clone prompt.
 * Forwards the same sample audio the user uploaded, plus a transcript built
 * from the text they entered in the form (sent as a text/plain "file" since
 * the Python endpoint expects sample_transcript as an UploadFile).
 */
export async function createVoicePrompt(
  requestId: string,
  audioFile: File,
  transcriptText: string
): Promise<void> {
  const form = new FormData();
  form.append("request_id", requestId);
  form.append("sample_audio", audioFile, audioFile.name || "sample.wav");
  form.append(
    "sample_transcript",
    new Blob([transcriptText], { type: "text/plain" }),
    "transcript.txt"
  );

  const response = await fetch(`${TTS_API_URL}/prompt`, {
    method: "POST",
    headers: { "X-API-Key": TTS_API_KEY },
    body: form,
  });

  if (!response.ok) {
    const detail = await safeErrorDetail(response);
    throw new TtsApiError(detail, response.status);
  }
}

/**
 * Calls /generate on the Python service - cloned voice generation.
 */
export async function generateClonedVoice(
  requestId: string,
  scriptText: string,
  scriptLang: string
): Promise<{ audio_file: string; metadata: Record<string, number | null> }> {
  const form = new FormData();
  form.append("request_id", requestId);
  form.append("script_text", scriptText);
  form.append("script_lang", scriptLang);

  const response = await fetch(`${TTS_API_URL}/generate`, {
    method: "POST",
    headers: { "X-API-Key": TTS_API_KEY },
    body: form,
  });

  if (!response.ok) {
    const detail = await safeErrorDetail(response);
    throw new TtsApiError(detail, response.status);
  }

  return response.json();
}

/**
 * Downloads the generated audio file's bytes from the Python service, so
 * the Node app can save/serve it without the browser ever calling Python
 * directly.
 */
export async function fetchGeneratedAudio(filename: string): Promise<Buffer> {
  const response = await fetch(`${TTS_API_URL}/audio/${filename}`, {
    headers: { "X-API-Key": TTS_API_KEY },
  });

  if (!response.ok) {
    const detail = await safeErrorDetail(response);
    throw new TtsApiError(detail, response.status);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function safeErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.detail ?? `TTS service error (${response.status})`;
  } catch {
    return `TTS service error (${response.status})`;
  }
}

export { TtsApiError };
