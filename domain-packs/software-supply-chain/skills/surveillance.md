---
name: software-supply-chain-surveillance-adapter
domain_id: software-supply-chain
adapter_for: surveillance-update
description: Domain adapter for refreshing one software supply-chain control baseline.
---

# Software Supply Chain Surveillance Adapter

Use with `skills/surveillance-update/SKILL.md`.

## Read First

- `domain-packs/software-supply-chain/taxonomy.v1.json`
- `domain-packs/software-supply-chain/extraction-schema.v1.json`
- `domain-packs/software-supply-chain/review-lanes.v1.json`
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`

## Domain Rules

- Check one `control` at a time.
- Material changes include new release provenance, changed dependency exposure, new advisory context, changed maintenance policy, or stale coverage.
- Activity-only events do not change a control claim unless a source-backed finding changes.
- Evidence updates must restate the component, control signal, source locator, review boundary, risk interpretation, and limitations.

## Output Checks

- No-op surveillance records the checked window and control.
- Activity-only records do not upgrade the claim stage.
- Evidence-update bundles require all default review lanes.
