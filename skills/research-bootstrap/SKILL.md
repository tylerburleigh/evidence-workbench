---
name: research-bootstrap
description: Use when initializing baseline coverage for one bounded research scope unit by staging source, artifact, finding, and claim records into a candidate bundle.
---

# Research Bootstrap

Create a candidate bundle for exactly one taxonomy scope unit. Keep public claims traceable to staged findings and sources.

## Read First

- `workbench.config.json` and the active `WORKBENCH_DOMAIN` value.
- `domain-packs/<domain-id>/domain.json`
- `domain-packs/<domain-id>/taxonomy.v1.json`
- `domain-packs/<domain-id>/evidence-ladder.v1.json`
- `domain-packs/<domain-id>/extraction-schema.v1.json`
- `domain-packs/<domain-id>/review-lanes.v1.json`
- `domain-packs/<domain-id>/skills/bootstrap.md`
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`
- Existing records under `data/sources`, `data/artifacts`, `data/findings`, `data/claims`, and `data/candidate-bundles`.

## Workflow

1. Resolve the active domain and one target taxonomy node. If more than one scope unit is requested, split the work into separate bundles.
2. Inspect existing public records and active bundles for the same taxonomy node so the bundle does not duplicate live coverage.
3. Apply the domain adapter before drafting. Extract every required field from the domain extraction schema before writing a finding or claim.
4. Stage records under `data/staged-records/<bundle-id>/`. A baseline bundle normally includes one source, one artifact when applicable, one finding, and one claim.
5. Write `data/candidate-bundles/<bundle-id>.json` with `intake_mode: "bootstrap"`, scoped taxonomy IDs, proposed changes, staged paths, required review lanes, and source IDs/URLs.
6. Write a research session under `research/sessions/` that records the scope, source screening, staged output, and next actions.
7. Run validation:

```bash
npm run validate
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- validate --bundle <bundle-id>
npm run sync:research-planning
```

## Boundaries

- Do not publish, approve, or bypass evidence review.
- Do not edit live public records directly; only stage proposed records and create a bundle.
- Do not turn activity or source discovery into a public claim unless a source-backed finding supports it.
- Keep limitations near the claim, especially when the domain adapter marks them as required.

## Expected Outputs

- Staged JSON records under `data/staged-records/<bundle-id>/`.
- One candidate bundle under `data/candidate-bundles/`.
- One research session under `research/sessions/`.
- Passing `npm run validate` and bundle validation for the active domain.
