# Implementation Plan

## Phase 1: Extract The Core Workflow

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

Goal:

Build the inspectable public surface.

Tasks:

- Homepage with domain summary, topic coverage, recent changes, and trust notes.
- Topic index and topic detail pages.
- Source, artifact, finding, and claim detail pages.
- Activity feed.
- Methods page generated partly from domain pack.

Acceptance criteria:

- A user can navigate from a public claim to findings, artifacts, and sources.
- Topic pages show evidence basis and limitations.
- Activity is not presented as proof.

## Phase 4: Admin Review Workspace

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

- An agent can bootstrap one topic into a candidate bundle.
- A second pass can review source fidelity.
- A third pass can review interpretation.
- A curator or editorial agent can publish after gates pass.

## Phase 6: Validation Hardening

Goal:

Make the framework reliable enough for repeated use.

Tasks:

- Add broad schema validation for all JSON records.
- Add support-map validation for claims.
- Add taxonomy-reference validation.
- Add stale-coverage detection.
- Add smoke checks for affected routes.

Acceptance criteria:

- `npm run validate` catches schema and cross-reference issues.
- `npm run build` passes with neutral fixture data.
- Published public routes render expected topic labels and claim text.

## Phase 7: Optional Database Migration

Do not start here.

Only migrate to SQLite or Postgres after:

- record shapes stabilize
- admin workflow is proven
- multiple domains or many records make file-backed operation painful

Even after a database migration, keep exportable JSON snapshots for review and agent workflows.

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
