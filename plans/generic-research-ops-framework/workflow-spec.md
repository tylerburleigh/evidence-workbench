# Workflow Spec

## Work Unit

The default work unit should be one taxonomy topic per run.

This prevents broad, diffuse research passes and makes review feasible.

If a user asks for a whole field, the system should select or ask for one bounded scope unit.

## Workflow 1: Bootstrap Research

Use when a topic has no baseline public coverage.

Steps:

1. Resolve scope.
2. Confirm the public question being answered.
3. Inspect current public records for overlap.
4. Check previous bundles and sessions.
5. Search and collect candidate sources.
6. Screen sources against inclusion and exclusion criteria.
7. Extract source facts before drafting claims.
8. Create source, artifact, finding, and claim records as staged JSON.
9. Create one candidate bundle.
10. Write one research session record.
11. Validate the bundle.
12. Regenerate planning state.
13. Leave the bundle in `submitted` or `revised`.

Expected outputs:

- one `research_session`
- zero or one `candidate_bundle`
- staged records under `data/staged-records/<bundle-id>/`

No-op is valid when evidence does not justify a public baseline.

## Workflow 2: Surveillance Update

Use when a topic already has baseline coverage.

Steps:

1. Resolve scope.
2. Define delta window from latest meaningful review or publication.
3. Search only for material changes.
4. Decide outcome:
   - `no_op`
   - `activity_only`
   - `claim_refresh`
   - `evidence_update`
5. Extract facts for new material sources.
6. Stage only affected records.
7. Create a candidate bundle if public records should change.
8. Write a session record.
9. Validate the bundle.
10. Regenerate planning state.

Rules:

- Activity alone should not upgrade a claim.
- New sources should not silently invalidate support maps; update the support map when a claim rationale changes.
- Null, negative, mixed, retracted, or stalled evidence should remain visible when it matters.

## Workflow 3: Evidence Review

Use after a candidate bundle is submitted.

Steps:

1. Pick one bundle revision and one review lane.
2. Run bundle status and validation.
3. Scaffold an evidence review.
4. Compare staged records against sources and live records.
5. Write structured findings.
6. Apply the review.
7. Confirm gate state.

Review verdicts:

- `accept`
- `needs_revision`
- `reject`
- `needs_human_judgment`

Evidence review findings should be actionable. They should identify the claim, why it matters, and the needed repair.

## Workflow 4: Editorial Review

Use after required evidence-review lanes are complete.

Steps:

1. Inspect bundle status.
2. Inspect promotion readiness.
3. Compare staged records to live records.
4. Check evidence-review findings.
5. Request revision or approve.
6. Publish only after approval.
7. Run planning sync after publish.
8. Smoke-check affected public routes.

Rules:

- Do not hand-copy staged records into public data.
- Do not publish if evidence-review gates are incomplete or blocking.
- Do not approve if staged claims exceed the support map.

## Workflow 5: Planning Sync

Generated planning state should be updated after:

- a research session is added
- a candidate bundle changes
- a bundle is published
- a taxonomy changes

The sync should compute:

- coverage status by topic
- next recommended mode
- active review status
- latest session
- latest bundle
- latest publication
- bootstrap queue
- surveillance queue

## Workflow 6: Report Integration

Use after a bundle is published, or after a sidecar synthesis answers a bounded question that should affect a visible report.

Steps:

1. Identify current `report_artifact` records for the affected domain, artifact type, and scope.
2. Decide the disposition:
   - update the current report in place
   - create a new report version and mark the replaced artifact `superseded` or `archived`
   - keep the new synthesis as an unindexed or draft sidecar
   - intentionally keep a separate current report because its audience, section, or scope differs
3. Merge newly published sources, findings, claims, reviews, and publication events into the target report metadata.
4. Update the Markdown report prose or traceability sections so the visible synthesis reflects the published graph.
5. Run validation and citation-audit checks when report indexes changed.

Rules:

- There should be at most one accidental current report for the same domain, artifact type, and scope.
- Paper-facing `literature_review` artifacts are canonical by default; additive synthesis should revise or supersede them rather than create parallel current reviews.
- Sidecars based on staged or submitted records must clearly state their unpublished status and define an integration trigger.
- Report integration does not publish new evidence claims. If the report needs unsupported evidence, create or revise a candidate bundle first.

## Candidate Bundle Validation

The validator should check:

- bundle required fields
- lifecycle status
- proposed change IDs
- staged paths remain under `data/staged-records/<bundle-id>/`
- target paths match record type and ID
- staged record `id` and `record_type` match the proposed change
- create/update semantics match live-file existence
- source references exist
- artifact references exist
- finding references exist
- claim support maps reference concrete findings and sources
- required review lanes are complete before approval
- publication event exists after publication

## Lifecycle Transitions

Allowed transitions:

```text
submitted -> in_review, needs_revision, approved, rejected
in_review -> needs_revision, approved, rejected
needs_revision -> revised, rejected
revised -> in_review, approved, rejected
approved -> in_review, rejected, published
published -> terminal
rejected -> terminal
```

Approval may be allowed directly from `submitted` for small bundles, but only when validation and review gates are clean.
