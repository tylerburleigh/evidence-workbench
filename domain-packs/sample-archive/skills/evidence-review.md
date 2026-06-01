---
name: sample-archive-evidence-review-adapter
domain_id: sample-archive
adapter_for: evidence-review
description: Domain adapter for reviewing archive source fidelity, scope fit, and context boundaries.
---

# Sample Archive Evidence Review Adapter

Use with `skills/evidence-review/SKILL.md`.

## Read First

- `domain-packs/sample-archive/review-lanes.v1.json`
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
- Completed reviews are applied with `WORKBENCH_DOMAIN=sample-archive`.
