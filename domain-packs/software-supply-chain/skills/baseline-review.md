---
name: software-supply-chain-baseline-review-adapter
domain_id: software-supply-chain
adapter_for: baseline-review
description: Domain adapter for running one baseline review for software supply-chain control baseline.
---

# Software Supply Chain Baseline Review Adapter

Use with `skills/baseline-review/SKILL.md`.

## Read First

- `domain-packs/software-supply-chain/domain.json`
- `domain-packs/software-supply-chain/taxonomy.v1.json`
- `domain-packs/software-supply-chain/extraction-schema.v1.json`
- `domain-packs/software-supply-chain/evidence-ladder.v1.json`
- `domain-packs/software-supply-chain/appraisal-lanes.v1.json`

## Domain Rules

- Scope unit: `control`.
- Required extraction fields: `component`, `control_signal`, `source_locator`, `review_boundary`, `risk_interpretation`, `limitations`.
- Default appraisal lanes: `source_fidelity`, `control_fit`, `risk_framing`, `operational_boundary`.
- Keep claims bounded to the reviewed release, dependency set, repository, or time window.
- Do not imply security assurance from policy presence, signatures, activity, or maintenance signals alone.

## Output Checks

- Every staged finding has a source locator, reviewed component, control signal, and review boundary.
- Every staged claim includes limitations and support-map entries tied to concrete findings and sources.
- Bundle validation is run with `LIT_REVIEW_STUDIO_DOMAIN=software-supply-chain`.
