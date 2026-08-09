---
name: Knowledge originals purged after indexing
description: Original uploaded knowledge files are deleted from object storage once ingestion succeeds; only DB chunks remain.
---

Rule: after a knowledge document version reaches `status='active'`, its original file no longer exists in object storage. The ingestion worker deletes it post-commit (best-effort); a one-time script (`purge-indexed-knowledge-objects.ts`) removed all previously indexed originals (~4.4 GB, dev bucket).

**Why:** PDFs were ~4.5 GB of storage cost while chat only ever reads `document_chunks` in Postgres. User explicitly chose "index only, delete originals".

**How to apply:**
- Never build features that read originals of active versions (download, re-ingest, embeddings backfill) without first defining a re-upload/source-retention policy — the bytes are gone.
- Admin document `retry` must stay restricted to failed jobs on failed versions (failed versions DO keep their file); loosening it re-introduces the bug where retrying a succeeded job clobbers a healthy version to `failed`.
- sha256 duplicate detection is DB-based and unaffected by object deletion.
- Prod uses the same shared bucket but a separate DB; prod-uploaded originals are only auto-deleted after a republish ships the new worker, and any pre-existing prod originals need a prod-side purge run.
