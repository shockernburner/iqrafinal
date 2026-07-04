---
name: IQRA "retrain" semantics and confidence gating
description: What "retrain the model" actually means in IQRA, and why answer confidence reaches "high" only with KB grounding
---

IQRA has NO model fine-tuning. The only "training" lever is the `training_records` table, whose rows are injected as few-shot Q&A examples into the prompt. So when a user says "retrain the model", they mean curate/add Q&A rows to that bank (and regenerate the seed JSON so fresh deploys keep them).

**Why:** A user asked to "retrain the model for every answer where confidence isn't high." Reaching for a fine-tuning API is wrong here — it doesn't exist. Adding exemplar Q&A is the intended mechanism.

**How to apply:**
- Answer confidence becomes "high" ONLY when KB retrieval returns ≥1 chunk, regardless of how many training records match. Training records improve answer quality/style and can nudge the LLM's self-assessment when chunks are present, but they cannot lift the medium cap on a zero-chunk question. To make an inherently-uncovered topic reach "high", the fix is KB coverage, not more training rows.
- Retesting the exact same question after storing its own generated answer is somewhat circular (the stored Q&A becomes a near-exact few-shot match); it legitimately raises the LLM's self-confidence, but report it honestly as few-shot enrichment, not fine-tuning.
- Batch retrain/eval scripts that insert into `manual_entries` must be idempotent (delete-then-insert or upsert by question); an interrupted run that inserts before checkpointing its state will otherwise create duplicate rows on rerun.
