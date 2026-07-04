---
name: FTS retrieval with 'simple' tsvector config
description: Why natural-language questions returned zero matches against the knowledge-base search_vector, and how queries must be built
---

The `document_chunks.search_vector` column is generated with `to_tsvector('simple', text)` — the `simple` config does no stemming and no stopword removal.

**Why:** `websearch_to_tsquery`/`plainto_tsquery` AND all tokens of the input. Passing a full user question ("What does Islam teach about honesty in business dealings?") requires every word — including "what", "does", "about" — to appear literally in a single chunk, so retrieval returned zero rows across 21k chunks, which silently capped chat confidence at "medium" (high requires KB grounding).

**How to apply:** When querying a `simple`-config tsvector, extract meaningful keywords from the user input (lowercase, drop stopwords and short tokens) and OR them with `to_tsquery('simple', 'kw1 | kw2 | ...')`, ranking with `ts_rank`. Keep the query config identical to the vector config. If retrieval quality ever needs improving further, consider rebuilding the vector with the `english` config and matching queries to it.
