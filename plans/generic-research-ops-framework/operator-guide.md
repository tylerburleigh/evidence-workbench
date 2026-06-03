# Downstream Domain-Pack Operator Guide

## Purpose

This guide is the repeatable operator path for adding a downstream domain pack and publishing its first source-backed baseline records.

Use it when the framework already exists and the task is to onboard a new research domain without changing core workflow code.

The successful end state is:

- a valid `domain-packs/<domain-id>/` directory
- one bounded bootstrap bundle for one taxonomy scope unit
- required evidence reviews completed
- the bundle approved and published through `scripts/bundle.mjs`
- planning state synced
- public and admin routes smoke-tested
- changes ready to commit

## Operating Rules

- Work on one taxonomy scope unit per bootstrap run.
- Keep domain vocabulary inside the domain pack, records, and skill adapters.
- Do not add core code unless the new domain exposes a true framework bug.
- Do not publish model output directly into live records.
- Stage proposed records under `data/staged-records/<bundle-id>/`.
- Publish only through `npm run research:bundle -- publish`.
- Treat planning files as generated state after sessions, bundle lifecycle changes, taxonomy changes, and publications.

## 1. Define The Domain Pack

Create:

```text
domain-packs/<domain-id>/
  domain.json
  taxonomy.v1.json
  evidence-ladder.v1.json
  extraction-schema.v1.json
  review-lanes.v1.json
  public-copy.v1.json
  skills/
    bootstrap.md
    surveillance.md
    evidence-review.md
    editorial-review.md
    synthesis.md
```

Use `domain-packs/sample-research/`, `domain-packs/sample-archive/`, and `domain-packs/software-supply-chain/` as implementation references.

Minimum checks:

- `domain.json` IDs and file names match the directory contents.
- `default_scope_unit` matches at least one taxonomy node type.
- `default_review_lanes` are present in `review-lanes.v1.json`.
- Public copy provides labels for the configured scope unit.
- Skill adapters add domain-specific discipline without restating the whole core workflow.

Run:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run sync:research-planning
npm run validate
npm test
```

The first planning sync should place uncovered scope units into the bootstrap queue.

## 2. Select One Bootstrap Scope

Read:

```bash
cat research/backlog/priority-queue.v1.json
cat research/state/coverage-status.v1.json
```

Choose one `bootstrap_queue` item. If a user asks for a whole field, narrow the run to the highest-priority ready scope unit.

Record the research question from the queue unless there is a better bounded question for the same scope.

## 3. Gather Source-Backed Evidence

For a baseline bootstrap, prefer stable primary or official sources:

- specifications
- standards
- official documentation
- public datasets or registries
- project records when reviewing a concrete project

When the run involves source discovery, scaffold a search protocol before drafting findings:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:search -- scaffold \
  --bundle <bundle-id> \
  --id <search-protocol-id> \
  --name "<search protocol name>" \
  --taxonomy-node <taxonomy-node-id> \
  --query "<search query>" \
  --database "<database or search surface>"
```

Record screening decisions as sources are included, deferred, or excluded:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:search -- screen \
  --bundle <bundle-id> \
  --id <search-protocol-id> \
  --title "<candidate title>" \
  --decision include \
  --source-id <source-id> \
  --reason "<short inclusion reason>"
```

Use `--decision maybe`, `exclude`, `duplicate`, `not_relevant`, or `no_full_text` for deferred or rejected candidates. The search protocol should stay staged with the bundle and be published only after review.

Avoid using a source to support claims outside its boundary. A specification can support a control model; it does not prove that a project executes that control.

Before drafting claims, extract:

- source identity and locator
- structured source locator when possible: section, page or table, URL, verification status, and a short paraphrase note
- reviewed boundary
- observed control signal or factual observation
- limitations and detection gaps
- what the source does not prove

## 4. Create Staged Records

Create one bundle directory:

```bash
mkdir -p data/staged-records/<bundle-id>
```

For a normal baseline, stage:

```text
data/staged-records/<bundle-id>/<source-id>.json
data/staged-records/<bundle-id>/<artifact-id>.json
data/staged-records/<bundle-id>/<finding-id>.json
data/staged-records/<bundle-id>/<claim-id>.json
```

Record boundaries:

- `source`: where the evidence came from
- `artifact`: what was extracted or reviewed
- `finding`: the source-backed observation
- `claim`: the public interpretation, with support map and limitations

The claim support map must reference concrete finding IDs and source IDs. Keep the public summary bounded to what the finding actually supports.

Use evidence roles deliberately:

- `direct_support` for findings that directly support the claim conclusion
- `boundary_condition` for findings that constrain or limit the claim
- `adjacent_evidence` for nearby evidence that should not be overread
- `counterexample` for evidence against the claim
- `background` for context that is not proof

## 5. Create The Candidate Bundle And Session

Create:

```text
data/candidate-bundles/<bundle-id>.json
research/sessions/<bundle-id>.json
```

The candidate bundle should include:

- `scope.domain_id`
- `scope.taxonomy_node_ids`
- `source_ids` and `source_urls`
- one `proposed_changes` entry per staged record
- required review lanes
- review requirement policy
- evidence review IDs, once reviews exist

The research session should include:

- `mode: "bootstrap"`
- the same domain and taxonomy scope
- `outcome: "candidate_bundle"`
- source IDs and URLs
- next actions for review, approval, publish, and project-specific follow-up

Keep timestamps coherent:

- session starts before it completes
- bundle submission follows the session
- evidence reviews follow submission
- publication follows approval

## 6. Complete Evidence Reviews

For each required review lane, create one `data/evidence-reviews/<review-id>.json` record for the current bundle revision.

Each review must identify:

- bundle ID
- revision number
- review lane
- verdict
- blocking status
- reviewed change IDs
- structured findings, even if empty

Required review lanes come from the domain pack. For example, the software supply-chain pack requires:

```text
source_fidelity
control_fit
risk_framing
operational_boundary
```

Run:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- status --bundle <bundle-id>
npm run validate
```

Do not approve until:

- bundle validation is ready
- promotion is ready
- every required lane has the minimum complete accepting reviews
- there are no open blocking review findings

## 7. Approve And Publish

Approve:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- approve --bundle <bundle-id>
```

Publish:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run research:bundle -- publish --bundle <bundle-id> --published-by <operator-id>
```

Publication should:

- copy staged records into the live `data/` collections
- write a publication event
- mark the bundle `published`
- update `publication_event_ids`
- sync planning state

If manual timestamps are later than the generated publication timestamp, normalize the manual session, submission, or review timestamps and run planning sync again.

## 8. Integrate Reports

After publication, inspect report artifacts that cover the affected domain and scope:

```bash
rg -n "\"record_type\": \"report_artifact\"|\"artifact_type\":|\"status\":|\"domain_id\":|\"scope_ids\":" data/report-artifacts
```

Decide whether the published evidence should:

- update an existing current literature review
- update an existing current synthesis report
- supersede an older report with a new current version
- remain only in an unindexed or draft sidecar memo

For app-visible reports, update the report Markdown and `data/report-artifacts/<report-id>.json` together. Keep `source_ids`, `claim_ids`, `finding_ids`, `publication_event_ids`, `scope_ids`, and citation-audit status aligned with the evidence graph.

Do not leave parallel current literature reviews for the same paper-facing scope unless the audience or section boundary is intentionally different and documented in the report summary. Sidecars based on submitted or staged records should name their target canonical report and integration trigger.

## 9. Sync Planning

Run:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run sync:research-planning
```

Inspect:

```bash
cat research/state/coverage-status.v1.json
cat research/backlog/priority-queue.v1.json
```

Expected bootstrap completion state:

- the published scope has `coverage_status: "baseline"`
- `last_checked_source` is usually `publication`
- `next_mode` is `surveillance`
- uncovered scope units remain in `bootstrap_queue`
- stale covered scope units appear in `surveillance_queue`

## 10. Update Tests And Docs

When a new domain pack or published graph changes expected behavior, update focused tests:

- domain loader coverage in `tests/sample-domain.test.mjs`
- route inventory coverage in `tests/route-smoke.test.mjs`
- planning behavior tests only when planning logic changes

Update docs:

- `plans/generic-research-ops-framework/implementation-plan.md`
- domain-specific notes if the new pack establishes a reusable pattern

## 11. Verify Locally

Run the standard local checks:

```bash
npm test
npm run validate
git diff --check
npm run build
```

Then smoke public routes with the domain active:

```bash
WORKBENCH_DOMAIN=<domain-id> npm run start -- -p 3002
WORKBENCH_DOMAIN=<domain-id> npm run smoke:routes
```

Stop the server and confirm the port is clear:

```bash
lsof -i :3002
```

For documentation-only changes, `git diff --check` is the minimum relevant check.

## 12. Commit Handoff

Before commit:

```bash
git status --short --branch
git diff --stat
git ls-files --others --exclude-standard
```

Commit the domain pack or bundle as one coherent unit. A good commit contains:

- domain-pack config and skill files, or one published baseline bundle
- staged records and live records when publication happened
- evidence reviews
- publication event
- research session
- planning state
- focused test/doc updates

If the branch contains both reusable platform changes and domain-specific research records, do not merge it wholesale to `main`. Audit the split first:

```bash
npm run branch:audit -- --base main --head HEAD
```

Use `plans/generic-research-ops-framework/branching-strategy.md` to decide what belongs in a short-lived `core/<feature>` branch versus a long-lived `research/<domain-or-question>` branch.

Use the next planning queue item as the handoff:

- if bootstrap queue is non-empty, continue with the next uncovered scope unit
- if bootstrap queue is empty, write operator docs, start a new domain, or wait for surveillance staleness/material change

## Worked Pattern From `software-supply-chain`

The completed downstream rehearsal used this sequence:

1. Added a `software-supply-chain` domain pack with `control` as the default scope unit.
2. Bootstrapped `release-provenance-control` from the SLSA Build Provenance specification.
3. Bootstrapped `dependency-exposure-control` from OpenSSF Scorecard dependency-related checks.
4. Bootstrapped `maintenance-signal-control` from OpenSSF Scorecard maintenance-related checks.
5. Completed all required evidence review lanes for each bundle.
6. Published all three bundles through the bundle workflow.
7. Synced planning so every configured control has fresh baseline coverage.
8. Smoke-tested the public and admin route inventory under `WORKBENCH_DOMAIN=software-supply-chain`.

That pattern is the reference for future downstream domains: a domain pack proves vocabulary and workflow fit, then one bounded source-backed baseline proves the publication path for each configured scope unit.
