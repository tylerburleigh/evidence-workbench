---
name: sample-archive-evidence-appraisal-adapter
domain_id: sample-archive
adapter_for: evidence-appraisal
description: Domain adapter for reviewing archive source fidelity, scope fit, and context boundaries.
---

# Sample Archive Evidence Appraisal Adapter

Use with `skills/evidence-appraisal/SKILL.md`.

## Read First

- `domain-packs/sample-archive/appraisal-lanes.v1.json`
- `domain-packs/sample-archive/extraction-schema.v1.json`
- `domain-packs/sample-archive/evidence-ladder.v1.json`
- The target bundle and staged archive records.

## Domain Rules

- `source_fidelity`: archive source metadata, locator, and observed property must match the staged source and artifact.
- `scope_fit`: the claim must answer only the configured archive question.
- `context_boundaries`: context boundaries must be explicit in the finding, claim, and limitations.
- Use `source_mismatch`, `endpoint_boundary`, `missing_caveat`, `taxonomy_mapping`, or `claim_overreach` categories as appropriate.

## Output Checks

- All three required lanes are complete before editorial approval.
- `blocking` is true for unresolved locator mismatch, question-scope drift, or missing context boundary.
- Completed appraisals are applied with `LIT_REVIEW_STUDIO_DOMAIN=sample-archive`.
