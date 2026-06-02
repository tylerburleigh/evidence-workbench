---
name: synthetic-student-responses-editorial-review-adapter
domain_id: synthetic-student-responses
adapter_for: editorial-review
description: Domain adapter for final editorial review of synthetic-student-response literature-review bundles.
---

# Synthetic Student Responses Editorial Review Adapter

Use with `skills/editorial-review/SKILL.md`.

## Read First

- Target bundle status and validation report.
- All required evidence-review records.
- Staged synthesis claims, findings, study artifacts, and sources.

## Domain Rules

- Do not publish a synthesis claim if any required review lane is missing or blocking.
- Claims must be useful for a paper background section: concise, source-backed, and explicit about boundaries.
- Keep scorer-validation claims separate from generation-quality claims unless both are supported.
- Mention limitations near conclusions, especially sample size, item type, grade band, subject domain, model version, prompt details, comparator data, and metric choice.
- Avoid field-wide claims when evidence is from one task, one model family, one prompt pattern, or one dataset.

## Output Checks

- The bundle status report is ready before approval.
- Each public claim has concrete supporting findings and sources.
- Support-map rationale explains how the evidence answers the review question.
- Publication is performed through `npm run research:bundle -- publish` with `WORKBENCH_DOMAIN=synthetic-student-responses`.
