---
name: Ingestion job stale reclaim & fencing
description: Why the ingestion worker uses attempt tokens + heartbeats, and how stuck 'processing' jobs are handled
---

**Rule:** Any in-process DB job queue on Autoscale must (1) reclaim stale `processing` rows (instances get killed mid-job) and (2) fence every job update with a per-claim `attempt_token`, or a reclaimed-but-still-alive attempt can corrupt the replacement attempt's state (mark a succeeded job failed, delete the source object it still needs).

**Why:** In production, 47 ingestion jobs sat in `processing` for hours after Autoscale restarts — no reclaim existed, so their documents stayed `pending` forever. Adding naive reclaim alone would have raced with live-but-slow attempts (read/extract runs before any transaction, so no visible heartbeat).

**How to apply:**
- `ingestion-worker.ts`: claim generates `attempt_token`; a 60s out-of-band heartbeat touches `updated_at`; all progress/terminal updates require the token; `OwnershipLostError` abandons silently without touching state or deleting storage. Reclaim requeues after `INGESTION_STALE_JOB_TIMEOUT_MS` (default 10 min), fails permanently after 3 requeues.
- Terminal failure updates job + document_version in one CTE statement, token-guarded.
- Migration `014_ingestion_lease.sql` adds the column; prod gets it on republish (server runs migrations at boot).
