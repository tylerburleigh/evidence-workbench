# Case Study: Synthetic Student Responses

The synthetic student responses branch is the first real example of how Lit Review Studio can move from a blank platform to a populated research workspace.

The branch is not a model for what belongs on `main`. It is a model for how a domain-specific research branch can grow while reusable platform improvements are harvested separately.

## Starting Point

The starting point was a reusable studio with neutral fixture domains, schemas, scripts, skills, and UI surfaces. It did not yet contain a real literature-review corpus.

The research goal was to understand literature about synthetic student responses, especially how generated responses are used in automated scoring research, sparse-data supplementation, model comparison, prompt design, realism evaluation, and constructed-response settings.

## Transition Pattern

A future domain should not begin with "write a literature review." The better transition is:

1. **Define the domain.**
   Clarify the research area, audience, source types, expected questions, and what would make a claim trustworthy.

2. **Create a domain pack.**
   For synthetic student responses, this meant review-question taxonomy nodes, extraction fields such as response origin and label source, appraisal lanes for construct mapping and scorer-validation relevance, public labels, and domain-specific agent skill adapters.

3. **Run one narrow research pass.**
   The first useful pass should be small enough to test the structure. For this branch, scorer-validation use was one such bounded question.

4. **Stage evidence before publication.**
   Sources, artifacts, findings, claims, and search protocols were staged under candidate bundles before they became part of the live evidence graph.

5. **Review the work.**
   Evidence appraisals checked source fidelity, construct mapping, method classification, scorer-validation relevance, synthesis overreach, and applicability boundaries.

6. **Inspect the UI.**
   The UI made gaps visible: whether users could find reports, trace claims back to sources, inspect source access, and understand review status.

7. **Harvest reusable improvements.**
   The research branch exposed platform needs: search protocol tooling, report artifacts, report detail pages, evidence-synthesis skills, branch auditing, and canonical report handling. Those improvements were split into a `core/*` branch and merged to `main`.

8. **Continue question by question.**
   The branch expanded into model choice, prompt engineering, realism, sparse-data supplementation, acceptable uses, and stakes boundaries only after the first loop proved the structure.

## Lessons

- Domain setup is part of the research, not just preparation.
- The first research pass should be intentionally narrow.
- Agent work needs visible intermediate records, not just a final answer.
- The UI is part of the method because it shows whether the work is inspectable.
- Corpus-specific tests should stay on research branches unless they are rewritten against fixtures.
- Reusable platform improvements should be harvested into `core/*` branches.
- Synthesis needs a canonical report model so additive memos do not become disconnected documents.
- Agent skills and domain rules are safer than relying on a single open-ended prompt.

## Branch Outcome

The research branch was renamed to:

```text
research/synthetic-student-responses-literature-review
```

It has a draft tracking PR that documents the corpus and explicitly marks it as not intended for wholesale merge into `main`.
