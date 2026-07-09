---
name: Multilingual chat (respond in user's language)
description: How IQRA chat mirrors the user's input language end-to-end, and the one path that needs runtime translation.
---

# Multilingual chat

The assistant reads any language and answers in the same language.

**How it works:** the Claude `SYSTEM_PROMPT` ("Language Protocol") instructs the model to detect the question's language and write every user-facing field in it — including the section labels (framework heading, clarifying-question lead-in, scholar-referral note) that the server used to hardcode in English. Those labels now come back as JSON fields and are consumed by the markdown composer.

**Why the labels moved into model output:** the server composes `directAnswer` markdown with fixed scaffolding. If that scaffolding stays English while the answer is (say) Arabic, the bubble is mixed-language. Making the model emit localized labels is the only way to cover arbitrary languages without a translation table. English `DEFAULT_*` constants remain as a resilience fallback only.

**The gotcha — deterministic paths don't auto-translate.** The comparative-religion refusal is a fixed English string returned WITHOUT calling the main generation model. Its trigger is an English-only regex, so it only fires on prompts containing English trigger words — which can still be embedded in an otherwise non-English sentence. To keep language parity, that refusal is run through a cheap dedicated Claude translation call (`localizeMessage`) whose content we supply (model only translates), with English fallback on error. **How to apply:** any future deterministic/canned response added to the chat path must be routed through `localizeMessage` too, or it will leak English into a non-English conversation.

**Known limitation (accepted):** retrieval FTS is over an English-only KB, so non-English questions retrieve nothing and confidence caps at "medium" — the answer still comes from the model's classical knowledge, just ungrounded. Cross-lingual retrieval (translate query → English keywords) was intentionally left out of scope.
