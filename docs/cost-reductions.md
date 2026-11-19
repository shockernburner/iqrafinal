# IQRA cost reductions (November 2026)

IQRA is funded by donations, so the approach is: **take the cheapest improvement that works within the current setup** (Replit + Postgres + Claude through Replit's AI integration), and only pay for bigger infrastructure once donations allow.

## Result at a glance

Almost all of the running cost is Claude answering questions. Per question:

| | Cost per question | Change |
|---|---|---|
| Before (Claude Sonnet 4.6) | $0.0342 | — |
| After the model switch (Claude Sonnet 5.5) | $0.0311 | −9% |
| After the model switch + prompt caching | **$0.0274** | **−20% overall** |

What that means for the 3-month launch budget (from `outputs/IQRA_AppStore_Launch_Budget_3mo.xlsx`, including hosting, store fees and a 10% buffer):

| What "1,000 / 2,000 / 4,000 users" means | Before | After | Saved |
|---|---|---|---|
| People online at the same moment (peak) | $404.7k | **$324.9k** | **$79.8k (−20%)** |
| Monthly active users (~1 question a day each) | $8.9k | **$7.3k** | **$1.6k (−18%)** |

## What was done

### 1. Switched Claude Sonnet 4.6 → Claude Sonnet 5.5 (live)
- **Price:** $2/$10 per million tokens instead of $3/$15.
- **The real saving is ~9%, not 33%.** The newer model counts the same text as about 30% more tokens.
- **Fast, cheap answers:** set to "low" effort, which skips extra thinking on most questions.
- **Automatic fallback:** if Replit ever stops offering 5.5, or 5.5 declines a question, the app falls back to Claude Sonnet 5 at the same price.
- **Confirmed** in Replit's logs: `Answered with claude-sonnet-5-5`.
- PR [#6](https://github.com/shockernburner/iqrafinal/pull/6).

### 2. Prompt caching (merged, live after the current republish)
- **The fixed instructions are cached.** They're sent with every question (about 2,000 tokens), so Claude now keeps them in its cache. Later questions read them for $0.10 per million tokens instead of $2.
- **Saving:** about 12% per question, plus slightly faster answers.
- **No downside:** if Replit doesn't pass caching through, nothing breaks; it just costs the same as before.
- **To confirm on Replit:** ask two questions within 5 minutes. In the logs, the second `Answered with` line should show `cache_read_input_tokens` of about 2,000.
- PR [#9](https://github.com/shockernburner/iqrafinal/pull/9).

### 3. Faster knowledge search, with no new service (live)
- **The fix:** search for chunks containing *all* keywords first, and use the slower *any*-keyword search only if needed.
- **Speed:** measured at ~540 ms → ~2 ms per typical question at 5× today's knowledge base.
- **Paid upgrades avoided:**
  - Elasticsearch, which would be a separate paid service (~$100+/month) with data to keep in sync.
  - A bigger database to cope with the 60 GB import.
- **Bonus:** fixed Bengali (and voweled Arabic) questions, which were never searching the knowledge base.
- PR [#7](https://github.com/shockernburner/iqrafinal/pull/7).

### 4. Usage logging to keep the budget honest (live)
- **What's logged:** each answer writes the model used and its token counts to the server log. You see it in Replit → Deployments → Logs; users never do.
- **Why it matters:** after a day of real traffic, the budget can be recalculated from actual usage instead of estimates.
- PRs [#8](https://github.com/shockernburner/iqrafinal/pull/8) and [#9](https://github.com/shockernburner/iqrafinal/pull/9).

### 5. Earlier cost-saving choices still in place
- **Uploaded originals are deleted after indexing.** Only the searchable text is kept, so file storage stays near zero.
- **The founder video costs nothing to host.** It's served from YouTube/Vimeo, and the player only loads when a visitor presses play.
- **The admin knowledge-base list shows 50 documents at a time.** This fixed the admin page freezing with ~28,800 documents, without a bigger server.

### 6. Bengali and Arabic questions use the English library cheaply
- **The problem:** the knowledge base is in English, so non-English questions found nothing in it and were answered from Claude's general knowledge.
- **The fix:** each Bengali or Arabic question is first turned into English search keywords by Claude's smallest model, for **about $0.0005 per question** (~2% of an answer).
- **Cost avoided:** this replaces a paid meaning-based (embeddings) search service.

## Deliberately deferred (paid, for when donations allow)

| Upgrade | Why it's deferred | Rough cost |
|---|---|---|
| Elasticsearch | The Postgres search fix covers the need | ~$100+/month |
| Meaning-based search (embeddings) | Would need a paid embeddings service | Usage-based |
| OCR for scanned books | Only needed if many scanned PDFs are in the 60 GB | Per page |
| Bigger always-on server | Reserved VM only needed for the 60 GB import month | ~$50/month during import |

## Next cheapest levers (not done yet)
1. **Daily free-question cap per user.** The most direct control on the AI bill in busy months.
2. **Claude Haiku 5.5 for simple questions.** About 95% cheaper per question, but needs a quality test first.
3. **Replit Core on annual billing.** 10% off ($18 vs $20/month).

*Figures are from the launch budget workbook and Anthropic/Replit list prices as of November 2026. AI costs depend most on how many questions are asked; recheck against the token counts in the logs once real traffic arrives.*
