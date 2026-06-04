---
name: sample-research-editorial-decision-adapter
domain_id: sample-research
adapter_for: editorial-decision
description: Domain adapter for approving or publishing sample-research bundles after evidence gates pass.
---

# Sample Research Editorial Decision Adapter

Use with `skills/editorial-decision/SKILL.md`.

## Read First

- `domain-packs/sample-research/public-copy.v1.json`
- `domain-packs/sample-research/appraisal-lanes.v1.json`
- The target bundle, staged files, editorial comments, and evidence appraisals.

## Domain Rules

- Required baseline lanes are `source_fidelity` and `interpretation`.
- Public wording must remain neutral and explicitly scoped to the sample topic.
- Claims must include limitations before approval.
- If optional `limitations` or `taxonomy_mapping` appraisals were requested, treat them as required for that revision.

## Output Checks

- Approve only when bundle validation and evidence-appraisal gates are ready.
- Publish only through `npm run research:bundle -- publish`.
- After publish, verify the public route can navigate from claim to finding to source.
