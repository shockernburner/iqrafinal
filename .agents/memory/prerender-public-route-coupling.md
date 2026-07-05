---
name: Prerendered public route coupling
description: The three places that must change in lockstep to add a crawlable public page to iqra-assistant.
---

Adding a new anonymous/public page that must be SEO-crawlable and served correctly in production requires changes in THREE files in lockstep:

1. `src/App.tsx` — add a `<Route>` (client-side routing).
2. `src/entry-server.tsx` — add a `PRERENDER_ROUTES` entry (`path`, `outFile`, title/description/robots/canonicalPath, `Component`). This generates a static prerendered HTML shell at build time.
3. `.replit-artifact/artifact.toml` — add a `[[services.production.rewrites]]` mapping `from = "/<path>"` → `to = "/<path>/index.html"`, placed BEFORE the catch-all `from = "/*"` rewrite. Edit via the `verifyAndReplaceArtifactToml` flow (direct edits are blocked).

**Why:** The static host serves prerendered per-route HTML only if the rewrite points at the generated `outFile`; without it the SPA catch-all serves the generic shell (crawlers see wrong title/meta). Without the PRERENDER_ROUTES entry, no static file is generated at all.

**How to apply:** Any pages that fetch live data still render defaults/empty during SSR (query hooks don't fetch under `renderToStaticMarkup`), so ensure components have sensible no-data fallbacks.
