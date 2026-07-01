import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mammoth from "mammoth";
import pg from "pg";
import { PDFParse } from "pdf-parse";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required to run the ingestion worker.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const storageRoot = path.resolve(process.cwd(), process.env.KNOWLEDGE_STORAGE_DIR ?? "storage/knowledge");
const chunkChars = Number(process.env.INGESTION_CHUNK_CHARS ?? 2600);
const overlapChars = Number(process.env.INGESTION_CHUNK_OVERLAP_CHARS ?? 350);

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, " ")
    .replace(/[ \t]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function detectLanguage(text) {
  if (/[\u0980-\u09FF]/u.test(text)) return "bn";
  if (/[\u0600-\u06FF]/u.test(text)) return "ar";
  return "en";
}

function chunkPageText(text, pageNumber) {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  const chunks = [];
  let index = 0;
  while (index < cleaned.length) {
    const slice = cleaned.slice(index, index + chunkChars).trim();
    if (slice) chunks.push({ pageNumber, text: slice, language: detectLanguage(slice) });
    if (index + chunkChars >= cleaned.length) break;
    index += Math.max(chunkChars - overlapChars, 1);
  }
  return chunks;
}

async function extractPdf(filePath) {
  let parser;
  try {
    const buffer = await fs.readFile(filePath);
    parser = new PDFParse({ data: buffer });
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
    await parser?.destroy();
  }
}

async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = cleanText(result.value);
  return { pageCount: null, chunks: chunkPageText(text, 1) };
}

async function extractText(filePath, extension) {
  if (extension === "pdf") return extractPdf(filePath);
  if (extension === "docx") return extractDocx(filePath);
  const text = await fs.readFile(filePath, "utf8");
  return { pageCount: 1, chunks: chunkPageText(text, 1) };
}

async function embedText(text) {
  const endpoint = process.env.LOCAL_EMBEDDING_ENDPOINT;
  const model = process.env.LOCAL_EMBEDDING_MODEL;
  if (!endpoint) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.LOCAL_EMBEDDING_TIMEOUT_MS ?? 8000));
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(model ? { model, input: text } : { input: text }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const candidate = payload.embedding ?? payload.embeddings?.[0] ?? payload.data?.[0]?.embedding;
    if (!Array.isArray(candidate)) return null;
    const vector = candidate.map(Number);
    return vector.every(Number.isFinite) ? `[${vector.join(",")}]` : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function claimJob() {
  const result = await pool.query(
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

async function processJob(job) {
  const client = await pool.connect();
  try {
    const versionResult = await client.query(
      `SELECT document_versions.*, documents.id AS document_id
       FROM document_versions
       JOIN documents ON documents.id = document_versions.document_id
       WHERE document_versions.id = $1`,
      [job.document_version_id],
    );
    const version = versionResult.rows[0];
    if (!version) throw new Error("Document version not found.");

    const filePath = path.join(storageRoot, version.storage_key);
    await client.query("UPDATE document_versions SET status = 'indexing' WHERE id = $1", [version.id]);
    const extracted = await extractText(filePath, version.extension);
    if (!extracted.chunks.length) throw new Error("No extractable text was found.");

    await client.query("BEGIN");
    await client.query("DELETE FROM document_chunks WHERE document_version_id = $1", [version.id]);
    for (const [index, chunk] of extracted.chunks.entries()) {
      const embedding = await embedText(chunk.text);
      await client.query(
        `INSERT INTO document_chunks
          (document_id, document_version_id, chunk_index, page_number, language, text, token_count, embedding, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::double precision[], true)`,
        [
          version.document_id,
          version.id,
          index,
          chunk.pageNumber,
          chunk.language,
          chunk.text,
          chunk.text.split(/\s+/u).filter(Boolean).length,
          embedding,
        ],
      );
      if (index % 10 === 0) {
        const progress = Math.min(95, 10 + Math.round((index / extracted.chunks.length) * 80));
        await client.query("UPDATE ingestion_jobs SET progress = $1, updated_at = now() WHERE id = $2", [progress, job.id]);
      }
    }
    await client.query(
      `UPDATE document_versions
       SET status = 'active', page_count = $2, language = $3, indexed_at = now()
       WHERE id = $1`,
      [version.id, extracted.pageCount, detectLanguage(extracted.chunks.map((chunk) => chunk.text).join(" ").slice(0, 4000))],
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
    console.log(`Indexed document version ${version.id} (${extracted.chunks.length} chunks).`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    const message = error instanceof Error ? error.message : "Unknown ingestion failure.";
    await pool.query(
      `UPDATE ingestion_jobs
       SET status = 'failed', error_message = $2, retry_count = retry_count + 1, finished_at = now(), updated_at = now()
       WHERE id = $1`,
      [job.id, message],
    );
    await pool.query(
      `UPDATE document_versions SET status = 'failed' WHERE id = $1`,
      [job.document_version_id],
    );
    console.error(`Failed ingestion job ${job.id}: ${message}`);
  } finally {
    client.release();
  }
}

const once = process.argv.includes("--once");
try {
  do {
    const job = await claimJob();
    if (!job) {
      if (once) console.log("No queued ingestion jobs.");
      break;
    }
    await processJob(job);
  } while (!once);
} finally {
  await pool.end();
}
