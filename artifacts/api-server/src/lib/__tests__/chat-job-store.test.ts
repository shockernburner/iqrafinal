import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatJobStore } from "../chat-job-store.js";

function createStore(options?: Partial<ConstructorParameters<typeof ChatJobStore>[0]>) {
  return new ChatJobStore({
    maxEntries: 3,
    maxActive: 2,
    maxActivePerUser: 1,
    ttlMs: 1_000,
    ...options,
  });
}

describe("ChatJobStore", () => {
  afterEach(() => vi.useRealTimers());

  it("only returns jobs to their owner", () => {
    const store = createStore();
    const admission = store.admit("job-1", "user-1");
    expect(admission.ok).toBe(true);
    expect(store.getForUser("job-1", "user-1")?.jobId).toBe("job-1");
    expect(store.getForUser("job-1", "user-2")).toBeUndefined();
  });

  it("enforces per-user, global-active, and retained-entry limits", () => {
    const store = createStore();
    expect(store.admit("job-1", "user-1").ok).toBe(true);
    expect(store.admit("job-2", "user-1")).toMatchObject({ ok: false, status: 429 });
    expect(store.admit("job-2", "user-2").ok).toBe(true);
    expect(store.admit("job-3", "user-3")).toMatchObject({ ok: false, status: 503 });

    const job1 = store.getForUser("job-1", "user-1")!;
    job1.status = "completed";
    expect(store.admit("job-3", "user-3").ok).toBe(true);
    expect(store.admit("job-4", "user-4")).toMatchObject({ ok: false, status: 503 });
  });

  it("expires terminal jobs after the retention TTL", () => {
    vi.useFakeTimers();
    const store = createStore({ maxEntries: 1 });
    expect(store.admit("job-1", "user-1").ok).toBe(true);
    store.getForUser("job-1", "user-1")!.status = "completed";
    store.scheduleCleanup("job-1");
    vi.advanceTimersByTime(1_000);
    expect(store.getForUser("job-1", "user-1")).toBeUndefined();
    expect(store.admit("job-2", "user-2").ok).toBe(true);
  });
});