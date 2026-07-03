import { assessIqraPolicy, COMPARATIVE_RELIGION_REFUSAL } from "./iqra-policy";
import { buildIqraResponse, formatBasmala } from "./iqra-response";

export type ChatApiPayload = {
  basmala: string;
  directAnswer: string;
  framework: string[];
  source: string;
  sourceLinks: Array<{ label: string; href: string }>;
  requiresScholarReferral?: boolean;
  clarifyingQuestion?: string | null;
  confidence?: "high" | "medium" | "low";
};

export function generateIqraChatResponse(prompt: string): ChatApiPayload {
  const policy = assessIqraPolicy(prompt);

  if (policy.requiresComparativeReligionRefusal) {
    return {
      basmala: formatBasmala(),
      directAnswer: COMPARATIVE_RELIGION_REFUSAL,
      framework: ["Scope: IQRA only addresses Islamic principles, lifestyle, and ethics"],
      source: "IQRA system policy",
      sourceLinks: [],
      requiresScholarReferral: false,
      confidence: "high",
    };
  }

  const response = buildIqraResponse(prompt);

  return {
    basmala: formatBasmala(),
    directAnswer: response.directAnswer,
    framework: response.framework,
    source: response.source,
    sourceLinks: response.sourceLinks ?? [],
    requiresScholarReferral: policy.requiresScholarReferral || policy.prohibitsWorkaround || response.requiresScholarReferral,
    clarifyingQuestion: response.clarifyingQuestion ?? null,
    confidence: response.confidence ?? "medium",
  };
}
