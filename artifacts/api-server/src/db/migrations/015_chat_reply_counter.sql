-- Seed a constant-time lifetime counter once. Migrations are intentionally
-- idempotent and run at every boot, so the expensive historical count must
-- only execute when the key does not exist yet.
DO $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('iqra_questions_replied_counter_seed'));
  IF NOT EXISTS (SELECT 1 FROM site_stats WHERE key = 'questions_replied') THEN
    INSERT INTO site_stats (key, count)
    SELECT 'questions_replied', count(*)
    FROM chat_messages
    WHERE role = 'assistant'
    ON CONFLICT (key) DO NOTHING;
  END IF;
END
$$;