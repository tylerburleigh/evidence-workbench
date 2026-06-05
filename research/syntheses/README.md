# Synthesis Reports

Use this directory for Markdown synthesis reports that summarize already-published evidence records across one domain or a bounded set of taxonomy scope units.

Synthesis reports are not public evidence claims by themselves. They should trace every conclusion to published claim, finding, source, evidence-appraisal, or publication-event IDs. When a report needs new evidence, create a candidate bundle through the baseline-review or review-update workflow instead of editing the report into an unsupported claim.

Index report files with `data/report-artifacts/<report-id>.json` when they should appear in the app. The index record should include `domain_id`, `scope_ids`, `artifact_type`, `path`, `source_ids`, `claim_ids`, and citation-audit status where applicable.

## Canonical Reports And Sidecars

A `report_artifact` with `status: "current"` is the canonical report for its `domain_id`, `artifact_type`, and scope. Keep at most one current `literature_review` for the same domain and paper-facing scope unless the audience or section boundary is intentionally different and documented in the record summary.

Use short per-question or per-bundle syntheses as sidecar memos when they help interpret new work before it is ready to merge. A sidecar should stay unindexed, or be indexed as `status: "draft"`, unless it is intentionally promoted as a separate app-visible report. Sidecars based on submitted, staged, or otherwise unpublished records must say so near the top of the Markdown file.

Each sidecar should include a disposition note that names the intended target report, the event that should trigger integration, and whether the sidecar should be archived, deleted, or kept as traceability after integration.

After a bundle represented in a sidecar is published, update the affected current report artifact by default. If the update needs a new file instead of an in-place revision, create a new report artifact with `status: "current"` and mark the replaced artifact as `status: "superseded"` or `status: "archived"`. Do not leave parallel current literature reviews for the same scope as an accidental byproduct of additive synthesis.

Recommended file name:

```text
<domain-id>-synthesis-<yyyy-mm-dd>.md
```

Recommended structure:

```text
# <Title>

Date:
Domain:
Scope:

## Evidence Inventory
## Question Status
## Cross-cutting Conclusions
## Strength of Evidence
## Open Questions
## Next Actions
## Traceability
```

For sidecar memos, also add:

```text
## Disposition
```
