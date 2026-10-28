-- Donors added by admins (e.g. offline donations). Listed publicly alongside
-- Stripe donors, ordered by donated_on (first come, first listed).
CREATE TABLE IF NOT EXISTS manual_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  anonymous boolean NOT NULL DEFAULT false,
  donated_on date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_donors_order_idx ON manual_donors (donated_on, created_at);

-- Corporate sponsors shown in the landing-page marquee. Logos are small images
-- stored inline so they survive redeploys without object storage.
CREATE TABLE IF NOT EXISTS corporate_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text,
  logo bytea NOT NULL,
  logo_mime text NOT NULL,
  sponsored_since date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corporate_sponsors_order_idx ON corporate_sponsors (sponsored_since, created_at);

-- Second password required (per upload) from the designated knowledge-base
-- uploaders, on top of their normal sign-in.
CREATE TABLE IF NOT EXISTS kb_upload_credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Single-use upload grants issued after the upload password is verified. Only
-- the SHA-256 hash of the token is stored.
CREATE TABLE IF NOT EXISTS kb_upload_grants (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_upload_grants_user_idx ON kb_upload_grants (user_id);
