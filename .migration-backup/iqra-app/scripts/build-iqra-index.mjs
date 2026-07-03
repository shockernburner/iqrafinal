import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";
import { PDFParse } from "pdf-parse";

const repoRoot = path.resolve(process.cwd(), "..");
const appRoot = process.cwd();
const knowledgeRoot = path.join(repoRoot, "IQRA - all final", "Knowledge base- 428 nos");
const trainingWorkbook = path.join(repoRoot, "1- 475 training_questions.xlsx");
const outDir = path.join(appRoot, "data");
const knowledgeOut = path.join(outDir, "knowledge-index.json");
const trainingOut = path.join(outDir, "training-questions.json");

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(fullPath) : fullPath;
    }),
  );
  return files.flat();
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim();
}

function inferCategory(filePath) {
  return path.relative(knowledgeRoot, filePath).split(path.sep)[0] ?? "Uncategorized";
}

async function extractPdf(filePath) {
  let parser;
  try {
    const buffer = await fs.readFile(filePath);
    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText({ first: 20 });
    return cleanText(parsed.text).slice(0, 18000);
  } catch (error) {
    return `Extraction unavailable. File title: ${path.basename(filePath)}. Category: ${inferCategory(filePath)}. Reason: ${error instanceof Error ? error.message : "unknown"}`;
  } finally {
    await parser?.destroy();
  }
}

function buildTrainingRows() {
  const workbook = xlsx.readFile(trainingWorkbook);
  const rows = workbook.SheetNames.flatMap((sheetName) =>
    xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }).map((row, index) => ({
      sheet: sheetName,
      row: index + 2,
      values: row,
    })),
  );

  return rows.map((row, index) => {
    const values = Object.values(row.values).map(cleanText).filter(Boolean);
    const question = cleanText(
      row.values["Instruction / Input Text (Training Question)"] ?? row.values.Question ?? values[0] ?? "",
    );
    const answer = cleanText(row.values["Desired Output"] ?? row.values.Answer ?? values.slice(1).join(" ")).slice(0, 2400);
    return {
      id: index + 1,
      sheet: row.sheet,
      row: row.row,
      question,
      answer,
      text: cleanText(values.join(" ")).slice(0, 3200),
    };
  });
}

await fs.mkdir(outDir, { recursive: true });

const pdfFiles = (await walk(knowledgeRoot)).filter((filePath) => filePath.toLowerCase().endsWith(".pdf")).sort();
const knowledge = [];

for (const [index, filePath] of pdfFiles.entries()) {
  const relativePath = path.relative(repoRoot, filePath);
  const text = await extractPdf(filePath);
  knowledge.push({
    id: index + 1,
    title: path.basename(filePath, path.extname(filePath)),
    category: inferCategory(filePath),
    path: relativePath,
    text,
  });
  if ((index + 1) % 25 === 0 || index + 1 === pdfFiles.length) {
    console.log(`Indexed ${index + 1}/${pdfFiles.length} PDFs`);
  }
}

const training = buildTrainingRows();

await fs.writeFile(
  knowledgeOut,
  JSON.stringify({ generatedAt: new Date().toISOString(), sourceRoot: knowledgeRoot, totalFiles: knowledge.length, records: knowledge }, null, 2),
);
await fs.writeFile(
  trainingOut,
  JSON.stringify({ generatedAt: new Date().toISOString(), sourceWorkbook: trainingWorkbook, totalRows: training.length, records: training }, null, 2),
);

console.log(`Wrote ${knowledgeOut}`);
console.log(`Wrote ${trainingOut}`);