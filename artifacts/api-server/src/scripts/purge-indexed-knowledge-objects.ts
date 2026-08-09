/**
 * One-time cleanup: delete original files from object storage for every
 * document version that has already been successfully indexed (status =
 * 'active'). The searchable index in document_chunks is untouched.
 *
 * Run: cd artifacts/api-server && npx tsx src/scripts/purge-indexed-knowledge-objects.ts
 */
import { pool } from "@workspace/db";
import { deleteKnowledgeObject } from "../lib/knowledge-upload";

async function main() {
  const result = await pool.query<{ id: string; storage_key: string; file_size_bytes: string }>(
    `SELECT id, storage_key, file_size_bytes
     FROM document_versions
     WHERE status = 'active'
     ORDER BY file_size_bytes DESC`,
  );
  let deleted = 0;
  let failed = 0;
  let bytes = 0;
  for (const row of result.rows) {
    try {
      await deleteKnowledgeObject(row.storage_key);
      deleted += 1;
      bytes += Number(row.file_size_bytes) || 0;
      if (deleted % 50 === 0) console.log(`...${deleted}/${result.rows.length} deleted`);
    } catch (error) {
      failed += 1;
      console.error(`Failed to delete ${row.storage_key}:`, error instanceof Error ? error.message : error);
    }
  }
  console.log(
    `Done. Deleted ${deleted} objects (~${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB), ${failed} failures, out of ${result.rows.length} active versions.`,
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
