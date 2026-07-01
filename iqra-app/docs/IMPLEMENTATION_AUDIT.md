# IQRA Implementation Audit

Date: 2026-07-01

## Current Architecture Detected

- Frontend framework: Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript.
- Backend framework: Next.js route handlers under `src/app/api`.
- Database: Firebase client/admin SDKs are present, but authentication and Firestore persistence are not wired into the main UI. No production multi-tenant auth gate exists yet.
- Authentication provider: Firebase SDK present; no login/register pages or route protection currently implemented.
- Storage provider: no production object-storage layer yet. The existing source route streams local PDF files from the workspace knowledge-base folder.
- Deployment target: not fully defined. The project has standard Next.js scripts but no Docker or private model deployment profile yet.
- Model runtime: now provider-abstract local runtime via `LOCAL_LLM_ENDPOINT` and `LOCAL_LLM_MODEL`. Public OpenAI runtime usage was removed in this implementation slice.
- Vector database: none yet. Existing retrieval is JSON token-overlap over `data/knowledge-index.json` and `data/training-questions.json`.
- Document-processing pipeline: `scripts/build-iqra-index.mjs` extracts the first pages of local PDFs into JSON. It is not page-aware, versioned, admin-driven, or backed by a vector index.
- Testing framework: no formal unit/e2e test framework is configured. Current validation uses ESLint, Next production build, and a new runtime-egress check.

## Implemented In This Slice

- Removed the OpenAI chat-completion call from `src/app/api/chat/route.ts`.
- Added a local-only model adapter in `src/lib/model/llm.ts` that targets a self-hosted OpenAI-compatible endpoint and falls back to deterministic local responses when no local runtime is configured.
- Added server-side response-shape validation in `src/lib/iqra-schema.ts`.
- Moved the canonical Basmala to `src/lib/iqra-policy.ts` and made the UI/API use that configured value.
- Added deterministic policy checks for comparative-religion refusal, scholar-referral triggers, and prohibited-workaround triggers.
- Removed browser `SpeechRecognition` / `webkitSpeechRecognition` usage from the frontend.
- Added `/api/voice/transcribe`, which accepts uploaded audio and forwards only to a configured local STT service.
- Added `npm run check:runtime-egress` to fail if public hosted LLM endpoints or browser speech APIs are reintroduced under `src/`.
- Updated `.env.example` to remove OpenAI variables and document local runtime/STT configuration.

## Requirement Mapping Snapshot

| Requirement Area | Status | Evidence / Gap |
| --- | --- | --- |
| No public hosted LLM at runtime | Partially complete | OpenAI removed from chat route; local adapter added; egress guard passes. Full network egress policy still needed in deployment. |
| No public speech API | Partially complete | Browser Web Speech removed; local STT upload route added. Actual faster-whisper service and benchmarks still needed. |
| Deterministic response schema | Partially complete | Structured schema parser added server-side. UI still consumes legacy shape pending formatter refactor. |
| Canonical Basmala | Partially complete | Central config added. Full response formatter enforcement still pending. |
| Private RAG with active versions | Missing | Current retrieval remains JSON token-overlap. Postgres/pgvector ingestion still pending. |
| Page-level citations | Missing | Existing source links are file-level only. |
| Admin dashboard and RBAC | Missing | No login, roles, admin routes, or lifecycle UI yet. |
| Training-data quality pipeline | Missing | Existing verifier is not the requested cleaning/splitting pipeline. |
| LoRA/QLoRA workflow | Missing | Baseline RAG and dataset approval must precede training. |
| Evaluation runner | Missing | No automated per-category evaluation framework yet. |
| Deployment | Missing | No Docker/private service composition yet. |
| Tests and security coverage | Partially complete | Lint/build/egress check pass; formal unit/integration/e2e/security suites still pending. |

## Security Concerns Remaining

- No user authentication gate yet.
- No server-verified administrator role yet.
- No rate limiting or request-size hardening on chat yet.
- No private vector database or document lifecycle audit log yet.
- Existing `/api/sources` streams local PDFs safely by path prefix, but it is unauthenticated and should become source-access controlled.
- Stripe routes should be reviewed once auth and user persistence are implemented.
- Existing local JSON indexes may contain extracted content without page-level access control.

## Validation Completed

- `npm run check:runtime-egress` passed.
- `npm run lint` passed.
- `npm run build` passed.
