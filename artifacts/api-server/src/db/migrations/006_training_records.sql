CREATE TABLE IF NOT EXISTS training_records (
  id serial PRIMARY KEY,
  sheet text NOT NULL DEFAULT 'manual_entries',
  row_num integer NOT NULL DEFAULT 0,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_records_question_fts_idx
  ON training_records USING gin(to_tsvector('simple', question));
