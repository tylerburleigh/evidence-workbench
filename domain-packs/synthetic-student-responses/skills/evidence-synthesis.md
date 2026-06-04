---
name: synthetic-student-responses-evidence-synthesis-adapter
domain_id: synthetic-student-responses
adapter_for: evidence-synthesis
description: Domain adapter for cross-question evidence synthesis of synthetic student response literature review baselines.
---

# Synthetic Student Responses Evidence Synthesis Adapter

Use with `skills/evidence-synthesis/SKILL.md`.

## Read First

- `domain-packs/synthetic-student-responses/domain.json`
- `domain-packs/synthetic-student-responses/taxonomy.v1.json`
- Published SSR claims, findings, artifacts, evidence appraisals, and synthesis matrix output.

## Domain Rules

- Scope unit: `review_question`.
- Compare claims by response origin, label source, rubric label space, generation method, real-response comparator, assessment purpose, decision consequence, operational use, and scorer use.
- Separate direct support from boundary conditions, adjacent evidence, and contextual guidance.
- Classify each review question as baseline-answered, directionally answered, or still open.
- Keep formative, in-term, summative, admissions, high-stakes, and low-stakes boundaries explicit.
- Do not infer automated-scorer validity, deployment readiness, subgroup fairness validity, or real-response interchangeability from synthetic-response realism alone.
- Treat targeted baseline review coverage as a scoped evidence map unless a later search protocol supports stronger systematic-review language.

## Output Checks

- The report answers whether the original questions were answered and how well.
- Every cross-cutting conclusion links to claim IDs and at least one supporting finding or source ID.
- The report names unresolved questions, especially high-stakes operational validation, grade-bearing classroom use, accountability use, subgroup fairness validation, and vendor policy.
- Applicability facets are summarized without letting low-stakes evidence support high-stakes claims.
