---
name: Express sub-router mounting and router-level auth middleware
description: Why sub-routers with router-level auth must be mounted with a path prefix, not bare router.use(subRouter)
---

Rule: never mount a sub-router that has router-level auth middleware (`router.use(authMw)`) via a bare `parent.use(subRouter)`. Mount it with an explicit prefix: `parent.use("/admin", adminRouter)` and strip the prefix from the routes inside.

**Why:** A bare `parent.use(subRouter)` matches ALL paths, so the sub-router's `router.use(attachUser, requireAdmin)` middleware ran for every `/api/*` request — it silently 403'd unrelated endpoints (donate, voice) for non-admin users. The routes inside still had full paths like `/admin/overview`, so the sub-router never *handled* other paths, but its middleware still executed for them.

**How to apply:** When adding any protected sub-router, mount it with its path prefix and define routes inside relative to that prefix. When debugging mystery 401/403s on unrelated endpoints, check for unprefixed sub-router mounts with router-level middleware.
