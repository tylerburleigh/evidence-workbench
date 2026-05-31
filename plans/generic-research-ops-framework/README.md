# Generic Research Ops Framework

This directory describes a domain-configurable research operations framework derived from a prior reference app.

The goal is not to clone any particular research domain. The goal is to preserve the durable pattern:

```text
domain taxonomy
  -> bounded research sessions
  -> structured evidence records
  -> staged candidate bundles
  -> evidence review gates
  -> editorial approval
  -> published evidence browser
  -> surveillance queue
```

## Intended Product

Build a file-backed research workbench for domains where claims must be traceable, reviewable, and updateable.

Possible downstream domains include any area where public claims need traceable evidence and controlled updates. These examples must not be encoded into the core:

- scientific or technical evidence curation
- policy, market, or product research
- internal knowledge-base curation

The framework should support multiple domain packs, but the first implementation can run one active domain at a time.

## Document Map

- [architecture.md](architecture.md): system layers, repo layout, and module boundaries
- [data-model.md](data-model.md): core records and relationships
- [domain-pack-contract.md](domain-pack-contract.md): how a new research domain customizes the framework
- [workflow-spec.md](workflow-spec.md): bootstrap, surveillance, evidence review, and publish workflows
- [agent-skill-model.md](agent-skill-model.md): reusable agent skills and domain-specific adapters
- [ui-spec.md](ui-spec.md): public and admin app surfaces
- [implementation-plan.md](implementation-plan.md): pragmatic build phases and acceptance criteria

## What To Preserve From This Repo

The reference implementation has several design choices worth carrying forward:

- Research work is bounded by a stable taxonomy unit.
- Research output does not directly change public records.
- Proposed changes are staged under a bundle-specific directory.
- Candidate bundles are the reviewable unit.
- Evidence reviews are structured records, not prose-only comments.
- Publication writes an event record and promotes staged records through a controlled path.
- Coverage state and priority queues are generated from source records, sessions, bundles, and publication history.
- Public pages separate source evidence from curator interpretation and domain-defined context.
- Agent skills encode workflow discipline around scope, extraction, review, and publishing.

## Current Repo Analogue

Use these existing paths as implementation references:

- `taxonomies/`: domain taxonomy
- `schemas/`: JSON Schema contracts
- `data/sources`, `data/artifacts`, `data/findings`, `data/claims`: public evidence graph
- `data/candidate-bundles`: reviewable staged changes
- `data/staged-records/<bundle-id>/`: proposed records before publication
- `data/evidence-reviews`: structured verification passes
- `data/publication-events`: publish audit trail
- `research/state` and `research/backlog`: generated planning state
- `research/sessions`: bounded research pass logs
- `.codex/skills`: agent operating procedures
- `scripts/bundle.mjs`: bundle validation, approval, publish, and smoke checks
- `scripts/review-evidence.mjs`: evidence-review scaffold and apply flow
- `src/lib/`: app-facing data access and mutation layer

## Non-Goals For V0

- Do not build a social product.
- Do not auto-publish model outputs.
- Do not optimize first for a chat interface.
- Do not require a database before the file-backed model proves out.
- Do not make the domain ontology invisible; it is the backbone of scoping, review, and navigation.
