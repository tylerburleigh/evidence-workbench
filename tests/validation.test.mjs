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
  const workspace = await mkdtemp(path.join(tmpdir(), "evidence-workbench-validation-"));
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

function syntheticSource() {
  return {
    schema_version: "1.0.0",
    record_type: "source",
    id: "synthetic-validation-source",
    name: "Synthetic validation fixture source",
    source_type: "paper",
    authors: ["Fixture Author"],
    venue: "Fixture Venue",
    year: 2026,
    urls: ["https://example.test/synthetic-validation-source"],
    summary: "Fixture source used to test domain extraction validation."
  };
}

function syntheticArtifact(overrides = {}) {
  return {
    schema_version: "1.0.0",
    record_type: "artifact",
    id: "synthetic-validation-artifact",
    name: "Fixture synthetic response study setup",
    artifact_type: "study_setup",
    status: "extracted",
    source_ids: ["synthetic-validation-source"],
    taxonomy_node_ids: ["ssr-scoring-validation-use"],
    methods: "Fixture method description.",
    education_context: "Middle grades mathematics short-answer item with correct/incorrect rubric.",
    response_origin: "synthetic",
    rubric_label_space: "correct/incorrect",
    label_source: "human-labeled comparator set",
    generation_method: "LLM few-shot generation",
    evaluation_method: "Human scoring agreement and real-response comparison",
    scorer_use: "validation",
    real_response_comparator: "Same item and rubric real-response comparator reported.",
    limitations: ["Fixture record only."],
    ...overrides
  };
}

function syntheticSearchProtocol() {
  return {
    schema_version: "1.0.0",
    record_type: "search_protocol",
    id: "synthetic-validation-search-protocol",
    name: "Fixture synthetic response search protocol",
    domain_id: "synthetic-student-responses",
    taxonomy_node_ids: ["ssr-scoring-validation-use"],
    status: "complete",
    search_started_at: "2026-06-02T00:00:00Z",
    search_completed_at: "2026-06-02T01:00:00Z",
    databases: ["Fixture Database"],
    search_queries: [
      {
        database: "Fixture Database",
        query: "\"synthetic student responses\" automated scoring",
        searched_at: "2026-06-02T00:15:00Z",
        result_count: 1
      }
    ],
    inclusion_criteria: ["Studies synthetic student responses in automated scoring contexts."],
    exclusion_criteria: ["No inspectable education response generation or scoring evaluation."],
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
        title: "Synthetic validation fixture source",
        decision: "include",
        source_id: "synthetic-validation-source"
      }
    ],
    source_ids: ["synthetic-validation-source"],
    screening_summary: "Fixture search protocol included one source.",
    limitations: ["Fixture record only."]
  };
}

test("domain-required extraction fields are enforced for synthetic-response artifacts", async () => {
  await withWorkspace(async (workspace) => {
    await writeWorkspaceJson(workspace, "data/sources/synthetic-validation-source.json", syntheticSource());
    await writeWorkspaceJson(
      workspace,
      "data/artifacts/synthetic-validation-artifact.json",
      syntheticArtifact({ response_origin: "" })
    );

    await assert.rejects(runValidation(workspace), (error) => {
      assert.match(error.stderr, /missing required extraction field response_origin/);
      return true;
    });

    await writeWorkspaceJson(workspace, "data/artifacts/synthetic-validation-artifact.json", syntheticArtifact());
    await writeWorkspaceJson(
      workspace,
      "data/search-protocols/synthetic-validation-search-protocol.json",
      syntheticSearchProtocol()
    );

    const result = await runValidation(workspace);
    assert.match(result.stdout, /Validated/);
  });
});
