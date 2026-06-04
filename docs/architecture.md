# Architecture

## Summary

The generic framework should be a small, inspectable research operations system with a public evidence browser and a private review workspace.

The core should be domain-neutral. Domain packs should provide taxonomy, rubrics, labels, evidence ladders, extraction fields, and agent instructions.

## Layers

### 1. Domain Pack

Defines the research domain.

Responsibilities:

- taxonomy units used for scoping and navigation
- evidence ladder or maturity scale
- source and artifact types
- extraction fields
- appraisal criteria
- appraisal lanes
- public labels and explanatory text
- domain-specific agent instructions

The core should treat every domain pack as data. A pack may model compounds, policies, products, methods, datasets, or any other research unit, but those concepts must not become core code paths.

### 2. Evidence Graph

Stores the public, published knowledge layer.

Core collections:

- `sources`
- `artifacts`
- `findings`
- `claims`
- `activity-items`
- optional domain-owned entity collections, depending on the pack

All public claims must be traceable to findings and sources.

### 3. Research Ops State

Stores internal planning state.

Core collections:

- `research/sessions`
- `research/state/coverage-status.v1.json`
- `research/backlog/priority-queue.v1.json`

The queue should be generated, not hand-maintained. It should answer:

- what has baseline coverage?
- what is in active review?
- what is stale?
- what should be baselined next?
- what should be surveilled next?

### 4. Candidate Bundle Layer

Research agents stage proposed public changes without publishing them.

Core paths:

- `data/candidate-bundles/<bundle-id>.json`
- `data/staged-records/<bundle-id>/*.json`

A bundle should contain:

- scope
- intake mode
- proposed changes
- target live paths
- staged paths
- evidence appraisal requirements
- source IDs and URLs
- next actions
- lifecycle status

### 5. Evidence Appraisal Layer

Evidence appraisal is a structured gate between research output and editorial approval.

The framework should support appraisal lanes like:

- `source_fidelity`
- `interpretation`
- `limitations`
- `taxonomy_mapping`
- optional domain-defined appraisal lanes

Domain packs may rename or add lanes, but every review should produce machine-readable findings.

### 6. Editorial Publish Layer

Publication is explicit and auditable.

Publishing should:

- require an approved bundle
- validate staged files
- promote staged records to live public paths
- write a publication event
- update the bundle status to `published`
- regenerate research planning state

No agent should directly edit live public records as a substitute for publishing.

### 7. User Interfaces

The public UI inspects published records.

The admin UI manages:

- candidate queue
- bundle detail
- promotion readiness
- evidence-appraisal state
- comments
- approval
- publication

The first UI implementation can be a Next.js app, but the workflow core should not depend on the UI framework.

## Recommended File Layout

```text
domain-packs/
  sample-research/
    domain.json
    taxonomy.v1.json
    evidence-ladder.v1.json
    extraction-schema.v1.json
    appraisal-lanes.v1.json
    public-copy.v1.json
    skills/
  <domain-id>/
    domain.json
    taxonomy.v1.json
    evidence-ladder.v1.json
    extraction-schema.v1.json
    appraisal-lanes.v1.json
    public-copy.v1.json
    schemas/
    rubrics/
    skills/

schemas/
  core/
  domain/

data/
  sources/
  artifacts/
  findings/
  claims/
  activity-items/
  candidate-bundles/
  evidence-appraisals/
  editorial-comments/
  publication-events/
  staged-records/

research/
  sessions/
  state/
  backlog/
  drafts/
  syntheses/

scripts/
  bundle.mjs
  appraise-evidence.mjs
  sync-research-planning.mjs
  validate-records.mjs

src/
  app/
  components/
  lib/
```

## Core Boundary

Keep the core framework responsible for workflow mechanics:

- reading and writing JSON records
- validating bundle paths and record IDs
- enforcing lifecycle transitions
- applying evidence-appraisal gates
- publishing staged records
- deriving coverage state

Keep domain packs responsible for:

- what the taxonomy means
- what fields are required for extraction
- what counts as stronger evidence
- what appraisal lanes are required
- how claims are worded and bounded

## V0 Storage Choice

Use file-backed JSON first.

Reasons:

- easy to review in git
- easy for agents to modify safely
- simple provenance and diffs
- low operational complexity

The framework can later add SQLite or Postgres after the record model stabilizes.
