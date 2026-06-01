---
name: sample-research-evidence-review-adapter
domain_id: sample-research
adapter_for: evidence-review
description: Domain adapter for reviewing source fidelity, interpretation, limitations, and taxonomy mapping in sample-research bundles.
---

# Sample Research Evidence Review Adapter

Use with `skills/evidence-review/SKILL.md`.

## Read First

- `domain-packs/sample-research/review-lanes.v1.json`
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

- Review `reviewed_change_ids` covers the staged changes actually inspected.
- `blocking` is true for unresolved source mismatch, unsupported claim, missing limitation, or wrong taxonomy scope.
- Completed reviews are applied with `WORKBENCH_DOMAIN=sample-research`.
