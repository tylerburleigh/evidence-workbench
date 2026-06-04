---
name: evidence-appraisal
description: Use when verifying one appraisal lane for one candidate bundle revision before editorial approval or publication.
---

# Evidence Appraisal

Appraise one lane for one candidate bundle revision. Produce a structured evidence appraisal; do not revise the staged records during the same pass.

## Read First

- `lit-review-studio.config.json` and the active `LIT_REVIEW_STUDIO_DOMAIN` value.
- `domain-packs/<domain-id>/appraisal-lanes.v1.json`
- `domain-packs/<domain-id>/evidence-ladder.v1.json`
- `domain-packs/<domain-id>/extraction-schema.v1.json`
- `domain-packs/<domain-id>/skills/evidence-appraisal.md`
- `data/candidate-bundles/<bundle-id>.json`
- Every staged file listed in the bundle.
- Existing evidence appraisals for the same bundle revision.

## Workflow

1. Confirm the active domain matches the bundle scope.
2. Inspect bundle status and structural readiness:

```bash
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:bundle -- status --bundle <bundle-id>
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:appraise-evidence -- status --bundle <bundle-id>
```

3. Scaffold a draft for the requested lane:

```bash
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:appraise-evidence -- scaffold --bundle <bundle-id> --lane <lane>
```

4. Compare staged records against cited source facts and the lane-specific domain adapter. Check support maps, taxonomy IDs, limitations, and claim wording as relevant to the lane.
5. Replace all draft placeholders. Set `verdict`, `blocking`, `summary`, and `findings` based on the appraisal. Use `needs_human_judgment` when the source cannot be checked reliably.
6. Apply the completed appraisal:

```bash
LIT_REVIEW_STUDIO_DOMAIN=<domain-id> npm run research:appraise-evidence -- apply --file <draft-path>
```

## Boundaries

- Do not conduct new research beyond verifying cited material.
- Do not approve, reject, request changes, or publish.
- Do not silently edit staged records while acting as appraiser.
- Do not mark an appraisal non-blocking if critical support, source, or scope issues remain open.

## Expected Outputs

- One complete `data/evidence-appraisals/<appraisal-id>.json` record for the lane.
- Updated `evidence_appraisal_ids` on the candidate bundle.
- Appraisal status showing lane completion or explicit blocking issues.
