import { pool } from "@workspace/db";

export type RetrievedChunk = {
  documentTitle: string;
  sectionHeading: string | null;
  pageNumber: number;
  text: string;
  rank: number;
};

export async function searchKnowledgeChunks(query: string, limit = 6): Promise<RetrievedChunk[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const result = await pool.query<{
    title: string;
    section_heading: string | null;
    page_number: number;
    text: string;
    rank: number;
  }>(
    `SELECT d.title, c.section_heading, c.page_number, c.text,
       ts_rank(c.search_vector, websearch_to_tsquery('simple', $1)) AS rank
     FROM document_chunks c
     JOIN documents d ON d.id = c.document_id
     WHERE c.is_active = true
       AND d.status = 'active'
       AND c.search_vector @@ websearch_to_tsquery('simple', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    [trimmed, limit],
  );

  return result.rows.map((row) => ({
    documentTitle: row.title,
    sectionHeading: row.section_heading,
    pageNumber: row.page_number,
    text: row.text,
    rank: Number(row.rank),
  }));
}
