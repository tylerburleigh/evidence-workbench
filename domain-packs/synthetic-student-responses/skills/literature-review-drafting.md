---
name: synthetic-student-responses-literature-review-drafting-adapter
domain_id: synthetic-student-responses
adapter_for: literature-review-drafting
description: Domain adapter for paper-facing literature-review prose about synthetic student responses, automated scoring, validation, and assessment-use boundaries.
---

# Synthetic Student Responses Literature Review Adapter

Use with `skills/literature-review-drafting/SKILL.md`.

## Read First

- `domain-packs/synthetic-student-responses/domain.json`
- `domain-packs/synthetic-student-responses/taxonomy.v1.json`
- `domain-packs/synthetic-student-responses/extraction-schema.v1.json`
- `domain-packs/synthetic-student-responses/skills/evidence-synthesis.md`
- Published SSR claims, findings, sources, artifacts, evidence appraisals, and synthesis reports.

## Domain Rules

- Scope unit: `review_question`.
- Organize paper-facing prose around generation methods, quality evaluation, model/prompt effects, real-response comparison, automated scoring use, label/scoring agreement, and assessment-stakes boundaries.
- Cite empirical studies for empirical claims and standards/guidance documents only for assessment-validity, formative-assessment, or responsible-AI guardrails.
- Keep response origin, label source, rubric label space, generation method, real-response comparator, assessment purpose, decision consequence, operational use, and scorer use explicit when they affect the claim.
- Separate synthetic-response realism from automated-scorer validity; one does not imply the other.
- Separate formative feedback, in-term/classroom assessment, summative assessment, admissions/selection, high-stakes individual decisions, and accountability decisions.
- Treat high-stakes and operational-use language conservatively unless direct source support exists.
- Use readable author-year citation labels in prose, backed by source IDs in a traceability section.
- Preserve limitations: targeted evidence map, heterogeneous response formats, inconsistent prompt/model reporting, label provenance variation, and thin direct high-stakes evidence.

## Output Checks

- Every paragraph that makes a factual literature claim includes inline citations.
- Automated scoring claims cite sources about scorer development, validation, labels, or scoring agreement, not only sources about generation realism.
- Acceptable-use claims distinguish developmental, diagnostic, training, calibration, stress-test, validation, live-scoring, and policy uses.
- Stakes claims explicitly distinguish lower-stakes formative/in-term contexts from summative, admissions, high-stakes, and accountability contexts.
- The limitations paragraph names unresolved evidence gaps: operational high-stakes validation, grade-bearing classroom use, accountability/certification/licensure/placement/promotion, subgroup fairness validation, and vendor/testing-program policy.
