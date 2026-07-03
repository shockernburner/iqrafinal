CREATE TABLE IF NOT EXISTS stripe_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);