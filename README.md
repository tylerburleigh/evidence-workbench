# Evidence Workbench

Evidence Workbench helps people organize research when the answer needs to be traceable.

It is designed for work where a team cannot just write a summary and move on. The team needs to know which sources support each claim, what evidence was reviewed, what still needs checking, who approved a change, and when a topic should be revisited.

The current implementation stores the work as plain repository files: JSON records for evidence and review state, plus Markdown for synthesis reports. A local web app turns those records into a browsable evidence workspace.

## Why It Exists

Research projects often become hard to trust over time. Sources live in one place, notes in another, claims in a document, review comments in chat, and updates in someone's memory. After a few rounds of work, it can be hard to answer basic questions:

- What claim are we making?
- Which sources support it?
- What does each source actually say?
- What are the limits of the evidence?
- Has anyone reviewed this before publication?
- What changed since the last review?
- Is this topic fresh, stale, or still uncovered?

Evidence Workbench gives that work a repeatable structure. It separates source-backed observations from interpretation, keeps proposed changes staged until review, and records publication history so later updates have context.

## What It Can Help With

Evidence Workbench is useful for research and knowledge work where accuracy, traceability, and revision history matter. Examples include:

- literature reviews
- policy or market research
- product and technical research
- internal knowledge-base curation
- standards or compliance evidence review
- domain-specific evidence maps

It is not meant to decide what is true automatically. It is meant to make the research process inspectable, reviewable, and easier to update.

## How It Works

A project starts with a domain: the subject area being researched. Each domain has a taxonomy, which breaks the work into smaller topics or questions. Research then moves through a controlled path:

1. Choose one bounded topic or question.
2. Gather sources.
3. Extract source-backed findings.
4. Draft claims or report sections that stay within the evidence.
5. Stage the proposed changes in a candidate bundle.
6. Review the bundle through structured review lanes.
7. Publish approved records to the evidence graph.
8. Track what is covered, what is stale, and what should be researched next.

The public side of the app lets people browse claims, findings, sources, reports, and methods. The admin side supports review and publication workflows.

## Key Ideas

- **Source**: where evidence came from, such as a paper, specification, report, dataset, or official page.
- **Artifact**: the object or study setup extracted from a source.
- **Finding**: a specific source-backed observation.
- **Claim**: a public interpretation that must point back to findings and sources.
- **Candidate bundle**: a proposed set of changes waiting for review.
- **Evidence review**: a structured check before publication.
- **Report artifact**: a Markdown synthesis or literature review connected to the evidence graph.
- **Planning state**: generated queues showing what needs bootstrap research or surveillance updates.
- **Domain pack**: the configuration that adapts the workbench to a subject area.

## What Is In This Repository

The `main` branch is intended to hold the reusable workbench platform, not every active research project.

It contains:

- the local web app
- schemas for evidence records
- command-line tools for validation, planning, search, review, publication, and branch audits
- reusable agent skills
- fixture and example domain packs
- framework documentation

The default domain is `sample-research`, a neutral fixture used to exercise the workflow. `sample-archive` provides a second fixture shape. `software-supply-chain` is currently present as a maintained example domain. The synthetic student responses domain on `main` is a scaffold; the populated literature-review corpus lives on a research branch.

Active research corpora should usually live on `research/*` branches. Reusable improvements discovered during research should be harvested into `core/*` branches and then merged back to `main`.

## Quick Start For Operators

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

## Common Commands

Validate every JSON record and cross-reference:

```bash
npm run validate
```

Inspect planning queues for the active domain:

```bash
npm run research:planning -- status
npm run research:planning -- next
```

Work with search protocols:

```bash
npm run research:search -- --help
```

Inspect, approve, or publish candidate bundles:

```bash
npm run research:bundle -- --help
```

Audit a branch before promoting changes to `main`:

```bash
npm run branch:audit -- --base main --head HEAD
```

## Documentation Map

The detailed framework documentation lives under `plans/generic-research-ops-framework/`:

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

Use branches to keep platform improvements separate from research output:

- `main`: stable platform, fixtures, schemas, reusable skills, docs, and tests
- `core/<feature>`: short-lived branches for reusable workbench improvements
- `research/<domain-or-question>`: long-lived branches for domain corpora, syntheses, sessions, and generated planning state

When a research branch produces a reusable improvement, harvest it into a `core/*` branch from `main`, validate it, merge it back to `main`, then merge `main` back into the research branch. See the [branching strategy](plans/generic-research-ops-framework/branching-strategy.md) for the full process.

