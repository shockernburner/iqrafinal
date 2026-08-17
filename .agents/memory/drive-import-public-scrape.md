---
name: Google Drive knowledge import
description: Why the Drive import scrapes public folder views instead of using the connector API, and its operational caveats
---

**Rule:** The Replit Google Drive connector for this project is granted only `drive.file` + `documents` scopes — it CANNOT list or download arbitrary user folders (API returns empty lists, not errors). The knowledge import therefore reads *publicly shared* folders via `https://drive.google.com/embeddedfolderview?id=...` HTML scraping and `uc?export=download` for file bytes.

**Why:** Verified empirically: proxied `files.list` with the folder id returned `{files: []}` while the public embedded view listed everything. Public downloads work without auth; the virus-scan interstitial must be confirmed via its form, with the form action restricted to Google download hosts (SSRF guard — a public HTML file's own form could otherwise redirect fetches anywhere).

**How to apply:**
- Folder must be shared "Anyone with the link can view" or the import finds 0 files.
- Import state is in-memory (single job) — lost on server restart/redeploy; safe to re-run because sha256 dedupe skips already-imported files. On Autoscale prod, a long import can be killed mid-run — re-run to resume.
- Large libraries (tens of thousands of small PDFs) take hours; sequential by design to keep memory flat and the ingestion queue orderly.
- `.html` knowledge files: an HTML response body may be the file itself, not the interstitial — the downloader takes the extension into account.
