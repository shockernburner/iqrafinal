---
name: Orval react-query hook option typing
description: Generated Orval react-query hooks sometimes type-require queryKey in options even though it's supplied internally by the hook wrapper
---

Orval-generated `useXxx` query hooks (via `@workspace/api-client-react` codegen) can produce `UseQueryOptions<...>` types that mark `queryKey` as required, even though the generated hook wrapper supplies `queryKey` internally and callers are only meant to pass `enabled`, `retry`, `refetchInterval`, etc.

**Why:** This is a codegen/type-inference quirk in the generated wrapper types, not a real runtime requirement — omitting `queryKey` at the call site works fine at runtime.

**How to apply:** When `tsc` reports `Property 'queryKey' is missing` on a generated hook's `query: {...}` options object, cast that options object `as any` (e.g. `{ enabled: !!x } as any`) rather than trying to satisfy the type or regenerating the client. Do not use `// @ts-ignore` above a multi-line call — TS attributes the error to the inner line where the offending property sits, not the call line, so the ignore comment silently does nothing.
