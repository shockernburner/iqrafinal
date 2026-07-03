import { CANONICAL_BASMALA } from "@/lib/iqra-policy";

export type IqraLanguage = "en" | "bn";
export type IqraConfidence = "high" | "medium" | "low";

export type VerifiedSource = {
  documentId: string;
  fileName: string;
  page: number;
  section?: string;
  referenceText: string;
};

export type EthicalFrameworkItem = {
  principle: string;
  explanation: string;
};

export type StructuredIqraResponse = {
  language: IqraLanguage;
  greeting: string;
  directAnswer: string;
  ethicalFramework: EthicalFrameworkItem[];
  verifiedSources: VerifiedSource[];
  scholarlyDifference: boolean;
  requiresScholarReferral: boolean;
  clarifyingQuestion: string | null;
  confidence: IqraConfidence;
};

export type LegacyIqraResponse = {
  directAnswer: string;
  framework: string[];
  source: string;
  sourceLinks?: Array<{ label: string; href: string }>;
  requiresScholarReferral?: boolean;
  clarifyingQuestion?: string | null;
  confidence?: IqraConfidence;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function parseFramework(value: unknown): EthicalFrameworkItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items = value.slice(0, 5).map((item) => {
    if (!isRecord(item) || !isString(item.principle) || !isString(item.explanation)) return null;
    return { principle: item.principle.trim(), explanation: item.explanation.trim() };
  });
  if (items.some((item) => item === null)) return null;
  return items as EthicalFrameworkItem[];
}

function parseSources(value: unknown): VerifiedSource[] | null {
  if (!Array.isArray(value)) return null;
  const sources = value.slice(0, 5).map((item) => {
    if (!isRecord(item) || !isString(item.documentId) || !isString(item.fileName) || !isString(item.referenceText)) {
      return null;
    }
    const page = typeof item.page === "number" ? item.page : Number(item.page);
    if (!Number.isInteger(page) || page < 1) return null;
    return {
      documentId: item.documentId.trim(),
      fileName: item.fileName.trim(),
      page,
      section: isString(item.section) ? item.section.trim() : undefined,
      referenceText: item.referenceText.trim(),
    };
  });
  if (sources.some((item) => item === null)) return null;
  return sources as VerifiedSource[];
}

export function parseStructuredIqraResponse(value: unknown): StructuredIqraResponse | null {
  if (!isRecord(value)) return null;
  const language = value.language === "bn" ? "bn" : value.language === "en" ? "en" : null;
  const confidence = value.confidence === "high" || value.confidence === "medium" || value.confidence === "low" ? value.confidence : null;
  const ethicalFramework = parseFramework(value.ethicalFramework);
  const verifiedSources = parseSources(value.verifiedSources);
  if (!language || !confidence || !isString(value.directAnswer) || !ethicalFramework || !verifiedSources) return null;
  if (!isBoolean(value.scholarlyDifference) || !isBoolean(value.requiresScholarReferral)) return null;
  if (value.clarifyingQuestion !== null && value.clarifyingQuestion !== undefined && !isString(value.clarifyingQuestion)) return null;

  return {
    language,
    greeting: CANONICAL_BASMALA,
    directAnswer: value.directAnswer.trim(),
    ethicalFramework,
    verifiedSources,
    scholarlyDifference: value.scholarlyDifference,
    requiresScholarReferral: value.requiresScholarReferral,
    clarifyingQuestion: isString(value.clarifyingQuestion) ? value.clarifyingQuestion.trim() : null,
    confidence,
  };
}

export function toLegacyIqraResponse(response: StructuredIqraResponse, sourceFallback: string): LegacyIqraResponse {
  const source = response.verifiedSources.length
    ? response.verifiedSources
        .map((item) => `${item.fileName}, p. ${item.page}${item.section ? `, ${item.section}` : ""}`)
        .join("; ")
    : sourceFallback;

  return {
    directAnswer: response.directAnswer,
    framework: response.ethicalFramework.map((item) => `${item.principle}: ${item.explanation}`),
    source,
    requiresScholarReferral: response.requiresScholarReferral,
    clarifyingQuestion: response.clarifyingQuestion,
    confidence: response.confidence,
  };
}
