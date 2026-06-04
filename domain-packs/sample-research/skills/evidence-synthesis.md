---
name: sample-research-synthesis-adapter
domain_id: sample-research
adapter_for: evidence-synthesis
description: Domain adapter for neutral sample-research synthesis reports.
---

# Sample Research Synthesis Adapter

Use with `skills/evidence-synthesis/SKILL.md`.

## Read First

- `domain-packs/sample-research/domain.json`
- `domain-packs/sample-research/taxonomy.v1.json`
- Published sample-research claims, findings, and evidence appraisals.

## Domain Rules

- Scope unit: `topic`.
- Treat this domain as a fixture. Do not infer real-world evidence strength from sample records.
- Use `subject`, `context`, `endpoint`, `result`, and `limitations` as the comparison fields.
- Keep synthesis language neutral and focused on workflow demonstration.

## Output Checks

- The report distinguishes fixture coverage from evidence conclusions.
- Each summarized topic links to its published claim and supporting findings.
- Any missing baseline is described as a workflow gap, not a substantive research gap.
