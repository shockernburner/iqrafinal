import { beforeEach, describe, expect, it, vi } from "vitest";

const { connect, query, release } = vi.hoisted(() => ({
  connect: vi.fn(),
  query: vi.fn(),
  release: vi.fn(),
}));
vi.mock("@workspace/db", () => ({ pool: { connect } }));

import { saveChatTurn } from "../chat-turn.js";

describe("saveChatTurn", () => {
  beforeEach(() => {
    connect.mockReset();
    query.mockReset();
    release.mockReset();
    connect.mockResolvedValue({ query, release });
    query.mockImplementation((sql: string) =>
      Promise.resolve(sql.includes("RETURNING id") ? { rowCount: 1 } : { rowCount: null }),
    );
  });

  it("saves one idempotent pair and increments the reply counter once", async () => {
    const result = await saveChatTurn({
      threadId: "thread-1",
      turnId: "turn-1",
      userText: "Question",
      assistantPayload: { directAnswer: "Answer", confidence: "high" },
    });

    expect(result.inserted).toBe(true);
    const calls = query.mock.calls.map(([sql]) => String(sql));
    expect(calls.filter((sql) => sql.includes("turn_id, role"))).toHaveLength(2);
    expect(calls.filter((sql) => sql.includes("questions_replied"))).toHaveLength(1);
    expect(query).toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });

  it("does not count an idempotent retry whose assistant row already exists", async () => {
    query.mockImplementation((sql: string) =>
      Promise.resolve(sql.includes("RETURNING id") ? { rowCount: 0 } : { rowCount: null }),
    );

    const result = await saveChatTurn({
      threadId: "thread-1",
      turnId: "turn-1",
      userText: "Question",
      assistantPayload: { directAnswer: "Answer" },
    });

    expect(result.inserted).toBe(false);
    const calls = query.mock.calls.map(([sql]) => String(sql));
    expect(calls.filter((sql) => sql.includes("questions_replied"))).toHaveLength(0);
    expect(query).toHaveBeenCalledWith("COMMIT");
  });

  it("rolls back and releases the client when persistence fails", async () => {
    query
      .mockResolvedValueOnce({ rowCount: null })
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce({ rowCount: null });

    await expect(
      saveChatTurn({
        threadId: "thread-1",
        turnId: "turn-1",
        userText: "Question",
        assistantPayload: { directAnswer: "Answer" },
      }),
    ).rejects.toThrow("database unavailable");
    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });
});