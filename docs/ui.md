# UI Guide

Evidence Workbench has two UI surfaces:

- a public evidence browser for published records and report artifacts
- an admin review workspace for candidate bundles before publication

The UI is intentionally work-focused. It should help readers inspect evidence, trace claims back to sources, and see review state without needing to reconstruct the work from chat history or raw JSON files.

## Public Surface

The public surface reads from the active domain pack and published evidence graph.

Current routes:

```text
/
/scope
/scope/[nodeId]
/sources
/sources/[sourceId]
/artifacts
/artifacts/[artifactId]
/findings
/findings/[findingId]
/claims
/claims/[claimId]
/activity
/methods
/reports
/reports/[reportId]
/reports/matrix.csv
/reports/matrix.md
```

The homepage gives the reader a compact state-of-the-domain view:

- domain summary from the active domain pack
- coverage metrics for configured scope units
- current literature review, when one is indexed as a report artifact
- related report outputs
- topic coverage cards
- recent candidate bundle activity
- published claim cards
- record index links for scope units, claims, findings, sources, artifacts, activity, reports, methods, and review

## Scope Pages

`/scope` lists the active domain taxonomy and coverage status.

`/scope/[nodeId]` shows one bounded scope unit with:

- summary and coverage status
- linked claims
- bundle state for that scope
- claim support-map entries
- findings
- artifacts
- sources

The page is meant to answer what is covered for this topic, what evidence supports the current claims, and whether there is still active review work.

## Record Detail Pages

The record detail pages expose the evidence graph one record at a time.

Source pages show source identity, access status, linked artifacts, linked findings, and external source URLs when available.

Artifact pages show extracted study, framework, dataset, method, or report records and their linked findings.

Finding pages show the atomic source-backed observation, evidence tier, confidence, endpoint, direction, context, quantitative notes, caveats, source link, artifact link, and scope links.

Claim pages show the public interpretation, support map, supporting sources, confidence, limitations, and linked findings.

The important distinction is that findings describe what a source supports; claims describe the curated interpretation built from findings.

## Reports

`/reports` is the app-visible entry point for synthesis artifacts.

It shows:

- source, artifact, finding, claim, report, and search-protocol metrics
- source access audit
- synthesis matrix, when configured by the domain pack
- report artifact index, including literature reviews
- links to synthesis inputs
- search protocol summaries
- access-limited screened source records

`/reports/[reportId]` renders an indexed report artifact from Markdown and preserves its connection to evidence records through the report artifact metadata.

The CSV and Markdown matrix routes expose the configured synthesis matrix for reuse outside the UI.

## Methods And Activity

`/methods` explains the trust model for the active domain:

- what counts as source evidence
- how curator interpretation is separated from source facts
- how the domain pack defines evidence tiers and labels
- how review and publication work
- what the workbench is not claiming to do

`/activity` shows publication and bundle activity so readers can see what changed recently.

## Admin Review Workspace

The admin review workspace is available at:

```text
/admin/review
/admin/review/[bundleId]
```

`/admin/review` lists candidate bundles with status, scope, intake mode, submitted date, revision number, required review lanes, missing lanes, blocking findings, promotion readiness, and proposed change count.

`/admin/review/[bundleId]` shows the reviewable unit in detail:

- validation readiness
- promotion readiness
- evidence-review gate state
- publication readiness
- review comments
- request-changes, approve, reject, publish, and comment actions
- scope and research question
- required and completed review lanes
- workflow audit
- staged and target file paths for proposed changes
- evidence reviews and structured review findings
- publication events
- next actions

The current UI does not have a separate "start review" action. Bundles enter the review workspace through their lifecycle status and staged records; reviewers can request changes, approve, reject, publish, and add comments from the bundle detail page.

## Domain Configuration

The UI adapts to the active domain pack. Domain packs provide:

- domain name and summary
- scope unit labels
- taxonomy nodes
- public copy and empty-state text
- evidence ladder labels
- report and synthesis matrix configuration
- review lanes

Optional domain-specific entity routes are not implemented in the current app. Domain-specific concepts should first be represented through taxonomy, records, extraction fields, report artifacts, or domain pack copy. Add entity routes only when a domain has a repeated object type that cannot be handled clearly by the generic records.

## Empty States

Empty states should help users distinguish different kinds of absence:

- no taxonomy node exists
- taxonomy node exists but has no baseline coverage
- baseline exists but no recent activity
- source exists but no extracted findings yet
- report artifacts are not indexed
- search protocols have not been published
- bundle exists but evidence review is missing

"Not researched yet" is different from "researched and no signal found." UI copy should preserve that distinction.

## Design Principles

- Make evidence inspectable before asking users to trust conclusions.
- Keep activity visually separate from evidence.
- Keep interpretation visibly separate from source-backed findings.
- Show uncertainty near the claim it qualifies.
- Make literature reviews and other report artifacts first-class navigation targets.
- Prefer dense, scannable operational UI over marketing-style pages.
- Do not hide the staged/public distinction in admin views.
- Keep the public browser useful even when the admin workspace is not exposed.
