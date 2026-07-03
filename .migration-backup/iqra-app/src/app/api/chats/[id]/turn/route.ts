import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { withPgClient } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

type AssistantPayload = {
  basmala?: string;
  directAnswer?: string;
  framework?: string[];
  source?: string;
  sourceLinks?: Array<{ label: string; href: string }>;
  requiresScholarReferral?: boolean;
  clarifyingQuestion?: string | null;
  confidence?: "high" | "medium" | "low";
};

function normalizeUserText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeAssistantPayload(value: unknown): AssistantPayload | null {
  if (!value || typeof value !== "object") return null;
  return value as AssistantPayload;
}

function suggestTitle(userText: string) {
  const oneLine = userText.replace(/\s+/g, " ").trim();
  return oneLine ? oneLine.slice(0, 80) : "New chat";
}

export async function POST(request: NextRequest, context: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    userText?: unknown;
    assistantPayload?: unknown;
  };

  const userText = normalizeUserText(body.userText);
  const assistantPayload = normalizeAssistantPayload(body.assistantPayload);
  const assistantText = assistantPayload?.directAnswer?.trim() ?? "";

  if (!userText || !assistantPayload || !assistantText) {
    return NextResponse.json({ error: "userText and assistantPayload are required." }, { status: 400 });
  }

  try {
    await withPgClient(async (client) => {
      await client.query("BEGIN");
      try {
        const threadCheck = await client.query<{ id: string; title: string }>(
          `SELECT id, title
           FROM chat_threads
           WHERE id = $1 AND user_id = $2
           FOR UPDATE`,
          [id, session.user.id],
        );

        if (!threadCheck.rows.length) {
          throw new Error("not_found");
        }

        await client.query(
          `INSERT INTO chat_messages (thread_id, role, content)
           VALUES ($1, 'user', $2)`,
          [id, userText],
        );

        await client.query(
          `INSERT INTO chat_messages (thread_id, role, content, response_payload)
           VALUES ($1, 'assistant', $2, $3::jsonb)`,
          [id, assistantText, JSON.stringify(assistantPayload)],
        );

        const currentTitle = threadCheck.rows[0].title;
        const nextTitle = currentTitle === "New chat" ? suggestTitle(userText) : currentTitle;
        await client.query(
          `UPDATE chat_threads
           SET title = $2,
               updated_at = now(),
               last_message_at = now()
           WHERE id = $1`,
          [id, nextTitle],
        );

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "not_found") {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to save chat turn." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
