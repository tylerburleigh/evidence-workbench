---
name: tadalafil-off-label-review-update-adapter
domain_id: tadalafil-off-label
adapter_for: review-update
description: Domain adapter for monitoring new tadalafil off-label evidence and safety updates.
---

# Tadalafil Off-Label Review Update Adapter

Use with `skills/review-update/SKILL.md`.

## Read First

- `domain-packs/tadalafil-off-label/taxonomy.v1.json`
- Existing records for the target review question.
- Latest publication event, research session, claim update, search protocol, or regulatory-label check for the target review question.

## Domain Rules

- Scope the update to one `review_question`.
- Search for new trials, observational studies, systematic reviews, pharmacovigilance signals, prescribing-information changes, and mechanistic studies only when they can materially affect a public claim or its boundaries.
- Treat preprints, conference abstracts, animal studies, and non-tadalafil PDE5-inhibitor sources as lower-directness evidence unless they materially change plausibility or risk interpretation.
- Preserve negative, null, mixed, or safety-limiting evidence if it changes the synthesis boundary.
- Label changes or safety communications can justify an update even without a new benefit study.
- Record review-update searches, databases, dates, screening decisions, and included/excluded sources in a `search_protocol` record when source discovery is performed.

## Output Checks

- New sources are screened against the active review question before extraction.
- Search protocol records link included `source_ids` and document exclusion reasons for screened-but-excluded candidates.
- Existing claims are updated only when the support map, safety boundary, directness interpretation, or confidence changes.
- No-op sessions explain the search window and why no material update was staged.
- Planning sync is run with `LIT_REVIEW_STUDIO_DOMAIN=tadalafil-off-label` after the session.
