---
name: IQRA separate prod DB & donation reconcile-on-boot
description: Dev and prod use SEPARATE databases; how prod data changes are applied; the webhook-loss + reconcile pattern for donations.
---

## Dev and prod are separate databases
The IQRA development database and the deployed (Autoscale) production database are
**distinct** — real user/donation data lives only in prod, dev has test rows.

**Why it matters:** You cannot promote a user, backfill a row, or fix data in
prod by writing to `DATABASE_URL` (that's dev). `executeSql(environment:"production")`
is READ-ONLY. The only ways to WRITE prod are things that run *inside* prod:
1. Normal app request paths (routes, Stripe webhook).
2. Startup routines that run on boot — so the change applies on the **next redeploy**.

**How to apply:** For "make X an admin in prod" / "backfill this row in prod",
implement an idempotent startup routine (see `ensureAdmins`, `reconcileDonations`)
and tell the user it takes effect after republishing. Admin allow-list is the
`ADMIN_EMAILS` shared env var (comma-separated); it only promotes existing
accounts, never creates users or resets passwords.

## Stripe donations can be lost even when the event is "in Stripe"
A `checkout.session.completed` handler that inserts `stripe_events` first, then
`donations`, can leave a donation missing if the donations insert transiently
fails (it 500s, Stripe may eventually stop retrying). The Stripe dashboard still
shows the event as received, so "I see it in Stripe events but not the table" =
the second write failed, not a delivery failure.

**Recovery pattern:** `reconcileDonations()` on boot selects
`checkout.session.completed` events in `stripe_events` with no matching
`donations.session_id`, re-fetches each session from Stripe, and inserts
(idempotent via `ON CONFLICT (session_id) DO NOTHING`). Run it **after**
`app.listen` as `void reconcile().catch(...)` with a `LIMIT` cap — never
`await` it before listen, or unbounded Stripe calls delay readiness on Autoscale.
Webhook and reconciler share `donationFromSession`/`recordDonationFromSession`
(lib/donations.ts) so their insert logic can't drift.
