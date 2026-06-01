---
name: software-supply-chain-evidence-review-adapter
domain_id: software-supply-chain
adapter_for: evidence-review
description: Domain adapter for reviewing source fidelity, control fit, risk framing, and operational boundaries.
---

# Software Supply Chain Evidence Review Adapter

Use with `skills/evidence-review/SKILL.md`.

## Read First

- `domain-packs/software-supply-chain/review-lanes.v1.json`
- `domain-packs/software-supply-chain/extraction-schema.v1.json`
- `domain-packs/software-supply-chain/evidence-ladder.v1.json`
- The target bundle and staged files.

## Domain Rules

- `source_fidelity`: verify source locators, version references, artifact metadata, and extracted observations.
- `control_fit`: confirm the staged records match the intended control node.
- `risk_framing`: reject guarantees or broad assurance language not supported by the observations.
- `operational_boundary`: confirm release, dependency, repository, and time-window boundaries are visible.
- Use `source_mismatch`, `endpoint_boundary`, `interpretation_overreach`, `missing_caveat`, `taxonomy_mapping`, or `claim_overreach` categories as appropriate.

## Output Checks

- `blocking` is true for unresolved source mismatch, wrong control scope, missing operational boundary, or overbroad risk language.
- `reviewed_change_ids` covers all staged changes inspected by the lane.
- Completed reviews are applied with `WORKBENCH_DOMAIN=software-supply-chain`.
