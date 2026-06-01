---
name: evidence-review
description: Use when verifying one review lane for one candidate bundle revision before editorial approval or publication.
---

# Evidence Review

Review one lane for one candidate bundle revision. Produce a structured evidence review; do not revise the staged records during the same pass.

## Read First

- `workbench.config.json` and the active `WORKBENCH_DOMAIN` value.
- `domain-packs/<domain-id>/review-lanes.v1.json`
- `domain-packs/<domain-id>/evidence-ladder.v1.json`
- `domain-packs/<domain-id>/extraction-schema.v1.json`
- `domain-packs/<domain-id>/skills/evidence-review.md`
- `data/candidate-bundles/<bundle-id>.json`
- Every staged file listed in the bundle.
- Existing evidence reviews for the same bundle revision.

## Workflow

1. Confirm the active domain matches the bundle scope.
2. Inspect bundle status and structural readiness:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- status --bundle <bundle-id>
WORKBENCH_DOMAIN=<domain-id> npm run research:review-evidence -- status --bundle <bundle-id>
```

3. Scaffold a draft for the requested lane:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:review-evidence -- scaffold --bundle <bundle-id> --lane <lane>
```

4. Compare staged records against cited source facts and the lane-specific domain adapter. Check support maps, taxonomy IDs, limitations, and claim wording as relevant to the lane.
5. Replace all draft placeholders. Set `verdict`, `blocking`, `summary`, and `findings` based on the review. Use `needs_human_judgment` when the source cannot be checked reliably.
6. Apply the completed review:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:review-evidence -- apply --file <draft-path>
```

## Boundaries

- Do not conduct new research beyond verifying cited material.
- Do not approve, reject, request changes, or publish.
- Do not silently edit staged records while acting as reviewer.
- Do not mark a review non-blocking if critical support, source, or scope issues remain open.

## Expected Outputs

- One complete `data/evidence-reviews/<review-id>.json` record for the lane.
- Updated `evidence_review_ids` on the candidate bundle.
- Review status showing lane completion or explicit blocking issues.
