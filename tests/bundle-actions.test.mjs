import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflowModulePath = path.join(repoRoot, "scripts/lib/bundle-workflow.mjs");
const bundleScriptPath = path.join(repoRoot, "scripts/bundle.mjs");
const archiveBundleId = "archive-question-baseline-2026-05-31";

async function createWorkspace() {
  const workspace = await mkdtemp(path.join(tmpdir(), "evidence-workbench-actions-"));
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

function createOutputCapturePrelude() {
  return [
    'import { appendFileSync } from "node:fs";',
    'const __workflowStdoutPath = process.env.WORKFLOW_STDOUT_PATH;',
    'function __workflowWrite(chunk) {',
    '  appendFileSync(__workflowStdoutPath, typeof chunk === "string" ? chunk : String(chunk), "utf8");',
    '}',
    'console.log = (...args) => __workflowWrite(`${args.map(String).join(" ")}\\n`);',
    'process.stdout.write = (chunk) => {',
    '  __workflowWrite(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));',
    '  return true;',
    '};'
  ].join("\n");
}

async function runCapturedNode(workspace, source, env = {}) {
  const outputPath = path.join(
    workspace,
    `.captured-stdout-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`
  );
  await writeFile(outputPath, "", "utf8");

  await execFileAsync(process.execPath, ["--input-type=module", "-e", `${createOutputCapturePrelude()}\n${source}`], {
    cwd: workspace,
    env: {
      ...process.env,
      ...env,
      WORKFLOW_STDOUT_PATH: outputPath
    }
  });

  return readFile(outputPath, "utf8");
}

async function runWorkflow(workspace, source, env = {}) {
  const stdout = await runCapturedNode(workspace, source, {
    ...env,
    WORKFLOW_MODULE_PATH: workflowModulePath
  });
  return stdout.trim() ? JSON.parse(stdout) : undefined;
}

async function runBundleCli(workspace, args, env = {}) {
  const source = [
    `process.argv = ${JSON.stringify([process.execPath, bundleScriptPath, ...args])};`,
    `await import(${JSON.stringify(pathToFileURL(bundleScriptPath).href)});`
  ].join("\n");
  const stdout = await runCapturedNode(workspace, source, env);
  return JSON.parse(stdout);
}

test("review comments are written without touching real fixture data", async () => {
  await withWorkspace(async (workspace) => {
    const result = await runWorkflow(
      workspace,
      `
        const { addReviewComment } = await import(process.env.WORKFLOW_MODULE_PATH);
        const result = await addReviewComment("${archiveBundleId}", {
          body: "Needs one final editorial pass.",
          authorId: "test-curator"
        });
        console.log(JSON.stringify(result));
      `,
      { WORKBENCH_DOMAIN: "sample-archive" }
    );

    assert.equal(result.action, "commented");
    const comment = await readWorkspaceJson(workspace, result.comment_path);
    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);

    assert.equal(comment.body, "Needs one final editorial pass.");
    assert.equal(comment.author_id, "test-curator");
    assert.ok(bundle.review_comment_ids.includes(result.comment_id));
  });
});

test("request changes and reject update bundle status in an isolated workspace", async () => {
  await withWorkspace(async (workspace) => {
    const requested = await runWorkflow(
      workspace,
      `
        const { updateCandidateBundleStatus } = await import(process.env.WORKFLOW_MODULE_PATH);
        const result = await updateCandidateBundleStatus("${archiveBundleId}", "needs_revision", {
          reason: "Clarify the support map boundary."
        });
        console.log(JSON.stringify(result));
      `,
      { WORKBENCH_DOMAIN: "sample-archive" }
    );

    assert.equal(requested.previous_lifecycle_status, "submitted");
    assert.equal(requested.lifecycle_status, "needs_revision");
    let bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "needs_revision");
    assert.deepEqual(bundle.next_actions, ["Clarify the support map boundary."]);

    const rejected = await runWorkflow(
      workspace,
      `
        const { updateCandidateBundleStatus } = await import(process.env.WORKFLOW_MODULE_PATH);
        const result = await updateCandidateBundleStatus("${archiveBundleId}", "rejected", {
          reason: "Do not publish this fixture branch."
        });
        console.log(JSON.stringify(result));
      `,
      { WORKBENCH_DOMAIN: "sample-archive" }
    );

    assert.equal(rejected.previous_lifecycle_status, "needs_revision");
    assert.equal(rejected.lifecycle_status, "rejected");
    bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "rejected");
    assert.deepEqual(bundle.next_actions, ["Do not publish this fixture branch."]);
  });
});

test("approve is blocked when required evidence review lanes are incomplete", async () => {
  await withWorkspace(async (workspace) => {
    const reviewPath = "data/evidence-reviews/evidence-review-archive-question-source-fidelity-r1.json";
    const review = await readWorkspaceJson(workspace, reviewPath);
    await writeWorkspaceJson(workspace, reviewPath, {
      ...review,
      status: "draft"
    });

    await assert.rejects(
      runWorkflow(
        workspace,
        `
          const { approveCandidateBundle } = await import(process.env.WORKFLOW_MODULE_PATH);
          const result = await approveCandidateBundle("${archiveBundleId}");
          console.log(JSON.stringify(result));
        `,
        { WORKBENCH_DOMAIN: "sample-archive" }
      ),
      /not ready for approval/
    );

    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "submitted");
  });
});

test("publish is blocked until a bundle is approved", async () => {
  await withWorkspace(async (workspace) => {
    await assert.rejects(
      runWorkflow(
        workspace,
        `
          const { publishCandidateBundle } = await import(process.env.WORKFLOW_MODULE_PATH);
          const result = await publishCandidateBundle("${archiveBundleId}");
          console.log(JSON.stringify(result));
        `,
        { WORKBENCH_DOMAIN: "sample-archive" }
      ),
      /must be approved before publication/
    );
  });
});

test("approved bundle publishes staged records in a temporary workspace", async () => {
  await withWorkspace(async (workspace) => {
    const result = await runWorkflow(
      workspace,
      `
        const { approveCandidateBundle, publishCandidateBundle } = await import(process.env.WORKFLOW_MODULE_PATH);
        await approveCandidateBundle("${archiveBundleId}");
        const result = await publishCandidateBundle("${archiveBundleId}", { publishedBy: "test-curator" });
        console.log(JSON.stringify(result));
      `,
      { WORKBENCH_DOMAIN: "sample-archive" }
    );

    assert.equal(result.action, "published");
    assert.equal(result.bundle_id, archiveBundleId);
    assert.ok(result.published_targets.some((target) => target.record_type === "claim"));

    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    const claim = await readWorkspaceJson(workspace, "data/claims/sample-archive-claim-baseline.json");
    const event = await readWorkspaceJson(workspace, result.publication_event_path);

    assert.equal(bundle.lifecycle_status, "published");
    assert.ok(bundle.publication_event_ids.includes(result.publication_event_id));
    assert.equal(claim.record_type, "claim");
    assert.equal(event.published_by, "test-curator");
  });
});

test("bundle CLI exposes non-destructive status JSON after action refactor", async () => {
  await withWorkspace(async (workspace) => {
    const status = await runBundleCli(workspace, ["status", "--bundle", archiveBundleId], {
      WORKBENCH_DOMAIN: "sample-archive"
    });

    assert.equal(status.bundle_id, archiveBundleId);
    assert.equal(status.validation.ready, true);
    assert.equal(status.evidence_review_gate.ready, true);
  });
});
