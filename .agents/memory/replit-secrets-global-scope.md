---
name: Replit secrets are global (dev + prod share values)
description: Changing a secret "just for a test" also changes it for the published Autoscale app after republish; plan swaps carefully
---

Replit secrets in this project are NOT environment-scoped: there is one value shared by the dev workspace and (at publish time) the production deployment.

**Why:** During the Stripe donate smoke test, swapping `STRIPE_SECRET_KEY` to a test-mode key for a "dev-only" test meant production would also run in test mode if republished — and reverting required requesting the live key again and republishing.

**How to apply:**
- Before temporarily swapping a secret for testing, tell the user it affects production too, and plan the revert immediately.
- Autoscale deployments only pick up secret changes on republish — the already-running prod instance keeps old values until then. After any secret change intended for prod, a republish is required.
