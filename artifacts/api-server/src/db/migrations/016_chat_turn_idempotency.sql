ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS turn_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS chat_messages_turn_role_unique_idx
  ON chat_messages (thread_id, turn_id, role)
  WHERE turn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS chat_messages_thread_cursor_idx
  ON chat_messages (thread_id, created_at DESC, id DESC);