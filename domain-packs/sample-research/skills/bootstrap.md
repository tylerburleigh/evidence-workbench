---
name: sample-research-bootstrap-adapter
domain_id: sample-research
adapter_for: research-bootstrap
description: Domain adapter for bootstrapping one neutral sample-research taxonomy topic.
---

# Sample Research Bootstrap Adapter

Use with `skills/research-bootstrap/SKILL.md`.

## Read First

- `domain-packs/sample-research/domain.json`
- `domain-packs/sample-research/taxonomy.v1.json`
- `domain-packs/sample-research/extraction-schema.v1.json`
- `domain-packs/sample-research/evidence-ladder.v1.json`
- `domain-packs/sample-research/review-lanes.v1.json`
- Existing sample fixture bundle: `data/candidate-bundles/example-topic-bootstrap-2026-05-31.json`

## Domain Rules

- Scope unit: `topic`.
- Required extraction fields: `subject`, `context`, `endpoint`, `result`, `limitations`.
- Default required review lanes for baseline bundles: `source_fidelity` and `interpretation`.
- Use `limitations` and `taxonomy_mapping` as extra lanes when the staged claim depends on caveats or ambiguous scope.
- Keep the public claim neutral and fixture-like. The sample domain must not imply real-world evidence strength.

## Output Checks

- Every staged finding has a source, taxonomy node, endpoint category, result direction, confidence, and limitations.
- Every staged claim maps to one `taxonomy_node` subject and includes `supporting_evidence`, `supporting_finding_ids`, `supporting_source_ids`, and `limitations`.
- Bundle validation is run with `WORKBENCH_DOMAIN=sample-research`.
