# Agent Skill Model

## Purpose

Agent skills are operating procedures. They should keep the model inside the workflow and domain boundaries.

The generic framework should have core skills plus domain adapters.

## Core Skills

### `research-bootstrap`

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

### `surveillance-update`

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

### `evidence-review`

Use when verifying a candidate bundle.

Responsibilities:

- run bundle validation
- review one lane for one revision
- compare staged records against source facts
- verify support maps
- write structured findings
- apply review

Boundaries:

- do not conduct new research
- do not approve or publish
- do not edit staged records unless explicitly asked to revise after review

### `editorial-review`

Use when approving or publishing a reviewed bundle.

Responsibilities:

- inspect promotion readiness
- inspect evidence-review gate
- compare staged and live records
- request changes, approve, or publish
- run post-publish checks

Boundaries:

- do not bypass publish workflow
- do not approve unsupported claims

### `synthesis-review`

Use when summarizing already-published evidence across one domain or a bounded group of scope units.

Responsibilities:

- resolve synthesis scope
- inspect current report artifacts and decide update, supersede, or sidecar disposition
- inventory published claims, findings, sources, reviews, publication events, and planning state
- classify question status and claim strength
- identify cross-cutting conclusions
- separate evidence-supported conclusions from workflow gaps
- draft a traceable Markdown synthesis report
- update report-artifact metadata when a visible report changes
- recommend next bootstrap, surveillance, review, or publication actions

Boundaries:

- do not create new evidence claims unless a separate candidate bundle is requested
- do not upgrade targeted baseline evidence into systematic-review language
- do not let planning state act as evidence
- do not generalize across scope units without explaining the support
- do not create parallel current reports for the same domain, artifact type, and scope unless the audience or section boundary is explicit

## Domain Adapter Skills

Each domain pack should provide short adapter instructions for the core skills.

Adapters should add:

- required extraction fields
- common overclaim patterns
- evidence hierarchy
- limitations, safety, or ethics caveats when configured
- domain-specific review lanes
- public wording rules

Adapters should not duplicate generic lifecycle instructions.

## Domain Adapter Example

Bootstrap instructions:

- Identify the domain subject, context, endpoint or observation type, result, and limitations.
- Extract required fields before drafting a claim.
- Separate source facts from interpretation.
- Flag common domain-specific overclaim patterns.
- Keep boundaries visible near the public claim.

Evidence review instructions:

- Check whether the public claim matches the source-backed finding.
- Check whether claim scope matches the configured taxonomy unit.
- Check whether limitations and uncertainty are represented.
- Check whether domain-specific review lanes are complete before approval.

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
2. Source-fidelity reviewer checks facts.
3. Interpretation reviewer checks claims.
4. Limitations reviewer checks caveats, boundaries, or configured risk/ethics concerns.
5. Editorial publisher approves and publishes.

Do not let the same pass silently do every role unless the user explicitly accepts lower review independence.
