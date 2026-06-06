---
name: tadalafil-off-label-evidence-appraisal-adapter
domain_id: tadalafil-off-label
adapter_for: evidence-appraisal
description: Domain adapter for appraising tadalafil source fidelity, population directness, exposure directness, endpoint validity, safety framing, and synthesis boundaries.
---

# Tadalafil Off-Label Evidence Appraisal Adapter

Use with `skills/evidence-appraisal/SKILL.md`.

## Read First

- `domain-packs/tadalafil-off-label/appraisal-lanes.v1.json`
- `domain-packs/tadalafil-off-label/extraction-schema.v1.json`
- `domain-packs/tadalafil-off-label/evidence-ladder.v1.json`
- The target bundle and staged files.

## Domain Rules

- `source_fidelity`: verify bibliographic metadata, population, drug exposure, comparator, endpoint, quantitative result, adverse events, and source locator against the cited source.
- `population_directness`: verify whether the evidence applies to healthy men age 30 to 50, cognitive-impairment populations, older adults, ED/BPH, PAH, cardiovascular disease, or mixed populations.
- `exposure_directness`: verify tadalafil dose, timing, duration, daily versus as-needed use, `pde5_agent`, `agent_directness_to_tadalafil`, and any transfer from other PDE5 inhibitors.
- `endpoint_validity`: verify whether cognitive tests, mood scales, vascular markers, exercise protocols, longevity proxies, and safety endpoints actually support the claim.
- `safety_risk_framing`: verify current contraindications and warnings, especially nitrates, riociguat, alpha blockers, antihypertensives, alcohol, cardiovascular status, renal/hepatic impairment, vision loss, hearing loss, priapism, and common adverse reactions.
- `confounding_bias`: assess confounding by indication, healthy-user effects, reverse causation, comparator adequacy, selective outcome reporting, multiplicity, and missing adverse-event capture.
- `synthesis_overreach`: block claims that imply off-label medical advice, treat mechanism as clinical benefit, overgeneralize from indirect populations, collapse non-tadalafil PDE5 evidence into tadalafil conclusions, or detach benefit from safety.
- Use issue categories such as `source_mismatch`, `population_indirectness`, `exposure_mismatch`, `endpoint_invalidity`, `safety_boundary_missing`, `confounding_unaddressed`, `mechanism_overreach`, or `claim_overreach`.

## Output Checks

- `blocking` is true for unresolved source mismatch, missing serious safety boundary, unsupported population or agent transfer, endpoint mismatch, or overbroad benefit claim.
- `appraised_change_ids` covers all staged changes inspected by the lane.
- Completed appraisals are applied with `LIT_REVIEW_STUDIO_DOMAIN=tadalafil-off-label`.
