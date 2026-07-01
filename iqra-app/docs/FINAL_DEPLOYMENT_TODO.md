# IQRA Final Deployment Todo

This checklist is for the final production deployment phase after localhost/client demo testing. Do not treat the app as production-ready until every release gate below is closed and re-tested.

## 0. Current Release Gate

Status: BLOCK RELEASE for production.

Known blockers before production:

- Remove and rotate the exposed `OPENAI_API_KEY` currently present in local environment configuration.
- Fix unsupported-query behavior so the app returns an insufficient-evidence response instead of citing unrelated sources.
- Make Bangla responses work end-to-end with Bangla language output and citations.
- Ensure document deletion removes or securely quarantines the physical stored file, not only DB rows/chunks.
- Implement admin document replace and rollback lifecycle.
- Configure and test real self-hosted LLM, STT, embedding, and reranker services.
- Complete full corpus ingestion and citation verification.
- Resolve high-severity production dependency vulnerabilities, especially `xlsx`.

## 1. Secrets And Environment

- Remove all legacy public AI variables from local and production env files:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `OPENAI_ENABLED`
  - Any Anthropic, Gemini, Azure OpenAI, Bedrock, Cohere, hosted speech, or hosted embedding credentials.
- Rotate the exposed OpenAI key immediately. Treat it as compromised.
- Create fresh production secrets:
  - `AUTH_SECRET`
  - `DATABASE_URL`
  - `AUTH_URL`
  - `NEXT_PUBLIC_APP_URL`
  - Stripe production keys, if billing/donation remains enabled.
  - Firebase credentials only if Firebase remains in the final architecture.
- Keep secrets outside Git using the deployment platform secret manager.
- Add a secret scanning command to CI and release checks.
- Confirm `.env.local`, `.env.production`, service account JSON, database dumps, and storage files are ignored.

## 2. Self-Hosted AI Runtime

Production must not call public hosted AI providers for answers, embeddings, reranking, OCR, speech-to-text, or text-to-speech.

Required production services:

- Self-hosted open-weight instruction model endpoint.
- Self-hosted multilingual embedding endpoint.
- Self-hosted reranker endpoint.
- Self-hosted Bangla/English STT endpoint, for example locally hosted Whisper or equivalent.
- Optional self-hosted TTS endpoint if voice playback is required.
- Optional OCR endpoint or local OCR worker for scanned PDFs.

Environment variables to configure:

- `LOCAL_LLM_ENDPOINT`
- `LOCAL_LLM_MODEL`
- `LOCAL_LLM_TIMEOUT_MS`
- `LOCAL_STT_ENDPOINT`
- `LOCAL_STT_TIMEOUT_MS`
- `LOCAL_EMBEDDING_ENDPOINT`
- `LOCAL_EMBEDDING_MODEL`
- `LOCAL_EMBEDDING_TIMEOUT_MS`
- `LOCAL_RERANK_ENDPOINT`
- `LOCAL_RERANK_MODEL`
- `LOCAL_RERANK_TIMEOUT_MS`

Validation:

- `/api/ready` must report database ok, local LLM ok, and local STT ok.
- Ask English, Bangla, mixed Bangla-English, and Arabic-term questions.
- Confirm no network calls go to OpenAI, Anthropic, Gemini, Azure, Bedrock, Cohere, Google Speech, Amazon Transcribe, or hosted Whisper APIs.

## 3. Database And Vector Search

- Provision production PostgreSQL.
- Enable required extensions:
  - `pgcrypto`
  - `vector`, if using pgvector.
- Replace local `double precision[]` fallback with production `vector(...)` columns where appropriate.
- Add vector indexes for embeddings.
- Confirm migrations are idempotent on an empty production database.
- Confirm rollback strategy for failed migrations.
- Configure backups, point-in-time recovery, and restore testing.
- Confirm database TLS is enabled.
- Confirm least-privilege DB user permissions.

Validation commands:

```zsh
npm run db:migrate
npm run build
npm run check:runtime-egress
```

## 4. Knowledge Ingestion And Storage

- Choose production document storage:
  - Local persistent volume, private object storage, or another client-controlled private store.
- Set `KNOWLEDGE_STORAGE_DIR` or equivalent production storage configuration.
- Ensure uploaded documents are never publicly accessible without app authorization.
- Implement physical deletion or secure quarantine for deleted documents.
- Implement document replace and rollback.
- Add OCR fallback for scanned PDFs.
- Validate password-protected, corrupted, oversized, empty, duplicate, Bangla, Arabic, and mixed-language files.
- Confirm duplicate hash detection works.
- Confirm ingestion jobs are retryable and safe under duplicate worker execution.
- Confirm failed ingestion does not activate a document.
- Confirm audit logs are written for upload, ingest success/failure, retry, deactivate, reactivate, replace, rollback, and delete.

Full corpus task:

- Ingest all 428 approved knowledge PDFs.
- Record ingestion success/failure counts.
- Manually review failed or low-text documents.
- Confirm page numbers and source links are correct.

## 5. Retrieval And Citation Gates

Before production, every answer must be grounded or explicitly say evidence is insufficient.

Required fixes:

- Add an evidence-sufficiency gate before citing sources.
- Prevent unrelated source citations for unsupported questions.
- Deduplicate repeated source labels.
- Verify cited page exists and supports the answer.
- Exclude inactive and deleted documents from retrieval and source streaming.
- Prevent citation laundering where a real source is cited but does not support the claim.
- Add confidence behavior that reflects weak or missing evidence.

Required test cases:

- English question against English evidence.
- Bangla question against Bangla evidence.
- Bangla question against English evidence.
- English question against Bangla evidence.
- Mixed Bangla-English question.
- Arabic quotation or terminology retrieval.
- Exact keyword query.
- Semantic paraphrase query.
- Ambiguous question.
- Unsupported question.
- Conflicting sources.
- Multiple scholarly positions.

## 6. IQRA Policy And Religious Safety

- Confirm canonical Basmala appears exactly once in rendered responses.
- Confirm direct answer appears first.
- Confirm ethical framework and sources are visually distinct.
- Confirm formal fatwa requests trigger boundary/referral.
- Confirm the app does not claim to be a mufti, court, or judicial authority.
- Confirm madhhab differences are neutral and do not invent a preferred position.
- Confirm prohibited loopholes are refused.
- Confirm comparative religion refusal works.
- Confirm exactly one clarifying question is asked only when essential.
- Confirm unsupported Qur'an verses, hadith text, narrators, gradings, page numbers, and legal maxims are not fabricated.

## 7. Authentication And Authorization

- Replace local admin credentials with production admin creation workflow.
- Enforce secure password policy.
- Confirm session expiration and logout.
- Add password reset only if required by product scope.
- Confirm admin-only APIs reject:
  - Unauthenticated users.
  - Normal authenticated users.
  - Modified client payloads claiming admin status.
  - Expired or replayed tokens.
- Confirm source document access rules:
  - If the knowledge base is shared, document that any logged-in user can access active shared sources.
  - If tenant/private documents are needed, add tenant/user ownership checks before production.

## 8. Web Security

- Run dependency audit and fix production vulnerabilities.
- Add security headers:
  - Content Security Policy.
  - `X-Frame-Options` or `frame-ancestors`.
  - `X-Content-Type-Options`.
  - `Referrer-Policy`.
  - Permissions Policy for microphone.
- Review CORS behavior.
- Add CSRF review for mutation endpoints using cookie auth.
- Confirm upload MIME spoofing is rejected using content sniffing, not only browser-provided MIME type.
- Confirm malicious filenames cannot escape storage root.
- Confirm PDF/body prompt injection is treated as untrusted evidence only.
- Confirm no sensitive documents, audio, prompts, credentials, or stack traces are logged.

## 9. Voice Readiness

- Start local STT service.
- Test microphone permission flow.
- Test secure audio upload.
- Test English transcription.
- Test Bangla transcription.
- Test Bangla-English code switching.
- Test low-confidence and silence handling.
- Test noisy audio handling.
- Confirm transcript is editable before submission.
- Confirm raw audio retention policy is implemented and documented.
- Confirm no hosted speech fallback exists.

## 10. UI And Product QA

- Test desktop and mobile layouts.
- Test keyboard accessibility.
- Test screen-reader labels for controls.
- Test color contrast.
- Test Bangla rendering.
- Test Arabic rendering and terminology display.
- Test login, register, logout.
- Test admin upload, status, retry, deactivate, reactivate, replace, rollback, delete.
- Test source display and source opening.
- Test loading, empty, and error states.
- Test Zakat Calculator.
- Test Halal Investment Checklist.
- Test donation flow in Stripe test mode, then production mode.

## 11. Automated Tests Required Before Production

Add or enable automated tests for:

- Auth login/register/logout.
- Admin authorization.
- Upload validation.
- Duplicate detection.
- Ingestion success/failure/retry.
- Retrieval active/inactive/deleted behavior.
- Source citation integrity.
- Unsupported question behavior.
- Structured response validation.
- Prompt injection attempts.
- Bangla and English output behavior.
- Voice route success and failure.
- Migration idempotency.

Minimum release commands:

```zsh
npm ci
npm run check:runtime-egress
npm run lint
npx tsc --noEmit
npm run build
npm run db:migrate
npm run verify:training
npm run eval:run
npm audit --omit=dev
```

## 12. Deployment Infrastructure

- Finalize Dockerfile and Docker Compose or chosen host configuration.
- Configure reverse proxy with TLS.
- Configure persistent volumes for Postgres and knowledge storage.
- Configure worker process separately from web process.
- Configure health checks:
  - Web app health.
  - DB connectivity.
  - LLM endpoint.
  - STT endpoint.
  - Embedding endpoint.
  - Reranker endpoint.
  - Worker queue health.
- Configure structured logs.
- Configure alerting for:
  - DB down.
  - Model endpoint down.
  - STT endpoint down.
  - Ingestion job failures.
  - High 401/403/429/5xx rate.
  - Disk nearing full.
  - Queue backlog.

## 13. Backup And Recovery

- Schedule database backups.
- Schedule knowledge-storage backups.
- Test restore into a clean environment.
- Document recovery time objective and recovery point objective.
- Ensure deleted/quarantined documents are handled according to retention policy.

## 14. Final Acceptance Checklist

The app may enter controlled pilot only when:

- No public AI provider appears in runtime code, config, or active environment.
- `/api/ready` reports all required services healthy.
- Full corpus ingestion is complete or failures are documented and accepted.
- English and Bangla text flows pass.
- Voice passes if included in the pilot scope.
- Admin upload, retry, deactivate, reactivate, replace, rollback, and delete pass.
- Unsupported questions do not receive fabricated or unrelated citations.
- Fatwa and high-risk religious queries trigger referral boundaries.
- Dependency audit has no unresolved high or critical production vulnerabilities.
- All mandatory smoke tests pass.
- Production backup and restore have been tested.

## 15. Final Deployment Day Runbook

1. Freeze code and tag release candidate.
2. Run all release commands locally or in CI.
3. Rotate and load production secrets.
4. Provision production DB and storage.
5. Run migrations.
6. Start self-hosted model, embedding, rerank, STT, and worker services.
7. Start web app behind TLS reverse proxy.
8. Confirm `/api/health` and `/api/ready`.
9. Create production admin.
10. Ingest approved knowledge base.
11. Run acceptance and citation tests.
12. Run security smoke tests.
13. Enable client access.
14. Monitor logs, latency, queue health, and 5xx errors during the first pilot window.
