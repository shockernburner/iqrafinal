import { readFile } from "node:fs/promises";
import path from "node:path";
import { query } from "@/lib/db";
import { rerankDocuments } from "@/lib/model/rerank";

type KnowledgeRecord = {
  id: number | string;
  title: string;
  category: string;
  path: string;
  text: string;
  documentId?: string;
  fileName?: string;
  page?: number;
  section?: string | null;
};

type TrainingRecord = {
  id: number;
  sheet: string;
  row: number;
  question: string;
  answer: string;
  text: string;
};

type KnowledgeIndex = {
  totalFiles: number;
  records: KnowledgeRecord[];
};

type TrainingIndex = {
  totalRows: number;
  records: TrainingRecord[];
};

type RetrievedContext = {
  knowledge: KnowledgeRecord[];
  training: TrainingRecord[];
  knowledgeTotal: number;
  trainingTotal: number;
};

export type SourceLink = {
  label: string;
  href: string;
};

type TrainingChatResponse = {
  directAnswer: string;
  framework: string[];
  source: string;
  confidence: "high" | "medium";
};

const dataRoot = path.join(process.cwd(), "data");
let knowledgeCache: Promise<KnowledgeIndex> | undefined;
let trainingCache: Promise<TrainingIndex> | undefined;

function cleanTitle(title: string) {
  const cleaned = title.replace(/[-_]/g, " ").replace(/\bpr\b.*$/i, "").replace(/\s+/g, " ").trim();
  return cleaned.length > 64 ? `${cleaned.slice(0, 61).trim()}...` : cleaned;
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2),
    ),
  );
}

async function readJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(dataRoot, fileName), "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function getKnowledgeIndex() {
  knowledgeCache ??= readJson<KnowledgeIndex>("knowledge-index.json", { totalFiles: 0, records: [] });
  return knowledgeCache;
}

async function getTrainingIndex() {
  trainingCache ??= readJson<TrainingIndex>("training-questions.json", { totalRows: 0, records: [] });
  return trainingCache;
}

function scoreText(tokens: string[], text: string) {
  const haystack = text.toLowerCase();
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function normalizeQuestion(value: string) {
  return tokenize(value).join(" ");
}

function jaccardSimilarity(left: string, right: string) {
  const leftSet = new Set(tokenize(left));
  const rightSet = new Set(tokenize(right));
  if (!leftSet.size || !rightSet.size) return 0;
  const overlap = [...leftSet].filter((token) => rightSet.has(token)).length;
  return overlap / (leftSet.size + rightSet.size - overlap);
}

function removeBasmala(value: string) {
  return value
    .replace(/بِسْمِٱللَّٰهِٱلرَّحْمَٰنِ ٱلرَّحِيمِ/gu, "")
    .replace(/Bismillahirrahmanirrahim/giu, "")
    .replace(/In the name of Allah, the Most Gracious, the Most Merciful/giu, "")
    .trim();
}

function topMatches<T extends { text: string }>(records: T[], prompt: string, limit: number) {
  const tokens = tokenize(prompt);
  if (tokens.length === 0) return records.slice(0, limit);

  return records
    .map((record) => ({ record, score: scoreText(tokens, record.text) }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((match) => match.record);
}

function buildSearchQuery(prompt: string) {
  const tokens = tokenize(prompt).slice(0, 12);
  return tokens.length ? tokens.join(" OR ") : prompt;
}

type DbRetrievedChunk = {
  id: string;
  document_id: string;
  document_version_id: string;
  title: string;
  original_filename: string;
  page_number: number;
  section_heading: string | null;
  text: string;
  storage_key: string;
  keyword_rank: number | null;
};

function storagePathToSourceHref(storageKey: string) {
  return `/api/sources?path=${encodeURIComponent(storageKey)}`;
}

async function retrieveFromDatabase(prompt: string): Promise<KnowledgeRecord[] | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    const searchQuery = buildSearchQuery(prompt);

    const result = await query<DbRetrievedChunk>(
      `WITH q AS (SELECT websearch_to_tsquery('simple', $1) AS tsquery)
       SELECT
         document_chunks.id,
         document_chunks.document_id,
         document_chunks.document_version_id,
         documents.title,
         document_versions.original_filename,
         document_chunks.page_number,
         document_chunks.section_heading,
         document_chunks.text,
         document_versions.storage_key,
         ts_rank(document_chunks.search_vector, q.tsquery) AS keyword_rank
       FROM document_chunks
       JOIN documents ON documents.id = document_chunks.document_id
       JOIN document_versions ON document_versions.id = document_chunks.document_version_id
       CROSS JOIN q
       WHERE documents.status = 'active'
         AND document_versions.status = 'active'
         AND document_chunks.is_active = true
         AND document_chunks.search_vector @@ q.tsquery
       ORDER BY keyword_rank DESC NULLS LAST
       LIMIT 16`,
      [searchQuery],
    );

    if (!result.rows.length) return [];
    const reranked = await rerankDocuments(
      prompt,
      result.rows.map((row) => ({ id: row.id, text: row.text })),
    );
    const rank = new Map(reranked.map((item, index) => [item.id, index]));

    return result.rows
      .sort((left, right) => (rank.get(left.id) ?? 999) - (rank.get(right.id) ?? 999))
      .slice(0, 6)
      .map((row) => ({
        id: row.id,
        title: row.title,
        category: "Private knowledge base",
        path: row.storage_key,
        text: row.text,
        documentId: row.document_id,
        fileName: row.original_filename,
        page: row.page_number,
        section: row.section_heading,
      }));
  } catch {
    return null;
  }
}

export async function retrieveIqraContext(prompt: string): Promise<RetrievedContext> {
  const [databaseKnowledge, knowledgeIndex, trainingIndex] = await Promise.all([
    retrieveFromDatabase(prompt),
    getKnowledgeIndex(),
    getTrainingIndex(),
  ]);
  const knowledge = databaseKnowledge ?? topMatches(knowledgeIndex.records, prompt, 5);

  return {
    knowledge,
    training: topMatches(trainingIndex.records, prompt, 3),
    knowledgeTotal: databaseKnowledge === null ? knowledgeIndex.totalFiles : databaseKnowledge.length,
    trainingTotal: trainingIndex.totalRows,
  };
}

export function formatRetrievedContext(context: RetrievedContext) {
  const knowledge = context.knowledge
    .map(
      (record, index) =>
        `${index + 1}. ${record.title} (${record.category}, ${record.path}${record.page ? `, page ${record.page}` : ""})\n${record.text.slice(0, 1600)}`,
    )
    .join("\n\n");

  const training = context.training
    .map(
      (record, index) =>
        `${index + 1}. Training row ${record.row}: ${record.question}\nExpected style/answer: ${record.answer.slice(0, 1200)}`,
    )
    .join("\n\n");

  return `Knowledge base inventory: ${context.knowledgeTotal} indexed PDF files. Use the retrieved excerpts below as background evidence when relevant, but speak to the user in a natural advisory voice. Do not merely summarize search results.\n\nRetrieved knowledge excerpts:\n${knowledge || "No close knowledge excerpt matched; answer from the system instruction and be transparent without sounding mechanical."}\n\nTraining workbook inventory: ${context.trainingTotal} rows. Use nearby rows only as style and calibration examples. Do not copy them verbatim unless the user asks for the exact training answer.\n\nNearby training examples:\n${training || "No close training example matched."}`;
}

export function formatSourceSummary(context: RetrievedContext) {
  const knowledgeSources = context.knowledge
    .slice(0, 2)
    .map((record) => `${cleanTitle(record.fileName ?? record.title)}${record.page ? `, p. ${record.page}` : ""}`);
  return knowledgeSources.length
    ? `Sources consulted: ${knowledgeSources.join("; ")}`
    : "Sources consulted: IQRA system guidance and local knowledge base";
}

export function getSourceLinks(context: RetrievedContext): SourceLink[] {
  return context.knowledge.slice(0, 3).map((record) => ({
    label: `${cleanTitle(record.fileName ?? record.title)}${record.page ? `, p. ${record.page}` : ""}`,
    href: storagePathToSourceHref(record.path),
  }));
}

export function buildExactTrainingResponse(prompt: string, context: RetrievedContext): TrainingChatResponse | null {
  const normalizedPrompt = normalizeQuestion(prompt);
  const match = context.training.find((record) => record.answer && normalizeQuestion(record.question) === normalizedPrompt);
  if (!match) return null;

  const answer = removeBasmala(match.answer);
  const paragraphs = answer
    .split(/\n{2,}|\.\s+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    directAnswer: paragraphs[0]?.slice(0, 1200) ?? answer.slice(0, 1200),
    framework: paragraphs.slice(1, 5).map((paragraph) => paragraph.slice(0, 220)),
    source: `Training workbook row ${match.row} | ${formatSourceSummary(context)}`,
    confidence: "high",
  };
}

export function buildTrainingCalibratedResponse(prompt: string, context: RetrievedContext): TrainingChatResponse | null {
  const exact = buildExactTrainingResponse(prompt, context);
  if (exact) return exact;

  const candidate = context.training
    .map((record) => ({
      record,
      score: jaccardSimilarity(prompt, record.question),
    }))
    .sort((left, right) => right.score - left.score)[0];

  if (!candidate || candidate.score <= 0) return null;

  const answer = removeBasmala(candidate.record.answer);
  const paragraphs = answer
    .split(/\n{2,}|\.\s+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    directAnswer: paragraphs[0]?.slice(0, 1200) ?? answer.slice(0, 1200),
    framework: paragraphs.slice(1, 5).map((paragraph) => paragraph.slice(0, 220)),
    source: `Training workbook row ${candidate.record.row} | ${formatSourceSummary(context)}`,
    confidence: "high",
  };
}