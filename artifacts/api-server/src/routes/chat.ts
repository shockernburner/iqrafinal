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
import { generateIqraChatResponse } from "../lib/chat";

const router: IRouter = Router();

router.post("/chat", attachUser, requireUser, (req, res) => {
  const body = SendChatBody.parse(req.body);
  const response = generateIqraChatResponse(body.prompt);
  const data = SendChatResponse.parse(response);
  res.json(data);
});

type AsyncJob = {
  jobId: string;
  status: "running" | "completed" | "failed";
  stage: string;
  attempt: number;
  lastConfidence?: "high" | "medium" | "low" | null;
  error?: string | null;
  response?: ReturnType<typeof generateIqraChatResponse>;
};

const jobs = new Map<string, AsyncJob>();

router.post("/chat/async", attachUser, requireUser, (req, res) => {
  const body = StartChatJobBody.parse(req.body);
  const jobId = randomUUID();
  const job: AsyncJob = { jobId, status: "running", stage: "Thinking", attempt: 1 };
  jobs.set(jobId, job);

  setTimeout(() => {
    const response = generateIqraChatResponse(body.prompt);
    job.status = "completed";
    job.stage = "Complete";
    job.lastConfidence = response.confidence ?? "medium";
    job.response = response;
  }, 600);

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
