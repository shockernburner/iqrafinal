import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { startAsyncChatJob } from "@/lib/chat-async-jobs";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { scope: "chat", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const job = await startAsyncChatJob(session.user.id, prompt.trim());
  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    stage: job.stage,
    attempt: job.attempt,
  });
}
