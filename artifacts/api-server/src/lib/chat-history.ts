import { pool } from "@workspace/db";

export const CHAT_PAGE_SIZE = 40;

export type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response_payload: Record<string, unknown> | null;
  created_at: Date;
};

function serializeMessage(row: ChatMessageRow) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    responsePayload: row.response_payload,
    createdAt: row.created_at.toISOString(),
  };
}

export async function loadMessagePage(threadId: string, before?: string) {
  const values: string[] = [threadId];
  const cursorFilter = before
    ? `AND (created_at, id) < (
         SELECT created_at, id FROM chat_messages
         WHERE thread_id = $1 AND id = $2
       )`
    : "";
  if (before) values.push(before);

  const result = await pool.query<ChatMessageRow>(
    `SELECT id, role, content, response_payload, created_at
     FROM chat_messages
     WHERE thread_id = $1
       ${cursorFilter}
     ORDER BY created_at DESC, id DESC
     LIMIT ${CHAT_PAGE_SIZE + 1}`,
    values,
  );

  const hasMore = result.rows.length > CHAT_PAGE_SIZE;
  const newestFirst = result.rows.slice(0, CHAT_PAGE_SIZE);
  const nextCursor = hasMore ? newestFirst[newestFirst.length - 1]?.id ?? null : null;
  return {
    messages: [...newestFirst].reverse().map(serializeMessage),
    hasMore,
    nextCursor,
  };
}