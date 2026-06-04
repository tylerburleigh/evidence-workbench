import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const validateScriptPath = path.join(repoRoot, "scripts/validate-records.mjs");

async function createWorkspace() {
  const workspace = await mkdtemp(path.join(tmpdir(), "lit-review-studio-validation-"));
  await Promise.all(
    ["data", "domain-packs", "research", "schemas"].map((entry) =>
      cp(path.join(repoRoot, entry), path.join(workspace, entry), { recursive: true })
    )
  );
  return workspace;
}

async function withWorkspace(fn) {
  const workspace = await createWorkspace();
  try {
    return await fn(workspace);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
}

async function writeWorkspaceJson(workspace, relativePath, value) {
  const filePath = path.join(workspace, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runValidation(workspace) {
  return execFileAsync(process.execPath, [validateScriptPath], { cwd: workspace });
}

const validationDomainId = "validation-fixture";
const validationNodeId = "validation-topic";

async function writeValidationFixtureDomain(workspace) {
  await writeWorkspaceJson(workspace, `domain-packs/${validationDomainId}/domain.json`, {
    id: validationDomainId,
    name: "Validation Fixture Domain",
    summary: "A temporary domain pack used by validator tests.",
    default_scope_unit: "topic",
    taxonomy_file: "taxonomy.v1.json",
    evidence_ladder_file: "evidence-ladder.v1.json",
    extraction_schema_file: "extraction-schema.v1.json",
    appraisal_lanes_file: "appraisal-lanes.v1.json",
    public_copy_file: "public-copy.v1.json",
    default_appraisal_lanes: ["fixture_review"],
    applicability_facets: [
      {
        id: "fixture_context_type",
        label: "Fixture Context Type",
        applies_to: ["artifact"],
        values: [
          { id: "development", label: "Development" },
          { id: "evaluation", label: "Evaluation" }
        ]
      }
    ]
  });

  await writeWorkspaceJson(workspace, `domain-packs/${validationDomainId}/taxonomy.v1.json`, {
    taxonomy_id: "validation-fixture-taxonomy",
    taxonomy_version: "1.0.0",
    domain_id: validationDomainId,
    nodes: [
      {
        id: validationNodeId,
        name: "Validation Topic",
        node_type: "topic",
        canonical_order: 1,
        summary: "A temporary topic used by validator tests.",
        search_aliases: ["validation fixture"],
        example_entities: [],
        scope_notes: ["Use only inside validator tests."],
        retirement_status: "active"
      }
    ]
  });

  await writeWorkspaceJson(workspace, `domain-packs/${validationDomainId}/evidence-ladder.v1.json`, {
    id: "validation-fixture-evidence-ladder",
    domain_id: validationDomainId,
    stages: [
      {
        id: "fixture_stage",
        label: "Fixture Stage",
        description: "A temporary evidence stage.",
        minimum_support_expected: "A fixture record with enough metadata to validate."
      }
    ]
  });

  await writeWorkspaceJson(workspace, `domain-packs/${validationDomainId}/appraisal-lanes.v1.json`, {
    id: "validation-fixture-appraisal-lanes",
    domain_id: validationDomainId,
    lanes: [
      {
        id: "fixture_review",
        label: "Fixture Review",
        description: "A temporary appraisal lane.",
        required_by_default: true
      }
    ]
  });

  await writeWorkspaceJson(workspace, `domain-packs/${validationDomainId}/public-copy.v1.json`, {
    id: "validation-fixture-public-copy",
    domain_id: validationDomainId,
    labels: {
      topic: "Topic"
    },
    empty_states: {
      no_topic: "No fixture topic exists."
    }
  });

  await writeWorkspaceJson(workspace, `domain-packs/${validationDomainId}/extraction-schema.v1.json`, {
    id: "validation-fixture-extraction-fields",
    domain_id: validationDomainId,
    validation: {
      enforce_required_fields: true
    },
    fields: [
      {
        id: "fixture_required_signal",
        label: "Fixture Required Signal",
        required: true,
        applies_to: ["artifact"],
        description: "Required only for validator fixture artifacts."
      }
    ]
  });
}

async function writeWorkspaceText(workspace, relativePath, value) {
  const filePath = path.join(workspace, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, "utf8");
}

function validationSource() {
  return {
    schema_version: "1.0.0",
    record_type: "source",
    id: "validation-fixture-source",
    name: "Validation fixture source",
    source_type: "paper",
    authors: ["Fixture Author"],
    venue: "Fixture Venue",
    year: 2026,
    urls: ["https://example.test/validation-fixture-source"],
    summary: "Fixture source used to test domain extraction validation."
  };
}

function sampleResearchSource(overrides = {}) {
  return {
    schema_version: "1.0.0",
    record_type: "source",
    id: "sample-source-example-topic-2026",
    name: "Synthetic Sample Source For Example Topic",
    source_type: "fixture_report",
    authors: ["Fixture Author"],
    year: 2026,
    summary: "Synthetic source metadata used only to test file-backed workflow mechanics.",
    ...overrides
  };
}

function validationArtifact(overrides = {}) {
  return {
    schema_version: "1.0.0",
    record_type: "artifact",
    id: "validation-fixture-artifact",
    name: "Fixture validation artifact",
    artifact_type: "study_setup",
    status: "extracted",
    source_ids: ["validation-fixture-source"],
    taxonomy_node_ids: [validationNodeId],
    methods: "Fixture method description.",
    fixture_required_signal: "Fixture signal.",
    fixture_context_type: "development",
    limitations: ["Fixture record only."],
    ...overrides
  };
}

function validationSearchProtocol() {
  return {
    schema_version: "1.0.0",
    record_type: "search_protocol",
    id: "validation-fixture-search-protocol",
    name: "Fixture validation search protocol",
    domain_id: validationDomainId,
    taxonomy_node_ids: [validationNodeId],
    status: "complete",
    search_started_at: "2026-06-02T00:00:00Z",
    search_completed_at: "2026-06-02T01:00:00Z",
    databases: ["Fixture Database"],
    search_queries: [
      {
        database: "Fixture Database",
        query: "\"validation fixture\" evidence",
        searched_at: "2026-06-02T00:15:00Z",
        result_count: 1
      }
    ],
    inclusion_criteria: ["Studies the fixture validation topic."],
    exclusion_criteria: ["Outside the fixture validation topic."],
    dedupe_method: "Fixture dedupe by title and DOI.",
    screening_counts: {
      records_identified: 1,
      records_screened: 1,
      full_text_reviewed: 1,
      sources_included: 1
    },
    screening_decisions: [
      {
        candidate_id: "fixture-candidate-1",
        title: "Validation fixture source",
        decision: "include",
        source_id: "validation-fixture-source"
      }
    ],
    source_ids: ["validation-fixture-source"],
    screening_summary: "Fixture search protocol included one source.",
    limitations: ["Fixture record only."]
  };
}

function duplicateLiteratureReviewReport(id, overrides = {}) {
  return {
    schema_version: "1.0.0",
    record_type: "report_artifact",
    id,
    name: "Duplicate current literature review fixture",
    artifact_type: "literature_review",
    status: "current",
    domain_id: validationDomainId,
    scope_ids: [validationNodeId],
    path: "research/syntheses/validation-fixture-literature-review.md",
    created_at: "2026-06-03",
    summary: "Fixture report used to validate duplicate current report artifact detection.",
    ...overrides
  };
}

test("domain-required extraction fields are enforced for configured artifacts", async () => {
  await withWorkspace(async (workspace) => {
    await writeValidationFixtureDomain(workspace);
    await writeWorkspaceJson(workspace, "data/sources/validation-fixture-source.json", validationSource());
    await writeWorkspaceJson(
      workspace,
      "data/artifacts/validation-fixture-artifact.json",
      validationArtifact({ fixture_required_signal: "" })
    );

    await assert.rejects(runValidation(workspace), (error) => {
      assert.match(error.stderr, /missing required extraction field fixture_required_signal/);
      return true;
    });

    await writeWorkspaceJson(workspace, "data/artifacts/validation-fixture-artifact.json", validationArtifact());
    await writeWorkspaceJson(
      workspace,
      "data/search-protocols/validation-fixture-search-protocol.json",
      validationSearchProtocol()
    );

    const result = await runValidation(workspace);
    assert.match(result.stdout, /Validated/);
  });
});

test("sources linked to findings or claims must carry descriptive summaries", async () => {
  await withWorkspace(async (workspace) => {
    const { summary, ...sourceWithoutSummary } = sampleResearchSource();
    await writeWorkspaceJson(workspace, "data/sources/sample-source-example-topic-2026.json", sourceWithoutSummary);

    await assert.rejects(runValidation(workspace), (error) => {
      assert.match(error.stderr, /evidence-linked source must include a descriptive summary/);
      assert.match(error.stderr, /sample-finding-example-topic-context-2026/);
      return true;
    });

    await writeWorkspaceJson(workspace, "data/sources/sample-source-example-topic-2026.json", sampleResearchSource());

    const result = await runValidation(workspace);
    assert.match(result.stdout, /Validated/);
  });
});

test("domain applicability facet values are validated when configured", async () => {
  await withWorkspace(async (workspace) => {
    await writeValidationFixtureDomain(workspace);
    await writeWorkspaceJson(workspace, "data/sources/validation-fixture-source.json", validationSource());
    await writeWorkspaceJson(
      workspace,
      "data/artifacts/validation-fixture-artifact.json",
      validationArtifact({ fixture_context_type: "unsupported_context" })
    );

    await assert.rejects(runValidation(workspace), (error) => {
      assert.match(error.stderr, /unsupported applicability facet fixture_context_type value: unsupported_context/);
      return true;
    });
  });
});

test("current report artifacts are unique by domain, artifact type, and scope", async () => {
  await withWorkspace(async (workspace) => {
    await writeValidationFixtureDomain(workspace);
    await writeWorkspaceText(
      workspace,
      "research/syntheses/validation-fixture-literature-review.md",
      "# Validation Fixture Literature Review\n"
    );
    await writeWorkspaceJson(
      workspace,
      "data/report-artifacts/current-lit-review-fixture.json",
      duplicateLiteratureReviewReport("current-lit-review-fixture")
    );
    await writeWorkspaceJson(
      workspace,
      "data/report-artifacts/duplicate-current-lit-review-fixture.json",
      duplicateLiteratureReviewReport("duplicate-current-lit-review-fixture")
    );

    await assert.rejects(runValidation(workspace), (error) => {
      assert.match(error.stderr, /duplicate current report_artifact for validation-fixture\/literature_review/);
      assert.match(error.stderr, /current-lit-review-fixture/);
      return true;
    });

    await writeWorkspaceJson(
      workspace,
      "data/report-artifacts/duplicate-current-lit-review-fixture.json",
      duplicateLiteratureReviewReport("duplicate-current-lit-review-fixture", { status: "draft" })
    );

    const result = await runValidation(workspace);
    assert.match(result.stdout, /Validated/);
  });
});
