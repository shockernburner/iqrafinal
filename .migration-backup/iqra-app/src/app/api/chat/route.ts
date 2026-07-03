import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateConfidenceGatedChatResponse } from "@/lib/chat-response";
import { rateLimit } from "@/lib/rate-limit";

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

  return NextResponse.json(await generateConfidenceGatedChatResponse(prompt));
}