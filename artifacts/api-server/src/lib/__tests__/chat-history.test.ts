import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@workspace/db", () => ({ pool: { query } }));

import { CHAT_PAGE_SIZE, loadMessagePage, type ChatMessageRow } from "../chat-history.js";

function row(index: number, contentSize = 20): ChatMessageRow {
  return {
    id: `message-${String(index).padStart(3, "0")}`,
    role: index % 2 === 0 ? "assistant" : "user",
    content: "x".repeat(contentSize),
    response_payload: index % 2 === 0 ? { confidence: "high" } : null,
    created_at: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
  };
}

describe("bounded chat history pages", () => {
  beforeEach(() => query.mockReset());

  it("returns only the newest 40 messages in chronological display order", async () => {
    const newestFirst = Array.from({ length: 41 }, (_, index) => row(41 - index, 10_000));
    query.mockResolvedValue({ rows: newestFirst });

    const startedAt = performance.now();
    const page = await loadMessagePage("thread-1");
    const elapsedMs = performance.now() - startedAt;
    const responseBytes = Buffer.byteLength(JSON.stringify(page));

    expect(page.messages).toHaveLength(CHAT_PAGE_SIZE);
    expect(page.messages[0]?.id).toBe("message-002");
    expect(page.messages.at(-1)?.id).toBe("message-041");
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe("message-002");
    expect(responseBytes).toBeLessThan(500_000);

    // Useful load-check telemetry in CI without making timing a flaky assertion.
    console.info({ turns: 20, messages: page.messages.length, responseBytes, elapsedMs });
  });

  it("uses an exclusive cursor and reports the final page", async () => {
    query.mockResolvedValue({ rows: [row(1)] });
    const page = await loadMessagePage("thread-1", "message-002");

    expect(query).toHaveBeenCalledWith(expect.stringContaining("(created_at, id) <"), [
      "thread-1",
      "message-002",
    ]);
    expect(page.messages.map((message) => message.id)).toEqual(["message-001"]);
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });
});