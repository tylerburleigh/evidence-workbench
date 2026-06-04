---
name: evidence-synthesis
description: Use when producing a cross-record synthesis report for one domain or bounded set of taxonomy scope units after baseline review or review update records have been published.
---

# Evidence Synthesis

Create a traceable synthesis report from published evidence records. Do not create new evidence claims unless the report identifies a gap that needs a later bundle.

## Read First

- `lit-review-studio.config.json` and the active `LIT_REVIEW_STUDIO_DOMAIN` value.
- `domain-packs/<domain-id>/domain.json`
- `domain-packs/<domain-id>/taxonomy.v1.json`
- `domain-packs/<domain-id>/public-copy.v1.json`
- `domain-packs/<domain-id>/skills/synthesis.md`
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`
- Published records under `data/claims`, `data/findings`, `data/sources`, `data/evidence-appraisals`, and `data/publication-events`.
- `research/syntheses/README.md`

## Workflow

1. Resolve the active domain and synthesis scope. Use a domain-wide scope only when each included scope unit has baseline coverage or is explicitly marked as a gap.
2. Inspect existing `report_artifact` records for current reports with the same domain, artifact type, and scope. Decide whether the work updates a current report, creates a new version that supersedes an older report, or remains a sidecar memo.
3. Inventory published claims, supporting findings, sources, evidence appraisals, publication events, applicability facets, and planning status for the scope.
4. Classify each included scope unit:
   - `answered_well`: source-backed baseline with clear limits.
   - `answered_directionally`: useful baseline but targeted, heterogeneous, or thin evidence.
   - `open_gap`: missing baseline, missing comparator, or insufficient direct evidence.
5. Draft the synthesis as a Markdown report under `research/syntheses/`. Include:
   - scope and date,
   - evidence inventory,
   - question-by-question status,
   - cross-cutting conclusions,
   - strength-of-evidence notes,
   - gaps and proposed next research actions,
   - traceability links to claim, finding, source, and review IDs.
6. If the report is a sidecar, include a disposition note naming the target canonical report, the integration trigger, and whether the sidecar should be archived, deleted, or kept after integration.
7. Create or update a `report_artifact` record under `data/report-artifacts/` when the report should be listed in the app. Include `domain_id`, `scope_ids`, `artifact_type`, `status`, `path`, `source_ids`, `claim_ids`, and citation-audit status. When replacing a current report, mark the older artifact `superseded` or `archived`.
8. Keep the synthesis report descriptive unless a published claim directly supports stronger language.
9. Run validation and domain smoke checks when routes or public copy could be affected:

```bash
npm run validate
npm test
```

## Boundaries

- Do not stage or publish new source, finding, or claim records from a synthesis pass unless the user explicitly asks for a new candidate bundle.
- Do not upgrade targeted baseline review evidence into systematic-review language.
- Do not collapse evidence across taxonomy nodes unless the report explains why the comparison is valid.
- Do not treat planning state as evidence; use it only to describe workflow coverage and freshness.
- Do not use unsupported operational recommendations. Convert them into follow-up questions or domain-specific caveats.
- Do not leave multiple current reports for the same domain, artifact type, and scope unless their audience or section boundary is intentionally different and explicit.
- Do not treat a sidecar memo as the canonical literature review. Integrate it into the current literature review or synthesis report after the underlying evidence is published.

## Expected Outputs

- One Markdown report under `research/syntheses/`, or a clearly scoped revision to an existing report.
- One `report_artifact` index record when the report should be visible in the app, with older replaced reports marked `superseded` or `archived`.
- A disposition note for sidecar memos.
- Optional supporting inventory tables under the same directory when useful.
- Clear next actions that point to `baseline-review`, `review-update`, `evidence-appraisal`, or `editorial-decision` workflows when new public records are needed.
- Passing validation and tests when the report changes repo-observed behavior or skill/test coverage.
