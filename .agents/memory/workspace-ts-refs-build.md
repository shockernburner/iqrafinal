---
name: Workspace lib packages need tsc -b after wiring refs
description: Composite/emitDeclarationOnly lib packages have no build script; build them with `pnpm exec tsc -b lib/<pkg>` or dependent packages fail typecheck with TS6305.
---

Lib packages in this monorepo (e.g. `lib/integrations-anthropic-ai`) use `composite: true` + `emitDeclarationOnly` tsconfigs and have NO `build` script in package.json.

**Why:** After adding one as a dependency + tsconfig reference, dependent packages fail `tsc --noEmit` with `TS6305: Output file .../dist/index.d.ts has not been built from source file...` until declarations exist. Without the d.ts, imported types also degrade to `any` (TS7006 errors under noImplicitAny).

**How to apply:** Run `pnpm exec tsc -b lib/<package-dir>` from the repo root once after wiring a new lib package reference. `pnpm --filter <pkg> run build` won't work (no script).

Related quirk: `npx tsx -e "<code>"` compiles the eval string as CJS — top-level `await` fails ("Top-level await is currently not supported with the cjs output format"). Wrap eval snippets in an async IIFE.
