---
name: Publish-safe expression indexes
description: Avoiding malformed Replit Publish schema diffs for PostgreSQL expression indexes.
---

Avoid PostgreSQL indexes whose key expression contains a multiline `CASE` when the schema must flow through Replit Publish. Prefer an existing simple composite index; if the expression must be indexed, materialize it as a generated column and index that column.

**Why:** Publish introspection correctly observed a valid development expression ending in `END`, but its generated development-to-production diff emitted `EN DESC`, so validation failed before production was modified.

**How to apply:** Before publishing a new expression index, inspect the computed schema diff. If serialization changes the expression, remove the optional index from development or replace it with a generated-column design through the normal development-schema and Publish flow.