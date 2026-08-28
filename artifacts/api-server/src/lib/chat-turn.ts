import { pool } from "@workspace/db";

export async function saveChatTurn(args: {
  threadId: string;
  turnId: string;
  userText: string;
  assistantPayload: Record<string, unknown>;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO chat_messages (thread_id, turn_id, role, content)
       VALUES ($1, $2, 'user', $3)
       ON CONFLICT (thread_id, turn_id, role) WHERE turn_id IS NOT NULL DO NOTHING`,
      [args.threadId, args.turnId, args.userText],
    );
    const assistantContent =
      typeof args.assistantPayload.directAnswer === "string"
        ? args.assistantPayload.directAnswer
        : "";
    const assistantInsert = await client.query(
      `INSERT INTO chat_messages (thread_id, turn_id, role, content, response_payload)
       VALUES ($1, $2, 'assistant', $3, $4::jsonb)
       ON CONFLICT (thread_id, turn_id, role) WHERE turn_id IS NOT NULL DO NOTHING
       RETURNING id`,
      [
        args.threadId,
        args.turnId,
        assistantContent,
        JSON.stringify(args.assistantPayload),
      ],
    );
    if ((assistantInsert.rowCount ?? 0) > 0) {
      await client.query(
        `INSERT INTO site_stats (key, count) VALUES ('questions_replied', 1)
         ON CONFLICT (key) DO UPDATE
         SET count = site_stats.count + 1, updated_at = now()`,
      );
    }
    await client.query(
      `UPDATE chat_threads SET updated_at = now(), last_message_at = now() WHERE id = $1`,
      [args.threadId],
    );
    await client.query("COMMIT");
    return { inserted: (assistantInsert.rowCount ?? 0) > 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}