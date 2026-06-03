---
name: literature-review
description: Use when drafting or revising paper-facing literature-review prose from already-collected research records, especially background sections that need inline source citations for substantive claims.
---

# Literature Review

Draft narrative literature-review prose from published evidence records. Treat this as a writing layer over the evidence graph, not as new evidence extraction.

## Read First

- `workbench.config.json` and the active `WORKBENCH_DOMAIN` value.
- `domain-packs/<domain-id>/domain.json`
- `domain-packs/<domain-id>/taxonomy.v1.json`
- `domain-packs/<domain-id>/public-copy.v1.json`
- `domain-packs/<domain-id>/skills/literature-review.md` when present.
- Relevant published records under `data/sources`, `data/findings`, `data/claims`, `data/artifacts`, `data/evidence-reviews`, and `data/publication-events`.
- Existing synthesis reports under `research/syntheses/` when they summarize the target scope.

## Workflow

1. Resolve the intended paper audience, target section, domain, and scope. If the user has not specified length or style, write a concise background-section draft.
2. Inspect existing `report_artifact` records for a current `literature_review` with the same domain and paper-facing scope. Revise that report by default; create a new current literature review only when the audience, target section, or scope is intentionally different, or when the old report is marked `superseded` or `archived`.
3. Inventory the published sources, findings, claims, and limitations that can support the requested prose. Treat sidecar syntheses as traceability aids, not as substitutes for the underlying published records.
4. Build a claim-to-citation map before drafting. Every substantive factual claim should cite one or more concrete source records inline.
5. Separate evidence types in the prose:
   - empirical study findings,
   - standards or policy guidance,
   - adjacent evidence,
   - the author's interpretation or implication for the present study.
6. Draft or revise a Markdown literature review with readable narrative paragraphs, not an audit table. Use author-year citation text when source metadata supports it, and retain source IDs where traceability matters.
7. Include a short limitations or gaps paragraph that states what the reviewed literature does not establish.
8. Add a traceability note listing the source IDs used, unless the user explicitly asks for polished prose only.
9. Create or update a `report_artifact` record under `data/report-artifacts/` when the draft should appear in the app. Include `artifact_type: "literature_review"`, `status`, `domain_id`, `scope_ids`, `path`, `source_ids`, `claim_ids`, and citation-audit status. When replacing a current literature review, mark the older artifact `superseded` or `archived`.
10. Run validation and tests when skill files, domain adapters, report indexes, or repo-observed behavior changed:

```bash
npm run validate
npm test
```

## Boundaries

- Do not browse for new sources unless the user asks for new literature search or current-source verification.
- Do not create or publish new source, finding, claim, or artifact records from a literature-review pass unless the user explicitly requests a candidate bundle.
- Do not cite a claim without citing the underlying source record when writing paper-facing prose.
- Do not present targeted bootstrap coverage as systematic-review coverage.
- Do not turn standards, guidance, or policy documents into empirical findings.
- Do not use source IDs as a substitute for readable citations when the user wants paper-facing prose; use IDs as traceability support.
- Do not make operational recommendations stronger than the published evidence supports.
- Do not leave multiple current `literature_review` artifacts for the same domain and paper-facing scope as an accidental result of additive writing.
- Do not promote a sidecar synthesis into paper-facing prose until its underlying evidence is published or its unpublished status is explicitly bounded in the prose.

## Expected Outputs

- One Markdown literature-review draft or revision under `research/syntheses/` unless the user specifies another location.
- One current `report_artifact` index record when the draft should be visible in the app, with older replaced literature reviews marked `superseded` or `archived`.
- Inline citations for every substantive factual claim.
- A short limitations/gaps paragraph.
- A traceability section listing cited source IDs and, when useful, supporting claim or finding IDs.
- Passing validation and tests when repository skills, adapters, or observed behavior are changed.
