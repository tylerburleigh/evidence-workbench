---
name: tadalafil-off-label-evidence-synthesis-adapter
domain_id: tadalafil-off-label
adapter_for: evidence-synthesis
description: Domain adapter for synthesizing tadalafil off-label evidence across benefits, risks, and directness boundaries.
---

# Tadalafil Off-Label Evidence Synthesis Adapter

Use with `skills/evidence-synthesis/SKILL.md`.

## Read First

- `domain-packs/tadalafil-off-label/domain.json`
- `domain-packs/tadalafil-off-label/taxonomy.v1.json`
- Published tadalafil claims, findings, study artifacts, search protocols, and evidence appraisals.

## Domain Rules

- Scope unit: `review_question`.
- Compare evidence by `population_profile`, `tadalafil_exposure`, `pde5_agent`, `agent_directness_to_tadalafil`, `class_transfer_limits`, `study_design`, `comparator_context`, `endpoint_domain`, `effect_estimate`, `safety_findings`, `directness_to_target_population`, and `confounding_and_bias_limits`.
- Synthesize benefits and risks together; do not create a benefit-only summary for off-label use.
- Separate clinical outcomes from surrogate biomarkers, mechanistic plausibility, nonhuman evidence, and adjacent PDE5-inhibitor class evidence; never let sildenafil-heavy or mixed PDE5 evidence silently become a tadalafil conclusion.
- Treat mild cognitive impairment and healthy-adult cognitive enhancement as different questions unless sources directly bridge them.
- State when the target population of mostly healthy men age 30 to 50 is unstudied or only indirectly represented.

## Output Checks

- The report distinguishes direct tadalafil evidence from adjacent sildenafil, vardenafil, avanafil, mixed PDE5-class, or mechanistic evidence.
- Each summarized review question links to published claims and supporting findings when available.
- Missing baselines are described as coverage gaps, not conclusions that evidence is absent.
- Safety and interaction boundaries appear alongside any possible benefit summary.
