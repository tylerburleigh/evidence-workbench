---
name: editorial-review
description: Use when deciding whether a reviewed candidate bundle should receive comments, changes requested, rejection, approval, or publication.
---

# Editorial Review

Make the final curation decision after structural validation and required evidence-review lanes are complete.

## Read First

- `workbench.config.json` and the active `WORKBENCH_DOMAIN` value.
- `domain-packs/<domain-id>/public-copy.v1.json`
- `domain-packs/<domain-id>/review-lanes.v1.json`
- `domain-packs/<domain-id>/skills/editorial-review.md`
- `data/candidate-bundles/<bundle-id>.json`
- Staged files listed in the bundle.
- Evidence reviews and review comments for the bundle.

## Workflow

1. Confirm the active domain matches the bundle scope.
2. Inspect promotion readiness and evidence gates:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- status --bundle <bundle-id>
WORKBENCH_DOMAIN=<domain-id> npm run research:review-evidence -- status --bundle <bundle-id>
```

3. Compare staged records against live public records. Check whether proposed public copy is bounded, traceable, and consistent with domain labels.
4. Choose exactly one action:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- comment --bundle <bundle-id> --comment "<text>"
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- request-changes --bundle <bundle-id> --reason "<reason>"
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- reject --bundle <bundle-id> --reason "<reason>"
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- approve --bundle <bundle-id>
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- publish --bundle <bundle-id>
```

5. After publication, run:

```bash
npm run validate
npm run sync:research-planning
```

## Boundaries

- Do not approve while required review lanes are missing or blocking findings remain open.
- Do not publish unless the bundle is approved.
- Do not manually copy staged files into live collections.
- Use request-changes when a fix is plausible; use reject when the bundle should not proceed.

## Expected Outputs

- A review comment, lifecycle status change, approval, rejection, or publication event.
- Published bundles have promoted live records, a publication event, and refreshed planning state.
