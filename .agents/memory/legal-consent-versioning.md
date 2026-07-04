---
name: Legal consent versioning
description: How IQRA forces users to (re)accept Terms/Privacy, and the cross-file version coupling.
---

Users must accept the current legal docs before using the app. Acceptance is tracked per-user in
`users.legal_accepted_version` (+ `legal_accepted_at`). "Current version" is a single string constant
`CURRENT_LEGAL_VERSION` in `artifacts/api-server/src/lib/legal.ts`.

**Rule:** to force everyone to re-accept (after editing the documents), bump `CURRENT_LEGAL_VERSION`.
Any user whose stored version no longer matches is treated as not-accepted and re-gated. Existing
users with NULL are always gated. Also update the human-readable `LEGAL_LAST_UPDATED` in
`artifacts/iqra-assistant/src/components/legal-shared.tsx` in lockstep — it's the displayed "Last
updated" date and is otherwise disconnected from the server constant.

**Enforcement is two-layered (do not drop either):**
- Frontend gate in `App.tsx` (`Home` + `ProtectedRoute`) renders `<LegalConsent/>` when
  `!user.legalAccepted`. Public `/terms` and `/privacy` routes stay accessible while gated.
- Server middleware `requireLegalAccepted` (in `lib/auth.ts`) returns 403 on business routes
  (chat, chats, donate, voice, admin) so the gate can't be bypassed via direct API calls.

**Why session reads from DB:** `legalAccepted` is NOT in the JWT — `/auth/session` looks up the DB
each call so acceptance (and `is_active`) stay fresh for pre-existing session cookies without
re-issuing tokens.
