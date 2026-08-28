import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  GetChatJobParams,
  GetChatJobResponse,
  SendChatBody,
  SendChatResponse,
  StartChatJobBody,
  StartChatJobResponse,
} from "@workspace/api-zod";
import { attachUser, requireUser, requireLegalAccepted } from "../lib/auth";
import { generateIqraChatResponse, type ChatApiPayload } from "../lib/chat";
import { ChatJobStore } from "../lib/chat-job-store";
import { DeadlineExceededError, withAbortDeadline } from "../lib/deadline";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const chatRequestTimeoutMs = Number(process.env.CHAT_REQUEST_TIMEOUT_MS ?? 90_000);
const asyncJobTtlMs = Number(process.env.CHAT_ASYNC_JOB_TTL_MS ?? 15 * 60_000);
const jobs = new ChatJobStore<ChatApiPayload>({
  maxEntries: Number(process.env.CHAT_ASYNC_MAX_RETAINED_JOBS ?? 500),
  maxActive: Number(process.env.CHAT_ASYNC_MAX_ACTIVE_JOBS ?? 100),
  maxActivePerUser: Number(process.env.CHAT_ASYNC_MAX_ACTIVE_PER_USER ?? 3),
  ttlMs: asyncJobTtlMs,
});

async function generateWithDeadline(prompt: string): Promise<ChatApiPayload> {
  return withAbortDeadline(
    (signal) => generateIqraChatResponse(prompt, signal),
    chatRequestTimeoutMs,
  );
}

router.post("/chat", attachUser, requireUser, requireLegalAccepted, async (req, res) => {
  const body = SendChatBody.parse(req.body);
  try {
    const response = await generateWithDeadline(body.prompt);
    const data = SendChatResponse.parse(response);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Chat generation failed");
    const timedOut = err instanceof DeadlineExceededError;
    res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "The assistant took too long to respond. Please try again."
        : "The assistant could not generate a response. Please try again.",
    });
  }
});

router.post("/chat/async", attachUser, requireUser, requireLegalAccepted, (req, res) => {
  const body = StartChatJobBody.parse(req.body);
  const jobId = randomUUID();
  const admission = jobs.admit(jobId, req.user!.id);
  if (!admission.ok) {
    res.status(admission.status).json({ error: admission.error });
    return;
  }
  const { job } = admission;

  void (async () => {
    try {
      const response = await generateWithDeadline(body.prompt);
      job.status = "completed";
      job.stage = "Complete";
      job.lastConfidence = response.confidence ?? "medium";
      job.response = response;
    } catch (err) {
      logger.error({ err }, "Async chat generation failed");
      job.status = "failed";
      job.stage = "Failed";
      job.error = "The assistant could not generate a response.";
    } finally {
      jobs.scheduleCleanup(jobId);
    }
  })();

  const data = StartChatJobResponse.parse({
    jobId: job.jobId,
    status: job.status,
    stage: job.stage,
    attempt: job.attempt,
  });
  res.json(data);
});

router.get("/chat/async/:jobId", attachUser, requireUser, requireLegalAccepted, (req, res) => {
  const params = GetChatJobParams.parse(req.params);
  const job = jobs.getForUser(params.jobId, req.user!.id);

  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }

  const data = GetChatJobResponse.parse({
    jobId: job.jobId,
    status: job.status,
    stage: job.stage,
    attempt: job.attempt,
    lastConfidence: job.lastConfidence ?? null,
    error: job.error ?? null,
    ...(job.response ?? {}),
  });
  res.json(data);
});

export default router;
