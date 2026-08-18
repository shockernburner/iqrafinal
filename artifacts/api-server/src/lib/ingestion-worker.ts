import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import { deleteKnowledgeObject, readKnowledgeObject } from "./knowledge-upload";

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

type ClaimedJob = { id: string; document_version_id: string; attempt_token: string };

const heartbeatIntervalMs = 60 * 1000;

const staleJobTimeoutMs = Number(process.env.INGESTION_STALE_JOB_TIMEOUT_MS ?? 10 * 60 * 1000);
const staleReclaimIntervalMs = 60 * 1000;
const maxStaleRequeues = 3;

// A job stuck in 'processing' with no heartbeat (progress updates touch
// updated_at) is orphaned — the instance that claimed it was stopped mid-job
// (Autoscale scale-down, redeploy, crash). Requeue it so another worker picks
// it up; after too many requeues, mark it failed so a poison file can't loop.
async function reclaimStaleJobs() {
  const requeued = await pool.query(
    `UPDATE ingestion_jobs
     SET status = 'queued', started_at = NULL, progress = 0, attempt_token = NULL,
         retry_count = retry_count + 1, updated_at = now()
     WHERE status = 'processing'
       AND updated_at < now() - make_interval(secs => $1)
       AND retry_count < $2
     RETURNING id`,
    [staleJobTimeoutMs / 1000, maxStaleRequeues],
  );
  const failed = await pool.query<{ id: string; document_version_id: string }>(
    `UPDATE ingestion_jobs
     SET status = 'failed', error_message = 'Job was interrupted repeatedly and gave up.',
         attempt_token = NULL, finished_at = now(), updated_at = now()
     WHERE status = 'processing'
       AND updated_at < now() - make_interval(secs => $1)
       AND retry_count >= $2
     RETURNING id, document_version_id`,
    [staleJobTimeoutMs / 1000, maxStaleRequeues],
  );
  for (const row of failed.rows) {
    await pool.query(`UPDATE document_versions SET status = 'failed' WHERE id = $1`, [row.document_version_id]);
  }
  if (requeued.rowCount || failed.rowCount) {
    logger.warn(
      { requeued: requeued.rowCount, failed: failed.rowCount },
      "Reclaimed stale ingestion jobs left in 'processing'",
    );
  }
}

async function claimJob(): Promise<ClaimedJob | null> {
  const result = await pool.query<ClaimedJob>(
    `UPDATE ingestion_jobs
     SET status = 'processing', started_at = now(), updated_at = now(), progress = 5,
         attempt_token = gen_random_uuid()
     WHERE id = (
       SELECT id FROM ingestion_jobs
       WHERE status = 'queued'
       ORDER BY created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING id, document_version_id, attempt_token`,
  );
  return result.rows[0] ?? null;
}

// Independently-committed lease heartbeat. Runs outside any transaction so
// reclaimStaleJobs on other instances can see it during long read/extract
// phases. Returns false if ownership was lost (job reclaimed elsewhere).
async function heartbeat(job: ClaimedJob): Promise<boolean> {
  const result = await pool.query(
    `UPDATE ingestion_jobs SET updated_at = now()
     WHERE id = $1 AND attempt_token = $2 AND status = 'processing'`,
    [job.id, job.attempt_token],
  );
  return (result.rowCount ?? 0) > 0;
}

class OwnershipLostError extends Error {
  constructor() {
    super("Ingestion job ownership lost (reclaimed by another worker).");
  }
}

async function processJob(job: ClaimedJob) {
  const client = await pool.connect();
  // Keep the lease visibly fresh during long read/extract phases (these run
  // before the chunk transaction and can exceed the stale-job timeout).
  const heartbeatTimer = setInterval(() => {
    heartbeat(job).catch((error) => {
      logger.warn({ jobId: job.id, err: error }, "Ingestion heartbeat failed");
    });
  }, heartbeatIntervalMs);
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
    if (!(await heartbeat(job))) throw new OwnershipLostError();

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
        await client.query(
          "UPDATE ingestion_jobs SET progress = $1, updated_at = now() WHERE id = $2 AND attempt_token = $3",
          [progress, job.id, job.attempt_token],
        );
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
    const success = await client.query(
      `UPDATE ingestion_jobs
       SET status = 'succeeded', progress = 100, attempt_token = NULL, finished_at = now(), updated_at = now()
       WHERE id = $1 AND attempt_token = $2 AND status = 'processing'`,
      [job.id, job.attempt_token],
    );
    if ((success.rowCount ?? 0) === 0) throw new OwnershipLostError();
    await client.query("COMMIT");
    logger.info(
      { jobId: job.id, versionId: version.id, chunks: extracted.chunks.length },
      "Ingestion job succeeded",
    );
    // Storage-saving policy: once a document is fully indexed, the original
    // file is no longer needed (chat only reads document_chunks). Delete it
    // from object storage, best-effort — a failure here never fails the job.
    try {
      await deleteKnowledgeObject(version.storage_key);
      logger.info({ versionId: version.id }, "Deleted original file from storage after indexing");
    } catch (error) {
      logger.warn({ versionId: version.id, err: error }, "Failed to delete original file from storage");
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (error instanceof OwnershipLostError) {
      // The job was reclaimed and belongs to another attempt now — do not
      // touch job or document-version state, and never delete the source.
      logger.warn({ jobId: job.id }, "Ingestion job ownership lost; abandoning attempt");
      return;
    }
    const message = error instanceof Error ? error.message : "Unknown ingestion failure.";
    // Terminal failure: transition job + document version atomically, and
    // only if this attempt still owns the job.
    await pool.query(
      `WITH failed_job AS (
         UPDATE ingestion_jobs
         SET status = 'failed', error_message = $2, retry_count = retry_count + 1,
             attempt_token = NULL, finished_at = now(), updated_at = now()
         WHERE id = $1 AND attempt_token = $3 AND status = 'processing'
         RETURNING document_version_id
       )
       UPDATE document_versions SET status = 'failed'
       WHERE id IN (SELECT document_version_id FROM failed_job)`,
      [job.id, message, job.attempt_token],
    );
    logger.error({ jobId: job.id, err: error }, "Ingestion job failed");
  } finally {
    clearInterval(heartbeatTimer);
    client.release();
  }
}

let running = false;

export function startIngestionWorker() {
  if (running) return;
  running = true;
  logger.info({ pollIntervalMs }, "Starting background ingestion worker");

  let lastReclaimAt = 0;
  const loop = async () => {
    while (running) {
      try {
        if (Date.now() - lastReclaimAt >= staleReclaimIntervalMs) {
          lastReclaimAt = Date.now();
          await reclaimStaleJobs();
        }
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
