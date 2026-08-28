export class DeadlineExceededError extends Error {
  constructor(message = "Operation timed out.") {
    super(message);
    this.name = "DeadlineExceededError";
  }
}

/**
 * Runs an operation with a real abort signal and a bounded wall-clock deadline.
 * The signal lets supported clients cancel network work instead of merely
 * abandoning a still-running promise.
 */
export async function withAbortDeadline<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DeadlineExceededError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}