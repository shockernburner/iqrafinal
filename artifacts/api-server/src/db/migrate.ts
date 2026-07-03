import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  const migrationsDir = path.join(dirname, "migrations");
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    logger.info({ file }, "Running migration");
    await pool.query(sql);
  }

  logger.info("Migrations complete");
}
