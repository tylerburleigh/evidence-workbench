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
const actionHandlersModulePath = path.join(repoRoot, "src/app/admin/review/action-handlers.js");
const workflowModulePath = path.join(repoRoot, "scripts/lib/bundle-workflow.mjs");
const studioDataModulePath = path.join(repoRoot, "scripts/lib/studio-data.mjs");
const archiveBundleId = "archive-question-baseline-2026-05-31";

async function createWorkspace() {
  const workspace = await mkdtemp(path.join(tmpdir(), "lit-review-studio-admin-actions-"));
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
      ACTION_HANDLERS_MODULE_PATH: actionHandlersModulePath,
      STUDIO_DATA_MODULE_PATH: studioDataModulePath,
      WORKFLOW_MODULE_PATH: workflowModulePath,
      WORKFLOW_STDOUT_PATH: outputPath
    }
  });

  const stdout = await readFile(outputPath, "utf8");
  return stdout.trim() ? JSON.parse(stdout) : undefined;
}

function actionHarnessSource(actionName, fields) {
  return `
    const { createAdminReviewActionHandlers } = await import(process.env.ACTION_HANDLERS_MODULE_PATH);
    const workflow = await import(process.env.WORKFLOW_MODULE_PATH);
    const { loadDomainStudioData } = await import(process.env.STUDIO_DATA_MODULE_PATH);
    const revalidatedPaths = [];
    const handlers = createAdminReviewActionHandlers({
      addReviewComment: workflow.addReviewComment,
      approveCandidateBundle: workflow.approveCandidateBundle,
      loadDomainStudioData,
      publishCandidateBundle: workflow.publishCandidateBundle,
      revalidateAdminPaths(bundleId) {
        revalidatedPaths.push("/", "/activity", "/scope", "/admin/review", \`/admin/review/\${bundleId}\`);
      },
      updateCandidateBundleStatus: workflow.updateCandidateBundleStatus
    });
    const formData = new FormData();
    for (const [key, value] of ${JSON.stringify(Object.entries(fields))}) {
      formData.set(key, value);
    }
    const targetPath = await handlers[${JSON.stringify(actionName)}](formData);
    console.log(JSON.stringify({ targetPath, revalidatedPaths }));
  `;
}

function parseQueryPath(targetPath) {
  return new URL(targetPath, "http://localhost");
}

test("admin add-comment action trims form input, writes comment, and returns notice redirect", async () => {
  await withWorkspace(async (workspace) => {
    const result = await runCapturedNode(
      workspace,
      actionHarnessSource("addComment", {
        bundleId: archiveBundleId,
        body: "  Needs one final editorial pass.  "
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );

    const target = parseQueryPath(result.targetPath);
    assert.equal(target.pathname, `/admin/review/${archiveBundleId}`);
    assert.equal(target.searchParams.get("notice"), "Review comment added.");
    assert.deepEqual(result.revalidatedPaths, ["/", "/activity", "/scope", "/admin/review", `/admin/review/${archiveBundleId}`]);

    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    const commentId = bundle.editorial_comment_ids.at(-1);
    const comment = await readWorkspaceJson(workspace, `data/editorial-comments/${commentId}.json`);
    assert.equal(comment.body, "Needs one final editorial pass.");
    assert.equal(comment.author_kind, "human");
    assert.equal(comment.author_id, "local-curator");
  });
});

test("admin request-changes and reject actions parse reasons and update bundle status", async () => {
  await withWorkspace(async (workspace) => {
    const requested = await runCapturedNode(
      workspace,
      actionHarnessSource("requestChanges", {
        bundleId: archiveBundleId,
        reason: "  Clarify the support map boundary.  "
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );

    let target = parseQueryPath(requested.targetPath);
    assert.equal(target.searchParams.get("notice"), "Bundle marked as needing revision.");
    let bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "needs_revision");
    assert.deepEqual(bundle.next_actions, ["Clarify the support map boundary."]);

    const rejected = await runCapturedNode(
      workspace,
      actionHarnessSource("reject", {
        bundleId: archiveBundleId,
        reason: "  Do not publish this fixture branch.  "
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );

    target = parseQueryPath(rejected.targetPath);
    assert.equal(target.searchParams.get("notice"), "Bundle rejected.");
    bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "rejected");
    assert.deepEqual(bundle.next_actions, ["Do not publish this fixture branch."]);
  });
});

test("admin approve and publish actions return notice redirects and promote records", async () => {
  await withWorkspace(async (workspace) => {
    const approved = await runCapturedNode(
      workspace,
      actionHarnessSource("approve", {
        bundleId: archiveBundleId
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );

    let target = parseQueryPath(approved.targetPath);
    assert.equal(target.searchParams.get("notice"), "Bundle approved.");
    let bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "approved");

    const published = await runCapturedNode(
      workspace,
      actionHarnessSource("publish", {
        bundleId: archiveBundleId
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );

    target = parseQueryPath(published.targetPath);
    assert.equal(target.searchParams.get("notice"), "Bundle published.");
    bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    const claim = await readWorkspaceJson(workspace, "data/claims/sample-archive-claim-baseline.json");
    assert.equal(bundle.lifecycle_status, "published");
    assert.equal(claim.record_type, "claim");
    assert.ok(bundle.publication_event_ids.length > 0);
  });
});

test("admin actions return error redirects for missing bundle id and active-domain mismatch", async () => {
  await withWorkspace(async (workspace) => {
    const missing = await runCapturedNode(
      workspace,
      actionHarnessSource("approve", {}),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );
    let target = parseQueryPath(missing.targetPath);
    assert.equal(target.pathname, "/admin/review");
    assert.equal(target.searchParams.get("error"), "Missing bundle id.");
    assert.deepEqual(missing.revalidatedPaths, []);

    const mismatch = await runCapturedNode(
      workspace,
      actionHarnessSource("approve", {
        bundleId: archiveBundleId
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-research" }
    );
    target = parseQueryPath(mismatch.targetPath);
    assert.equal(target.pathname, `/admin/review/${archiveBundleId}`);
    assert.equal(target.searchParams.get("error"), `Bundle is not part of the active domain: ${archiveBundleId}`);

    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "submitted");
    assert.deepEqual(mismatch.revalidatedPaths, []);
  });
});

test("admin publish action returns workflow error redirect when bundle is not approved", async () => {
  await withWorkspace(async (workspace) => {
    const result = await runCapturedNode(
      workspace,
      actionHarnessSource("publish", {
        bundleId: archiveBundleId
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );

    const target = parseQueryPath(result.targetPath);
    assert.equal(target.pathname, `/admin/review/${archiveBundleId}`);
    assert.match(target.searchParams.get("error"), /must be approved before publication/);
    assert.deepEqual(result.revalidatedPaths, []);

    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    assert.equal(bundle.lifecycle_status, "submitted");
  });
});

test("admin approve action returns workflow error redirect when evidence appraisals are incomplete", async () => {
  await withWorkspace(async (workspace) => {
    const reviewPath = "data/evidence-appraisals/evidence-appraisal-archive-question-source-fidelity-r1.json";
    const review = await readWorkspaceJson(workspace, reviewPath);
    await writeWorkspaceJson(workspace, reviewPath, {
      ...review,
      status: "draft"
    });

    const result = await runCapturedNode(
      workspace,
      actionHarnessSource("approve", {
        bundleId: archiveBundleId
      }),
      { LIT_REVIEW_STUDIO_DOMAIN: "sample-archive" }
    );

    const target = parseQueryPath(result.targetPath);
    assert.equal(target.pathname, `/admin/review/${archiveBundleId}`);
    assert.match(target.searchParams.get("error"), /not ready for approval/);
    assert.deepEqual(result.revalidatedPaths, []);
  });
});
