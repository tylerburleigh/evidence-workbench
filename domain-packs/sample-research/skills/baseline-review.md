---
name: sample-baseline-review-adapter
domain_id: sample-research
adapter_for: baseline-review
description: Domain adapter for running one baseline review for neutral sample-research taxonomy topic.
---

# Sample Baseline Review Adapter

Use with `skills/baseline-review/SKILL.md`.

## Read First

- `domain-packs/sample-research/domain.json`
- `domain-packs/sample-research/taxonomy.v1.json`
- `domain-packs/sample-research/extraction-schema.v1.json`
- `domain-packs/sample-research/evidence-ladder.v1.json`
- `domain-packs/sample-research/appraisal-lanes.v1.json`
- Existing sample fixture bundle: `data/candidate-bundles/example-topic-baseline-review-2026-05-31.json`

## Domain Rules

- Scope unit: `topic`.
- Required extraction fields: `subject`, `context`, `endpoint`, `result`, `limitations`.
- Default required appraisal lanes for baseline bundles: `source_fidelity` and `interpretation`.
- Use `limitations` and `taxonomy_mapping` as extra lanes when the staged claim depends on caveats or ambiguous scope.
- Keep the public claim neutral and fixture-like. The sample domain must not imply real-world evidence strength.

## Output Checks

- Every staged finding has a source, taxonomy node, endpoint category, result direction, confidence, and limitations.
- Every staged claim maps to one `taxonomy_node` subject and includes `supporting_evidence`, `supporting_finding_ids`, `supporting_source_ids`, and `limitations`.
- Bundle validation is run with `LIT_REVIEW_STUDIO_DOMAIN=sample-research`.
