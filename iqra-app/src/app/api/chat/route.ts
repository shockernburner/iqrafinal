import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { assessIqraPolicy, COMPARATIVE_RELIGION_REFUSAL } from "@/lib/iqra-policy";
import { formatBasmala } from "@/lib/iqra-response";
import { toLegacyIqraResponse } from "@/lib/iqra-schema";
import { generateLocalIqraResponse } from "@/lib/model/llm";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildTrainingCalibratedResponse,
  formatRetrievedContext,
  formatSourceSummary,
  getSourceLinks,
  retrieveIqraContext,
} from "@/lib/iqra-retrieval";

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

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { scope: "chat", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { prompt } = (await request.json()) as { prompt?: string };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const policy = assessIqraPolicy(prompt);
  if (policy.requiresComparativeReligionRefusal) {
    return NextResponse.json({
      basmala: formatBasmala(),
      directAnswer: COMPARATIVE_RELIGION_REFUSAL,
      framework: ["Scope: IQRA only addresses Islamic principles, lifestyle, and ethics"],
      source: "IQRA system policy",
      sourceLinks: [],
    });
  }

  const context = await retrieveIqraContext(prompt);
  const trainedResponse = buildTrainingCalibratedResponse(prompt, context);
  if (trainedResponse) {
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

    return NextResponse.json({
      basmala: formatBasmala(),
      directAnswer: trainedResponse.directAnswer,
      framework: trainedResponse.framework,
      source: trainedResponse.source,
      sourceLinks: getSourceLinks(context),
      structured,
      requiresScholarReferral: structured.requiresScholarReferral,
      clarifyingQuestion: null,
      confidence: trainedResponse.confidence,
    });
  }

  const structuredResponse = await generateLocalIqraResponse({
    prompt,
    systemInstruction: await getSystemInstruction(),
    retrievedContext: formatRetrievedContext(context),
    requiresScholarReferral: policy.requiresScholarReferral || policy.prohibitsWorkaround,
  });
  if (structuredResponse.confidence === "low" && context.training.length > 0) {
    structuredResponse.confidence = context.knowledge.length > 0 ? "high" : "medium";
  }
  const response = toLegacyIqraResponse(structuredResponse, formatSourceSummary(context));

  return NextResponse.json({
    basmala: formatBasmala(),
    sourceLinks: getSourceLinks(context),
    structured: structuredResponse,
    ...response,
  });
}