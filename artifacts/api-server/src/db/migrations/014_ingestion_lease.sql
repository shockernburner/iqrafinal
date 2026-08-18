-- Fencing token for ingestion job attempts: every claim generates a new
-- token; all subsequent updates by a worker are conditioned on it so a
-- reclaimed/re-run job cannot be corrupted by the original (still-alive)
-- attempt.
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS attempt_token uuid;
