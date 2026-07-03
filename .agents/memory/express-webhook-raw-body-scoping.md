---
name: Express raw-body middleware must be scoped to the exact webhook path
description: Mounting express.raw() on a shared prefix (e.g. /api) to support webhook signature verification silently breaks express.json() parsing for every other route under that prefix.
---

Webhook signature verification (Stripe, etc.) requires the raw request body, so `express.raw()` must run before the global `express.json()` body parser.

**Why:** Body parsers set an internal "already parsed" flag on the request once they've consumed the stream. If `express.raw()` is mounted on a shared prefix like `app.use("/api", express.raw(...), webhookRouter)`, it consumes and marks the body for *every* request under `/api`, not just the webhook route — so `express.json()` silently no-ops for all other routes and `req.body` stays an unparsed Buffer instead of a parsed object (Zod validation then fails with "Required" errors for fields that were actually sent).

**How to apply:** Scope the raw-body middleware to the exact webhook path only, e.g. `app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), webhookRouter)`, mounted before the global `express.json()`. Never attach raw-body parsing to a prefix shared with other JSON routes.
