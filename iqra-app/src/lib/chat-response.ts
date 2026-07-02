import { readFile } from "node:fs/promises";
import path from "node:path";
import { assessIqraPolicy, COMPARATIVE_RELIGION_REFUSAL } from "@/lib/iqra-policy";
import { formatBasmala } from "@/lib/iqra-response";
import { toLegacyIqraResponse } from "@/lib/iqra-schema";
import { generateLocalIqraResponse } from "@/lib/model/llm";
import {
  buildTrainingCalibratedResponse,
  formatRetrievedContext,
  formatSourceSummary,
  getSourceLinks,
  retrieveIqraContext,
} from "@/lib/iqra-retrieval";

const REQUIRED_CONFIDENCE = "high";

export type ChatApiPayload = {
  basmala: string;
  directAnswer: string;
  framework: string[];
  source: string;
  sourceLinks: Array<{ label: string; href: string }>;
  requiresScholarReferral?: boolean;
  clarifyingQuestion?: string | null;
  confidence?: "high" | "medium" | "low";
  responseHeld?: boolean;
  suggestedAction?: "retrain_or_refine_prompt";
  structured?: unknown;
};

function detectResponseLanguage(prompt: string): "en" | "bn" {
  return /[\u0980-\u09FF]/u.test(prompt) ? "bn" : "en";
}

function toFrameworkItems(framework: string[]) {
  return framework.slice(0, 5).map((item) => {
    const [principle, ...rest] = item.split(":");
    return {
      principle: principle.trim() || "Amanah",
      explanation: rest.join(":").trim() || item.trim(),
    };
  });
}

async function getSystemInstruction() {
  try {
    return await readFile(path.join(process.cwd(), "..", "sys_instruction.txt"), "utf8");
  } catch {
    return "You are IQRA, an Islamic ethics assistant. Guide users through Islamic principles, do not issue Fatwas, and answer in concise structured JSON.";
  }
}

function buildConfidenceHoldResponse(prompt: string, confidence: "low" | "medium", sourceSummary: string): ChatApiPayload {
  const language = detectResponseLanguage(prompt);
  const confidenceLabel = confidence === "medium" ? "medium" : "low";
  const directAnswer =
    language === "bn"
      ? `এই প্রশ্নের বর্তমান উত্তরটি এখনই শেয়ার করা হচ্ছে না, কারণ প্রমাণ-ভিত্তিক আত্মবিশ্বাস ${confidenceLabel}। উচ্চ আত্মবিশ্বাস (high) নিশ্চিত হলে উত্তর দেওয়া হবে।`
      : `I am holding the direct answer for now because the current evidence confidence is ${confidenceLabel}. The answer will be delivered once confidence is high.`;

  const framework =
    language === "bn"
      ? [
          "আরও নির্ভুল প্রেক্ষাপট দিন: শিল্প, দেশ/নীতি, চুক্তির ধরন, সময়সীমা",
          "প্রয়োজনে retraining চালান (prepare:training, verify:training, eval:run), তারপর একই প্রশ্ন আবার জিজ্ঞাসা করুন",
          "উত্তর পাওয়া পর্যন্ত আমি high-confidence প্রমাণ ছাড়া চূড়ান্ত উত্তর দেখাব না",
        ]
      : [
          "Provide tighter context: jurisdiction, contract type, timeline, and constraints",
          "Run retraining/update (prepare:training, verify:training, eval:run), then ask the same question again",
          "I will continue withholding final answers until confidence is high",
        ];

  const clarifyingQuestion =
    language === "bn"
      ? "আপনি কি প্রশ্নটি নির্দিষ্ট কেস/চুক্তির তথ্যসহ আরেকবার দিতে পারবেন, নাকি আগে retraining চালাব?"
      : "Would you like to share more case-specific details now, or should we run retraining first?";

  return {
    basmala: formatBasmala(),
    directAnswer,
    framework,
    source: sourceSummary,
    sourceLinks: [],
    requiresScholarReferral: false,
    clarifyingQuestion,
    confidence,
    responseHeld: true,
    suggestedAction: "retrain_or_refine_prompt",
    structured: {
      language,
      greeting: formatBasmala(),
      directAnswer,
      ethicalFramework: toFrameworkItems(framework),
      verifiedSources: [],
      scholarlyDifference: false,
      requiresScholarReferral: false,
      clarifyingQuestion,
      confidence,
    },
  };
}

export async function generateConfidenceGatedChatResponse(prompt: string): Promise<ChatApiPayload> {
  const policy = assessIqraPolicy(prompt);
  if (policy.requiresComparativeReligionRefusal) {
    return {
      basmala: formatBasmala(),
      directAnswer: COMPARATIVE_RELIGION_REFUSAL,
      framework: ["Scope: IQRA only addresses Islamic principles, lifestyle, and ethics"],
      source: "IQRA system policy",
      sourceLinks: [],
      responseHeld: false,
      confidence: "high",
    };
  }

  const context = await retrieveIqraContext(prompt);
  const trainedResponse = buildTrainingCalibratedResponse(prompt, context);
  if (trainedResponse) {
    if (trainedResponse.confidence !== REQUIRED_CONFIDENCE) {
      return buildConfidenceHoldResponse(prompt, trainedResponse.confidence, trainedResponse.source);
    }

    const structured = {
      language: detectResponseLanguage(prompt),
      greeting: formatBasmala(),
      directAnswer: trainedResponse.directAnswer,
      ethicalFramework: toFrameworkItems(trainedResponse.framework),
      verifiedSources: context.knowledge.slice(0, 3).flatMap((record) =>
        record.page
          ? [
              {
                documentId: String(record.documentId ?? record.id),
                fileName: record.fileName ?? record.title,
                page: record.page,
                section: record.section ?? undefined,
                referenceText: record.text.slice(0, 320),
              },
            ]
          : [],
      ),
      scholarlyDifference: false,
      requiresScholarReferral: policy.requiresScholarReferral || policy.prohibitsWorkaround,
      clarifyingQuestion: null,
      confidence: trainedResponse.confidence,
    };

    return {
      basmala: formatBasmala(),
      directAnswer: trainedResponse.directAnswer,
      framework: trainedResponse.framework,
      source: trainedResponse.source,
      sourceLinks: getSourceLinks(context),
      structured,
      requiresScholarReferral: structured.requiresScholarReferral,
      clarifyingQuestion: null,
      confidence: trainedResponse.confidence,
      responseHeld: false,
    };
  }

  const structuredResponse = await generateLocalIqraResponse({
    prompt,
    systemInstruction: await getSystemInstruction(),
    retrievedContext: formatRetrievedContext(context),
    requiresScholarReferral: policy.requiresScholarReferral || policy.prohibitsWorkaround,
  });

  if (structuredResponse.confidence !== REQUIRED_CONFIDENCE) {
    return buildConfidenceHoldResponse(prompt, structuredResponse.confidence, formatSourceSummary(context));
  }

  const response = toLegacyIqraResponse(structuredResponse, formatSourceSummary(context));

  return {
    basmala: formatBasmala(),
    sourceLinks: getSourceLinks(context),
    structured: structuredResponse,
    responseHeld: false,
    ...response,
  };
}
