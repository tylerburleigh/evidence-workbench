import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const searchWorkflowModulePath = path.join(repoRoot, "scripts/lib/search-workflow.mjs");
const searchScriptPath = path.join(repoRoot, "scripts/search-pass.mjs");
const bundleScriptPath = path.join(repoRoot, "scripts/bundle.mjs");
const validateScriptPath = path.join(repoRoot, "scripts/validate-records.mjs");
const fixtureBundleId = "fixture-sample-search-bundle";

async function createWorkspace() {
  const workspace = await mkdtemp(path.join(tmpdir(), "lit-review-studio-search-"));
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

async function readWorkspaceJson(workspace, relativePath) {
  return JSON.parse(await readFile(path.join(workspace, relativePath), "utf8"));
}

async function writeWorkspaceJson(workspace, relativePath, value) {
  const filePath = path.join(workspace, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runWorkflow(workspace, source, env = {}) {
  const { stdout } = await execFileAsync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: workspace,
    env: {
      ...process.env,
      ...env,
      SEARCH_WORKFLOW_MODULE_PATH: searchWorkflowModulePath
    }
  });
  return JSON.parse(stdout);
}

test("search workflow scaffolds a staged protocol and attaches it to a bundle", async () => {
  await withWorkspace(async (workspace) => {
    await writeWorkspaceJson(workspace, `data/candidate-bundles/${fixtureBundleId}.json`, {
      schema_version: "1.0.0",
      record_type: "candidate_bundle",
      id: fixtureBundleId,
      name: "Fixture Sample Search Bundle",
      intake_mode: "baseline_review",
      lifecycle_status: "submitted",
      submitted_at: "2026-06-02T00:00:00Z",
      submitted_by: "test-agent",
      revision_number: 1,
      scope: {
        domain_id: "sample-research",
        taxonomy_node_ids: ["example-topic"],
        research_question: "Fixture search workflow question."
      },
      proposed_changes: [],
      required_appraisal_lanes: [],
      appraisal_requirement: {
        min_complete_appraisals_per_lane: 1,
        block_on_open_critical_findings: true,
        block_on_open_major_findings: false
      }
    });

    const result = await runWorkflow(
      workspace,
      `
        const { scaffoldSearchProtocol, addScreeningDecision } = await import(process.env.SEARCH_WORKFLOW_MODULE_PATH);
        const scaffold = await scaffoldSearchProtocol({
          protocolId: "fixture-sample-search-pass",
          bundleId: "${fixtureBundleId}",
          name: "Fixture Sample Search Pass",
          taxonomyNodeIds: ["example-topic"],
          queries: ["\\"fixture topic\\" evidence appraisal"],
          databases: ["Fixture Search"],
          inclusionCriteria: ["Includes fixture evidence appraisal context."],
          exclusionCriteria: ["Outside the fixture topic."],
          startedAt: "2026-06-02T00:00:00Z"
        });
        const decision = await addScreeningDecision({
          protocolId: "fixture-sample-search-pass",
          bundleId: "${fixtureBundleId}",
          title: "Fixture Evidence Appraisal Source",
          decision: "include",
          sourceId: "sample-source-example-topic-2026",
          reason: "Directly discusses the fixture topic.",
          url: "https://example.test/fixture-evidence-appraisal-source"
        });
        console.log(JSON.stringify({ scaffold, decision }));
      `,
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-research" }
    );

    assert.equal(result.scaffold.action, "scaffolded_search_protocol");
    assert.equal(result.scaffold.bundle_change_added, true);
    assert.equal(result.decision.status, "included_sources_staged");

    const protocol = await readWorkspaceJson(
      workspace,
      `data/staged-records/${fixtureBundleId}/fixture-sample-search-pass.json`
    );
    assert.equal(protocol.systematicity_level, "targeted_baseline_review");
    assert.equal(protocol.screening_decisions.length, 1);
    assert.deepEqual(protocol.source_ids, ["sample-source-example-topic-2026"]);

    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${fixtureBundleId}.json`);
    assert.ok(
      bundle.proposed_changes.some(
        (change) =>
          change.target_record_type === "search_protocol" &&
            change.target_record_id === "fixture-sample-search-pass"
      )
    );

    await execFileAsync(process.execPath, [bundleScriptPath, "validate", "--bundle", fixtureBundleId], {
      cwd: workspace,
      env: {
        ...process.env,
        LIT_REVIEW_STUDIO_DOMAIN: "sample-research"
      }
    });
  });
});

test("research search CLI scaffolds a standalone protocol record", async () => {
  await withWorkspace(async (workspace) => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        searchScriptPath,
        "scaffold",
        "--id",
        "fixture-standalone-search",
        "--name",
        "Fixture Standalone Search",
        "--taxonomy-node",
        "example-topic",
        "--query",
        "\"fixture topic\" evidence appraisal",
        "--database",
        "Fixture Search",
        "--include-criterion",
        "Reports fixture evidence context.",
        "--exclude-criterion",
        "Outside the fixture topic."
      ],
      {
        cwd: workspace,
        env: {
          ...process.env,
          LIT_REVIEW_STUDIO_DOMAIN: "sample-research"
        }
      }
    );

    const result = JSON.parse(stdout);
    assert.equal(result.action, "scaffolded_search_protocol");
    assert.equal(result.protocol_path, "data/search-protocols/fixture-standalone-search.json");

    const protocol = await readWorkspaceJson(workspace, "data/search-protocols/fixture-standalone-search.json");
    assert.equal(protocol.record_type, "search_protocol");
    assert.equal(protocol.systematicity_level, "targeted_baseline_review");
    assert.equal(protocol.search_queries[0].database, "Fixture Search");

    await execFileAsync(process.execPath, [validateScriptPath], { cwd: workspace });
  });
});

test("research search CLI stages bundled protocols under the bundle directory", async () => {
  await withWorkspace(async (workspace) => {
    await writeWorkspaceJson(workspace, `data/candidate-bundles/${fixtureBundleId}.json`, {
      schema_version: "1.0.0",
      record_type: "candidate_bundle",
      id: fixtureBundleId,
      name: "Fixture Sample Search Bundle",
      intake_mode: "baseline_review",
      lifecycle_status: "submitted",
      submitted_at: "2026-06-02T00:00:00Z",
      submitted_by: "test-agent",
      revision_number: 1,
      scope: {
        domain_id: "sample-research",
        taxonomy_node_ids: ["example-topic"],
        research_question: "Fixture bundled search workflow question."
      },
      proposed_changes: [],
      required_appraisal_lanes: [],
      appraisal_requirement: {
        min_complete_appraisals_per_lane: 1,
        block_on_open_critical_findings: true,
        block_on_open_major_findings: false
      }
    });

    const { stdout } = await execFileAsync(
      process.execPath,
      [
        searchScriptPath,
        "scaffold",
        "--bundle",
        fixtureBundleId,
        "--id",
        "fixture-bundled-search",
        "--name",
        "Fixture Bundled Search",
        "--taxonomy-node",
        "example-topic",
        "--query",
        "\"fixture topic\" follow-up",
        "--database",
        "Fixture Search"
      ],
      {
        cwd: workspace,
        env: {
          ...process.env,
          LIT_REVIEW_STUDIO_DOMAIN: "sample-research"
        }
      }
    );

    const result = JSON.parse(stdout);
    assert.equal(
      result.protocol_path,
      `data/staged-records/${fixtureBundleId}/fixture-bundled-search.json`
    );
    assert.equal(result.bundle_change_added, true);

    const protocol = await readWorkspaceJson(
      workspace,
      `data/staged-records/${fixtureBundleId}/fixture-bundled-search.json`
    );
    assert.equal(protocol.record_type, "search_protocol");

    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${fixtureBundleId}.json`);
    assert.equal(bundle.proposed_changes[0].target_record_id, "fixture-bundled-search");
  });
});
