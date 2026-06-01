---
name: sample-archive-surveillance-adapter
domain_id: sample-archive
adapter_for: surveillance-update
description: Domain adapter for checking material changes in one archive question since the latest review or publication.
---

# Sample Archive Surveillance Adapter

Use with `skills/surveillance-update/SKILL.md`.

## Read First

- `domain-packs/sample-archive/taxonomy.v1.json`
- `domain-packs/sample-archive/extraction-schema.v1.json`
- `domain-packs/sample-archive/review-lanes.v1.json`
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`

## Domain Rules

- Check one `question` at a time.
- Material changes are changes to archive item identity, locator, observed property, or context boundary.
- A new archive citation is activity-only unless it changes the supported observation.
- Evidence updates must restate `archive_item`, `locator`, `observed_property`, and `context_boundary`.

## Output Checks

- No-op surveillance records the checked window and archive question.
- Activity-only records do not change public claim maturity.
- Evidence-update bundles require `source_fidelity`, `scope_fit`, and `context_boundaries` review lanes.
