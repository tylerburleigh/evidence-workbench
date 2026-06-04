---
name: sample-archive-synthesis-adapter
domain_id: sample-archive
adapter_for: evidence-synthesis
description: Domain adapter for archive-style synthesis reports.
---

# Sample Archive Synthesis Adapter

Use with `skills/evidence-synthesis/SKILL.md`.

## Read First

- `domain-packs/sample-archive/domain.json`
- `domain-packs/sample-archive/taxonomy.v1.json`
- Published sample-archive claims, findings, and evidence appraisals.

## Domain Rules

- Scope unit: `question`.
- Compare archive observations by `archive_item`, `locator`, `observed_property`, and `context_boundary`.
- Do not generalize across archive locators unless the published claims already support that comparison.
- Treat missing locators or context boundaries as synthesis limits.

## Output Checks

- The report preserves archive item identity and locator boundaries.
- Each conclusion names the question scope it applies to.
- Any cross-question pattern is explicitly marked as interpretive.
