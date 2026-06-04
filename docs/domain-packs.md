# Domain Pack Contract

## Purpose

A domain pack lets the framework run the same research operations workflow in a new field without hardcoding that field into the core app.

The domain pack should answer:

- What are the stable research units?
- What counts as evidence?
- What fields must be extracted?
- What appraisal lanes are required?
- What context-of-use or applicability facets bound claims?
- How should public claims be worded and bounded?
- What should agents read before acting?
- Whether the domain enforces required extraction fields or search/screening protocol records.

## Required Files

```text
domain-packs/<domain-id>/
  domain.json
  taxonomy.v1.json
  evidence-ladder.v1.json
  extraction-schema.v1.json
  appraisal-lanes.v1.json
  public-copy.v1.json
  skills/
    baseline-review.md
    review-update.md
    evidence-appraisal.md
    editorial-decision.md
    synthesis.md
```

## `domain.json`

Suggested shape:

```json
{
  "id": "sample-research",
  "name": "Sample Research Domain",
  "summary": "Neutral fixture domain used to exercise the generic research workflow.",
  "default_scope_unit": "topic",
  "taxonomy_file": "taxonomy.v1.json",
  "evidence_ladder_file": "evidence-ladder.v1.json",
  "extraction_schema_file": "extraction-schema.v1.json",
  "appraisal_lanes_file": "appraisal-lanes.v1.json",
  "public_copy_file": "public-copy.v1.json",
  "default_appraisal_lanes": [
    "source_fidelity",
    "interpretation",
    "limitations",
    "taxonomy_mapping"
  ]
}
```

## Taxonomy

The taxonomy should define the stable units of work and navigation.

Neutral fixture example:

```text
category: example category
  topic: example topic
  topic: second example topic
```

Each topic should include:

- stable ID
- name
- summary
- aliases
- canonical order
- parent category
- example entities or methods
- scope notes

## Evidence Ladder

The evidence ladder is domain-specific. The core framework should only load, display, and reference configured ladder stages; it should not hardcode stage names or progression rules.

Neutral fixture example:

```text
source_identified
finding_extracted
claim_supported
reviewed_baseline
```

Each stage should define:

- label
- description
- minimum support expected
- common overclaim risk
- what moves a claim to the next stage

## Extraction Schema

Each domain pack should specify fields that agent skills must extract.

Neutral fixture fields:

- subject
- context
- endpoint or observation type
- result or extracted observation
- limitations
- source location or retrieval note

Domains can opt into required-field validation by adding:

```json
{
  "validation": {
    "enforce_required_fields": true
  }
}
```

When enabled, required fields should declare `applies_to`, for example `["artifact"]`, `["finding"]`, or `["claim"]`.

## Applicability Facets

Domains may define `applicability_facets` in `domain.json` when claims depend on reusable context-of-use dimensions.

The core framework treats these as generic configured facets. Domain packs define the vocabulary.

Examples:

- assessment purpose or decision consequence in education
- deployment environment or criticality in software operations
- population, severity, or care setting in clinical evidence appraisals
- jurisdiction or enforcement setting in policy appraisals

Suggested shape:

```json
{
  "applicability_facets": [
    {
      "id": "consequence_level",
      "label": "Consequence Level",
      "applies_to": ["artifact", "claim"],
      "description": "The consequence level for interpreting evidence transfer.",
      "values": [
        { "id": "low", "label": "Low" },
        { "id": "medium", "label": "Medium" },
        { "id": "high", "label": "High" }
      ]
    }
  ]
}
```

When configured with `values`, validation should reject unsupported facet values. Domains can also make facet fields required through `extraction-schema.v1.json`.

## Appraisal Lanes

Appraisal lanes should be explicit and domain-configurable.

Core lanes worth preserving:

- `source_fidelity`: do source metadata and extracted facts match the cited source?
- `interpretation`: do findings support the public claim?
- `limitations`: are caveats, context, uncertainty, and boundaries visible?
- `taxonomy_mapping`: are records mapped to the right domain scope units?
- `applicability_boundary`: do conclusions stay within the contexts, populations, settings, use cases, or consequence levels represented by the evidence?
- optional domain-defined appraisal lanes for pack-specific risks or limitations

Domain-specific lanes can be added, but the core should treat lane IDs as configuration.

## Public Copy

The domain pack should provide labels for public pages.

Examples:

- evidence layer label
- interpretation layer label
- optional domain-specific context layer labels
- empty-state language
- stage labels
- confidence labels
- warning labels

Avoid encoding this copy only in React components.

## Agent Skill Overrides

Domain skills should not duplicate the core workflow. They should add domain discipline.

For example, a domain adapter can specify:

- required fields that must be extracted before drafting a claim
- common ways claims overreach beyond the extracted findings
- boundaries that must appear near public conclusions
- appraisal lanes required before approval
- terms, labels, and page copy that should replace generic UI language
