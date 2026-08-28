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
  GetOlderChatMessagesParams,
  GetOlderChatMessagesResponse,
  ListChatsResponse,
} from "@workspace/api-zod";
import { attachUser, requireUser, requireLegalAccepted } from "../lib/auth";
import { loadMessagePage } from "../lib/chat-history";
import { saveChatTurn } from "../lib/chat-turn";

const router: IRouter = Router();

router.use(attachUser, requireUser, requireLegalAccepted);

router.get("/", async (req, res) => {
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

router.post("/", async (req, res) => {
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

router.get("/:id", async (req, res) => {
  const params = GetChatParams.parse(req.params);

  const thread = await pool.query("SELECT id FROM chat_threads WHERE id = $1 AND user_id = $2", [
    params.id,
    req.user!.id,
  ]);
  if (!thread.rows[0]) {
    res.status(404).json({ error: "Chat thread not found." });
    return;
  }

  const page = await loadMessagePage(params.id);

  const data = GetChatResponse.parse({
    id: params.id,
    ...page,
  });
  res.json(data);
});

router.get("/:id/messages/:before", async (req, res) => {
  const params = GetOlderChatMessagesParams.parse(req.params);
  const thread = await pool.query("SELECT id FROM chat_threads WHERE id = $1 AND user_id = $2", [
    params.id,
    req.user!.id,
  ]);
  if (!thread.rows[0]) {
    res.status(404).json({ error: "Chat thread not found." });
    return;
  }

  const cursor = await pool.query(
    "SELECT id FROM chat_messages WHERE thread_id = $1 AND id = $2",
    [params.id, params.before],
  );
  if (!cursor.rows[0]) {
    res.status(404).json({ error: "Chat message cursor not found." });
    return;
  }

  const data = GetOlderChatMessagesResponse.parse({
    id: params.id,
    ...(await loadMessagePage(params.id, params.before)),
  });
  res.json(data);
});

router.post("/:id/turn", async (req, res) => {
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

  await saveChatTurn({
    threadId: params.id,
    turnId: body.turnId,
    userText: body.userText,
    assistantPayload: body.assistantPayload,
  });

  const data = AppendChatTurnResponse.parse({ ok: true });
  res.json(data);
});

export default router;
