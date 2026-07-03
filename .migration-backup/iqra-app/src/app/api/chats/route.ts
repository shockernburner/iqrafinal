import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";

type ChatThreadRow = {
  id: string;
  title: string;
  updated_at: string;
  preview: string | null;
};

function normalizeTitle(value: unknown) {
  if (typeof value !== "string") return "New chat";
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, 120) : "New chat";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const result = await query<ChatThreadRow>(
    `SELECT thread.id, thread.title, thread.updated_at, last_message.content AS preview
     FROM chat_threads thread
     LEFT JOIN LATERAL (
       SELECT content
       FROM chat_messages
       WHERE thread_id = thread.id
       ORDER BY created_at DESC
       LIMIT 1
     ) AS last_message ON true
     WHERE thread.user_id = $1
     ORDER BY thread.updated_at DESC
     LIMIT 100`,
    [session.user.id],
  );

  return NextResponse.json({
    threads: result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
      preview: row.preview,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { title } = (await request.json().catch(() => ({}))) as { title?: unknown };
  const normalizedTitle = normalizeTitle(title);

  let inserted;
  try {
    inserted = await query<{ id: string; title: string; updated_at: string }>(
      `INSERT INTO chat_threads (user_id, title)
       VALUES ($1, $2)
       RETURNING id, title, updated_at`,
      [session.user.id, normalizedTitle],
    );
  } catch (error) {
    const dbError = error as { code?: string; constraint?: string };
    if (dbError.code === "23503" && dbError.constraint === "chat_threads_user_id_fkey") {
      return NextResponse.json(
        { error: "Your session is stale. Please sign out and sign in again." },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: "Unable to create chat." }, { status: 500 });
  }

  const thread = inserted.rows[0];
  return NextResponse.json({
    id: thread.id,
    title: thread.title,
    updatedAt: thread.updated_at,
  });
}
