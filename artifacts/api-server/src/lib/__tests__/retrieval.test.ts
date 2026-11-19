import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@workspace/db", () => ({ pool: { query } }));

import { extractKeywords, searchKnowledgeChunks } from "../retrieval.js";

const row = (id: string, rank = 0.5) => ({ id, title: `Doc ${id}`, section_heading: null, page_number: 1, text: `text ${id}`, rank });
const tsqueries = () => query.mock.calls.map((call) => call[1][0]);

beforeEach(() => query.mockReset());

describe("extractKeywords", () => {
  it("keeps meaningful words, drops stopwords and short words, de-duplicates", () => {
    expect(extractKeywords("What are the rights of neighbors? Rights matter!")).toEqual(["rights", "neighbors", "matter"]);
  });

  it("strips tsquery operators so user text can't break the query", () => {
    expect(extractKeywords("anger & (patience) | !envy <sabr>")).toEqual(["anger", "patience", "envy", "sabr"]);
  });

  it("skips Bengali filler words so the key terms keep their places", () => {
    const q = "মৃত্যুর পর থেকে কিয়ামত, পুনরুত্থান ও চূড়ান্ত বিচার পর্যন্ত মানুষের আত্মা, চেতনা এবং পরিচয়ের অবস্থা কী থাকে? বারযাখে মানুষ কীভাবে অস্তিত্ব বজায় রাখে?";
    const keywords = extractKeywords(q);
    for (const filler of ["থেকে", "পর্যন্ত", "এবং", "থাকে", "কীভাবে"]) expect(keywords).not.toContain(filler.normalize("NFC"));
    expect(keywords).toContain("বারযাখে"); // was cut by the 12-keyword cap before fillers were skipped
    expect(keywords).toHaveLength(12);
  });

  it("matches both Unicode forms of Bengali letters such as য় (normalised like the indexer)", () => {
    const precomposed = "\u0995\u09BF\u09DF\u09BE\u09AE\u09A4"; // কিয়ামত typed with the single য় character
    const decomposed = "\u0995\u09BF\u09AF\u09BC\u09BE\u09AE\u09A4"; // য + nukta, as stored after NFC
    expect(extractKeywords(precomposed)).toEqual([decomposed]);
    expect(extractKeywords(decomposed)).toEqual([decomposed]);
  });

  it("keeps Arabic and Bengali words and caps at 12 keywords", () => {
    expect(extractKeywords("الصبر والشكر")).toEqual(["الصبر", "والشكر"]);
    expect(extractKeywords("প্রতিবেশীর অধিকার")).toEqual(["প্রতিবেশীর", "অধিকার"]);
    expect(extractKeywords("الصَّبْرُ مِفْتَاحُ الْفَرَجِ")).toEqual(["الصَّبْرُ", "مِفْتَاحُ", "الْفَرَجِ"]);
    expect(extractKeywords(Array.from({ length: 20 }, (_, i) => `word${i}x`).join(" "))).toHaveLength(12);
  });
});

describe("searchKnowledgeChunks", () => {
  it("searches for all keywords first and stops there when that fills the results", async () => {
    query.mockResolvedValueOnce({ rows: [1, 2, 3, 4, 5, 6].map((n) => row(`a${n}`)) });
    const results = await searchKnowledgeChunks("rights of neighbors", 6);
    expect(tsqueries()).toEqual(["rights & neighbors"]);
    expect(results).toHaveLength(6);
  });

  it("fills remaining places from the any-keyword search, all-keyword matches first, no duplicates", async () => {
    query
      .mockResolvedValueOnce({ rows: [row("a"), row("b")] })
      .mockResolvedValueOnce({ rows: [row("a"), row("c"), row("b"), row("d"), row("e"), row("f"), row("g")] });
    const results = await searchKnowledgeChunks("handle anger at work", 6);
    expect(tsqueries()).toEqual(["handle & anger & work", "handle | anger | work"]);
    expect(query.mock.calls[1]![1][1]).toBe(8); // limit + already found
    expect(results.map((r) => r.text)).toEqual(["text a", "text b", "text c", "text d", "text e", "text f"]);
  });

  it("runs a single query for a one-keyword question", async () => {
    query.mockResolvedValueOnce({ rows: [row("x")] });
    await searchKnowledgeChunks("patience", 6);
    expect(tsqueries()).toEqual(["patience"]);
  });

  it("searches several queries in order, filling places and skipping duplicates", async () => {
    query
      .mockResolvedValueOnce({ rows: [row("e1"), row("e2")] }) // English: all keywords
      .mockResolvedValueOnce({ rows: [row("e1"), row("e3")] }) // English: any keyword
      .mockResolvedValueOnce({ rows: [row("e3"), row("b1")] }) // Bengali: any keyword (single word, one query)
    ;
    const results = await searchKnowledgeChunks(["barzakh soul", "বারযাখ"], 6);
    expect(tsqueries()).toEqual(["barzakh & soul", "barzakh | soul", "বারযাখ"]);
    expect(results.map((r) => r.text)).toEqual(["text e1", "text e2", "text e3", "text b1"]);
  });

  it("stops before later queries once the first fills every place", async () => {
    query.mockResolvedValueOnce({ rows: [1, 2, 3].map((n) => row(`e${n}`)) });
    await searchKnowledgeChunks(["barzakh soul", "বারযাখ"], 3);
    expect(tsqueries()).toEqual(["barzakh & soul"]);
  });

  it("skips the database when there are no meaningful keywords", async () => {
    expect(await searchKnowledgeChunks("what is it?", 6)).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
