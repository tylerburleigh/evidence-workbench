# Evidence Workbench

Evidence Workbench is a file-backed research operations framework for building traceable evidence graphs, reviewing proposed evidence changes, publishing bounded claims, and maintaining research coverage over time.

The core pattern is:

```text
domain taxonomy
  -> bounded research sessions
  -> structured evidence records
  -> staged candidate bundles
  -> evidence review gates
  -> editorial approval
  -> published evidence browser
  -> report integration
  -> surveillance queue
```

The repo is intentionally split between reusable workbench machinery and domain-specific research output. `main` should stay usable as the stable platform branch. Active research corpora should usually live on `research/*` branches unless they are intentionally promoted as maintained examples.

## Quick Start

Install dependencies:

```bash
npm install
```

Validate records and run tests:

```bash
npm run validate
npm test
```

Run the local app:

```bash
npm run dev
```

The default active domain is configured in `workbench.config.json`. Override it for commands with `WORKBENCH_DOMAIN=<domain-id>`.

## What Is In `main`

`main` contains the reusable framework, fixtures, and maintained examples needed to exercise the workflow:

- core Next.js app and public/admin routes in `src/`
- JSON schemas in `schemas/`
- workflow CLIs in `scripts/`
- reusable agent skills in `skills/`
- domain packs in `domain-packs/`
- fixture/example records in `data/`
- planning state and sessions in `research/`
- framework documentation in `plans/generic-research-ops-framework/`

The neutral default fixture is `sample-research`. `sample-archive` exercises a second fixture shape. `software-supply-chain` is a maintained example domain currently present on `main`. The synthetic student responses pack on `main` is a scaffold; populated SSR literature-review records belong on the corresponding `research/*` branch.

## Common Commands

Validate every JSON record against schemas and cross-reference rules:

```bash
npm run validate
```

Run the test suite:

```bash
npm test
```

Inspect planning queues for the active domain:

```bash
npm run research:planning -- status
npm run research:planning -- next
```

Scaffold or update search protocols:

```bash
npm run research:search -- --help
```

Inspect, approve, or publish candidate bundles:

```bash
npm run research:bundle -- --help
```

Audit a branch split before promoting changes to `main`:

```bash
npm run branch:audit -- --base main --head HEAD
```

## Documentation Map

Start with the framework plan:

- [Framework overview](plans/generic-research-ops-framework/README.md)
- [Architecture](plans/generic-research-ops-framework/architecture.md)
- [Data model](plans/generic-research-ops-framework/data-model.md)
- [Domain pack contract](plans/generic-research-ops-framework/domain-pack-contract.md)
- [Workflow spec](plans/generic-research-ops-framework/workflow-spec.md)
- [Agent skill model](plans/generic-research-ops-framework/agent-skill-model.md)
- [Operator guide](plans/generic-research-ops-framework/operator-guide.md)
- [Branching strategy](plans/generic-research-ops-framework/branching-strategy.md)
- [Implementation plan](plans/generic-research-ops-framework/implementation-plan.md)

## Repository Layout

```text
data/                         Published and staged evidence records
domain-packs/                 Domain taxonomies, review lanes, copy, and skill adapters
plans/generic-research-ops-framework/
                              Framework design and operating docs
research/                     Research sessions, planning state, and syntheses
schemas/                      JSON Schema contracts
scripts/                      Validation, planning, search, bundle, and audit CLIs
skills/                       Reusable agent workflow skills
src/                          Next.js public/admin workbench
tests/                        Node test suite
workbench.config.json         Default active domain
```

## Branching Model

Use branches to keep reusable workbench changes separate from domain-specific research output:

- `main`: stable platform, fixtures, schemas, reusable skills, docs, tests
- `core/<feature>`: short-lived branches for reusable framework improvements
- `research/<domain-or-question>`: long-lived branches for domain corpora, syntheses, sessions, and generated planning state

When a research branch produces a reusable improvement, harvest it into a `core/*` branch from `main`, validate it, merge it back to `main`, then merge `main` back into the research branch. See the [branching strategy](plans/generic-research-ops-framework/branching-strategy.md) for the full process.

