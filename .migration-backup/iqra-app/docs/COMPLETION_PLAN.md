# IQRA Completion Plan

Date: 2026-07-01

## Architecture Direction

Use the existing Next.js application as the web/API shell. Do not rebuild the UI unnecessarily. Replace unwired Firebase usage with a self-hosted stack centered on Postgres and pgvector, because the target system needs document versions, chunks, vector search, ingestion jobs, audit logs, evaluations, and administrator workflows in one controlled private environment.

Recommended production services:

- Web/API: Next.js App Router.
- Authentication: Auth.js with a Postgres adapter and server-verified roles.
- Database: Postgres with pgvector.
- Queue: pg-boss using Postgres.
- Object storage: local volume for development, S3-compatible private storage such as MinIO for production.
- LLM runtime: self-hosted open-weight model behind an OpenAI-compatible local endpoint, such as vLLM or llama.cpp server.
- Embeddings: self-hosted multilingual embedding model, preferably BGE-M3 or equivalent.
- Reranker: self-hosted multilingual reranker, preferably BGE reranker family or equivalent.
- Speech-to-text: self-hosted faster-whisper service.
- Monitoring: Prometheus/Grafana or equivalent.

## Work Already Started

- Public OpenAI chat dependency removed.
- Browser Web Speech dependency removed.
- Local LLM and local STT abstraction boundaries added.
- Canonical Basmala and initial policy checks centralized.
- Runtime-egress check added.
- Lint and production build pass after the phase-0 slice.

## Database Migrations Needed

Create migrations for at least:

- `users`: Auth.js-compatible user records plus role metadata.
- `accounts`, `sessions`, `verification_tokens`: Auth.js adapter tables if required.
- `documents`: stable document identity, current active version, lifecycle state.
- `document_versions`: file hash, filename, MIME type, size, page count, language, uploader, storage key, version, active/inactive status.
- `document_chunks`: document version, page number, section, normalized text, token count, language, embedding vector, FTS document.
- `ingestion_jobs`: queue state, progress, failure reason, retry count.
- `audit_log`: actor, action, entity, metadata, timestamp.
- `model_registry`: base model, adapter, policy version, embedding model, reranker, index version, dataset versions.
- `evaluation_runs`, `evaluation_cases`, `evaluation_results`: per-category evaluation reports and traces.
- `policy_versions`: controlled system-instruction versions.

## Implementation Phases

1. Finish constraint hardening: add request limits, chat rate limiting, source-access controls, and deployment egress policy.
2. Add Auth.js login/register, server sessions, and RBAC with an admin role.
3. Replace JSON retrieval with Postgres/pgvector hybrid retrieval and page-aware source records.
4. Build admin-only ingestion APIs and a pg-boss worker for PDF/DOCX processing, OCR routing, chunking, embedding, indexing, activation, retry, replacement, rollback, deletion, and audit logging.
5. Refactor the UI response formatter to consume the full structured response contract rather than the current legacy response shape.
6. Build the training-data validation pipeline for the supplied workbook, producing clean JSONL, rejected/review JSONL, and JSON/Markdown quality reports.
7. Add the automated evaluation runner using held-out training data, the client acceptance questions, absent-answer cases, prompt-injection cases, disagreement/referral cases, and voice cases.
8. Add Docker deployment with web/API, worker, Postgres+pgvector, local LLM, embeddings, reranker, STT, MinIO, and monitoring.
9. Add model benchmarking and only then prepare LoRA/QLoRA scripts for approved training data.
10. Complete Bangla text and voice support after English-first production paths are stable.

## Security Changes Required

- Never trust client-side `isAdmin`; check role server-side.
- Protect all admin routes and ingestion routes.
- Add rate limiting on chat, voice, auth, uploads, and Stripe-related routes.
- Enforce upload MIME/extension/size/page limits.
- Add duplicate detection with SHA-256.
- Quarantine files when malware scanning infrastructure is unavailable.
- Do not log full user questions, raw audio, full documents, tokens, or secrets by default.
- Add secure headers, CSRF posture for auth routes, and explicit body-size limits.
- Add source authorization: users should only see citations and source snippets allowed by policy/admin settings.
- Add health and readiness endpoints for app, DB, queue, model, embeddings, reranker, and STT.

## Testing Strategy

- Unit tests: policy checks, schema validation, normalizers, chunking, citation validation, upload validation.
- Integration tests: auth/session/RBAC, ingestion lifecycle, active-version filtering, deletion from storage/vector index, STT route failures, model timeout.
- E2E tests: login, chat answer, admin upload, indexing progress, deactivate document, source block rendering, voice transcript review.
- Security tests: cross-user isolation, non-admin admin-route denial, prompt injection, retrieved-text injection, system-prompt disclosure request, citation manipulation, rate limiting.
- Evaluation tests: per-category report generation and failed-case trace export.

## Deployment Strategy

- Add `.env.example` with no secrets and only private runtime endpoints.
- Add Dockerfiles and `docker-compose.yml` for local private deployment.
- Add CPU profile for development and GPU profile for production inference.
- Pin model revisions; never use floating `latest` identifiers.
- Add admin creation command and initial knowledge-base import command.
- Add backup/restore instructions for Postgres, object storage, vector index, and model/evaluation registries.
- Add reverse-proxy configuration with HTTPS assumptions.
- Add rollback procedure for app version, policy version, model/adapter version, and knowledge-index version.

## Risks and Assumptions

- No live GPU infrastructure is available now, so local model/STT endpoints are configurable boundaries until deployment infrastructure is provisioned.
- The 428 PDFs need legal/content approval and page-level extraction verification before they can be treated as authoritative retrieval evidence.
- The spreadsheet is supervised style/evaluation data, not infallible religious truth. Human review is required before fine-tuning.
- The client acceptance DOCX must remain outside training and be used only for final acceptance evaluation.
- Bangla voice support requires real Bangladeshi-speaker benchmarking before production approval.
- Full LoRA training should wait until baseline RAG is evaluated and the cleaned dataset is approved.
