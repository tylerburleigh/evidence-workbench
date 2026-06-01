---
name: sample-research-surveillance-adapter
domain_id: sample-research
adapter_for: surveillance-update
description: Domain adapter for checking material changes in one neutral sample-research topic.
---

# Sample Research Surveillance Adapter

Use with `skills/surveillance-update/SKILL.md`.

## Read First

- `domain-packs/sample-research/taxonomy.v1.json`
- `domain-packs/sample-research/extraction-schema.v1.json`
- `domain-packs/sample-research/review-lanes.v1.json`
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`

## Domain Rules

- Check one `topic` at a time.
- Treat a new source mention as activity-only unless it changes a staged or published finding.
- For an evidence update, extract `subject`, `context`, `endpoint`, `result`, and `limitations` again instead of assuming the prior finding still applies.
- Keep update bundles minimal; do not restage the full baseline when only one claim or activity item changed.

## Output Checks

- No-op surveillance still writes a research session with the checked window.
- Activity-only changes use `activity_item` records and do not change claim maturity.
- Evidence updates require the same review lanes as the affected bundle scope.
