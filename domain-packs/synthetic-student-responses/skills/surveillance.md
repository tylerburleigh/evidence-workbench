---
name: synthetic-student-responses-surveillance-adapter
domain_id: synthetic-student-responses
adapter_for: surveillance-update
description: Domain adapter for monitoring new literature about synthetic student responses and automated scoring.
---

# Synthetic Student Responses Surveillance Adapter

Use with `skills/surveillance-update/SKILL.md`.

## Read First

- `domain-packs/synthetic-student-responses/taxonomy.v1.json`
- Existing records for the target review question.
- Latest publication event, research session, or claim update for the target review question.

## Domain Rules

- Scope surveillance to one `review_question`.
- Search for material new studies, datasets, benchmarks, reviews, and model-comparison work since the latest meaningful check.
- Treat preprints and new model announcements as sources only when they contain inspectable study details relevant to the review question.
- Activity about LLM releases does not update a synthesis claim unless a source applies the model to synthetic student response generation or evaluation.
- Preserve negative, mixed, null, or low-quality evidence if it changes the synthesis boundary.

## Output Checks

- New sources are screened against the active review question before extraction.
- Existing claims are updated only when the support map changes.
- No-op sessions explain the search window and why no material update was staged.
- Planning sync is run with `WORKBENCH_DOMAIN=synthetic-student-responses` after the session.
