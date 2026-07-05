CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id text UNIQUE,
  email text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  country text,
  anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donations_user_idx ON donations (user_id);
CREATE INDEX IF NOT EXISTS donations_created_idx ON donations (created_at DESC);
