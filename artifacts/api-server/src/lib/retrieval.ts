import { pool } from "@workspace/db";

export type RetrievedChunk = {
  documentTitle: string;
  sectionHeading: string | null;
  pageNumber: number;
  text: string;
  rank: number;
};

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "did", "do",
  "does", "for", "from", "had", "has", "have", "how", "i", "if", "in", "is",
  "it", "its", "may", "me", "my", "no", "not", "of", "on", "or", "our",
  "should", "so", "than", "that", "the", "their", "them", "then", "there",
  "these", "they", "this", "to", "us", "was", "we", "were", "what", "when",
  "where", "which", "who", "why", "will", "with", "would", "you", "your",
  "about", "into", "over", "under", "between", "during", "please", "tell",
]);

// The search_vector column uses the 'simple' text search config (no stemming,
// no stopword removal), so a websearch/plainto query over a full natural-language
// question — which ANDs every token, stopwords included — almost never matches.
// Instead, extract meaningful keywords and OR them, ranking by overlap.
function buildKeywordTsquery(query: string): string | null {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}''-]+/u)
    .map((t) => t.replace(/^[-']+|[-']+$/g, ""))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  const unique = Array.from(new Set(tokens)).slice(0, 12);
  if (unique.length === 0) return null;
  return unique.map((t) => t.replace(/[':&|!()<>]/g, "")).filter(Boolean).join(" | ");
}

export async function searchKnowledgeChunks(query: string, limit = 6): Promise<RetrievedChunk[]> {
  const tsquery = buildKeywordTsquery(query);
  if (!tsquery) return [];

  const result = await pool.query<{
    title: string;
    section_heading: string | null;
    page_number: number;
    text: string;
    rank: number;
  }>(
    `SELECT d.title, c.section_heading, c.page_number, c.text,
       ts_rank(c.search_vector, to_tsquery('simple', $1)) AS rank
     FROM document_chunks c
     JOIN documents d ON d.id = c.document_id
     WHERE c.is_active = true
       AND d.status = 'active'
       AND c.search_vector @@ to_tsquery('simple', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    [tsquery, limit],
  );

  return result.rows.map((row) => ({
    documentTitle: row.title,
    sectionHeading: row.section_heading,
    pageNumber: row.page_number,
    text: row.text,
    rank: Number(row.rank),
  }));
}
