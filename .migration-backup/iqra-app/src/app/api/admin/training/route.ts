import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { startAdminMaintenance } from "@/lib/admin-maintenance";
import { getAdminApiSession } from "@/lib/authz";
import { clearIqraRetrievalCaches } from "@/lib/iqra-retrieval";

type TrainingRecord = {
  id: number;
  sheet: string;
  row: number;
  question: string;
  answer: string;
  text: string;
};

type TrainingFile = {
  generatedAt: string;
  sourceWorkbook?: string;
  totalRows: number;
  records: TrainingRecord[];
};

const trainingPath = path.join(process.cwd(), "data", "training-questions.json");

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readTrainingFile(): Promise<TrainingFile> {
  try {
    const raw = JSON.parse(await readFile(trainingPath, "utf8")) as TrainingFile;
    return {
      generatedAt: raw.generatedAt ?? new Date().toISOString(),
      sourceWorkbook: raw.sourceWorkbook,
      totalRows: raw.totalRows ?? raw.records?.length ?? 0,
      records: Array.isArray(raw.records) ? raw.records : [],
    };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      totalRows: 0,
      records: [],
    };
  }
}

async function saveTrainingFile(file: TrainingFile) {
  file.generatedAt = new Date().toISOString();
  file.totalRows = file.records.length;
  await writeFile(trainingPath, JSON.stringify(file, null, 2));
  clearIqraRetrievalCaches();
}

function toNewRecord(record: Partial<TrainingRecord>, nextId: number, row: number): TrainingRecord | null {
  const question = normalizeText(record.question);
  const answer = normalizeText(record.answer);
  if (!question || !answer) return null;

  return {
    id: nextId,
    sheet: normalizeText(record.sheet) || "admin_upload",
    row,
    question,
    answer,
    text: `${question} ${answer}`.trim(),
  };
}

function parseJsonFile(input: string): Array<Partial<TrainingRecord>> {
  const parsed = JSON.parse(input) as unknown;
  if (Array.isArray(parsed)) {
    return parsed as Array<Partial<TrainingRecord>>;
  }

  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { records?: unknown[] }).records)) {
    return ((parsed as { records: unknown[] }).records ?? []) as Array<Partial<TrainingRecord>>;
  }

  return [];
}

function parseWorkbook(buffer: ArrayBuffer): Array<Partial<TrainingRecord>> {
  const workbook = xlsx.read(Buffer.from(buffer), { type: "buffer" });
  const rows = workbook.SheetNames.flatMap((sheetName) =>
    xlsx
      .utils
      .sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" })
      .map((row, index) => {
        const values = Object.values(row).map((value) => normalizeText(value));
        return {
          sheet: sheetName,
          row: index + 2,
          question:
            normalizeText(row["Instruction / Input Text (Training Question)"]) ||
            normalizeText(row.Question) ||
            normalizeText(row.question) ||
            values[0] ||
            "",
          answer:
            normalizeText(row["Desired Output"]) ||
            normalizeText(row.Answer) ||
            normalizeText(row.answer) ||
            values.slice(1).join(" ").trim(),
        };
      }),
  );

  return rows;
}

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const file = await readTrainingFile();
  return NextResponse.json({
    totalRows: file.totalRows,
    latest: file.records.slice(-20).reverse(),
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const file = await readTrainingFile();
  const existingRows = file.records;
  const nextIdStart = (existingRows.at(-1)?.id ?? 0) + 1;
  let imported: Array<Partial<TrainingRecord>> = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const upload = form.get("file");
    if (!(upload instanceof File)) {
      return NextResponse.json({ error: "A .json or .xlsx file is required." }, { status: 400 });
    }

    const name = upload.name.toLowerCase();
    if (name.endsWith(".json")) {
      imported = parseJsonFile(await upload.text());
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      imported = parseWorkbook(await upload.arrayBuffer());
    } else {
      return NextResponse.json({ error: "Unsupported file. Use .json or .xlsx." }, { status: 400 });
    }
  } else {
    const body = (await request.json()) as { question?: string; answer?: string };
    imported = [{ question: body.question, answer: body.answer, sheet: "admin_manual", row: 1 }];
  }

  const toAppend: TrainingRecord[] = [];
  let nextId = nextIdStart;

  for (const [index, record] of imported.entries()) {
    const normalized = toNewRecord(record, nextId, Number(record.row ?? index + 1));
    if (!normalized) continue;
    toAppend.push(normalized);
    nextId += 1;
  }

  if (!toAppend.length) {
    return NextResponse.json({ error: "No valid question/answer pairs found." }, { status: 400 });
  }

  file.records = [...existingRows, ...toAppend];
  await saveTrainingFile(file);
  const refresh = startAdminMaintenance("refresh-training-dataset", session.user.id);

  return NextResponse.json({
    ok: true,
    added: toAppend.length,
    totalRows: file.totalRows,
    refreshStarted: refresh.started,
  });
}