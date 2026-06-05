---
name: software-supply-chain-editorial-decision-adapter
domain_id: software-supply-chain
adapter_for: editorial-decision
description: Domain adapter for approving or publishing software supply-chain control bundles.
---

# Software Supply Chain Editorial Decision Adapter

Use with `skills/editorial-decision/SKILL.md`.

## Read First

- `domain-packs/software-supply-chain/public-copy.v1.json`
- `domain-packs/software-supply-chain/appraisal-lanes.v1.json`
- The target bundle, staged records, comments, and evidence appraisals.

## Domain Rules

- Required lanes are `source_fidelity`, `control_fit`, `risk_framing`, and `operational_boundary`.
- Do not approve claims that imply security guarantees, permanent assurance, or coverage outside the reviewed boundary.
- Request changes when release identity, dependency scope, source locator, or risk interpretation is ambiguous.
- Publication should preserve the boundary between source-backed observations and editorial control interpretation.

## Output Checks

- Approve only when bundle validation and all required appraisal lanes are ready.
- Publish only through `npm run research:bundle -- publish`.
- After publish, verify public navigation from control claim to observation to source.
