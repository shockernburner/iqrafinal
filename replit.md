# IQRA Assistant

An Islamic ethics and leadership chat assistant: users register/login, chat with a policy-grounded assistant for guidance rooted in traditional texts, and admins manage the knowledge base, maintenance jobs, and training data. Migrated from a Vercel/Next.js app into this pnpm workspace (Vite+React frontend, Express backend).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (builds + runs migrations on boot)
- `pnpm --filter @workspace/iqra-assistant run dev` — run the frontend (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret (already set)
- Optional env: `STRIPE_SECRET_KEY` — enables live donate checkout; without it, `/api/donate` returns `{ url: null }` and the frontend shows a graceful message
- Create/promote an admin user: `cd artifacts/api-server && npx tsx src/scripts/create-admin.ts <email> <password> [name]`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (`artifacts/iqra-assistant`), wouter routing, TanStack Query, shadcn/ui, forest-green/cream/gold theme
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + `pg` Pool, plain SQL migrations run on server startup (`src/db/migrations/*.sql`)
- Auth: JWT in httpOnly cookie (jsonwebtoken + bcryptjs)
- Validation: Zod (generated from OpenAPI spec)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- Frontend pages: `artifacts/iqra-assistant/src/pages/` (chat, login, register, donate, admin, thank-you)
- Backend routes: `artifacts/api-server/src/routes/` (auth, chat, chats, admin, donate, voice)
- Backend business logic: `artifacts/api-server/src/lib/` (auth, chat generation, admin maintenance, knowledge upload, training data)
- DB migrations: `artifacts/api-server/src/db/migrations/*.sql`, runner in `src/db/migrate.ts`
- API contract (source of truth): `lib/api-spec/openapi.yaml` → generates `lib/api-zod` and `lib/api-client-react`

## Architecture decisions

- Chat responses are generated via a rule-based policy + templated response system (`lib/iqra-policy.ts` + `lib/iqra-response.ts`), not a full LLM — the original app's local-LLM/retrieval/training pipeline was out of scope for this migration.
- Chat flow is two-step by design: frontend calls `POST /api/chat` to generate an `assistantPayload`, then `POST /api/chats/:id/turn` to persist both the user message and that payload. The turn endpoint does NOT generate responses itself — it trusts the payload the client already computed.
- Voice transcription (`/api/voice/transcribe`) intentionally returns HTTP 501 "not configured" — no fake transcription data, per no-silent-fallback principle.
- Admin maintenance jobs are simulated in-memory (progress/logs) rather than spawning real npm scripts, since the original scripts don't exist in this stack.
- Training question records live in a JSON file + in-memory additions (no DB table); additions do not persist across server restarts.

## Product

- Public: register/login (JWT cookie auth), chat with the IQRA assistant across multiple threads, donate page with Stripe checkout (falls back gracefully without a Stripe key).
- Admin (`/admin`): overview/documents (knowledge base upload + versioning), maintenance (simulated job runner), training (Q&A dataset viewer/editor) tabs.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- esbuild only bundles JS — see `.agents/memory/api-server-esbuild-build.md` for why non-JS runtime files (migrations, data) need an explicit copy step in `build.mjs`.
- Generated Orval query hooks can falsely require `queryKey` in options — see `.agents/memory/orval-query-option-typing.md`.
- Always restart both `artifacts/api-server` and `artifacts/iqra-assistant` workflows after backend or frontend code changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
