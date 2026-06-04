---
name: review-update
description: Use when checking an already scoped research unit for material changes since the latest baseline-review pass, publication, or review-update pass.
---

# Review Update

Check whether a scoped research unit needs no change, an activity-only note, or a staged evidence update.

## Read First

- `lit-review-studio.config.json` and the active `LIT_REVIEW_STUDIO_DOMAIN` value.
- `domain-packs/<domain-id>/taxonomy.v1.json`
- `domain-packs/<domain-id>/appraisal-lanes.v1.json`
- `domain-packs/<domain-id>/skills/review-update.md`
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`
- Existing public records and publication events for the target taxonomy node.
- Existing candidate bundles for the same scope.

## Workflow

1. Resolve the target taxonomy node and define the delta window from the latest publication, session, or explicit user date.
2. Inspect live claims, findings, sources, artifacts, activity items, and open bundles for the same scope.
3. Search or inspect only for material changes inside the delta window. Do not redo baseline research unless the user asks.
4. Choose one outcome:
   - `no-op`: write a research session noting that no material change was found.
   - `activity-only`: stage an `activity_item` when the event matters but does not change evidence support.
   - `evidence-update`: stage the minimal source, artifact, finding, claim, or activity changes needed.
5. For staged changes, create or update a candidate bundle with `intake_mode: "review_update"` when the schema supports it, or a clearly named update bundle when it does not.
6. Run validation:

```bash
npm run validate
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- validate --bundle <bundle-id>
npm run sync:research-planning
```

## Boundaries

- Do not upgrade a claim only because there was activity.
- Do not widen the taxonomy scope during review update.
- Do not publish or approve.
- Prefer the smallest auditable change over restaging a full baseline bundle.

## Expected Outputs

- A research session for every review update pass.
- Optional staged records and one candidate bundle when material changes exist.
- Passing validation for any staged bundle.
