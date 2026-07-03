export type TranscriptionResult = {
  transcript: string;
  language: "en" | "bn" | "unknown";
  confidence: number | null;
};

type LocalSttPayload = {
  transcript?: unknown;
  text?: unknown;
  language?: unknown;
  confidence?: unknown;
};

function normalizeLanguage(value: unknown): TranscriptionResult["language"] {
  return value === "en" || value === "bn" ? value : "unknown";
}

export async function transcribeWithLocalStt(audio: File): Promise<TranscriptionResult> {
  const endpoint = process.env.LOCAL_STT_ENDPOINT;
  if (!endpoint) {
    throw new Error("Private speech-to-text is not configured. Set LOCAL_STT_ENDPOINT to a self-hosted STT service.");
  }

  const form = new FormData();
  form.append("audio", audio, audio.name || "query.webm");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.LOCAL_STT_TIMEOUT_MS ?? 30000));
  try {
    const response = await fetch(endpoint, { method: "POST", body: form, signal: controller.signal });
    if (!response.ok) throw new Error("Private speech-to-text service rejected the audio.");
    const payload = (await response.json()) as LocalSttPayload;
    const transcript = typeof payload.transcript === "string" ? payload.transcript : typeof payload.text === "string" ? payload.text : "";
    if (!transcript.trim()) throw new Error("Private speech-to-text did not return a transcript.");
    return {
      transcript: transcript.trim(),
      language: normalizeLanguage(payload.language),
      confidence: typeof payload.confidence === "number" ? payload.confidence : null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
