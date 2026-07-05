-- Per-visit event log so the admin Growth panel can chart visits over time.
-- The aggregate `site_stats.page_visits` counter is kept as-is (it powers the
-- landing-page tally and preserves the historical total); this table records
-- one row per landing-page visit going forward for time-series analytics.
CREATE TABLE IF NOT EXISTS page_visit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_visit_events_created_idx ON page_visit_events (created_at DESC);
