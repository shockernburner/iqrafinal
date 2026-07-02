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

  try {
    const job = await startAsyncChatJob(session.user.id, prompt.trim());
    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      stage: job.stage,
      attempt: job.attempt,
    });
  } catch (error) {
    const dbError = error as { code?: string; constraint?: string };
    if (dbError.code === "23503" && dbError.constraint === "chat_async_jobs_user_id_fkey") {
      return NextResponse.json(
        { error: "Your session is stale. Please sign out and sign in again." },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: "Unable to start background processing." }, { status: 500 });
  }
}
