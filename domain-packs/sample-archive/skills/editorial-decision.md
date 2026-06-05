---
name: sample-archive-editorial-decision-adapter
domain_id: sample-archive
adapter_for: editorial-decision
description: Domain adapter for approving or publishing sample-archive bundles after required appraisal lanes pass.
---

# Sample Archive Editorial Decision Adapter

Use with `skills/editorial-decision/SKILL.md`.

## Read First

- `domain-packs/sample-archive/public-copy.v1.json`
- `domain-packs/sample-archive/appraisal-lanes.v1.json`
- The target bundle, staged archive records, comments, and evidence appraisals.

## Domain Rules

- Required lanes are `source_fidelity`, `scope_fit`, and `context_boundaries`.
- Do not approve if the claim reads like a broad historical conclusion instead of a bounded archive observation.
- Claims must preserve the locator and context boundary in public-facing text or limitations.
- Request changes instead of approval when source identity, archive item identity, or context boundary is ambiguous.

## Output Checks

- Approve only when bundle validation and all archive appraisal lanes are ready.
- Publish only through `npm run research:bundle -- publish`.
- After publish, verify the public route can navigate from claim to finding to source.
