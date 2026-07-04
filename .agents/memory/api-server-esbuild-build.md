---
name: Express API server esbuild build
description: esbuild bundling in the pnpm workspace api-server only outputs JS; non-JS runtime files are not carried over automatically
---

The `artifacts/api-server/build.mjs` esbuild pipeline bundles TypeScript/JS into `dist/*.mjs`. It does NOT copy any non-JS files referenced at runtime via relative filesystem paths (e.g. SQL migration files read via `readdir`/`readFile` next to compiled code, or static JSON/data directories).

**Why:** A migration runner that resolves its migrations directory relative to `import.meta.url` will find files in `src/db/migrations` during dev (tsx/ts-node) but get `ENOENT` in the built `dist/` output, because esbuild only emitted the bundled JS — the sibling `migrations/` directory was never copied.

**How to apply:** Whenever an api-server module reads project files at runtime by relative path (migrations, seed data, templates, etc.), add an explicit copy step in `build.mjs` (e.g. `cp` from `src/...` into the matching `dist/...` location) after the esbuild `build()` call. Don't assume esbuild handles anything other than JS/TS entry points and their imports.

This also applies to dependency-internal runtime assets: pdfjs-dist (pulled in by pdf-parse) loads `pdf.worker.mjs` at runtime relative to the bundle, so it must be copied next to `dist/index.mjs` or every PDF ingestion fails with "Setting up fake worker failed". Resolve it via `createRequire(require.resolve("pdf-parse")).resolve("pdfjs-dist")` — it's a transitive dep, so resolving from the api-server package fails.
