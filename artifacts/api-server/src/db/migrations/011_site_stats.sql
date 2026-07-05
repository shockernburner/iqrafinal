CREATE TABLE IF NOT EXISTS site_stats (
  key text PRIMARY KEY,
  count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_stats (key, count) VALUES ('page_visits', 0) ON CONFLICT (key) DO NOTHING;
