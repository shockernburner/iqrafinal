import { readFile } from "node:fs/promises";
import path from "node:path";

export type TrainingRecord = {
  id: number;
  sheet: string;
  row: number;
  question: string;
  answer: string;
};

let cache: TrainingRecord[] | null = null;
let nextId = 1;

export async function loadTrainingRecords(): Promise<TrainingRecord[]> {
  if (cache) return cache;

  try {
    const filePath = path.join(process.cwd(), "data", "training-questions.json");
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { records: TrainingRecord[] };
    cache = parsed.records ?? [];
  } catch {
    cache = [];
  }

  nextId = cache.reduce((max, record) => Math.max(max, record.id), 0) + 1;
  return cache;
}

export async function addTrainingRecord(question: string, answer: string) {
  const records = await loadTrainingRecords();
  const record: TrainingRecord = {
    id: nextId++,
    sheet: "manual_entries",
    row: records.length + 1,
    question,
    answer,
  };
  records.unshift(record);
  return record;
}
