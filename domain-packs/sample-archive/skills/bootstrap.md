---
name: sample-archive-bootstrap-adapter
domain_id: sample-archive
adapter_for: research-bootstrap
description: Domain adapter for bootstrapping one archive-style question scope.
---

# Sample Archive Bootstrap Adapter

Use with `skills/research-bootstrap/SKILL.md`.

## Read First

- `domain-packs/sample-archive/domain.json`
- `domain-packs/sample-archive/taxonomy.v1.json`
- `domain-packs/sample-archive/extraction-schema.v1.json`
- `domain-packs/sample-archive/evidence-ladder.v1.json`
- `domain-packs/sample-archive/review-lanes.v1.json`
- Existing fixture bundle: `data/candidate-bundles/archive-question-baseline-2026-05-31.json`

## Domain Rules

- Scope unit: `question`.
- Required extraction fields: `archive_item`, `locator`, `observed_property`, `context_boundary`.
- Required review lanes: `source_fidelity`, `scope_fit`, and `context_boundaries`.
- Claims must stay inside the configured question and must not generalize archive observations beyond the locator and context boundary.
- Prefer stable locators over broad source URLs when describing archive material.

## Output Checks

- Staged artifacts preserve archive item identity and source linkage.
- Staged findings include the observed property and context boundary.
- Bundle validation is run with `WORKBENCH_DOMAIN=sample-archive`.
