---
name: attention-triage
description: Use when deciding what needs attention now in the active evidence-workbench domain, including coverage gaps, bundle readiness, source-access issues, source-summary gaps, and thin claim support.
---

# Attention Triage

Identify the next operational work items for one active domain. Produce a short prioritized queue, not a broad project plan.

## Read First

- `workbench.config.json` and the active `WORKBENCH_DOMAIN` value.
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`
- `data/candidate-bundles/`
- `data/sources/`, `data/findings/`, `data/claims/`
- `data/report-artifacts/`
- `src/lib/public-data.js` helpers: `getAttentionItems`, `getCoverageSnapshot`, and `getEvidenceHealth`.

## Workflow

1. Resolve the active domain and load the workbench data.
2. Run structural checks:

```bash
npm run validate
```

3. Inspect attention signals in this order:

- open candidate bundles
- blocked validation, promotion, or evidence-review gates
- uncovered or stale scope units
- direct finding sources without full-text access
- evidence-linked sources missing summaries
- claims with missing support-map, finding, or source links
- current report artifacts that may need integration after new publication

4. For each item, identify:

- severity: `warn`, `info`, or `clear`
- owner surface: review queue, scope page, source page, claim page, report page, or planning state
- concrete next action
- record IDs and route links

5. Return the top 3-7 items. If there are no blockers, say so and name the highest-leverage maintenance action.

## Boundaries

- Do not create new evidence, revise records, approve bundles, or publish during triage.
- Do not treat activity as evidence.
- Do not recommend broad research unless a coverage, access, or support signal points to it.
- Keep source-summary tasks descriptive: what the source is, what evidence it contains, and why it is in the graph.

## Expected Outputs

- A short prioritized attention queue.
- A one-line health summary for coverage, bundle readiness, source access, and claim support.
- Exact commands only when the next step requires operator action.
