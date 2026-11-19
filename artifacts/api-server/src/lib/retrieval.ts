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
  // Bengali filler words (question words, conjunctions, common verbs/postpositions).
  "এবং", "থেকে", "পর্যন্ত", "কীভাবে", "কিভাবে", "কেন", "কোন", "কোনো", "কারা", "যারা", "যেটা", "যেমন",
  "এটা", "এটি", "সেটা", "সেটি", "এই", "সেই", "ওই", "তার", "তাদের", "তাকে", "আমার", "আমাদের", "আমরা",
  "আপনি", "আপনার", "তুমি", "তোমার", "হয়", "হবে", "হয়ে", "ছিল", "আছে", "নেই", "থাকে", "থাকবে",
  "করে", "করা", "করতে", "করবে", "জন্য", "সাথে", "সঙ্গে", "মধ্যে", "উপর", "নিয়ে", "অথবা", "কিন্তু",
  "তবে", "যদি", "তাহলে", "একটি", "দয়া", "বলুন", "বলবেন", "সম্পর্কে", "বিষয়ে",
  // Arabic filler words.
  "في", "من", "على", "إلى", "الى", "عن", "ماذا", "كيف", "لماذا", "متى", "أين", "هذا", "هذه", "ذلك", "تلك",
  "التي", "الذي", "الذين", "كان", "كانت", "يكون", "مع", "بين", "عند", "حول", "أو", "لكن", "إذا",
].map((word) => word.normalize("NFC")));

// The search_vector column uses the 'simple' text search config (no stemming,
// no stopword removal), so a websearch/plainto query over a full natural-language
// question — which ANDs every token, stopwords included — almost never matches.
// Instead we extract the meaningful keywords ourselves. Combining marks (\p{M}:
// Bengali vowel signs and virama, Arabic harakat) count as part of a word, as they
// do in Postgres's tokenizer; without them every Bengali word fell apart.
export function extractKeywords(query: string): string[] {
  // NFC, as the indexer does: some Bengali letters (য়, ড়, ঢ়) can be typed
  // in two Unicode forms, and both must match the stored text.
  const tokens = query
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}''-]+/u)
    .map((t) => t.replace(/^[-']+|[-']+$/g, ""))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => t.replace(/[':&|!()<>]/g, ""))
    .filter(Boolean);
  return Array.from(new Set(tokens)).slice(0, 12);
}

type ChunkRow = {
  id: string;
  title: string;
  section_heading: string | null;
  page_number: number;
  text: string;
  rank: number;
};

async function runSearch(tsquery: string, limit: number): Promise<ChunkRow[]> {
  const result = await pool.query<ChunkRow>(
    `SELECT c.id, d.title, c.section_heading, c.page_number, c.text,
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
  return result.rows;
}

/** Two-step search for one query: chunks with every keyword first, then any keyword to fill. */
async function searchRows(query: string, limit: number): Promise<ChunkRow[]> {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return [];

  const rows = keywords.length > 1 ? await runSearch(keywords.join(" & "), limit) : [];
  if (rows.length < limit) {
    const seen = new Set(rows.map((row) => row.id));
    // Ask for a few extra so chunks already found don't leave places empty.
    for (const row of await runSearch(keywords.join(" | "), limit + rows.length)) {
      if (rows.length >= limit) break;
      if (!seen.has(row.id)) rows.push(row);
    }
  }
  return rows;
}

/**
 * Two-step search. Chunks containing *every* keyword come first: that match set
 * is small, so it is fast even on a very large knowledge base, and those chunks
 * are usually the most relevant. Only when that finds fewer than `limit` chunks
 * do we fall back to chunks containing *any* keyword (the slower, broader
 * search) to fill the remaining places. Measured on 290k chunks: a typical
 * question dropped from ~540 ms to ~2 ms (docs/knowledge-upload-60gb-plan.md).
 *
 * Several queries (e.g. English search terms, then the original non-English
 * question) are searched in order, each filling the places the previous left.
 */
export async function searchKnowledgeChunks(query: string | string[], limit = 6): Promise<RetrievedChunk[]> {
  const rows: ChunkRow[] = [];
  const seen = new Set<string>();
  for (const q of Array.isArray(query) ? query : [query]) {
    if (rows.length >= limit) break;
    for (const row of await searchRows(q, limit)) {
      if (rows.length >= limit) break;
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    }
  }

  return rows.map((row) => ({
    documentTitle: row.title,
    sectionHeading: row.section_heading,
    pageNumber: row.page_number,
    text: row.text,
    rank: Number(row.rank),
  }));
}
