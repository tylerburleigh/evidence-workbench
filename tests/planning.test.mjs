import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const planningModulePath = path.join(repoRoot, "scripts/lib/planning.mjs");
const planningScriptPath = path.join(repoRoot, "scripts/research-planning.mjs");

async function createWorkspace() {
  const workspace = await mkdtemp(path.join(tmpdir(), "lit-review-studio-planning-"));
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
  await writeFile(path.join(workspace, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runPlanningSync(workspace, env = {}) {
  await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
        const { syncResearchPlanning } = await import(process.env.PLANNING_MODULE_PATH);
        await syncResearchPlanning({ now: "2026-06-01T00:00:00Z" });
      `
    ],
    {
      cwd: workspace,
      env: {
        ...process.env,
        ...env,
        PLANNING_MODULE_PATH: planningModulePath
      }
    }
  );
}

async function ageSampleResearchBaseline(workspace) {
  const oldTimestamp = "2026-01-01T00:00:00Z";
  const oldDate = "2026-01-01";
  const files = [
    "data/claims/sample-claim-example-topic-baseline.json",
    "data/candidate-bundles/example-topic-baseline-review-2026-05-31.json",
    "research/sessions/example-topic-baseline-review-2026-05-31.json",
    "data/publication-events/publish-example-topic-baseline-review-2026-05-31-2026-05-31t22-52-32-459z.json"
  ];

  for (const relativePath of files) {
    const record = await readWorkspaceJson(workspace, relativePath);
    const agedRecord = { ...record };

    if (agedRecord.last_updated) {
      agedRecord.last_updated = oldDate;
    }
    if (agedRecord.submitted_at) {
      agedRecord.submitted_at = oldTimestamp;
    }
    if (agedRecord.started_at) {
      agedRecord.started_at = oldTimestamp;
    }
    if (agedRecord.completed_at) {
      agedRecord.completed_at = oldTimestamp;
    }
    if (agedRecord.published_at) {
      agedRecord.published_at = oldTimestamp;
    }

    await writeWorkspaceJson(workspace, relativePath, agedRecord);
  }
}

test("planning defers fresh baseline coverage until the stale threshold", async () => {
  await withWorkspace(async (workspace) => {
    await runPlanningSync(workspace, { LIT_REVIEW_STUDIO_DOMAIN: "sample-research" });

    const coverage = await readWorkspaceJson(workspace, "research/state/coverage-status.v1.json");
    const queue = await readWorkspaceJson(workspace, "research/backlog/priority-queue.v1.json");
    const row = coverage.nodes.find((node) => node.taxonomy_node_id === "example-topic");

    assert.equal(row.coverage_status, "baseline");
    assert.equal(row.next_mode, "review_update");
    assert.equal(row.queue_state, "deferred");
    assert.equal(row.freshness_status, "fresh");
    assert.equal(row.stale_after_days, 90);
    assert.equal(row.days_since_last_check, 0);
    assert.equal(queue.review_update_queue.some((item) => item.taxonomy_node_id === "example-topic"), false);
  });
});

test("planning moves stale baseline coverage into the Review Update queue", async () => {
  await withWorkspace(async (workspace) => {
    await ageSampleResearchBaseline(workspace);
    await runPlanningSync(workspace, { LIT_REVIEW_STUDIO_DOMAIN: "sample-research" });

    const coverage = await readWorkspaceJson(workspace, "research/state/coverage-status.v1.json");
    const queue = await readWorkspaceJson(workspace, "research/backlog/priority-queue.v1.json");
    const row = coverage.nodes.find((node) => node.taxonomy_node_id === "example-topic");
    const queueItem = queue.review_update_queue.find((item) => item.taxonomy_node_id === "example-topic");

    assert.equal(row.coverage_status, "baseline");
    assert.equal(row.next_mode, "review_update");
    assert.equal(row.queue_state, "ready");
    assert.equal(row.freshness_status, "stale");
    assert.equal(row.stale_after_days, 90);
    assert.equal(row.days_since_last_check, 151);
    assert.equal(row.stale_at, "2026-04-01T00:00:00.000Z");
    assert.ok(row.stale_reason.includes("stale after 90 days"));

    assert.equal(queueItem.default_mode, "review_update");
    assert.equal(queueItem.freshness_status, "stale");
    assert.equal(queueItem.days_since_last_check, 151);
    assert.ok(queueItem.rationale.includes("Baseline coverage is stale"));
  });
});

test("planning CLI exposes normalized queue paths and baseline_review next state", async () => {
  await withWorkspace(async (workspace) => {
    await runPlanningSync(workspace, { LIT_REVIEW_STUDIO_DOMAIN: "sample-research" });

    const { stdout: statusStdout } = await execFileAsync(process.execPath, [planningScriptPath, "status"], {
      cwd: workspace,
      env: {
        ...process.env,
        LIT_REVIEW_STUDIO_DOMAIN: "sample-research"
      }
    });
    const status = JSON.parse(statusStdout);

    assert.equal(status.domain_id, "sample-research");
    assert.equal(status.domain_matches, true);
    assert.ok(Array.isArray(status.queues.baseline_review));
    assert.ok(Array.isArray(status.queues.review_update));
    assert.equal(status.queue_counts.baseline_review, status.queues.baseline_review.length);

    const { stdout: nextStdout } = await execFileAsync(process.execPath, [planningScriptPath, "next", "--mode", "baseline_review"], {
      cwd: workspace,
      env: {
        ...process.env,
        LIT_REVIEW_STUDIO_DOMAIN: "sample-research"
      }
    });
    const next = JSON.parse(nextStdout);

    assert.equal(next.mode, "baseline_review");
    if (status.next.baseline_review) {
      assert.equal(next.item.taxonomy_node_id, status.next.baseline_review.taxonomy_node_id);
    } else {
      assert.equal(next.item, null);
    }
  });
});
