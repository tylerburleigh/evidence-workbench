---
name: sample-research-evidence-appraisal-adapter
domain_id: sample-research
adapter_for: evidence-appraisal
description: Domain adapter for appraising source fidelity, interpretation, limitations, and taxonomy mapping in sample-research bundles.
---

# Sample Research Evidence Appraisal Adapter

Use with `skills/evidence-appraisal/SKILL.md`.

## Read First

- `domain-packs/sample-research/appraisal-lanes.v1.json`
- `domain-packs/sample-research/extraction-schema.v1.json`
- `domain-packs/sample-research/evidence-ladder.v1.json`
- The target bundle and staged files.

## Domain Rules

- `source_fidelity`: source metadata, locator, artifact references, and extracted facts must match the cited staged source.
- `interpretation`: the claim summary and support map must not say more than the finding statement supports.
- `limitations`: caveats from the extraction fields must remain visible near the claim.
- `taxonomy_mapping`: all staged records must reference the intended sample topic.
- Use `claim_overreach`, `support_map_gap`, `missing_caveat`, or `taxonomy_mapping` finding categories when those issues appear.

## Output Checks

- Confirm `appraised_change_ids` covers the staged changes actually inspected.
- `blocking` is true for unresolved source mismatch, unsupported claim, missing limitation, or wrong taxonomy scope.
- Completed appraisals are applied with `LIT_REVIEW_STUDIO_DOMAIN=sample-research`.
