---
name: pdf-parse v2 requires @napi-rs/canvas in Node
description: pdf-parse v2 (pdfjs-dist) crashes with "DOMMatrix is not defined" at import time in a plain Node server unless @napi-rs/canvas is installed, even for text-only extraction.
---

`pdf-parse` v2 wraps `pdfjs-dist`, whose module-level code references `DOMMatrix`/`ImageData`/`Path2D` unconditionally, even when only extracting text (no rendering/rasterization).

**Why:** In a bare Node server (no browser, no `canvas` package), those globals don't exist, so importing `pdf-parse` throws `ReferenceError: DOMMatrix is not defined` before any parsing code runs.

**How to apply:** Add `@napi-rs/canvas` as a dependency (no code changes needed — pdfjs-dist auto-detects and uses it for the polyfills) wherever `pdf-parse` v2 is used server-side in Node, e.g. a document ingestion/extraction pipeline.
