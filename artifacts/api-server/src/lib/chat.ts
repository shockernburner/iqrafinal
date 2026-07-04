import { assessIqraPolicy, COMPARATIVE_RELIGION_REFUSAL } from "./iqra-policy";
import { formatBasmala } from "./iqra-response";
import { searchKnowledgeChunks } from "./retrieval";
import { findRelevantTrainingRecords } from "./training-data";
import { generateLlmChatResponse } from "./iqra-llm";

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

const CONFIDENCE_ORDER = { low: 0, medium: 1, high: 2 } as const;

function capConfidence(
  confidence: "high" | "medium" | "low",
  cap: "high" | "medium" | "low",
): "high" | "medium" | "low" {
  return CONFIDENCE_ORDER[confidence] > CONFIDENCE_ORDER[cap] ? cap : confidence;
}

function composeDisplayMarkdown(args: {
  basmala: string;
  answer: string;
  framework: string[];
  sourceQuote: string;
  sourceAttribution: string;
  clarifyingQuestion: string | null;
  requiresScholarReferral: boolean;
}): string {
  const parts: string[] = [args.basmala, "", args.answer];

  if (args.framework.length > 0) {
    parts.push("", "**Ethical Framework & Principles**", "");
    for (const item of args.framework) {
      parts.push(`- ${item}`);
    }
  }

  if (args.sourceQuote) {
    parts.push("", `> ${args.sourceQuote}`);
    if (args.sourceAttribution) {
      parts.push(`> — *${args.sourceAttribution}*`);
    }
  }

  if (args.clarifyingQuestion) {
    parts.push("", `**To sharpen this guidance:** ${args.clarifyingQuestion}`);
  }

  if (args.requiresScholarReferral) {
    parts.push(
      "",
      "_This matter warrants a certified scholar's review for a formal ruling. IQRA provides principles, not Fatwas._",
    );
  }

  return parts.join("\n");
}

export async function generateIqraChatResponse(prompt: string): Promise<ChatApiPayload> {
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

  const [chunks, examples] = await Promise.all([
    searchKnowledgeChunks(prompt, 6),
    findRelevantTrainingRecords(prompt, 3),
  ]);

  const llm = await generateLlmChatResponse(prompt, chunks, examples);

  // Without knowledge base support, confidence is capped at "medium" — genuine
  // "high" confidence requires grounding in the uploaded document library.
  const confidence =
    chunks.length === 0 ? capConfidence(llm.confidence, "medium") : llm.confidence;

  const basmala = formatBasmala();
  const requiresScholarReferral =
    policy.requiresScholarReferral || policy.prohibitsWorkaround || llm.requiresScholarReferral;

  const source =
    chunks.length > 0
      ? `Grounded in the IQRA knowledge base: ${[...new Set(chunks.map((chunk) => chunk.documentTitle))].join("; ")}`
      : llm.sourceAttribution || "Classical Islamic scholarship";

  const sourceLinks =
    llm.sourceLinks.length > 0
      ? llm.sourceLinks
      : [...new Set(chunks.map((chunk) => chunk.documentTitle))].map((title) => ({
          label: title,
          href: "",
        }));

  return {
    basmala,
    directAnswer: composeDisplayMarkdown({
      basmala,
      answer: llm.answer,
      framework: llm.framework,
      sourceQuote: llm.sourceQuote,
      sourceAttribution: llm.sourceAttribution,
      clarifyingQuestion: llm.clarifyingQuestion,
      requiresScholarReferral,
    }),
    framework: llm.framework,
    source,
    sourceLinks,
    requiresScholarReferral,
    clarifyingQuestion: llm.clarifyingQuestion,
    confidence,
  };
}
