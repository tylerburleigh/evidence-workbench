---
name: editorial-decision
description: Use when deciding whether an appraised candidate bundle should receive comments, changes requested, rejection, approval, or publication.
---

# Editorial Decision

Make the final curation decision after structural validation and required evidence-appraisal lanes are complete.

## Read First

- `lit-review-studio.config.json` and the active `LIT_REVIEW_STUDIO_DOMAIN` value.
- `domain-packs/<domain-id>/public-copy.v1.json`
- `domain-packs/<domain-id>/appraisal-lanes.v1.json`
- `domain-packs/<domain-id>/skills/editorial-decision.md`
- `data/candidate-bundles/<bundle-id>.json`
- Staged files listed in the bundle.
- Evidence appraisals and editorial comments for the bundle.

## Workflow

1. Confirm the active domain matches the bundle scope.
2. Inspect promotion readiness and evidence gates:

```bash
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- status --bundle <bundle-id>
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:appraise-evidence -- status --bundle <bundle-id>
```

3. Compare staged records against live public records. Check whether proposed public copy is bounded, traceable, and consistent with domain labels.
4. Choose exactly one action:

```bash
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- comment --bundle <bundle-id> --comment "<text>"
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- request-changes --bundle <bundle-id> --reason "<reason>"
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- reject --bundle <bundle-id> --reason "<reason>"
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- approve --bundle <bundle-id>
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- publish --bundle <bundle-id>
```

5. After publication, run:

```bash
npm run validate
npm run sync:research-planning
```

## Boundaries

- Do not approve while required appraisal lanes are missing or blocking findings remain open.
- Do not publish unless the bundle is approved.
- Do not manually copy staged files into live collections.
- Use request-changes when a fix is plausible; use reject when the bundle should not proceed.

## Expected Outputs

- An editorial comment, lifecycle status change, approval, rejection, or publication event.
- Published bundles have promoted live records, a publication event, and refreshed planning state.
