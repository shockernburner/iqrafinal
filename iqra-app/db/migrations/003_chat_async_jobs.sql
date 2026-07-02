CREATE TABLE IF NOT EXISTS chat_async_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  stage text NOT NULL DEFAULT 'Thinking',
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  last_confidence text CHECK (last_confidence IN ('high', 'medium', 'low')),
  error_message text,
  result_payload jsonb,
  worker_id text,
  locked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_async_jobs_user_created_idx ON chat_async_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_async_jobs_status_created_idx ON chat_async_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS chat_async_jobs_status_locked_idx ON chat_async_jobs(status, locked_at);
