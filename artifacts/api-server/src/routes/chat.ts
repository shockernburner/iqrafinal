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
import { attachUser, requireUser } from "../lib/auth";
import { generateIqraChatResponse, type ChatApiPayload } from "../lib/chat";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/chat", attachUser, requireUser, async (req, res) => {
  const body = SendChatBody.parse(req.body);
  try {
    const response = await generateIqraChatResponse(body.prompt);
    const data = SendChatResponse.parse(response);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Chat generation failed");
    res.status(502).json({ error: "The assistant could not generate a response. Please try again." });
  }
});

type AsyncJob = {
  jobId: string;
  status: "running" | "completed" | "failed";
  stage: string;
  attempt: number;
  lastConfidence?: "high" | "medium" | "low" | null;
  error?: string | null;
  response?: ChatApiPayload;
};

const jobs = new Map<string, AsyncJob>();

router.post("/chat/async", attachUser, requireUser, (req, res) => {
  const body = StartChatJobBody.parse(req.body);
  const jobId = randomUUID();
  const job: AsyncJob = { jobId, status: "running", stage: "Thinking", attempt: 1 };
  jobs.set(jobId, job);

  void (async () => {
    try {
      const response = await generateIqraChatResponse(body.prompt);
      job.status = "completed";
      job.stage = "Complete";
      job.lastConfidence = response.confidence ?? "medium";
      job.response = response;
    } catch (err) {
      logger.error({ err }, "Async chat generation failed");
      job.status = "failed";
      job.stage = "Failed";
      job.error = "The assistant could not generate a response.";
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

router.get("/chat/async/:jobId", attachUser, requireUser, (req, res) => {
  const params = GetChatJobParams.parse(req.params);
  const job = jobs.get(params.jobId);

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
