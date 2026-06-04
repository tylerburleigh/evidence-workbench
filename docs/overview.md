# Framework Overview

Evidence Workbench is a domain-configurable framework for agent-assisted research.

The goal is not to clone any particular research domain. The goal is to give agentic research a durable, inspectable structure:

```text
domain taxonomy
  -> bounded research sessions
  -> structured evidence records
  -> staged candidate bundles
  -> evidence review gates
  -> editorial approval
  -> published evidence browser
  -> canonical report integration
  -> surveillance queue
```

## Intended Product

Build a file-backed research workbench for domains where claims must be traceable, reviewable, and updateable.

Possible downstream domains include any area where public claims need traceable evidence and controlled updates. Domain vocabulary should generally live in domain packs or research branches, not in core workflow code:

- scientific or technical evidence curation
- policy, market, or product research
- internal knowledge-base curation

The framework supports multiple domain packs, but the current implementation runs one active domain at a time.

## Document Map

- [architecture.md](architecture.md): system layers, repo layout, and module boundaries
- [data-model.md](data-model.md): core records and relationships
- [domain-packs.md](domain-packs.md): how a new research domain customizes the framework
- [workflows.md](workflows.md): bootstrap, surveillance, evidence review, publish, planning sync, and report-integration workflows
- [ui.md](ui.md): current public evidence browser and admin review workspace
- [agent-skills.md](agent-skills.md): reusable agent skills and domain-specific adapters
- [operator-guide.md](operator-guide.md): concrete downstream domain-pack setup, publish, verify, and commit workflow
- [branching-strategy.md](branching-strategy.md): how to keep reusable platform changes separate from domain-specific research branches
- [case-studies/synthetic-student-responses.md](case-studies/synthetic-student-responses.md): lessons from the first real literature-review branch

## What To Preserve From This Repo

The implementation has several design choices worth preserving:

- Research work is bounded by a stable taxonomy unit.
- Research output does not directly change public records.
- Proposed changes are staged under a bundle-specific directory.
- Candidate bundles are the reviewable unit.
- Evidence reviews are structured records, not prose-only comments.
- Publication writes an event record and promotes staged records through a controlled path.
- Current report artifacts stay canonical for their domain, type, and scope; additive synthesis updates, supersedes, or remains a labeled sidecar.
- Coverage state and priority queues are generated from source records, sessions, bundles, and publication history.
- Public pages separate source evidence from curator interpretation and domain-defined context.
- Agent skills encode workflow discipline around scope, extraction, review, and publishing.

## Current Repo Paths

Use these existing paths as implementation references:

- `domain-packs/`: domain taxonomy, extraction fields, review lanes, public copy, and skill adapters
- `schemas/`: JSON Schema contracts
- `data/sources`, `data/artifacts`, `data/findings`, `data/claims`: public evidence graph
- `data/candidate-bundles`: reviewable staged changes
- `data/staged-records/<bundle-id>/`: proposed records before publication
- `data/evidence-reviews`: structured verification passes
- `data/publication-events`: publish audit trail
- `research/state` and `research/backlog`: generated planning state
- `research/sessions`: bounded research pass logs
- `research/syntheses`: traceable Markdown synthesis reports
- `skills/`: reusable agent operating procedures
- `scripts/bundle.mjs`: bundle validation, approval, publish, and smoke checks
- `scripts/review-evidence.mjs`: evidence-review scaffold and apply flow
- `src/lib/`: app-facing data access and mutation layer

## Non-Goals

- Do not build a social product.
- Do not auto-publish model outputs.
- Do not optimize first for a chat interface.
- Do not require a database before the file-backed model proves out.
- Do not make the domain ontology invisible; it is the backbone of scoping, review, and navigation.
