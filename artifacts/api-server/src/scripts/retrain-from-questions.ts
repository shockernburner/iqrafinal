import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "@workspace/db";
import { generateIqraChatResponse } from "../lib/chat";
import { searchKnowledgeChunks } from "../lib/retrieval";
import { addTrainingRecord } from "../lib/training-data";

const statePath = process.argv[2];
const timeBudgetMs = Number(process.argv[3] ?? 95) * 1000;
const CONCURRENCY = 3;

if (!statePath) {
  console.error("Usage: tsx src/scripts/retrain-from-questions.ts <stateFile> [timeBudgetSeconds]");
  process.exit(1);
}

type Confidence = "high" | "medium" | "low";

type Entry = {
  index: number;
  question: string;
  chunkCount?: number;
  initialConfidence?: Confidence;
  retrained?: boolean;
  trainingRecordId?: number;
  finalConfidence?: Confidence;
};

type State = { entries: Entry[]; jsonRegenerated?: boolean };

async function loadState(): Promise<State> {
  return JSON.parse(await readFile(statePath, "utf8")) as State;
}

async function saveState(state: State): Promise<void> {
  await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
}

async function regenerateSeedJson(): Promise<number> {
  const res = await pool.query<{
    sheet: string;
    row_num: number;
    question: string;
    answer: string;
  }>("SELECT sheet, row_num, question, answer FROM training_records ORDER BY id ASC");
  const records = res.rows.map((row, i) => ({
    id: i + 1,
    sheet: row.sheet,
    row: row.row_num,
    question: row.question,
    answer: row.answer,
    text: `Q: ${row.question}\n\nA: ${row.answer}`,
  }));
  const out = {
    generatedAt: new Date().toISOString(),
    sourceWorkbook: "1- 475 training_questions.xlsx (excel_import) + retrain additions",
    totalRows: records.length,
    records,
  };
  await writeFile(
    path.join(process.cwd(), "data", "training-questions.json"),
    JSON.stringify(out, null, 2) + "\n",
  );
  return records.length;
}

async function runBatches<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.all(items.slice(i, i + CONCURRENCY).map(worker));
  }
}

async function main(): Promise<void> {
  const deadline = Date.now() + timeBudgetMs;
  const state = await loadState();

  // Phase 1: test each question; retrain (persist Q&A) whenever confidence < high.
  const toTest = state.entries.filter((e) => !e.initialConfidence);
  for (let i = 0; i < toTest.length; i += CONCURRENCY) {
    if (Date.now() > deadline) break;
    const batch = toTest.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (e) => {
        const chunks = await searchKnowledgeChunks(e.question, 6);
        const res = await generateIqraChatResponse(e.question);
        e.chunkCount = chunks.length;
        e.initialConfidence = res.confidence;
        if (res.confidence !== "high") {
          // Idempotency: a prior interrupted run may have inserted this row before
          // state was checkpointed. Drop any existing manual retrain row for this
          // exact question so reruns never accumulate duplicates.
          await pool.query(
            "DELETE FROM training_records WHERE sheet = 'manual_entries' AND question = $1",
            [e.question],
          );
          const rec = await addTrainingRecord(e.question, res.directAnswer);
          e.retrained = true;
          e.trainingRecordId = rec.id;
        } else {
          e.retrained = false;
          e.finalConfidence = "high";
        }
        console.log(
          `TEST [${e.index}] chunks=${e.chunkCount} conf=${e.initialConfidence} retrained=${e.retrained}`,
        );
      }),
    );
    await saveState(state);
  }

  if (state.entries.some((e) => !e.initialConfidence)) {
    console.log(JSON.stringify({ phase: "test", pending: state.entries.filter((e) => !e.initialConfidence).length }));
    return;
  }

  // Phase 2: persist the enriched training dataset to the seed file (once).
  if (!state.jsonRegenerated) {
    const n = await regenerateSeedJson();
    state.jsonRegenerated = true;
    await saveState(state);
    console.log(`SEED JSON regenerated with ${n} records`);
  }

  // Phase 3: retest only the retrained questions to measure the post-retrain confidence.
  const toRetest = state.entries.filter((e) => !e.finalConfidence);
  for (let i = 0; i < toRetest.length; i += CONCURRENCY) {
    if (Date.now() > deadline) break;
    const batch = toRetest.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (e) => {
        const res = await generateIqraChatResponse(e.question);
        e.finalConfidence = res.confidence;
        console.log(`RETEST [${e.index}] final=${res.confidence}`);
      }),
    );
    await saveState(state);
  }

  if (state.entries.some((e) => !e.finalConfidence)) {
    console.log(JSON.stringify({ phase: "retest", pending: state.entries.filter((e) => !e.finalConfidence).length }));
    return;
  }

  const summary = {
    done: true,
    total: state.entries.length,
    initialHigh: state.entries.filter((e) => e.initialConfidence === "high").length,
    initialMedium: state.entries.filter((e) => e.initialConfidence === "medium").length,
    initialLow: state.entries.filter((e) => e.initialConfidence === "low").length,
    finalHigh: state.entries.filter((e) => e.finalConfidence === "high").length,
    finalMedium: state.entries.filter((e) => e.finalConfidence === "medium").length,
    finalLow: state.entries.filter((e) => e.finalConfidence === "low").length,
    retrained: state.entries.filter((e) => e.retrained).length,
  };
  console.log("SUMMARY " + JSON.stringify(summary, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
