# Lit Review Studio

Lit Review Studio is a framework for agent-assisted research.

It is designed for situations where a user wants an AI agent to help research a topic, but does not want the result to be a black-box answer, a long chat transcript, or a loose pile of notes. The studio gives agentic research a durable shape: sources, extracted findings, supported claims, review steps, synthesis reports, planning queues, and a browsable web interface.

The point is not to let an agent decide what is true on its own. The point is to make the agent's research work decomposed, observable, reviewable, and easy for a person to inspect.

## Why It Exists

LLM-assisted research can be useful, but it is often hard to audit. A model can produce a polished answer without making the work behind it easy to inspect: which sources were considered, what was extracted from each source, what was excluded, what claims are actually supported, and what still needs review.

Traditional notes and wiki pages have a related problem. They can be readable, but they often hide how the page was produced and how it should be updated later.

Lit Review Studio sits between those modes. It lets an agent help with research, while turning the work into structured records and readable pages. After a few rounds of work, a user should still be able to answer:

- What claim are we making?
- Which sources support it?
- What does each source actually say?
- What are the limits of the evidence?
- Has anyone reviewed this before publication?
- What changed since the last review?
- Is this topic fresh, stale, or still uncovered?

That structure matters because research is rarely finished after one answer. It needs review, correction, synthesis, follow-up, and later review update.

## What The Framework Provides

Lit Review Studio combines four parts:

- **Data models** for sources, artifacts, findings, claims, appraisals, bundles, reports, and planning state.
- **Workflows** for search, extraction, appraisal, publication, synthesis, and review update.
- **Agent skills** that guide an AI assistant through bounded research tasks.
- **A web UI** for browsing the resulting evidence graph, reports, methods, and appraisal state.

Those parts are meant to work together. The agent has a workflow to follow. The output has a schema. Reviewers have specific checks to perform. Readers have pages they can browse instead of reconstructing the work from a transcript.

## What It Can Help With

Lit Review Studio is useful for research and knowledge work where accuracy, traceability, and revision history matter. Examples include:

- literature reviews
- policy or market research
- product and technical research
- internal knowledge-base curation
- standards or compliance evidence appraisal
- domain-specific evidence maps

It can be thought of as a variant of an LLM wiki or an agentic research workspace: the agent can help build the knowledge base, but the result is structured enough for people to inspect and maintain.

## How It Works

A project starts with a domain: the subject area being researched. Each domain has a taxonomy, which breaks the work into smaller topics or questions. The agent works on one bounded question at a time, and the work moves through a controlled path:

1. Choose one bounded topic or question.
2. Search for and gather sources.
3. Extract source-backed findings.
4. Draft claims or report sections that stay within the evidence.
5. Stage the proposed changes in a candidate bundle.
6. Review the bundle through structured appraisal lanes.
7. Publish approved records to the evidence graph.
8. Track what is covered, what is stale, and what should be researched next.

The public side of the app lets people browse claims, findings, sources, reports, and methods. The admin side supports appraisal and publication workflows. The repository stores the underlying records as plain files so the work can be versioned, audited, branched, and reviewed.

## Key Ideas

- **Source**: where evidence came from, such as a paper, specification, report, dataset, or official page.
- **Artifact**: the object or study setup extracted from a source.
- **Finding**: a specific source-backed observation.
- **Claim**: a public interpretation that must point back to findings and sources.
- **Candidate bundle**: a proposed set of changes waiting for review.
- **Evidence appraisal**: a structured check before publication.
- **Report artifact**: a Markdown synthesis or literature review connected to the evidence graph.
- **Planning state**: generated queues showing what needs baseline review research or review updates.
- **Domain pack**: the configuration that adapts the studio to a subject area.

## What Is In This Repository

The `main` branch is intended to hold the reusable studio platform, not every active research project.

It contains:

- the local web app
- schemas for evidence records
- command-line tools for validation, planning, search, appraisal, publication, and branch audits
- reusable agent skills
- workflow documentation
- fixture and example domain packs

The default domain is `sample-research`, a neutral fixture used to exercise the workflow. `sample-archive` provides a second fixture shape. `software-supply-chain` is currently present as a maintained example domain. The synthetic student responses domain on `main` is a scaffold; the populated literature-review corpus lives on a research branch.

Active research corpora should usually live on `research/*` branches. Reusable improvements discovered during research should be harvested into `core/*` branches and then merged back to `main`.

## Getting Started With Your Own Use Case

Most users should not start by editing JSON files by hand. Start by using the existing samples to understand the shape of the system, then work with an agent to adapt the framework to your own research domain.

A practical first path looks like this:

1. **Clone or fork the repo.**
   Run the app with the default `sample-research` domain so you can see how sources, findings, claims, reports, appraisal state, and planning queues appear in the UI.

2. **Describe the research job in ordinary language.**
   Tell the agent what kind of research you want the studio to support, who the audience is, what kinds of sources matter, what questions you expect to answer, and what would make a claim trustworthy.

3. **Create a domain pack before doing research.**
   The domain pack is the foundation for a new use case. It defines the topic taxonomy, evidence ladder, extraction fields, appraisal lanes, public labels, and domain-specific agent instructions. This is where the studio becomes specific to a literature review, policy area, product research workflow, or other domain.

4. **Keep the first version small.**
   Start with a few scope units in the taxonomy and one bounded research question. The goal is to prove that the structure fits the domain before building a large corpus.

5. **Run one complete research pass.**
   Have the agent gather sources, extract findings, stage records in a candidate bundle, complete evidence appraisals, publish approved records, and sync planning state. This first pass tests the full loop.

6. **Use the UI to inspect the result.**
   Browse the claim pages, source pages, report pages, methods page, and admin appraisal state. The UI is part of the research process: it shows whether the agent's work is understandable and whether the evidence can be audited.

7. **Adjust the domain pack and workflows.**
   If the first pass exposes missing extraction fields, unclear appraisal lanes, awkward labels, or unsupported source types, update the domain pack and tests before scaling up.

8. **Separate reusable improvements from research output.**
   If adapting the studio requires a feature that would help every domain, put that work on a `core/*` branch. Keep domain-specific records, reports, and planning state on a `research/*` branch.

A useful prompt for the agent is:

```text
I want to adapt Lit Review Studio for <research domain>. Read the README, domain pack contract, operator guide, and branching strategy. Help me design a small first domain pack, choose one bounded research question, and run one complete research pass. Keep reusable platform changes separate from domain-specific research records.
```

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

The default active domain is configured in `lit-review-studio.config.json`. Override it for commands with `LIT_REVIEW_STUDIO_DOMAIN=<domain-id>`.

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

The durable framework documentation lives under `docs/`:

- [Framework overview](docs/overview.md)
- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Domain packs](docs/domain-packs.md)
- [Workflows](docs/workflows.md)
- [UI guide](docs/ui.md)
- [Agent skills](docs/agent-skills.md)
- [Operator guide](docs/operator-guide.md)
- [Branching strategy](docs/branching-strategy.md)
- [Synthetic student responses case study](docs/case-studies/synthetic-student-responses.md)

## Repository Layout

```text
data/                         Published and staged evidence records
docs/                         Durable framework and operator documentation
domain-packs/                 Domain taxonomies, appraisal lanes, copy, and skill adapters
research/                     Research sessions, planning state, and syntheses
schemas/                      JSON Schema contracts
scripts/                      Validation, planning, search, bundle, and audit CLIs
skills/                       Reusable agent workflow skills
src/                          Next.js public/admin studio
tests/                        Node test suite
lit-review-studio.config.json         Default active domain
```

## Branching Model

Use branches to keep platform improvements separate from research output:

- `main`: stable platform, fixtures, schemas, reusable skills, docs, and tests
- `core/<feature>`: short-lived branches for reusable studio improvements
- `research/<domain-or-question>`: long-lived branches for domain corpora, syntheses, sessions, and generated planning state

When a research branch produces a reusable improvement, harvest it into a `core/*` branch from `main`, validate it, merge it back to `main`, then merge `main` back into the research branch. See the [branching strategy](docs/branching-strategy.md) for the full process.
