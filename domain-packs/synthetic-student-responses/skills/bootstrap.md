---
name: synthetic-student-responses-bootstrap-adapter
domain_id: synthetic-student-responses
adapter_for: research-bootstrap
description: Domain adapter for bootstrapping one literature-review question about synthetic student responses.
---

# Synthetic Student Responses Bootstrap Adapter

Use with `skills/research-bootstrap/SKILL.md`.

## Read First

- `domain-packs/synthetic-student-responses/domain.json`
- `domain-packs/synthetic-student-responses/taxonomy.v1.json`
- `domain-packs/synthetic-student-responses/extraction-schema.v1.json`
- `domain-packs/synthetic-student-responses/evidence-ladder.v1.json`
- `domain-packs/synthetic-student-responses/review-lanes.v1.json`

## Domain Rules

- Scope unit: `review_question`.
- Required extraction fields: `education_context`, `response_origin`, `rubric_label_space`, `label_source`, `generation_method`, `evaluation_method`, `scorer_use`, `real_response_comparator`, `limitations`, `source_locator`.
- Keep `response_origin` separate from `rubric_label_space`; real/synthetic is not the same construct as correct/incorrect.
- Record whether labels come from humans, generated targets, model judgments, datasets, or adjudication.
- Classify scorer use as training, augmentation, validation, calibration, benchmarking, stress testing, or not scorer-facing.
- Capture prompt ingredients and model version when reported, but do not infer unreported prompts or model settings.
- For literature searches, stage a `search_protocol` record with queries, databases, inclusion/exclusion criteria, screening decisions, deduplication notes, and included source IDs.

## Output Checks

- Every staged study artifact identifies the educational context, response origin, label source, generation method, evaluation method, scorer use, and real-response comparator.
- Every staged finding includes a source locator and states exactly what the study reports.
- Search and screening work is captured in a staged `search_protocol` record when the bundle is based on a search pass.
- Every staged synthesis claim includes limitations and support-map entries tied to concrete findings and sources.
- Bundle validation is run with `WORKBENCH_DOMAIN=synthetic-student-responses`.
