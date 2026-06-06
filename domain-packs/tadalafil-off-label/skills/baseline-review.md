---
name: tadalafil-off-label-baseline-review-adapter
domain_id: tadalafil-off-label
adapter_for: baseline-review
description: Domain adapter for one baseline review question about off-label tadalafil/Cialis effects or risks.
---

# Tadalafil Off-Label Baseline Review Adapter

Use with `skills/baseline-review/SKILL.md`.

## Read First

- `domain-packs/tadalafil-off-label/domain.json`
- `domain-packs/tadalafil-off-label/taxonomy.v1.json`
- `domain-packs/tadalafil-off-label/extraction-schema.v1.json`
- `domain-packs/tadalafil-off-label/evidence-ladder.v1.json`
- `domain-packs/tadalafil-off-label/appraisal-lanes.v1.json`

## Domain Rules

- Scope unit: `review_question`.
- Required extraction fields: `population_profile`, `tadalafil_exposure`, `pde5_agent`, `agent_directness_to_tadalafil`, `class_transfer_limits`, `indication_context`, `study_design`, `comparator_context`, `endpoint_domain`, `endpoint_measure`, `effect_estimate`, `safety_findings`, `directness_to_target_population`, `confounding_and_bias_limits`, `source_locator`.
- Primary target-interest population is mostly healthy men age 30 to 50; mark ED, BPH, PAH, cognitive-impairment, older-adult, cardiovascular, or mixed clinical populations as indirect unless the review question is specifically about that population.
- Keep tadalafil-specific evidence separate from sildenafil, vardenafil, avanafil, or class-level PDE5-inhibitor evidence unless the source justifies transfer; fill `pde5_agent`, `agent_directness_to_tadalafil`, and `class_transfer_limits` for every artifact, finding, and claim.
- Always record dose, frequency, acute versus chronic exposure, duration, comparator, and endpoint instrument.
- For safety, check current labeling boundaries including nitrates, riociguat/guanylate-cyclase stimulators, alpha blockers, antihypertensives, alcohol, cardiovascular status, renal/hepatic impairment, vision loss, hearing loss, priapism, and common adverse reactions.
- For literature searches, stage a `search_protocol` record with queries, databases, inclusion/exclusion criteria, screening decisions, deduplication notes, and included source IDs.

## Output Checks

- Every staged study artifact identifies population_profile, tadalafil_exposure, pde5_agent, agent_directness_to_tadalafil, class_transfer_limits, study_design, comparator_context, safety_findings, directness_to_target_population, and confounding_and_bias_limits.
- Every staged finding includes endpoint_measure, effect_estimate, source_locator, pde5_agent, agent_directness_to_tadalafil, class_transfer_limits, directness_to_target_population, and safety_findings.
- Search and screening work is captured in a staged `search_protocol` record when the bundle is based on a search pass.
- Every staged synthesis claim includes limitations and support-map entries tied to concrete findings and sources.
- Bundle validation is run with `LIT_REVIEW_STUDIO_DOMAIN=tadalafil-off-label`.
