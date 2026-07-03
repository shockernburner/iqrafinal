import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import { readKnowledgeObject } from "./knowledge-upload";

const chunkChars = Number(process.env.INGESTION_CHUNK_CHARS ?? 2600);
const overlapChars = Number(process.env.INGESTION_CHUNK_OVERLAP_CHARS ?? 350);
const pollIntervalMs = Number(process.env.INGESTION_POLL_INTERVAL_MS ?? 5000);

function cleanText(value: string) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, " ")
    .replace(/[ \t]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function detectLanguage(text: string) {
  if (/[\u0980-\u09FF]/u.test(text)) return "bn";
  if (/[\u0600-\u06FF]/u.test(text)) return "ar";
  return "en";
}

type Chunk = { pageNumber: number; text: string; language: string };

function chunkPageText(text: string, pageNumber: number): Chunk[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  const chunks: Chunk[] = [];
  let index = 0;
  while (index < cleaned.length) {
    const slice = cleaned.slice(index, index + chunkChars).trim();
    if (slice) chunks.push({ pageNumber, text: slice, language: detectLanguage(slice) });
    if (index + chunkChars >= cleaned.length) break;
    index += Math.max(chunkChars - overlapChars, 1);
  }
  return chunks;
}

async function extractPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    const text = cleanText(parsed.text);
    const pageCount = Number(parsed.total ?? 1) || 1;
    const pageBreaks = text.split(/\f/u).filter(Boolean);
    const pages = pageBreaks.length > 1 ? pageBreaks : [text];
    return {
      pageCount: Math.max(pageCount, pages.length),
      chunks: pages.flatMap((pageText, index) => chunkPageText(pageText, index + 1)),
    };
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text = cleanText(result.value);
  return { pageCount: null as number | null, chunks: chunkPageText(text, 1) };
}

async function extractText(buffer: Buffer, extension: string) {
  if (extension === "pdf") return extractPdf(buffer);
  if (extension === "docx") return extractDocx(buffer);
  return { pageCount: 1, chunks: chunkPageText(buffer.toString("utf8"), 1) };
}

type ClaimedJob = { id: string; document_version_id: string };

async function claimJob(): Promise<ClaimedJob | null> {
  const result = await pool.query<ClaimedJob>(
    `UPDATE ingestion_jobs
     SET status = 'processing', started_at = now(), updated_at = now(), progress = 5
     WHERE id = (
       SELECT id FROM ingestion_jobs
       WHERE status = 'queued'
       ORDER BY created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING id, document_version_id`,
  );
  return result.rows[0] ?? null;
}

async function processJob(job: ClaimedJob) {
  const client = await pool.connect();
  try {
    const versionResult = await client.query<{
      id: string;
      document_id: string;
      storage_key: string;
      extension: string;
    }>(
      `SELECT document_versions.id, document_versions.storage_key, document_versions.extension,
              documents.id AS document_id
       FROM document_versions
       JOIN documents ON documents.id = document_versions.document_id
       WHERE document_versions.id = $1`,
      [job.document_version_id],
    );
    const version = versionResult.rows[0];
    if (!version) throw new Error("Document version not found.");

    await client.query("UPDATE document_versions SET status = 'indexing' WHERE id = $1", [version.id]);
    const bytes = await readKnowledgeObject(version.storage_key);
    const extracted = await extractText(bytes, version.extension);
    if (!extracted.chunks.length) throw new Error("No extractable text was found.");

    await client.query("BEGIN");
    await client.query("DELETE FROM document_chunks WHERE document_version_id = $1", [version.id]);
    for (const [index, chunk] of extracted.chunks.entries()) {
      await client.query(
        `INSERT INTO document_chunks
          (document_id, document_version_id, chunk_index, page_number, language, text, token_count, embedding, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, true)`,
        [
          version.document_id,
          version.id,
          index,
          chunk.pageNumber,
          chunk.language,
          chunk.text,
          chunk.text.split(/\s+/u).filter(Boolean).length,
        ],
      );
      if (index % 10 === 0) {
        const progress = Math.min(95, 10 + Math.round((index / extracted.chunks.length) * 80));
        await client.query("UPDATE ingestion_jobs SET progress = $1, updated_at = now() WHERE id = $2", [
          progress,
          job.id,
        ]);
      }
    }
    await client.query(
      `UPDATE document_versions
       SET status = 'active', page_count = $2, language = $3, indexed_at = now()
       WHERE id = $1`,
      [
        version.id,
        extracted.pageCount,
        detectLanguage(extracted.chunks.map((chunk) => chunk.text).join(" ").slice(0, 4000)),
      ],
    );
    await client.query(
      `UPDATE documents
       SET status = 'active', current_version_id = $2, updated_at = now()
       WHERE id = $1`,
      [version.document_id, version.id],
    );
    await client.query(
      "UPDATE ingestion_jobs SET status = 'succeeded', progress = 100, finished_at = now(), updated_at = now() WHERE id = $1",
      [job.id],
    );
    await client.query("COMMIT");
    logger.info(
      { jobId: job.id, versionId: version.id, chunks: extracted.chunks.length },
      "Ingestion job succeeded",
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    const message = error instanceof Error ? error.message : "Unknown ingestion failure.";
    await pool.query(
      `UPDATE ingestion_jobs
       SET status = 'failed', error_message = $2, retry_count = retry_count + 1, finished_at = now(), updated_at = now()
       WHERE id = $1`,
      [job.id, message],
    );
    await pool.query(`UPDATE document_versions SET status = 'failed' WHERE id = $1`, [job.document_version_id]);
    logger.error({ jobId: job.id, err: error }, "Ingestion job failed");
  } finally {
    client.release();
  }
}

let running = false;

export function startIngestionWorker() {
  if (running) return;
  running = true;
  logger.info({ pollIntervalMs }, "Starting background ingestion worker");

  const loop = async () => {
    while (running) {
      try {
        const job = await claimJob();
        if (job) {
          await processJob(job);
          continue;
        }
      } catch (error) {
        logger.error({ err: error }, "Ingestion worker poll failed");
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  };

  loop().catch((error) => {
    logger.error({ err: error }, "Ingestion worker loop crashed");
    running = false;
  });
}
