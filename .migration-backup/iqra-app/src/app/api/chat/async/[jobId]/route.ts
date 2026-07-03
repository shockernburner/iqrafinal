import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAsyncChatJob } from "@/lib/chat-async-jobs";

export const runtime = "nodejs";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const job = await getAsyncChatJob(session.user.id, jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (job.status === "completed" && job.result) {
    return NextResponse.json({
      status: "completed",
      stage: job.stage,
      attempt: job.attempt,
      ...job.result,
    });
  }

  return NextResponse.json(job);
}
