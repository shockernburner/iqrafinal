-- A user question and its assistant answer are inserted in the same
-- transaction and therefore share a transaction timestamp. Index the explicit
-- role tie-breaker used by chat history so a reply always follows its question.
CREATE INDEX IF NOT EXISTS chat_messages_thread_display_order_idx
  ON chat_messages (
    thread_id,
    created_at DESC,
    (CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) DESC,
    id DESC
  );