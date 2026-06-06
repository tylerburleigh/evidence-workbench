---
name: tadalafil-off-label-editorial-decision-adapter
domain_id: tadalafil-off-label
adapter_for: editorial-decision
description: Domain adapter for final editorial decision of tadalafil off-label evidence bundles.
---

# Tadalafil Off-Label Editorial Decision Adapter

Use with `skills/editorial-decision/SKILL.md`.

## Read First

- Target bundle status and validation report.
- All required evidence-appraisal records.
- Staged synthesis claims, findings, study artifacts, search protocols, and sources.

## Domain Rules

- Do not publish a synthesis claim if any required appraisal lane is missing or blocking.
- Claims must be clinically bounded, source-backed, and explicit about whether they address benefit, risk, mechanism, directness, or uncertainty.
- Do not publish text that reads as advice to use tadalafil off-label.
- Keep healthy-adult, MCI, ED/BPH, PAH, older-adult, and cardiovascular-disease populations separate unless the support map justifies transfer.
- Keep tadalafil-specific evidence separate from sildenafil, vardenafil, avanafil, and mixed PDE5-inhibitor evidence unless `class_transfer_limits` and the support map justify transfer.
- Mention safety limitations near conclusions, especially contraindications with nitrates or riociguat, hypotension interactions, cardiovascular status, alpha blockers, antihypertensives, alcohol, vision/hearing warnings, priapism, renal/hepatic limits, and dose/duration uncertainty.
- Avoid field-wide claims when evidence is from one population, one endpoint, one dose schedule, one small study, one observational design, or non-tadalafil PDE5-inhibitor evidence.

## Output Checks

- The bundle status report is ready before approval.
- Each public claim has concrete supporting findings and sources.
- Support-map rationale explains how the evidence answers the review question and where it does not.
- Each claim exposes `pde5_agent`, `agent_directness_to_tadalafil`, and `class_transfer_limits`.
- Publication is performed through `npm run research:bundle -- publish` with `LIT_REVIEW_STUDIO_DOMAIN=tadalafil-off-label`.
