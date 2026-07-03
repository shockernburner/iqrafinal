import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";

const repoRoot = path.resolve(process.cwd(), "..");
const workbookPath = process.env.IQRA_TRAINING_WORKBOOK
  ? path.resolve(process.env.IQRA_TRAINING_WORKBOOK)
  : path.join(repoRoot, "1- 500 training_questions (1).xlsx");
const outDir = path.join(process.cwd(), "data", "training-dataset");
const canonicalBasmala =
  "بِسْمِ ٱللّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ Bismillāh al-Raḥmān al-Raḥīm (In the name of Allah, the Most Gracious, the Most Merciful)";
const basmalaPattern = /بِسْمِ|bismill[aā]h|in the name of allah/iu;
const citationPattern = /\b(qur'?an|surah|sahih|hadith|bukhari|muslim|tirmidhi|abu dawud|ibn majah|nasai|reference|source|ayah|verse)\b|[\u0600-\u06FF]+/iu;
const leadingGreetingLinePattern =
  /^\s*(?:بِسْمِ|bismill[aā]h|in the name of allah|gracious,? the most merciful|the most gracious|most merciful)/iu;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, " ")
    .replace(/[ \t]+/gu, " ")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/u)
    .filter((token) => token.length > 2);
}

function jaccard(left, right) {
  const leftSet = new Set(tokenize(left));
  const rightSet = new Set(tokenize(right));
  if (!leftSet.size || !rightSet.size) return 0;
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  return intersection / (leftSet.size + rightSet.size - intersection);
}

function getRowValue(row, candidates, fallbackValues) {
  for (const candidate of candidates) {
    if (row[candidate] !== undefined && normalizeText(row[candidate])) return normalizeText(row[candidate]);
  }
  return normalizeText(fallbackValues.find((value) => normalizeText(value)) ?? "");
}

function hasResponseArchitecture(answer) {
  const lower = answer.toLowerCase();
  const hasDirectness = answer.length >= 40;
  const hasFramework = /amanah|gharar|ihsan|riba|maqasid|tawakkul|shura|sabr|haqq|principle|framework|guidance/iu.test(lower);
  const hasSourceSignal = citationPattern.test(answer);
  return hasDirectness && hasFramework && hasSourceSignal;
}

function canonicalizeBasmala(answer) {
  if (!basmalaPattern.test(answer)) return { answer, changed: false };
  const lines = answer.split(/\r?\n/u);
  let contentStart = 0;
  while (contentStart < lines.length && (leadingGreetingLinePattern.test(lines[contentStart]) || !lines[contentStart].trim())) {
    contentStart += 1;
  }
  const withoutLeadingGreeting = lines.slice(contentStart).join("\n").trim();
  return {
    answer: `${canonicalBasmala}\n\n${withoutLeadingGreeting || answer}`,
    changed: !answer.startsWith(canonicalBasmala),
  };
}

function splitApproved(records) {
  const train = [];
  const validation = [];
  const test = [];
  for (const [index, record] of records.entries()) {
    const bucket = index % 10;
    if (bucket === 8) validation.push(record);
    else if (bucket === 9) test.push(record);
    else train.push(record);
  }
  return { train, validation, test };
}

function toJsonLine(record) {
  return `${JSON.stringify(record)}\n`;
}

function markdownReport(report) {
  return `# IQRA Training Dataset Quality Report

Generated: ${report.generatedAt}

## Summary

- Workbook: ${report.workbookPath}
- Total records: ${report.totalRecords}
- Approved records: ${report.approvedRecords}
- Review-required records: ${report.reviewRecords}
- Training split: ${report.splits.train}
- Validation split: ${report.splits.validation}
- Held-out internal test split: ${report.splits.test}

## Issue Counts

${Object.entries(report.issueCounts)
  .map(([issue, count]) => `- ${issue}: ${count}`)
  .join("\n")}

## Notes

- Text normalization is limited to Unicode NFC, control-character removal, and whitespace cleanup.
- Arabic and Bangla code points, including Arabic diacritics, are preserved.
- Substantive religious changes are never made automatically; rows with content concerns are sent to review.
- The client acceptance DOCX is not read or included in any training split.
`;
}

await fs.mkdir(outDir, { recursive: true });

const workbook = xlsx.readFile(workbookPath);
const rawRows = workbook.SheetNames.flatMap((sheetName) =>
  xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }).map((row, index) => ({
    sheet: sheetName,
    row: index + 2,
    values: row,
  })),
);

const records = rawRows.map((row, index) => {
  const values = Object.values(row.values).map(normalizeText);
  const question = getRowValue(
    row.values,
    ["Instruction / Input Text (Training Question)", "Instruction", "Input", "Question", "Prompt"],
    values,
  );
  const answer = getRowValue(row.values, ["Desired Output", "Answer", "Response", "Output"], values.slice(1));
  return {
    id: index + 1,
    sheet: row.sheet,
    row: row.row,
    question,
    answer,
    normalizedQuestionKey: tokenize(question).join(" "),
  };
});

const seenQuestionKeys = new Map();
const issueCounts = {};
const autoFixCounts = {};
const approved = [];
const review = [];

for (const record of records) {
  const issues = [];
  if (!record.question) issues.push("empty_question");
  if (record.question && record.question.length < 4) issues.push("question_too_short");
  if (!record.answer) issues.push("empty_answer");
  if (record.answer && record.answer.length < 40) issues.push("answer_too_short");
  if (record.question && record.answer && record.question === record.answer) issues.push("question_equals_answer");
  if (record.answer && !basmalaPattern.test(record.answer)) issues.push("missing_basmala_for_review");
  if (record.answer && !citationPattern.test(record.answer)) issues.push("missing_citation_signal");
  if (record.answer && !/\breference\b|\bsource\b|\bqur'?an\b|\bsunnah\b|\bhadith\b/iu.test(record.answer)) {
    issues.push("incomplete_reference_locator");
  }
  if (record.answer && !hasResponseArchitecture(record.answer)) issues.push("response_architecture_review");

  const duplicateOf = seenQuestionKeys.get(record.normalizedQuestionKey);
  if (record.normalizedQuestionKey && duplicateOf) issues.push(`duplicate_question_of_${duplicateOf}`);
  else if (record.normalizedQuestionKey) seenQuestionKeys.set(record.normalizedQuestionKey, record.id);

  const nearby = approved.find((candidate) => jaccard(candidate.question, record.question) >= 0.92);
  if (nearby) issues.push(`near_duplicate_question_of_${nearby.id}`);

  const canonicalizedAnswer = canonicalizeBasmala(record.answer);
  if (canonicalizedAnswer.changed) autoFixCounts.canonical_basmala = (autoFixCounts.canonical_basmala ?? 0) + 1;

  const outputRecord = {
    id: record.id,
    sourceSheet: record.sheet,
    sourceRow: record.row,
    question: record.question,
    answer: canonicalizedAnswer.answer,
    datasetVersion: "2026-07-01.1",
  };

  for (const issue of issues) issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;

  if (issues.length) review.push({ ...outputRecord, reviewReasons: issues });
  else approved.push(outputRecord);
}

const splits = splitApproved(approved);
const report = {
  generatedAt: new Date().toISOString(),
  workbookPath,
  totalRecords: records.length,
  approvedRecords: approved.length,
  reviewRecords: review.length,
  splits: {
    train: splits.train.length,
    validation: splits.validation.length,
    test: splits.test.length,
  },
  issueCounts,
  autoFixCounts,
};

await Promise.all([
  fs.writeFile(path.join(outDir, "approved.jsonl"), approved.map(toJsonLine).join("")),
  fs.writeFile(path.join(outDir, "review-required.jsonl"), review.map(toJsonLine).join("")),
  fs.writeFile(path.join(outDir, "train.jsonl"), splits.train.map(toJsonLine).join("")),
  fs.writeFile(path.join(outDir, "validation.jsonl"), splits.validation.map(toJsonLine).join("")),
  fs.writeFile(path.join(outDir, "heldout-test.jsonl"), splits.test.map(toJsonLine).join("")),
  fs.writeFile(path.join(outDir, "quality-report.json"), JSON.stringify(report, null, 2)),
  fs.writeFile(path.join(outDir, "quality-report.md"), markdownReport(report)),
]);

console.log(`Prepared ${approved.length} approved records and ${review.length} review-required records.`);
console.log(`Wrote dataset artefacts to ${outDir}`);
