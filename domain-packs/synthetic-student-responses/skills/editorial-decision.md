---
name: synthetic-student-responses-editorial-decision-adapter
domain_id: synthetic-student-responses
adapter_for: editorial-decision
description: Domain adapter for final editorial decision of synthetic-student-response literature-review bundles.
---

# Synthetic Student Responses Editorial Decision Adapter

Use with `skills/editorial-decision/SKILL.md`.

## Read First

- Target bundle status and validation report.
- All required evidence-appraisal records.
- Staged synthesis claims, findings, study artifacts, and sources.

## Domain Rules

- Do not publish a synthesis claim if any required appraisal lane is missing or blocking.
- Claims must be useful for a paper background section: concise, source-backed, and explicit about boundaries.
- Keep scorer-validation claims separate from generation-quality claims unless both are supported.
- Keep formative, summative, low-stakes, and high-stakes use boundaries explicit; do not let low-stakes development evidence support high-stakes deployment claims without direct support.
- Mention limitations near conclusions, especially sample size, item type, grade band, subject domain, model version, prompt details, comparator data, and metric choice.
- Avoid field-wide claims when evidence is from one task, one model family, one prompt pattern, or one dataset.

## Output Checks

- The bundle status report is ready before approval.
- Each public claim has concrete supporting findings and sources.
- Support-map rationale explains how the evidence answers the review question.
- Publication is performed through `npm run research:bundle -- publish` with `LIT_REVIEW_STUDIO_DOMAIN=synthetic-student-responses`.
