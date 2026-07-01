CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'failed', 'deleted')),
  current_version_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  extension text NOT NULL,
  file_size_bytes bigint NOT NULL,
  sha256 text NOT NULL UNIQUE,
  storage_key text NOT NULL,
  page_count integer,
  language text NOT NULL DEFAULT 'unknown',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'quarantined', 'indexing', 'active', 'inactive', 'failed', 'deleted')),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  indexed_at timestamptz,
  UNIQUE(document_id, version)
);

ALTER TABLE documents
  ADD CONSTRAINT documents_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  page_number integer NOT NULL CHECK (page_number >= 1),
  section_heading text,
  language text NOT NULL DEFAULT 'unknown',
  text text NOT NULL,
  token_count integer,
  embedding double precision[],
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(text, ''))) STORED,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_version_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);
CREATE INDEX IF NOT EXISTS document_versions_document_id_idx ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS document_versions_status_idx ON document_versions(status);
CREATE INDEX IF NOT EXISTS document_versions_sha256_idx ON document_versions(sha256);
CREATE INDEX IF NOT EXISTS document_chunks_active_idx ON document_chunks(document_version_id, is_active);
CREATE INDEX IF NOT EXISTS document_chunks_search_idx ON document_chunks USING gin(search_vector);
CREATE INDEX IF NOT EXISTS ingestion_jobs_status_idx ON ingestion_jobs(status, created_at);
