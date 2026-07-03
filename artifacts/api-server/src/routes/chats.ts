import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  AppendChatTurnBody,
  AppendChatTurnParams,
  AppendChatTurnResponse,
  CreateChatBody,
  CreateChatResponse,
  GetChatParams,
  GetChatResponse,
  ListChatsResponse,
} from "@workspace/api-zod";
import { attachUser, requireUser } from "../lib/auth";

const router: IRouter = Router();

router.use(attachUser, requireUser);

router.get("/chats", async (req, res) => {
  const result = await pool.query<{
    id: string;
    title: string;
    updated_at: Date;
    preview: string | null;
  }>(
    `SELECT t.id, t.title, t.updated_at,
       (SELECT content FROM chat_messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS preview
     FROM chat_threads t
     WHERE t.user_id = $1
     ORDER BY t.updated_at DESC`,
    [req.user!.id],
  );

  const data = ListChatsResponse.parse({
    threads: result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at.toISOString(),
      preview: row.preview,
    })),
  });
  res.json(data);
});

router.post("/chats", async (req, res) => {
  const body = CreateChatBody.parse(req.body);
  const title = body.title?.trim().slice(0, 120) || "New chat";

  const result = await pool.query<{ id: string; title: string; updated_at: Date }>(
    `INSERT INTO chat_threads (user_id, title) VALUES ($1, $2) RETURNING id, title, updated_at`,
    [req.user!.id, title],
  );

  const row = result.rows[0]!;
  const data = CreateChatResponse.parse({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at.toISOString(),
  });
  res.status(201).json(data);
});

router.get("/chats/:id", async (req, res) => {
  const params = GetChatParams.parse(req.params);

  const thread = await pool.query("SELECT id FROM chat_threads WHERE id = $1 AND user_id = $2", [
    params.id,
    req.user!.id,
  ]);
  if (!thread.rows[0]) {
    res.status(404).json({ error: "Chat thread not found." });
    return;
  }

  const messages = await pool.query<{
    id: string;
    role: "user" | "assistant";
    content: string;
    response_payload: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `SELECT id, role, content, response_payload, created_at
     FROM chat_messages WHERE thread_id = $1 ORDER BY created_at ASC`,
    [params.id],
  );

  const data = GetChatResponse.parse({
    id: params.id,
    messages: messages.rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      responsePayload: row.response_payload,
      createdAt: row.created_at.toISOString(),
    })),
  });
  res.json(data);
});

router.post("/chats/:id/turn", async (req, res) => {
  const params = AppendChatTurnParams.parse(req.params);
  const body = AppendChatTurnBody.parse(req.body);

  const thread = await pool.query("SELECT id FROM chat_threads WHERE id = $1 AND user_id = $2", [
    params.id,
    req.user!.id,
  ]);
  if (!thread.rows[0]) {
    res.status(404).json({ error: "Chat thread not found." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO chat_messages (thread_id, role, content) VALUES ($1, 'user', $2)`,
      [params.id, body.userText],
    );
    const assistantContent =
      typeof body.assistantPayload.directAnswer === "string" ? body.assistantPayload.directAnswer : "";
    await client.query(
      `INSERT INTO chat_messages (thread_id, role, content, response_payload) VALUES ($1, 'assistant', $2, $3::jsonb)`,
      [params.id, assistantContent, JSON.stringify(body.assistantPayload)],
    );
    await client.query(
      `UPDATE chat_threads SET updated_at = now(), last_message_at = now() WHERE id = $1`,
      [params.id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const data = AppendChatTurnResponse.parse({ ok: true });
  res.json(data);
});

export default router;
