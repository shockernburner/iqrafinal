import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  searchKnowledgeChunks: vi.fn(),
  findRelevantTrainingRecords: vi.fn(),
  generateLlmChatResponse: vi.fn(),
  englishSearchTerms: vi.fn(),
}));

vi.mock("../retrieval.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../retrieval.js")>()),
  searchKnowledgeChunks: mocks.searchKnowledgeChunks,
}));
vi.mock("@workspace/db", () => ({ pool: { query: vi.fn() } }));
vi.mock("../training-data.js", () => ({ findRelevantTrainingRecords: mocks.findRelevantTrainingRecords }));
vi.mock("../iqra-llm.js", async () => {
  const NON_LATIN = /(?=\p{L})\P{Script=Latin}/u;
  return {
    generateLlmChatResponse: mocks.generateLlmChatResponse,
    englishSearchTerms: mocks.englishSearchTerms,
    needsEnglishSearchTerms: (text: string) => NON_LATIN.test(text),
    localizeMessage: vi.fn(),
  };
});

const { generateIqraChatResponse } = await import("../chat.js");

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.searchKnowledgeChunks.mockResolvedValue([]);
  mocks.findRelevantTrainingRecords.mockResolvedValue([]);
  mocks.generateLlmChatResponse.mockResolvedValue({
    answer: "উত্তর", framework: [], sourceLinks: [], confidence: "medium", requiresScholarReferral: false,
  });
});

describe("generateIqraChatResponse search language", () => {
  it("searches a Bengali question with English terms first, then the original wording", async () => {
    mocks.englishSearchTerms.mockResolvedValueOnce("barzakh soul resurrection");
    const q = "বারযাখে মানুষ কীভাবে অস্তিত্ব বজায় রাখে?";
    await generateIqraChatResponse(q).catch(() => undefined);
    expect(mocks.englishSearchTerms).toHaveBeenCalledWith(q, undefined);
    expect(mocks.searchKnowledgeChunks).toHaveBeenCalledWith(["barzakh soul resurrection", q], 6);
    expect(mocks.findRelevantTrainingRecords).toHaveBeenCalledWith("barzakh or soul or resurrection", 3);
  });

  it("falls back to the original wording when English terms aren't available", async () => {
    mocks.englishSearchTerms.mockResolvedValueOnce(null);
    const q = "বারযাখ কী?";
    await generateIqraChatResponse(q).catch(() => undefined);
    expect(mocks.searchKnowledgeChunks).toHaveBeenCalledWith(q, 6);
    expect(mocks.findRelevantTrainingRecords).toHaveBeenCalledWith(q, 3);
  });

  it("does not make the extra call for English questions", async () => {
    await generateIqraChatResponse("What are the rights of neighbors?").catch(() => undefined);
    expect(mocks.englishSearchTerms).not.toHaveBeenCalled();
    expect(mocks.searchKnowledgeChunks).toHaveBeenCalledWith("What are the rights of neighbors?", 6);
  });
});
