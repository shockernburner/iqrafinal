import fs from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const scanRoots = [path.join(appRoot, "src")];
const blockedPatterns = [
  { name: "OpenAI runtime endpoint", pattern: /api\.openai\.com|OPENAI_API_KEY|OPENAI_MODEL|openai/iu },
  { name: "Anthropic runtime endpoint", pattern: /api\.anthropic\.com|ANTHROPIC_API_KEY|anthropic/iu },
  { name: "Gemini runtime endpoint", pattern: /generativelanguage\.googleapis\.com|GEMINI_API_KEY|googleai|google-generative/iu },
  { name: "Browser Web Speech API", pattern: /SpeechRecognition|webkitSpeechRecognition/iu },
];

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

const files = (await Promise.all(scanRoots.map(walk)))
  .flat()
  .filter((filePath) => /\.(ts|tsx|js|jsx|mjs)$/u.test(filePath));

const violations = [];
for (const filePath of files) {
  const content = await fs.readFile(filePath, "utf8");
  for (const blocked of blockedPatterns) {
    if (blocked.pattern.test(content)) {
      violations.push(`${blocked.name}: ${path.relative(appRoot, filePath)}`);
    }
  }
}

if (violations.length) {
  console.error("Public hosted runtime dependency detected:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Runtime egress check passed: no public hosted LLM or browser speech APIs found in src/.");
