import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "@workspace/db";

export type TrainingRecord = {
  id: number;
  sheet: string;
  row: number;
  question: string;
  answer: string;
};

let seedChecked = false;

const SEED_ADVISORY_LOCK_KEY = 748291;

async function ensureSeeded(): Promise<void> {
  if (seedChecked) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [SEED_ADVISORY_LOCK_KEY]);

    const countResult = await client.query<{ count: string }>("SELECT count(*) FROM training_records");
    if (Number(countResult.rows[0]?.count ?? 0) === 0) {
      let records: TrainingRecord[] = [];
      try {
        const filePath = path.join(process.cwd(), "data", "training-questions.json");
        const raw = await readFile(filePath, "utf8");
        const parsed = JSON.parse(raw) as { records: TrainingRecord[] };
        records = parsed.records ?? [];
      } catch {
        records = [];
      }

      const batchSize = 200;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const values: unknown[] = [];
        const placeholders = batch
          .map((record, idx) => {
            const base = idx * 4;
            values.push(record.sheet, record.row, record.question, record.answer);
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
          })
          .join(", ");
        await client.query(
          `INSERT INTO training_records (sheet, row_num, question, answer) VALUES ${placeholders}`,
          values,
        );
      }
    }

    await client.query("COMMIT");
    seedChecked = true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function loadTrainingRecords(): Promise<TrainingRecord[]> {
  await ensureSeeded();
  const result = await pool.query<{
    id: number;
    sheet: string;
    row_num: number;
    question: string;
    answer: string;
  }>("SELECT id, sheet, row_num, question, answer FROM training_records ORDER BY id DESC");
  return result.rows.map((row) => ({
    id: row.id,
    sheet: row.sheet,
    row: row.row_num,
    question: row.question,
    answer: row.answer,
  }));
}

export async function addTrainingRecord(question: string, answer: string): Promise<TrainingRecord> {
  await ensureSeeded();
  const result = await pool.query<{
    id: number;
    sheet: string;
    row_num: number;
    question: string;
    answer: string;
  }>(
    `INSERT INTO training_records (sheet, row_num, question, answer)
     VALUES ('manual_entries', 0, $1, $2)
     RETURNING id, sheet, row_num, question, answer`,
    [question, answer],
  );
  const row = result.rows[0];
  return { id: row.id, sheet: row.sheet, row: row.row_num, question: row.question, answer: row.answer };
}

export async function bulkAddTrainingRecords(
  rows: Array<{ question: string; answer: string }>,
  sheet: string,
): Promise<number> {
  await ensureSeeded();
  const clean = rows
    .map((r) => ({ question: r.question.trim(), answer: r.answer.trim() }))
    .filter((r) => r.question.length > 0 && r.answer.length > 0);
  if (clean.length === 0) return 0;

  const batchSize = 200;
  let inserted = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < clean.length; i += batchSize) {
      const batch = clean.slice(i, i + batchSize);
      const values: unknown[] = [];
      const placeholders = batch
        .map((record, idx) => {
          const base = idx * 4;
          values.push(sheet, i + idx + 1, record.question, record.answer);
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        })
        .join(", ");
      await client.query(
        `INSERT INTO training_records (sheet, row_num, question, answer) VALUES ${placeholders}`,
        values,
      );
      inserted += batch.length;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
  return inserted;
}

export async function findRelevantTrainingRecords(query: string, limit = 3): Promise<TrainingRecord[]> {
  await ensureSeeded();
  const result = await pool.query<{
    id: number;
    sheet: string;
    row_num: number;
    question: string;
    answer: string;
  }>(
    `SELECT id, sheet, row_num, question, answer
     FROM training_records
     WHERE to_tsvector('simple', question) @@ websearch_to_tsquery('simple', $1)
     ORDER BY ts_rank(to_tsvector('simple', question), websearch_to_tsquery('simple', $1)) DESC
     LIMIT $2`,
    [query, limit],
  );
  return result.rows.map((row) => ({
    id: row.id,
    sheet: row.sheet,
    row: row.row_num,
    question: row.question,
    answer: row.answer,
  }));
}
