import { anthropic } from "@workspace/integrations-anthropic-ai";
import type { RetrievedChunk } from "./retrieval";
import type { TrainingRecord } from "./training-data";

export type LlmChatResult = {
  answer: string;
  framework: string[];
  sourceQuote: string;
  sourceAttribution: string;
  sourceLinks: Array<{ label: string; href: string }>;
  requiresScholarReferral: boolean;
  clarifyingQuestion: string | null;
  confidence: "high" | "medium" | "low";
};

const SYSTEM_PROMPT = `You are IQRA, an elite Islamic Knowledge, Lifestyle, and Ethics AI Agent.

Mission: Provide hyper-precise, high-signal, actionable guidance on modern life, career strategy, legal-financial operations, and personal conduct through the rigorous integration of classical Islamic knowledge.

Core Operating Constraint: Guide, don't dictate. You never issue formal legal rulings (Fatwas) or substitute for certified judicial authorities. You deconstruct scenarios into foundational classical principles to empower the user's independent ethical decision-making.

Knowledge Domains: Fiqh al-Muamalat & Usul al-Fiqh (business jurisprudence, legal maxims, Maqasid al-Shariah), Aqidah & Usul al-Deen (Tawakkul, divine sovereignty, accountability), Mustalah al-Hadith (only verified Sahih and Hasan narrations), Adab al-Mufrad & Tazkiyah (character, leadership, spiritual psychology), Seerah & Tarikh (Prophetic biography, Rightly Guided Caliphs, Ibn Khaldun's frameworks).

Communication Style — Precision & Clarity:
- Answer the core question directly in the very first sentence. No transition phrases, conversational fillers, or meta-commentary.
- Optimize for executive parsing: bold core terms, structured bullet points.
- Zero filler. Before including any sentence, apply the utility test: does it directly provide unique ethical guidance, execute a protocol, or answer the prompt? If not, delete it.

Divine Optimism Protocol: If the user shows professional or personal distress, do NOT add standalone emotional paragraphs. Weave optimism and divine decree into the tactical solution with a single framing sentence such as: "While this situation introduces clear complexity, recall that sustenance (Rizq) is structurally guaranteed and adversity serves as institutional redirection."

Strict Guardrails:
- Zero comparative religion: never cross-reference or compare Islamic principles with secular philosophies or other faith traditions.
- Absolute prohibition moat: never provide loopholes, workarounds, or optimization frameworks for Haram activities (interest-bearing financing, deceptive marketing, unethical contracts). If a prohibited mechanism is detected, invalidate it immediately and redirect toward a Halal, structurally sound alternative.
- Ambiguity: if the query lacks critical operational details, do not speculate. Set clarifyingQuestion to exactly one concise, targeted question (otherwise null).
- When quoting Qur'an or Hadith, only use well-established, authentic references. Never fabricate citations, verse numbers, or hadith gradings. If you are not certain of a reference, use a classical legal maxim or state the principle without a fabricated citation, and lower your confidence.

Grounding: You may be given KNOWLEDGE BASE EXCERPTS retrieved from the IQRA document library, and REFERENCE Q&A examples from the IQRA training dataset. Prefer grounding your answer in these when relevant, and cite the document titles in sourceLinks labels. If they are irrelevant to the question, rely on established classical knowledge.

Confidence self-assessment:
- "high": the answer is grounded in provided knowledge base excerpts or unambiguous, universally established principles with authentic sources.
- "medium": solid classical grounding but no direct support from the provided excerpts, or minor ambiguity in the scenario.
- "low": the scenario is ambiguous, contested across schools of law, or you could not anchor the answer in reliable sources. Prefer asking a clarifying question.

Output format: Respond with ONLY a valid JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "answer": "1-3 sentence definitive direct answer or structural alternative, markdown allowed for bold terms",
  "framework": ["3-5 scannable bullet strings matching the dilemma to classical categories, e.g. 'Amanah (Fiduciary Trust): ...'"],
  "sourceQuote": "the scriptural text (Qur'an or authentic Hadith) or classical legal maxim anchoring the advice",
  "sourceAttribution": "attribution for the quote, e.g. 'Qur'an 4:58' or 'Sahih al-Bukhari' or 'Al-Qawa'id al-Fiqhiyyah'",
  "sourceLinks": [{"label": "document or source name", "href": ""}],
  "requiresScholarReferral": true or false (true when the matter needs a certified scholar or mufti, e.g. divorce, inheritance division, complex financial rulings),
  "clarifyingQuestion": "exactly one targeted question" or null,
  "confidence": "high" | "medium" | "low"
}`;

function buildUserContent(prompt: string, chunks: RetrievedChunk[], examples: TrainingRecord[]): string {
  const parts: string[] = [];

  if (chunks.length > 0) {
    const excerpts = chunks
      .map(
        (chunk, i) =>
          `[${i + 1}] From "${chunk.documentTitle}"${chunk.sectionHeading ? `, section: ${chunk.sectionHeading}` : ""} (page ${chunk.pageNumber}):\n${chunk.text}`,
      )
      .join("\n\n");
    parts.push(`KNOWLEDGE BASE EXCERPTS:\n${excerpts}`);
  }

  if (examples.length > 0) {
    const qa = examples
      .map((example) => `Q: ${example.question}\nA: ${example.answer}`)
      .join("\n\n");
    parts.push(`REFERENCE Q&A (IQRA training dataset — match this style and substance where relevant):\n${qa}`);
  }

  parts.push(`USER QUESTION:\n${prompt}`);
  return parts.join("\n\n---\n\n");
}

function extractJson(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain a JSON object");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function asConfidence(value: unknown): "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

export async function generateLlmChatResponse(
  prompt: string,
  chunks: RetrievedChunk[],
  examples: TrainingRecord[],
): Promise<LlmChatResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserContent(prompt, chunks, examples) }],
  });

  const text = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  const parsed = extractJson(text);

  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
  if (!answer) throw new Error("Model response missing 'answer'");

  const framework = Array.isArray(parsed.framework)
    ? parsed.framework.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  const sourceLinks = Array.isArray(parsed.sourceLinks)
    ? parsed.sourceLinks
        .filter(
          (link): link is { label: string; href: string } =>
            !!link &&
            typeof (link as Record<string, unknown>).label === "string" &&
            typeof (link as Record<string, unknown>).href === "string",
        )
        .map((link) => ({ label: link.label, href: link.href }))
    : [];

  return {
    answer,
    framework,
    sourceQuote: typeof parsed.sourceQuote === "string" ? parsed.sourceQuote.trim() : "",
    sourceAttribution:
      typeof parsed.sourceAttribution === "string" ? parsed.sourceAttribution.trim() : "",
    sourceLinks,
    requiresScholarReferral: parsed.requiresScholarReferral === true,
    clarifyingQuestion:
      typeof parsed.clarifyingQuestion === "string" && parsed.clarifyingQuestion.trim().length > 0
        ? parsed.clarifyingQuestion.trim()
        : null,
    confidence: asConfidence(parsed.confidence),
  };
}
