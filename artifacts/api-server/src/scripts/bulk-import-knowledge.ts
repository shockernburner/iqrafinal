import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pool } from "@workspace/db";
import { storeKnowledgeUpload } from "../lib/knowledge-upload";

const sourceDir = process.argv[2];
const timeBudgetSeconds = Number(process.argv[3] ?? 90);

if (!sourceDir) {
  console.error("Usage: tsx src/scripts/bulk-import-knowledge.ts <dir> [timeBudgetSeconds]");
  process.exit(1);
}

async function listPdfs(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listPdfs(full)));
    } else if (entry.name.toLowerCase().endsWith(".pdf")) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const deadline = Date.now() + timeBudgetSeconds * 1000;

  const admin = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1",
  );
  if (!admin.rows[0]) {
    console.error("No admin user found; cannot attribute uploads.");
    process.exit(1);
  }
  const adminId = admin.rows[0].id;

  const unsorted = await listPdfs(sourceDir);
  const withSizes = await Promise.all(
    unsorted.map(async (file) => ({ file, size: (await stat(file)).size })),
  );
  const files = withSizes.sort((a, b) => a.size - b.size).map((entry) => entry.file);
  const existing = await pool.query<{ sha256: string }>(
    "SELECT sha256 FROM document_versions WHERE status <> 'deleted'",
  );
  const knownHashes = new Set(existing.rows.map((row) => row.sha256));

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let remaining = 0;
  let outOfTime = false;

  for (const filePath of files) {
    if (Date.now() > deadline) {
      outOfTime = true;
      remaining += 1;
      continue;
    }

    const maxBytes = Number(process.env.MAX_KNOWLEDGE_UPLOAD_BYTES ?? 50 * 1024 * 1024);
    const info = await stat(filePath);
    if (info.size > maxBytes) {
      failed += 1;
      console.error(
        `SKIP (too large) ${path.basename(filePath)}: ${(info.size / 1024 / 1024).toFixed(1)} MB > limit`,
      );
      continue;
    }
    const bytes = await readFile(filePath);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (knownHashes.has(sha256)) {
      skipped += 1;
      continue;
    }

    const fakeFile = {
      originalname: path.basename(filePath),
      mimetype: "application/pdf",
      size: info.size,
      buffer: bytes,
    } as Express.Multer.File;

    try {
      const result = await storeKnowledgeUpload(fakeFile, adminId);
      if ("error" in result) {
        if (result.status === 409) {
          skipped += 1;
        } else {
          failed += 1;
          console.error(`FAIL ${path.basename(filePath)}: ${result.error}`);
        }
      } else {
        imported += 1;
        knownHashes.add(sha256);
        console.log(`OK ${path.basename(filePath)} (${(info.size / 1024 / 1024).toFixed(1)} MB)`);
      }
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${path.basename(filePath)}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(
    JSON.stringify({ totalFiles: files.length, imported, skipped, failed, remaining, outOfTime }),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
