# Branching Strategy

## Purpose

Use branches to separate reusable workbench improvements from domain-specific research output.

The workbench is meant to support many research areas. A research branch can accumulate a large evidence graph, but `main` should stay usable as the stable, reusable platform.

## Branch Roles

### `main`

Stable platform branch.

`main` should contain:

- generic workflow code
- schemas
- UI surfaces
- core and fixture tests
- domain-pack contracts and operator docs
- neutral or intentionally maintained fixture domains
- reusable skills

`main` should avoid carrying a large active research corpus unless that corpus is intentionally maintained as a product demo.

### `core/<feature>`

Short-lived platform-improvement branches.

Use these when a research branch reveals a reusable need, such as:

- report rendering
- source-access audits
- search protocol workflow
- evidence review gates
- synthesis/report integration helpers
- UI discoverability improvements

Merge these back to `main` after validation. Then merge or rebase `main` back into active research branches.

### `research/<domain-or-question>`

Long-lived research branches or worktrees.

Use these for domain-specific work:

- source records
- artifacts
- findings
- claims
- candidate bundles
- staged records
- evidence reviews
- publication events
- research sessions
- domain-specific syntheses
- generated planning state

Examples:

- `research/synthetic-student-responses`
- `research/software-supply-chain`
- `research/<new-domain>`

Research branches may be pushed and shared, but they should not be merged wholesale into `main` unless the goal is to make that domain corpus part of the product.

## Harvest Flow

When a research branch produces reusable improvements:

1. Keep the research branch intact.
2. Create a new branch from `main`, for example:

   ```bash
   git switch main
   git pull
   git switch -c core/<feature-name>
   ```

3. Audit the research branch diff:

   ```bash
   npm run branch:audit -- --base main --head research/<domain-or-question>
   ```

4. Bring over only the reusable platform files.
5. Replace any domain-specific tests with fixture-domain tests where practical.
6. Run:

   ```bash
   npm run validate
   npm test
   git diff --check
   ```

7. Merge the core branch into `main`.
8. Merge or rebase `main` back into the research branch.

## File Classification Guide

Usually core/platform:

- `src/**`
- `scripts/**`
- `schemas/**`
- `skills/**`
- `tests/**`
- `docs/**`
- `README.md`
- `package.json`
- `package-lock.json`

Usually domain configuration:

- `domain-packs/<domain-id>/**`

Domain packs can be promoted to `main` when they are intentional fixtures or maintained examples. Otherwise, leave them with the research branch.

Usually research corpus:

- `data/sources/**`
- `data/artifacts/**`
- `data/findings/**`
- `data/claims/**`
- `data/candidate-bundles/**`
- `data/staged-records/**`
- `data/evidence-reviews/**`
- `data/publication-events/**`
- `data/report-artifacts/**`
- `data/search-protocols/**`
- `research/sessions/**`
- `research/syntheses/**`
- `research/state/**`
- `research/backlog/**`

Research corpus files should normally stay on research branches.

## Rules of Thumb

- If a change would help every domain, harvest it into `core/<feature>` and merge it to `main`.
- If a change only makes sense for one literature review or domain corpus, keep it on `research/<domain-or-question>`.
- If a test needs a domain corpus to pass, either keep that test on the research branch or rewrite it against a fixture domain before merging to `main`.
- Do not use `main` as the archive for every research output.
- Do not delete research branch records just to make a core branch clean; create a clean branch from `main` and selectively bring over core files.
