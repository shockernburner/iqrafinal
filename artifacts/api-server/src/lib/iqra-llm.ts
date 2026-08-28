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
  /** Detected language of the user's question (English name), e.g. "English", "Arabic". */
  language: string;
  /** Section labels localized to the user's language (fall back to English). */
  frameworkHeading: string;
  clarifyingLabel: string;
  scholarReferralNote: string;
};

export const DEFAULT_FRAMEWORK_HEADING = "Ethical Framework & Principles";
export const DEFAULT_CLARIFYING_LABEL = "To sharpen this guidance:";
export const DEFAULT_SCHOLAR_REFERRAL_NOTE =
  "This matter warrants a certified scholar's review for a formal ruling. IQRA provides principles, not Fatwas.";

const SYSTEM_PROMPT = `You are IQRA, an elite Islamic Knowledge, Lifestyle, and Ethics AI Agent.

Mission: Provide hyper-precise, high-signal, actionable guidance on modern life, career strategy, legal-financial operations, and personal conduct through the rigorous integration of classical Islamic knowledge.

Core Operating Constraint: Guide, don't dictate. You never issue formal legal rulings (Fatwas) or substitute for certified judicial authorities. You deconstruct scenarios into foundational classical principles to empower the user's independent ethical decision-making.

Knowledge Domains: Fiqh al-Muamalat & Usul al-Fiqh (business jurisprudence, legal maxims, Maqasid al-Shariah), Aqidah & Usul al-Deen (Tawakkul, divine sovereignty, accountability), Mustalah al-Hadith (only verified Sahih and Hasan narrations), Adab al-Mufrad & Tazkiyah (character, leadership, spiritual psychology), Seerah & Tarikh (Prophetic biography, Rightly Guided Caliphs, Ibn Khaldun's frameworks).

Communication Style — Precision & Clarity:
- Answer the core question directly in the very first sentence. No transition phrases, conversational fillers, or meta-commentary.
- Optimize for executive parsing: bold core terms, structured bullet points.
- Zero filler. Before including any sentence, apply the utility test: does it directly provide unique ethical guidance, execute a protocol, or answer the prompt? If not, delete it.

Language Protocol — Mirror the user:
- Detect the natural language of the USER QUESTION and write EVERY natural-language output field (answer, framework, clarifyingQuestion, frameworkHeading, clarifyingLabel, scholarReferralNote) in that exact same language, matching its script, tone, and register. If the question mixes languages, use the dominant one.
- The KNOWLEDGE BASE EXCERPTS and REFERENCE Q&A may be in a different language (usually English). Still respond in the user's language regardless of the language of the grounding material — translate the substance, do not switch languages.
- Keep Qur'an and Hadith quotations in their original Arabic inside sourceQuote; you may append a short translation in the user's language in parentheses. Keep proper-noun attributions (e.g. "Qur'an 4:58", "Sahih al-Bukhari", "Al-Qawa'id al-Fiqhiyyah") in their standard form.
- Report the detected language's English name in the "language" field.

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
  "clarifyingQuestion": "exactly one targeted question, in the user's language" or null,
  "confidence": "high" | "medium" | "low",
  "language": "the user question's language as an English name, e.g. 'English', 'Arabic', 'Urdu', 'French', 'Indonesian'",
  "frameworkHeading": "heading for the framework bullets, in the user's language (English: 'Ethical Framework & Principles')",
  "clarifyingLabel": "short bold lead-in for the clarifying question ending with a colon, in the user's language (English: 'To sharpen this guidance:')",
  "scholarReferralNote": "one sentence telling the user to consult a certified scholar for a formal ruling, in the user's language (English: 'This matter warrants a certified scholar's review for a formal ruling. IQRA provides principles, not Fatwas.')"
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

/**
 * Translate a fixed English message into the same language as the user's prompt.
 * Used for deterministic responses (e.g. the comparative-religion refusal) so they
 * mirror the user's language. The message content is fixed by us — the model only
 * translates it — and any failure falls back to the original English text so the
 * response is never blocked.
 */
export async function localizeMessage(
  prompt: string,
  englishMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const message = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system:
          "You are a translator. Translate the MESSAGE into the exact same natural language as the USER TEXT, matching its script and register. If the USER TEXT is already in English, return the MESSAGE unchanged. Do not answer or comment on the USER TEXT. Output ONLY the translated message — no quotes, no labels, no commentary.",
        messages: [
          { role: "user", content: `USER TEXT:\n${prompt}\n\n---\n\nMESSAGE:\n${englishMessage}` },
        ],
      },
      { signal },
    );
    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return text || englishMessage;
  } catch {
    return englishMessage;
  }
}

export async function generateLlmChatResponse(
  prompt: string,
  chunks: RetrievedChunk[],
  examples: TrainingRecord[],
  signal?: AbortSignal,
): Promise<LlmChatResult> {
  const message = await anthropic.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserContent(prompt, chunks, examples) }],
    },
    { signal },
  );

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

  const strOr = (value: unknown, fallback: string): string =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

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
    language: strOr(parsed.language, "English"),
    frameworkHeading: strOr(parsed.frameworkHeading, DEFAULT_FRAMEWORK_HEADING),
    clarifyingLabel: strOr(parsed.clarifyingLabel, DEFAULT_CLARIFYING_LABEL),
    scholarReferralNote: strOr(parsed.scholarReferralNote, DEFAULT_SCHOLAR_REFERRAL_NOTE),
  };
}
