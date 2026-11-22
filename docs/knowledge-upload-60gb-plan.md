# Knowledge base: uploading 60 GB in one month

Prepared 18 Nov 2026 against the code on `main` and Replit's published pricing and limits.
Search timings were measured on a local Postgres with synthetic text that mimics real word frequencies (details at the end).

## Verdict

**The current setup can hold 60 GB, but four things should change first:**
1. The search query: it is the biggest risk once real traffic arrives.
2. The deployment type: move off Autoscale for the import month.
3. Scanned PDFs: they will fail silently.
4. Upload by Drive folder, not the browser.

Storage space and storage cost are not a concern.

## What 60 GB turns into

| | Today (July import) | After +60 GB (estimate) |
|---|---|---|
| Source files | ~4.5 GB | ~64.5 GB |
| Searchable text chunks | ~58,000 | **~830,000** (≈12,900 chunks per GB of PDFs) |
| Database size (text + search index) | ~0.4 GB | **~5.5 GB** |
| Original files kept in storage | none (deleted after indexing) | none |

- **Replit's limit is 100 GiB per production database** on paid plans ([docs](https://docs.replit.com/billing/about-usage-based-billing)), so 5.5 GB is well inside it.
- **Storage costs about $0.35 per GiB per month**, so roughly **$2/month** extra ([Aug 2026 price update](https://docs.replit.com/billing/aug-cloud-billing-updates)).
- **Originals don't pile up.** They are deleted from file storage once indexed, so file storage stays near zero.
- **Assumption:** these estimates assume your new PDFs are like the July batch (mostly real text). Arabic/Bengali-heavy or very dense books will add more chunks per GB.

## Constraints, in order of impact

### 1. Search gets ~13× slower: ✅ fixed (Nov 2026, all-keywords-first search)
For every question, the assistant searches all chunks for *any* of the question's keywords and scores every match. The work grows with the size of the knowledge base.

| Search per question (fast laptop, data cached) | 58k chunks (today) | 290k chunks (measured) | ~830k chunks (projected) |
|---|---|---|---|
| Specific question (rare words) | 20 ms | 136 ms | ~0.4 s |
| Typical question | 300 ms | 540 ms | **~1.5 s** |
| Question with common words | 150 ms | 710 ms | **~2 s** |

- **Production will be slower than this.** Replit's database is slower than a laptop with everything in memory.
- **It adds up under load.** At 1,000+ people chatting at once, several searches start every second, and 1.5–2 s each would overload the database and slow every answer.
- **Fix: search for *all* keywords first, and fall back to *any* keyword only when that finds fewer than 6 matches.** Measured at 290k chunks:
  - Typical question: **540 ms → 2 ms**
  - Common-word question: **710 ms → 210 ms**
  - Answers usually get *more* relevant, since chunks containing every keyword rank first.
- **Effort:** a small change in `artifacts/api-server/src/lib/retrieval.ts`.

### 2. Autoscale is the wrong deployment type for a bulk import
- **The import pauses when nobody is using the app.** `.replit` says the app is deployed as **Autoscale**, which goes idle after 15 minutes without visitors. Indexing runs inside the server process, so an idle server indexes nothing. The import would only progress while people are using the app.
- **The Drive import can be lost on restart.** Its progress is kept in memory, so a restart loses the import job. Re-running it is safe, because files already imported are skipped.
- **Recommendation: switch to a Reserved VM for the import month.**
  - Dedicated **2 vCPU / 8 GB costs about $50/month** ([pricing](https://docs.replit.com/billing/deployment-pricing)).
  - It keeps indexing running around the clock, and 8 GB of memory leaves room to read large PDFs.
  - Switch back to Autoscale afterwards if traffic is low.
  - Check which type is live in Replit → Deployments; `replit.md` assumes a Reserved VM.
  - Before switching, deploy the stability fix and follow the steps in [reserved-vm-audit.md](reserved-vm-audit.md).

### 3. Scanned PDFs (images of pages) will fail
- **There is no OCR.** A PDF without a text layer fails with "No extractable text was found" and is never searchable. Many classical Islamic texts circulate as scans, so this could affect a big share of 60 GB.
- **Before uploading, spot-check a sample:** if you can't select text in the PDF, it's a scan.
- **Options for scans:**
  - (a) OCR them before uploading (e.g. Adobe Acrobat or ABBYY, which handle Arabic and Bengali).
  - (b) Add an OCR step to the indexer later (a larger change, with per-page cost).
- **After the import,** the Knowledge Base tab lists failed documents.

### 4. Upload by Google Drive folder, not the browser
- **The browser upload is impractical at this size:** it takes at most 50 files / 50 MB per batch, so 60 GB would need over 1,200 manual batches.
- **Use Admin → Knowledge Base → Import from Drive with a public ("anyone with the link") folder.** It downloads 4 files at a time, skips duplicates and copes with Google's rate limits. One run can take up to 100,000 files and subfolders 6 levels deep.
- **Files over 50 MB are skipped.** That limit is the `MAX_KNOWLEDGE_UPLOAD_BYTES` setting. Either split large books, or raise the limit to 100 MB once on the 8 GB VM; every file is held in memory while it's read.
- **Import in chunks of about 5–10 GB per folder** rather than one 60 GB folder. A restart then costs little, and you can check the failed count between batches.

### 5. The admin document list will get heavy
- **Every document is sent to the browser in one response.** The Knowledge Base table already shows 50 at a time with search (fixed in Nov), but the server still sends all documents at once.
- **At 28,800 documents that's roughly 12 MB;** at 100,000+ it will make the admin tab slow to open.
- **Recommendation:** move paging and search to the server. This is a moderate change, not urgent until the list is about 4× today's.

### 6. Indexing speed: measure on the first batch
- **Speed depends on the PDFs**, mainly page count and text density. One indexer runs per server and processes one file at a time.
- **Rule of thumb:** a 2-vCPU VM should index tens of GB per day for text PDFs, so 60 GB is days, not weeks.
- **Measure after your first 5 GB folder** using the Knowledge Files Indexed counter in the admin dashboard.
- **If it's too slow,** the next step is letting one server index 2–3 files at once (a small code change).

### What does *not* need to change
- **Costs per question:** the assistant always sends the same 6 best chunks to Claude, so a bigger library doesn't increase cost per answer.
- **Duplicates:** files are fingerprinted (SHA-256), so re-importing a folder never creates copies.
- **Upload security:** only the designated uploaders, with the second password, can import.

## Recommended order for the month
1. ~~Apply the search fix (constraint 1)~~ (done) and switch to a Reserved VM (constraint 2).
2. Spot-check the 60 GB for scans; OCR or set aside image-only PDFs.
3. Split into 5–10 GB Drive folders; import the first one and measure indexing speed.
4. Import the rest, checking failed documents after each folder.
5. Once done, decide whether to stay on the Reserved VM, based on chat traffic.

## How the search numbers were measured
- **Data:** a local Postgres 18 with the production `document_chunks` table definition and the same full-text-search setup and index. Chunks were ~430 words, drawn from a 20,000-word vocabulary with a natural (Zipf) frequency curve, matching the 2,600-character production chunks.
- **Queries:** the production query, timed with `EXPLAIN ANALYZE` (median of three warm runs) at 58k and 290k chunks. The 830k figures are a straight-line projection.
- **Not tested at full size:** the full 830k set wasn't generated because the machine had only 14 GB of free disk.
- **Real-text caveat:** real text has more repeated phrases than synthetic text, so treat these as guides to scale, not exact production numbers.
