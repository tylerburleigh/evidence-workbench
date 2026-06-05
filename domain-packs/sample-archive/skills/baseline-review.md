---
name: sample-archive-baseline-review-adapter
domain_id: sample-archive
adapter_for: baseline-review
description: Domain adapter for running one baseline review for archive-style question scope.
---

# Sample Archive Baseline Review Adapter

Use with `skills/baseline-review/SKILL.md`.

## Read First

- `domain-packs/sample-archive/domain.json`
- `domain-packs/sample-archive/taxonomy.v1.json`
- `domain-packs/sample-archive/extraction-schema.v1.json`
- `domain-packs/sample-archive/evidence-ladder.v1.json`
- `domain-packs/sample-archive/appraisal-lanes.v1.json`
- Existing fixture bundle: `data/candidate-bundles/archive-question-baseline-2026-05-31.json`

## Domain Rules

- Scope unit: `question`.
- Required extraction fields: `archive_item`, `locator`, `observed_property`, `context_boundary`.
- Required appraisal lanes: `source_fidelity`, `scope_fit`, and `context_boundaries`.
- Claims must stay inside the configured question and must not generalize archive observations beyond the locator and context boundary.
- Prefer stable locators over broad source URLs when describing archive material.

## Output Checks

- Staged artifacts preserve archive item identity and source linkage.
- Staged findings include the observed property and context boundary.
- Bundle validation is run with `LIT_REVIEW_STUDIO_DOMAIN=sample-archive`.
