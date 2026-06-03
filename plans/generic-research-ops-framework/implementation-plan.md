# Implementation Plan

## Status Snapshot

Last updated: 2026-06-02.

Completed:

- Phase 1: Extract the core workflow.
- Phase 2: Domain pack loader.
- Phase 3: Public evidence browser.
- Phase 4: Admin review workspace, including guarded comment, request-changes, approve, reject, and publish actions.
- Phase 5: Agent skills. Core workflow skills and fixture domain adapters exist with read-first lists, workflow rules, boundaries, and test coverage.
- Phase 6: Validation hardening, including schema/cross-reference checks, stale-coverage detection, data-driven route smoke checks, and admin action coverage.
- Downstream domain-pack rehearsal: `software-supply-chain` now has published source-backed baselines for all three configured controls.
- Literature-review domain scaffold: `synthetic-student-responses` now has review-question taxonomy, extraction fields, review lanes, evidence ladder, skill adapters, and a config-driven synthesis matrix report surface.
- Operator guide: documented the concrete downstream domain-pack setup, bootstrap, evidence review, publish, verification, and commit workflow.
- Research tooling improvement pass: added a search-pass CLI, bundle readiness summaries, structured source locators, and typed support-map evidence roles.

In progress / partly complete:

- No required implementation phase is currently in progress.

Next:

- Bootstrap the first `synthetic-student-responses` review question with source-backed literature records.
- Defer Phase 7 until record shapes and operational volume justify a database migration.

Recent implementation commits:

- `efda341`: generic research workflow core.
- `21cdee6`: second fixture pack validation.
- `e413bf7`: shared workbench data layer.
- `543712c`: public evidence browser.
- `01ff786`: methods and activity pages.
- `1e6a84d`: admin review workspace.
- `c0888fe`: admin review actions.
- `7002597`: admin review action hardening.
- `7ed9d07`: agent workflow skills.
- `d14fa96`: stale coverage planning.
- `04d464f`: data-driven route smoke coverage.
- `ff0f410`: admin action coverage.
- `068a17d`: supply-chain provenance baseline.
- `c88d8b9`: dependency exposure baseline.
- `04d5de1`: maintenance signal baseline.

## Phase 1: Extract The Core Workflow

Status: Complete.

Goal:

Create a domain-neutral file-backed framework with one neutral fixture domain.

Tasks:

- Define core schemas for source, artifact, finding, claim, activity item, research session, candidate bundle, evidence review, review comment, publication event, coverage state, and priority queue.
- Port bundle validation from the reference implementation into domain-neutral names.
- Port evidence-review scaffold/apply workflow.
- Port planning-state sync.
- Keep JSON files as the storage layer.

Acceptance criteria:

- A neutral fixture domain can create a candidate bundle with staged records.
- Bundle validation catches broken paths, wrong record IDs, missing references, and missing support maps.
- Evidence-review records can be scaffolded and applied.
- Publication promotes staged records and writes a publication event.

## Phase 2: Domain Pack Loader

Status: Complete.

Goal:

Make the framework configurable through a domain pack.

Tasks:

- Load `domain.json`, taxonomy, evidence ladder, review lanes, and public copy.
- Expose domain config through the app data layer.
- Make route labels and stage labels domain-driven.
- Make required review lanes domain-driven.

Acceptance criteria:

- The same app can run the neutral fixture pack without editing core workflow code.
- The same app can run a second independently authored test pack without editing core workflow code.

## Phase 3: Public Evidence Browser

Status: Complete.

Goal:

Build the inspectable public surface.

Tasks:

- Homepage with domain summary, scope coverage, recent changes, and trust notes.
- Scope index and scope detail pages.
- Source, artifact, finding, and claim detail pages.
- Activity feed.
- Methods page generated partly from domain pack.

Acceptance criteria:

- A user can navigate from a public claim to findings, artifacts, and sources.
- Scope pages show evidence basis and limitations.
- Activity is not presented as proof.

## Phase 4: Admin Review Workspace

Status: Complete.

Goal:

Build the private curation surface.

Tasks:

- Candidate bundle queue.
- Bundle detail page.
- Promotion readiness display.
- Evidence-review readiness display.
- Comment form.
- Approve, reject, request changes, publish actions.

Acceptance criteria:

- A curator can publish a valid reviewed bundle without using the command line.
- Publish is blocked when evidence gates or promotion checks fail.
- Published bundles produce publication events.

## Phase 5: Agent Skills

Status: Complete.

Goal:

Provide agent-operable workflows.

Tasks:

- Create core skills:
  - bootstrap
  - surveillance
  - evidence review
  - editorial review
- Create domain adapters for the neutral fixture pack and at least one second test pack.
- Add read-first lists and bounded workflow rules.

Acceptance criteria:

- An agent can bootstrap one scope unit into a candidate bundle.
- A second pass can review source fidelity.
- A third pass can review interpretation.
- A curator or editorial agent can publish after gates pass.

## Phase 6: Validation Hardening

Status: Complete.

Goal:

Make the framework reliable enough for repeated use.

Tasks:

- Add broad schema validation for all JSON records.
- Add support-map validation for claims.
- Add taxonomy-reference validation.
- Add stale-coverage detection.
- Add smoke checks for affected routes.
- Add broader admin action coverage.

Acceptance criteria:

- `npm run validate` catches schema and cross-reference issues.
- `npm run build` passes with neutral fixture data.
- Published public routes render expected scope labels and claim text.
- Route smoke checks cover collection pages, public detail pages, admin review pages, and both fixture domains.
- Admin action tests cover success and error paths for comments, request changes, rejection, approval, and publication.

## Phase 7: Optional Database Migration

Do not start here.

Only migrate to SQLite or Postgres after:

- record shapes stabilize
- admin workflow is proven
- multiple domains or many records make file-backed operation painful

Even after a database migration, keep exportable JSON snapshots for review and agent workflows.

## Downstream Domain-Pack Rehearsal

Status: Complete.

Goal:

Prove the framework can support a non-fixture domain without changing core workflow code.

Completed:

- Added `software-supply-chain` domain pack.
- Added a `control` scope unit with three configured controls.
- Added domain-specific extraction fields, review lanes, evidence ladder, public copy, and skill adapters.
- Added tests proving the pack loads through the domain loader and route smoke inventory with an empty graph.
- Bootstrapped and published source-backed baseline bundles for `release-provenance-control`, `dependency-exposure-control`, and `maintenance-signal-control`.
- Completed `source_fidelity`, `control_fit`, `risk_framing`, and `operational_boundary` evidence reviews for all published downstream bundles.
- Synced planning state for `software-supply-chain`; all configured controls have fresh baseline coverage and the bootstrap queue is empty.

Next:

- Exercise the operator guide with another downstream domain, or defer Phase 7 until record shapes and operational volume justify a database migration.

## Synthetic Student Response Literature Review

Status: Scaffolded.

Goal:

Support a real literature-review workflow for a paper on LLM-generated synthetic student responses used in automated scorer validation.

Completed:

- Added `synthetic-student-responses` domain pack.
- Added `review_question` scope units for scorer-validation use, generation methods, quality evaluation, model effects, prompt-engineering effects, real-response comparison, and human/AI scoring agreement.
- Added enforced extraction fields that separate response origin, rubric label space, label source, generation method, prompt strategy, evaluation method, scorer use, real-response comparator, reported metrics, limitations, and source locator.
- Added review lanes for source fidelity, construct mapping, method classification, scorer-validation relevance, synthesis overreach, and optional search-protocol review.
- Added `search_protocol` record support for search query, screening, inclusion, exclusion, deduplication, and included-source tracking.
- Added domain skill adapters for bootstrap, surveillance, evidence review, and editorial review.
- Added a config-driven `/reports` synthesis matrix surface with CSV and Markdown export for paper-oriented literature comparison.

Next:

- Bootstrap one review question at a time, starting with `ssr-scoring-validation-use`.
- Stage each paper as a source, each study design or synthetic-response pipeline as an artifact, extracted results as findings, and background-section conclusions as synthesis claims.
- Exercise the `search_protocol` shape during the first search pass and refine fields if screening decisions need more structure.

## First Build Guidance

Build the generic framework by porting durable workflow mechanics from the reference implementation, not by preserving its domain vocabulary.

Suggested first target:

1. Rename reference-app-specific concepts to domain-neutral concepts.
2. Keep the candidate bundle and evidence-review CLI logic.
3. Keep the Next.js app structure.
4. Add a domain-pack loader.
5. Implement one neutral `sample-research` fixture pack as the first proof.
6. Implement one second fixture pack with different labels, review lanes, and extraction fields as the second proof.

If both fixture packs work without changing core workflow code, the architecture is probably correctly separated. Real domain packs should be downstream examples, not prerequisites for the core.
