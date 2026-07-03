export type EmbeddingVector = number[];

type EmbeddingPayload = {
  embedding?: unknown;
  embeddings?: unknown;
  data?: Array<{ embedding?: unknown }>;
};

function parseEmbedding(payload: EmbeddingPayload): EmbeddingVector | null {
  const candidate = payload.embedding ?? (Array.isArray(payload.embeddings) ? payload.embeddings[0] : undefined) ?? payload.data?.[0]?.embedding;
  if (!Array.isArray(candidate)) return null;
  const vector = candidate.map((value) => (typeof value === "number" ? value : Number(value)));
  return vector.every((value) => Number.isFinite(value)) ? vector : null;
}

export function toPgVector(vector: EmbeddingVector) {
  return `[${vector.join(",")}]`;
}

export async function embedQuery(text: string): Promise<EmbeddingVector | null> {
  const endpoint = process.env.LOCAL_EMBEDDING_ENDPOINT;
  const model = process.env.LOCAL_EMBEDDING_MODEL;
  if (!endpoint) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.LOCAL_EMBEDDING_TIMEOUT_MS ?? 8000));
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(model ? { model, input: text } : { input: text }),
    });
    if (!response.ok) return null;
    return parseEmbedding((await response.json()) as EmbeddingPayload);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
