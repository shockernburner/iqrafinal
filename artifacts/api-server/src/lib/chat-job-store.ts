export type AsyncChatJob<T> = {
  jobId: string;
  userId: string;
  status: "running" | "completed" | "failed";
  stage: string;
  attempt: number;
  lastConfidence?: "high" | "medium" | "low" | null;
  error?: string | null;
  response?: T;
};

type AdmissionResult<T> =
  | { ok: true; job: AsyncChatJob<T> }
  | { ok: false; status: 429 | 503; error: string };

export class ChatJobStore<T> {
  private readonly jobs = new Map<string, AsyncChatJob<T>>();

  constructor(
    private readonly options: {
      maxEntries: number;
      maxActive: number;
      maxActivePerUser: number;
      ttlMs: number;
    },
  ) {}

  admit(jobId: string, userId: string): AdmissionResult<T> {
    if (this.jobs.size >= this.options.maxEntries) {
      return { ok: false, status: 503, error: "The chat queue is full. Please try again shortly." };
    }

    let active = 0;
    let activeForUser = 0;
    for (const job of this.jobs.values()) {
      if (job.status !== "running") continue;
      active += 1;
      if (job.userId === userId) activeForUser += 1;
    }
    if (active >= this.options.maxActive) {
      return { ok: false, status: 503, error: "The chat queue is busy. Please try again shortly." };
    }
    if (activeForUser >= this.options.maxActivePerUser) {
      return { ok: false, status: 429, error: "Too many chat requests are already running." };
    }

    const job: AsyncChatJob<T> = {
      jobId,
      userId,
      status: "running",
      stage: "Thinking",
      attempt: 1,
    };
    this.jobs.set(jobId, job);
    return { ok: true, job };
  }

  getForUser(jobId: string, userId: string): AsyncChatJob<T> | undefined {
    const job = this.jobs.get(jobId);
    return job?.userId === userId ? job : undefined;
  }

  scheduleCleanup(jobId: string): void {
    const timer = setTimeout(() => this.jobs.delete(jobId), this.options.ttlMs);
    timer.unref();
  }
}