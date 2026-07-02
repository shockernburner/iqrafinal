import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { generateConfidenceGatedChatResponse, type ChatApiPayload } from "@/lib/chat-response";
import { query, withPgClient } from "@/lib/db";
import { clearIqraRetrievalCaches } from "@/lib/iqra-retrieval";

type JobStatus = "running" | "completed" | "failed";

type JobConfidence = "high" | "medium" | "low";

export type ChatAsyncJobView = {
  jobId: string;
  status: JobStatus;
  stage: string;
  attempt: number;
  lastConfidence: JobConfidence | null;
  error: string | null;
  result: ChatApiPayload | null;
};

type ChatAsyncJobRow = {
  id: string;
  user_id: string;
  prompt: string;
  status: JobStatus;
  stage: string;
  attempt: number;
  last_confidence: JobConfidence | null;
  error_message: string | null;
  result_payload: ChatApiPayload | null;
  worker_id: string | null;
  locked_at: string | null;
};

const ACTIVE_STAGES = ["Thinking", "Reading references", "Getting your response ready"];
const RETRAIN_LOCK_KEY = 483_920_115;
const LOCK_STALE_MS = Number(process.env.CHAT_ASYNC_LOCK_STALE_MS ?? 90_000);
const HEARTBEAT_MS = Number(process.env.CHAT_ASYNC_HEARTBEAT_MS ?? 15_000);
const MAX_ATTEMPTS = Math.max(1, Number(process.env.CHAT_ASYNC_MAX_ATTEMPTS ?? 4));
const WORKER_ID = process.env.INSTANCE_ID ?? randomUUID();

let workerPumpActive = false;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function view(job: ChatAsyncJobRow): ChatAsyncJobView {
  return {
    jobId: job.id,
    status: job.status,
    stage: job.stage,
    attempt: job.attempt,
    lastConfidence: job.last_confidence,
    error: job.error_message,
    result: job.result_payload,
  };
}

function runNpmScript(script: string) {
  return new Promise<void>((resolve, reject) => {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(npmCommand, ["run", script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "ignore",
    });

    child.on("error", (error) => reject(error));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm run ${script} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function insertJob(userId: string, prompt: string) {
  const inserted = await query<ChatAsyncJobRow>(
    `INSERT INTO chat_async_jobs (
      user_id,
      prompt,
      status,
      stage,
      attempt,
      last_confidence,
      error_message,
      result_payload,
      worker_id,
      locked_at,
      updated_at
    )
    VALUES ($1, $2, 'running', 'Thinking', 0, NULL, NULL, NULL, NULL, NULL, now())
    RETURNING id, user_id, prompt, status, stage, attempt, last_confidence, error_message, result_payload, worker_id, locked_at`,
    [userId, prompt],
  );
  return inserted.rows[0] ?? null;
}

async function loadJob(userId: string, jobId: string) {
  const selected = await query<ChatAsyncJobRow>(
    `SELECT id, user_id, prompt, status, stage, attempt, last_confidence, error_message, result_payload, worker_id, locked_at
     FROM chat_async_jobs
     WHERE id = $1 AND user_id = $2`,
    [jobId, userId],
  );
  return selected.rows[0] ?? null;
}

async function claimNextJob() {
  const claimed = await query<ChatAsyncJobRow>(
    `WITH candidate AS (
      SELECT id
      FROM chat_async_jobs
      WHERE status = 'running'
        AND (locked_at IS NULL OR locked_at < now() - ($1::text || ' milliseconds')::interval)
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE chat_async_jobs job
    SET worker_id = $2,
        locked_at = now(),
        updated_at = now()
    FROM candidate
    WHERE job.id = candidate.id
    RETURNING job.id, job.user_id, job.prompt, job.status, job.stage, job.attempt, job.last_confidence, job.error_message, job.result_payload, job.worker_id, job.locked_at`,
    [LOCK_STALE_MS, WORKER_ID],
  );

  return claimed.rows[0] ?? null;
}

async function heartbeat(jobId: string) {
  await query(
    `UPDATE chat_async_jobs
     SET locked_at = now(), updated_at = now()
     WHERE id = $1 AND worker_id = $2 AND status = 'running'`,
    [jobId, WORKER_ID],
  );
}

async function updateRunningJob(jobId: string, patch: { stage?: string; attempt?: number; lastConfidence?: JobConfidence | null }) {
  const sets: string[] = ["updated_at = now()"];
  const values: unknown[] = [jobId, WORKER_ID];
  let index = values.length + 1;

  if (patch.stage !== undefined) {
    sets.push(`stage = $${index}`);
    values.push(patch.stage);
    index += 1;
  }

  if (patch.attempt !== undefined) {
    sets.push(`attempt = $${index}`);
    values.push(patch.attempt);
    index += 1;
  }

  if (patch.lastConfidence !== undefined) {
    sets.push(`last_confidence = $${index}`);
    values.push(patch.lastConfidence);
  }

  await query(
    `UPDATE chat_async_jobs
     SET ${sets.join(", ")}
     WHERE id = $1 AND worker_id = $2 AND status = 'running'`,
    values,
  );
}

async function completeJob(jobId: string, payload: ChatApiPayload, stage: string, confidence: JobConfidence) {
  await query(
    `UPDATE chat_async_jobs
     SET status = 'completed',
         stage = $3,
         last_confidence = $4,
         result_payload = $5::jsonb,
         error_message = NULL,
         worker_id = NULL,
         locked_at = NULL,
         completed_at = now(),
         updated_at = now()
     WHERE id = $1 AND worker_id = $2`,
    [jobId, WORKER_ID, stage, confidence, JSON.stringify(payload)],
  );
}

async function failJob(jobId: string, stage: string, errorMessage: string) {
  await query(
    `UPDATE chat_async_jobs
     SET status = 'failed',
         stage = $3,
         error_message = $4,
         worker_id = NULL,
         locked_at = NULL,
         updated_at = now()
     WHERE id = $1 AND worker_id = $2`,
    [jobId, WORKER_ID, stage, errorMessage],
  );
}

async function runRetrainingCycle(jobId: string) {
  await updateRunningJob(jobId, { stage: "Waiting for retraining slot" });

  await withPgClient(async (client) => {
    while (true) {
      const lockResult = await client.query<{ locked: boolean }>(
        `SELECT pg_try_advisory_lock($1) AS locked`,
        [RETRAIN_LOCK_KEY],
      );
      if (lockResult.rows[0]?.locked) break;
      await sleep(500);
    }

    try {
      await updateRunningJob(jobId, { stage: "Retraining model" });
      await runNpmScript("prepare:training");
      await runNpmScript("build:index");
      clearIqraRetrievalCaches();
    } finally {
      await client.query(`SELECT pg_advisory_unlock($1)`, [RETRAIN_LOCK_KEY]);
    }
  });
}

async function processClaimedJob(job: ChatAsyncJobRow) {
  const heartbeatTimer = setInterval(() => {
    void heartbeat(job.id);
  }, HEARTBEAT_MS);

  let stageCursor = 0;

  try {
    while (true) {
      if (job.attempt >= MAX_ATTEMPTS) {
        throw new Error(`Confidence did not reach high after ${MAX_ATTEMPTS} attempts.`);
      }

      await updateRunningJob(job.id, { stage: ACTIVE_STAGES[stageCursor % ACTIVE_STAGES.length] });
      stageCursor += 1;

      const payload = await generateConfidenceGatedChatResponse(job.prompt);
      const confidence = (payload.confidence ?? "low") as JobConfidence;

      if (!payload.responseHeld || confidence === "high") {
        await completeJob(job.id, payload, "Response ready", confidence);
        return;
      }

      job.attempt += 1;
      await updateRunningJob(job.id, {
        attempt: job.attempt,
        lastConfidence: confidence,
        stage: "Confidence below high, continuing retraining",
      });

      await runRetrainingCycle(job.id);
      await sleep(700);
    }
  } catch (error) {
    await failJob(
      job.id,
      "Retraining failed",
      error instanceof Error ? error.message : "Unknown background retraining failure.",
    );
  } finally {
    clearInterval(heartbeatTimer);
  }
}

async function workerPump() {
  if (workerPumpActive) return;
  workerPumpActive = true;

  try {
    while (true) {
      const nextJob = await claimNextJob();
      if (!nextJob) return;
      await processClaimedJob(nextJob);
    }
  } finally {
    workerPumpActive = false;
  }
}

export function triggerAsyncChatWorkers() {
  void workerPump();
}

export async function startAsyncChatJob(userId: string, prompt: string) {
  const job = await insertJob(userId, prompt);
  if (!job) {
    throw new Error("Unable to create async chat job.");
  }
  triggerAsyncChatWorkers();
  return view(job);
}

export async function getAsyncChatJob(userId: string, jobId: string): Promise<ChatAsyncJobView | null> {
  const job = await loadJob(userId, jobId);
  if (!job) return null;
  if (job.status === "running") triggerAsyncChatWorkers();
  return view(job);
}
