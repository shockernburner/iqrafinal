import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response_payload: Record<string, unknown> | null;
  created_at: string;
};

export async function GET(_request: NextRequest, context: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { id } = await context.params;
  const ownerCheck = await query<{ id: string }>(
    `SELECT id FROM chat_threads WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [id, session.user.id],
  );
  if (!ownerCheck.rows.length) {
    return NextResponse.json({ error: "Chat not found." }, { status: 404 });
  }

  const messages = await query<ChatMessageRow>(
    `SELECT id, role, content, response_payload, created_at
     FROM chat_messages
     WHERE thread_id = $1
     ORDER BY created_at ASC`,
    [id],
  );

  return NextResponse.json({
    id,
    messages: messages.rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      responsePayload: row.response_payload,
      createdAt: row.created_at,
    })),
  });
}
