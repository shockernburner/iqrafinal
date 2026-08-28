import { afterEach, describe, expect, it, vi } from "vitest";
import { DeadlineExceededError, withAbortDeadline } from "../deadline.js";

describe("withAbortDeadline", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a successful result and clears its timer", async () => {
    vi.useFakeTimers();
    await expect(withAbortDeadline(async () => "done", 90_000)).resolves.toBe("done");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts hanging work and rejects at the deadline", async () => {
    vi.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    const result = withAbortDeadline(
      (signal) => {
        capturedSignal = signal;
        return new Promise<string>(() => undefined);
      },
      90_000,
    );

    const rejection = expect(result).rejects.toBeInstanceOf(DeadlineExceededError);
    await vi.advanceTimersByTimeAsync(90_000);
    await rejection;
    expect(capturedSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});