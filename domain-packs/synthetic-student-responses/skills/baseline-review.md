---
name: synthetic-student-responses-baseline-review-adapter
domain_id: synthetic-student-responses
adapter_for: baseline-review
description: Domain adapter for running one baseline review for literature-review question about synthetic student responses.
---

# Synthetic Student Responses Baseline Review Adapter

Use with `skills/baseline-review/SKILL.md`.

## Read First

- `domain-packs/synthetic-student-responses/domain.json`
- `domain-packs/synthetic-student-responses/taxonomy.v1.json`
- `domain-packs/synthetic-student-responses/extraction-schema.v1.json`
- `domain-packs/synthetic-student-responses/evidence-ladder.v1.json`
- `domain-packs/synthetic-student-responses/appraisal-lanes.v1.json`

## Domain Rules

- Scope unit: `review_question`.
- Required extraction fields: `education_context`, `response_origin`, `rubric_label_space`, `label_source`, `generation_method`, `assessment_purpose`, `decision_consequence`, `operational_use`, `evaluation_method`, `scorer_use`, `real_response_comparator`, `limitations`, `source_locator`.
- Keep `response_origin` separate from `rubric_label_space`; real/synthetic is not the same construct as correct/incorrect.
- Record whether labels come from humans, generated targets, model judgments, datasets, or adjudication.
- Classify scorer use as training, augmentation, validation, calibration, benchmarking, stress testing, or not scorer-facing.
- Classify assessment purpose, decision consequence, and operational use separately; formative/summative purpose is not the same as low/high stakes consequence.
- Capture prompt ingredients and model version when reported, but do not infer unreported prompts or model settings.
- For literature searches, stage a `search_protocol` record with queries, databases, inclusion/exclusion criteria, screening decisions, deduplication notes, and included source IDs. Prefer `npm run research:search -- scaffold` and `npm run research:search -- screen` so deferred and excluded sources are captured consistently.
- Use structured `source_locator` objects for findings when possible: section, page or table, URL, verification status, and a short paraphrase note.
- Use support roles deliberately in claim support maps: `direct_support`, `boundary_condition`, `adjacent_evidence`, `counterexample`, or `background`.

## Output Checks

- Every staged study artifact identifies the educational context, response origin, label source, generation method, assessment purpose, decision consequence, operational use, evaluation method, scorer use, and real-response comparator.
- Every staged finding includes a source locator and states exactly what the study reports.
- Search and screening work is captured in a staged `search_protocol` record when the bundle is based on a search pass.
- Every staged synthesis claim includes limitations and support-map entries tied to concrete findings and sources.
- Bundle validation is run with `LIT_REVIEW_STUDIO_DOMAIN=synthetic-student-responses`.
