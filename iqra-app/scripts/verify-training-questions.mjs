import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const appUrl = process.env.IQRA_VERIFY_URL ?? "http://localhost:3000";
const limit = Number.parseInt(process.env.IQRA_VERIFY_LIMIT ?? "8", 10);
const trainingPath = path.join(process.cwd(), "data", "training-questions.json");
const reportPath = path.join(process.cwd(), "data", "training-verification-report.json");

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 4);
}

function overlapScore(expected, actual) {
  const expectedTokens = Array.from(new Set(normalize(expected))).slice(0, 80);
  if (expectedTokens.length === 0) return 0;
  const actualText = ` ${normalize(actual).join(" ")} `;
  const matches = expectedTokens.filter((token) => actualText.includes(` ${token} `)).length;
  return matches / expectedTokens.length;
}

async function ask(prompt) {
  const response = await fetch(`${appUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

const training = JSON.parse(await fs.readFile(trainingPath, "utf8"));
const rows = training.records.filter((record) => record.question).slice(0, limit);
const results = [];

for (const record of rows) {
  const startedAt = Date.now();
  const response = await ask(record.question);
  const actual = [response.directAnswer, ...(response.framework ?? []), response.source].join(" ");
  const score = overlapScore(record.answer, actual);
  const passed = Boolean(response.directAnswer && Array.isArray(response.framework) && response.framework.length > 0 && response.source);

  results.push({
    id: record.id,
    row: record.row,
    question: record.question,
    passed,
    overlapScore: Number(score.toFixed(3)),
    source: response.source,
    durationMs: Date.now() - startedAt,
  });
  console.log(`${passed ? "PASS" : "FAIL"} row ${record.row}: ${record.question} (${Math.round(score * 100)}% overlap)`);
}

const report = {
  generatedAt: new Date().toISOString(),
  appUrl,
  sampledRows: results.length,
  passedRows: results.filter((result) => result.passed).length,
  averageOverlap: Number((results.reduce((sum, result) => sum + result.overlapScore, 0) / Math.max(results.length, 1)).toFixed(3)),
  results,
};

await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(`Wrote ${reportPath}`);

if (report.passedRows !== report.sampledRows) {
  process.exitCode = 1;
}