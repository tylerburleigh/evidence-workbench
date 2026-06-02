---
name: synthetic-student-responses-evidence-review-adapter
domain_id: synthetic-student-responses
adapter_for: evidence-review
description: Domain adapter for reviewing source fidelity, construct mapping, method classification, scorer relevance, and synthesis boundaries.
---

# Synthetic Student Responses Evidence Review Adapter

Use with `skills/evidence-review/SKILL.md`.

## Read First

- `domain-packs/synthetic-student-responses/review-lanes.v1.json`
- `domain-packs/synthetic-student-responses/extraction-schema.v1.json`
- `domain-packs/synthetic-student-responses/evidence-ladder.v1.json`
- The target bundle and staged files.

## Domain Rules

- `source_fidelity`: verify bibliographic metadata, study details, metrics, and source locators against the cited source.
- `construct_mapping`: block records that blur real versus synthetic response origin, correct versus incorrect rubric labels, human labels, AI labels, and generated target labels.
- `method_classification`: verify generation model, prompt strategy, generation workflow, response type, evaluation method, and reported metrics.
- `scorer_validation_relevance`: distinguish automated scorer validation, calibration, benchmarking, or stress testing from unrelated synthetic-data generation.
- `synthesis_overreach`: reject claims that generalize beyond the item type, subject, grade band, rubric, model, prompt, comparator, or metric studied.
- Use categories such as `source_mismatch`, `construct_conflation`, `method_misclassification`, `missing_comparator`, `scorer_relevance_gap`, `metric_overreach`, or `claim_overreach`.

## Output Checks

- `blocking` is true for unresolved source mismatch, construct conflation, unsupported scorer-validation relevance, or overbroad synthesis.
- `reviewed_change_ids` covers all staged changes inspected by the lane.
- Completed reviews are applied with `WORKBENCH_DOMAIN=synthetic-student-responses`.
