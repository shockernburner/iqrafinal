-- Track each user's acceptance of the legal documents (Terms of Service + Privacy Policy).
-- Existing users have NULL, so they are treated as not-yet-accepted and are forced to
-- accept the current version on their next visit.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS legal_accepted_version text,
  ADD COLUMN IF NOT EXISTS legal_accepted_at timestamptz;
