import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPgPool } from "@/lib/db";

const allowedTypes = new Map([
  ["pdf", new Set(["application/pdf"])],
  ["docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])],
  ["txt", new Set(["text/plain", "application/octet-stream"])],
  ["html", new Set(["text/html", "application/xhtml+xml"])],
]);

function cleanFileName(fileName: string) {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._ -]/gu, "_").slice(0, 180) || "document";
}

function getExtension(fileName: string) {
  return path.extname(fileName).replace(/^\./u, "").toLowerCase();
}

function validateUpload(file: File) {
  const extension = getExtension(file.name);
  const allowedMimeTypes = allowedTypes.get(extension);
  if (!allowedMimeTypes) return { error: "Unsupported file extension." };
  if (!allowedMimeTypes.has(file.type || "application/octet-stream")) return { error: "Unsupported MIME type." };
  const maxBytes = Number(process.env.MAX_KNOWLEDGE_UPLOAD_BYTES ?? 50 * 1024 * 1024);
  if (file.size <= 0) return { error: "Uploaded file is empty." };
  if (file.size > maxBytes) return { error: "Uploaded file exceeds the configured size limit." };
  return { extension };
}

export async function storeKnowledgeUpload(file: File, userId: string) {
  const validation = validateUpload(file);
  if ("error" in validation) return { error: validation.error, status: 400 } as const;

  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const pool = getPgPool();
  const duplicate = await pool.query<{ id: string; original_filename: string }>(
    "SELECT id, original_filename FROM document_versions WHERE sha256 = $1 AND status <> 'deleted' LIMIT 1",
    [sha256],
  );
  if (duplicate.rows[0]) {
    return {
      error: `Duplicate upload. Existing version: ${duplicate.rows[0].original_filename}`,
      status: 409,
    } as const;
  }

  const safeName = cleanFileName(file.name);
  const configuredStorageRoot = process.env.KNOWLEDGE_STORAGE_DIR;
  const storageRoot = configuredStorageRoot
    ? path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredStorageRoot)
    : path.join(process.cwd(), "storage", "knowledge");
  const storageKey = path.join(new Date().toISOString().slice(0, 10), `${randomUUID()}-${safeName}`);
  const absolutePath = path.join(storageRoot, storageKey);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes, { flag: "wx" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const document = await client.query<{ id: string }>(
      `INSERT INTO documents (title, created_by)
       VALUES ($1, $2)
       RETURNING id`,
      [safeName.replace(/\.[^.]+$/u, ""), userId],
    );
    const version = await client.query<{ id: string }>(
      `INSERT INTO document_versions
         (document_id, version, original_filename, mime_type, extension, file_size_bytes, sha256, storage_key, uploaded_by)
       VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [document.rows[0].id, safeName, file.type || "application/octet-stream", validation.extension, file.size, sha256, storageKey, userId],
    );
    const job = await client.query<{ id: string }>(
      `INSERT INTO ingestion_jobs (document_version_id)
       VALUES ($1)
       RETURNING id`,
      [version.rows[0].id],
    );
    await client.query(
      `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'knowledge_document_uploaded', 'document_version', $2, $3::jsonb)`,
      [userId, version.rows[0].id, JSON.stringify({ fileName: safeName, sha256, jobId: job.rows[0].id })],
    );
    await client.query("COMMIT");
    return {
      documentId: document.rows[0].id,
      versionId: version.rows[0].id,
      jobId: job.rows[0].id,
      sha256,
      ingestionStatus: "queued",
    } as const;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
