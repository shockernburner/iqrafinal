export type RerankCandidate = {
  id: string;
  text: string;
};

type RerankPayload = {
  results?: Array<{ index?: number; relevance_score?: number; score?: number }>;
  data?: Array<{ index?: number; relevance_score?: number; score?: number }>;
};

function scoreFromPayload(payload: RerankPayload, size: number) {
  const scores = new Map<number, number>();
  for (const item of payload.results ?? payload.data ?? []) {
    if (typeof item.index !== "number") continue;
    const score = typeof item.relevance_score === "number" ? item.relevance_score : typeof item.score === "number" ? item.score : 0;
    scores.set(item.index, score);
  }
  return Array.from({ length: size }, (_, index) => scores.get(index) ?? 0);
}

export async function rerankDocuments(query: string, candidates: RerankCandidate[]) {
  const endpoint = process.env.LOCAL_RERANK_ENDPOINT;
  if (!endpoint || candidates.length <= 1) return candidates;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.LOCAL_RERANK_TIMEOUT_MS ?? 8000));
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, documents: candidates.map((candidate) => candidate.text) }),
    });
    if (!response.ok) return candidates;
    const scores = scoreFromPayload((await response.json()) as RerankPayload, candidates.length);
    return candidates
      .map((candidate, index) => ({ candidate, score: scores[index] }))
      .sort((left, right) => right.score - left.score)
      .map((item) => item.candidate);
  } catch {
    return candidates;
  } finally {
    clearTimeout(timeout);
  }
}
