# Agent Skill Model

## Purpose

Agent skills are operating procedures. They should keep the model inside the workflow and domain boundaries.

The generic framework should have core skills plus domain adapters.

## Core Skills

### `baseline-review`

Use when initializing coverage for one topic.

Responsibilities:

- resolve bounded scope
- inspect existing records
- search and screen sources
- extract facts
- stage source/artifact/finding/claim records
- create candidate bundle
- write research session
- validate bundle
- sync planning state

Boundaries:

- do not publish
- do not cover multiple scope units unless explicitly decomposed
- do not make claims without source-backed findings

### `review-update`

Use when checking what changed since the last review.

Responsibilities:

- define delta window
- search for material changes
- decide no-op, activity-only, or claim update
- stage minimal changes
- write session
- validate bundle

Boundaries:

- do not redo baseline research
- do not upgrade evidence due to activity alone

### `evidence-appraisal`

Use when verifying a candidate bundle.

Responsibilities:

- run bundle validation
- appraise one lane for one revision
- compare staged records against source facts
- verify support maps
- write structured findings
- apply appraisal

Boundaries:

- do not conduct new research
- do not approve or publish
- do not edit staged records unless explicitly asked to revise after appraisal

### `editorial-decision`

Use when approving or publishing an appraised bundle.

Responsibilities:

- inspect promotion readiness
- inspect evidence-appraisal gate
- compare staged and live records
- request changes, approve, or publish
- run post-publish checks

Boundaries:

- do not bypass publish workflow
- do not approve unsupported claims

### `evidence-synthesis`

Use when summarizing already-published evidence across one domain or a bounded group of scope units.

Responsibilities:

- resolve synthesis scope
- inspect current report artifacts and decide update, supersede, or sidecar disposition
- inventory published claims, findings, sources, appraisals, publication events, and planning state
- classify question status and claim strength
- identify cross-cutting conclusions
- separate evidence-supported conclusions from workflow gaps
- draft a traceable Markdown synthesis report
- update report-artifact metadata when a visible report changes
- recommend next baseline review, review update, appraisal, or publication actions

Boundaries:

- do not create new evidence claims unless a separate candidate bundle is requested
- do not upgrade targeted baseline evidence into systematic-review language
- do not let planning state act as evidence
- do not generalize across scope units without explaining the support
- do not create parallel current reports for the same domain, artifact type, and scope unless the audience or section boundary is explicit

### `review-triage`

Use when deciding what needs attention now in one active domain.

Responsibilities:

- inspect bundle readiness, coverage state, source access, source summaries, claim support, and report integration signals
- prioritize the highest-leverage operational work items
- point each item to the relevant review, scope, source, claim, report, or planning surface
- produce a short queue rather than a broad project plan

Boundaries:

- do not create new evidence
- do not approve or publish
- do not recommend broad research unless a concrete attention signal supports it
- do not treat planning state or activity as evidence

## Domain Adapter Skills

Each domain pack should provide short adapter instructions for the core skills.

Adapters should add:

- required extraction fields
- common overclaim patterns
- evidence hierarchy
- limitations, safety, or ethics caveats when configured
- domain-specific appraisal lanes
- public wording rules

Adapters should not duplicate generic lifecycle instructions.

## Domain Adapter Example

Baseline Review instructions:

- Identify the domain subject, context, endpoint or observation type, result, and limitations.
- Extract required fields before drafting a claim.
- Separate source facts from interpretation.
- Flag common domain-specific overclaim patterns.
- Keep boundaries visible near the public claim.

Evidence appraisal instructions:

- Check whether the public claim matches the source-backed finding.
- Check whether claim scope matches the configured taxonomy unit.
- Check whether limitations and uncertainty are represented.
- Check whether domain-specific appraisal lanes are complete before approval.

## Skill File Shape

For Codex-style skills, each skill should include:

- concise frontmatter with clear trigger description
- read-first list
- workflow steps
- boundaries
- expected outputs
- pointers to domain references

Keep `SKILL.md` short. Put longer rubrics in domain-pack reference files.

## Multi-Agent Pattern

The framework can use separate agents or skill passes:

1. Research drafter creates bundle.
2. Source-fidelity appraiser checks facts.
3. Interpretation appraiser checks claims.
4. Limitations appraiser checks caveats, boundaries, or configured risk/ethics concerns.
5. Editorial publisher approves and publishes.

Do not let the same pass silently do every role unless the user explicitly accepts lower review independence.
