---
name: IQRA Assistant deployed on Autoscale (not Reserved VM)
description: Production deployment decision — user chose Autoscale over Reserved VM despite the in-process background ingestion worker needing an always-on process.
---

The app has an in-process background ingestion worker (polls a jobs table every 5s, extracts/chunks uploaded documents). This pattern needs an always-on process to be reliable.

**Why:** The user explicitly chose to deploy on **Autoscale** instead of **Reserved VM** to save cost at low traffic ("will go with autoscale till we have more clients"), accepting that the worker resets on cold starts / idle spin-down and may not process every queued document promptly.

**How to apply:** Don't "fix" this by silently changing deployment type — it was a conscious tradeoff. If asked to make ingestion more reliable, the correct fix is prompting the user to switch to Reserved VM in the Publish UI (not a code change) once they're ready to scale up.
