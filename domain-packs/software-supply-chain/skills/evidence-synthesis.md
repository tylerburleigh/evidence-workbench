---
name: software-supply-chain-synthesis-adapter
domain_id: software-supply-chain
adapter_for: evidence-synthesis
description: Domain adapter for software supply-chain control synthesis reports.
---

# Software Supply Chain Synthesis Adapter

Use with `skills/evidence-synthesis/SKILL.md`.

## Read First

- `domain-packs/software-supply-chain/domain.json`
- `domain-packs/software-supply-chain/taxonomy.v1.json`
- Published control claims, findings, evidence appraisals, and publication events.

## Domain Rules

- Scope unit: `control`.
- Compare controls by component, control signal, source locator, review boundary, risk interpretation, and limitations.
- Do not convert a control signal into a security-assurance claim.
- Separate observed repository evidence from operational recommendations.

## Output Checks

- The report separates control coverage from risk reduction.
- Each control conclusion links to concrete findings and source locators.
- Open gaps are phrased as future control-review questions.
