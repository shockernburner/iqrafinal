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

  it("skips the database when there are no meaningful keywords", async () => {
    expect(await searchKnowledgeChunks("what is it?", 6)).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
