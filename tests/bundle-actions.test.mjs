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
const reviewScriptPath = path.join(repoRoot, "scripts/review-evidence.mjs");
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
    assert.equal(result.public_graph_delta.by_record_type.claim.created, 1);
    assert.equal(event.public_graph_delta.by_record_type.claim.created, 1);
  });
});

test("publish propagates non-blocking review findings into follow-up actions", async () => {
  await withWorkspace(async (workspace) => {
    const artifactPath =
      "data/staged-records/archive-question-baseline-2026-05-31/sample-archive-artifact-2026.json";
    const artifact = await readWorkspaceJson(workspace, artifactPath);
    await writeWorkspaceJson(workspace, artifactPath, {
      ...artifact,
      reported_metrics: "Fixture reports a count that still needs table-level extraction.",
      numeric_results_extracted: false
    });

    const reviewPath = "data/evidence-reviews/evidence-review-archive-question-source-fidelity-r1.json";
    const review = await readWorkspaceJson(workspace, reviewPath);
    await writeWorkspaceJson(workspace, reviewPath, {
      ...review,
      findings: [
        {
          finding_id: "archive-follow-up-note",
          severity: "note",
          category: "uncertainty",
          claim_or_issue: "The fixture review includes a non-blocking follow-up note.",
          why_it_matters: "Non-blocking review notes should remain visible after publication.",
          recommended_action: "Revisit fixture detail extraction in the next manual pass.",
          resolution_status: "closed",
          applies_to_change_id: "create-archive-claim"
        }
      ]
    });

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

    const expectedAction = "source_fidelity: Revisit fixture detail extraction in the next manual pass.";
    const bundle = await readWorkspaceJson(workspace, `data/candidate-bundles/${archiveBundleId}.json`);
    const event = await readWorkspaceJson(workspace, result.publication_event_path);
    const expectedExtractionAction = {
      action_id: "extract-numeric-results-sample-archive-artifact-2026",
      action_type: "numeric_results_extraction",
      status: "open",
      priority: "medium",
      target_record_type: "artifact",
      target_record_id: "sample-archive-artifact-2026",
      source_ids: ["sample-archive-source-2026"],
      taxonomy_node_ids: ["archive-question"],
      metric_fields_present: ["reported_metrics"],
      reason:
        "artifact sample-archive-artifact-2026 reports metric text but numeric_results_extracted is false.",
      recommended_action:
        "Extract table-level numeric results for Synthetic Archive Artifact before quantitative synthesis.",
      artifact_id: "sample-archive-artifact-2026"
    };

    assert.deepEqual(result.review_follow_up_actions, [expectedAction]);
    assert.deepEqual(result.extraction_follow_up_actions, [expectedExtractionAction]);
    assert.ok(bundle.next_actions.includes(expectedAction));
    assert.ok(bundle.next_actions.includes("Resolve 1 structured extraction follow-up action(s) before quantitative synthesis."));
    assert.deepEqual(bundle.extraction_follow_up_actions, [expectedExtractionAction]);
    assert.deepEqual(event.review_follow_up_actions, [expectedAction]);
    assert.deepEqual(event.extraction_follow_up_actions, [expectedExtractionAction]);
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

test("bundle CLI audit exposes workflow checks and projected graph deltas", async () => {
  await withWorkspace(async (workspace) => {
    const audit = await runBundleCli(workspace, ["audit", "--bundle", archiveBundleId], {
      WORKBENCH_DOMAIN: "sample-archive"
    });

    assert.equal(audit.bundle_id, archiveBundleId);
    assert.equal(audit.workflow_audit.projected_publication_delta.by_record_type.claim.created, 1);
    assert.ok(Array.isArray(audit.workflow_audit.source_depth.checks));
    assert.ok(Array.isArray(audit.workflow_audit.source_access.checks));
    assert.ok(Array.isArray(audit.workflow_audit.search_linkage.checks));
    assert.ok(Array.isArray(audit.workflow_audit.timestamp_order.checks));
    assert.ok(Array.isArray(audit.workflow_audit.numeric_extraction.checks));
    assert.equal(audit.workflow_audit.publication_completeness.eligible, false);
  });
});

test("published bundle audit exposes publication completeness and live/staged drift", async () => {
  await withWorkspace(async (workspace) => {
    const claimPath = "data/claims/sample-claim-example-topic-baseline.json";
    const claim = await readWorkspaceJson(workspace, claimPath);
    await writeWorkspaceJson(workspace, claimPath, {
      ...claim,
      summary: "Synthetic drift introduced by the audit test."
    });

    const audit = await runBundleCli(workspace, ["audit", "--bundle", "example-topic-bootstrap-2026-05-31"], {
      WORKBENCH_DOMAIN: "sample-research"
    });
    const driftCheck = audit.workflow_audit.publication_completeness.checks.find(
      (check) => check.target_record_id === "sample-claim-example-topic-baseline"
    );

    assert.equal(audit.workflow_audit.publication_completeness.eligible, true);
    assert.equal(audit.workflow_audit.publication_completeness.ready, false);
    assert.equal(driftCheck.live_matches_staged, false);
    assert.ok(audit.workflow_audit.warnings.some((warning) => warning.includes("published live record differs")));
  });
});

test("bundle audit flags missing numeric extraction status when metric fields are staged", async () => {
  await withWorkspace(async (workspace) => {
    const artifactPath =
      "data/staged-records/archive-question-baseline-2026-05-31/sample-archive-artifact-2026.json";
    const artifact = await readWorkspaceJson(workspace, artifactPath);
    await writeWorkspaceJson(workspace, artifactPath, {
      ...artifact,
      reported_metrics: "Synthetic fixture reports an illustrative count but does not extract a table."
    });

    const audit = await runBundleCli(workspace, ["audit", "--bundle", archiveBundleId], {
      WORKBENCH_DOMAIN: "sample-archive"
    });
    const numericCheck = audit.workflow_audit.numeric_extraction.checks.find(
      (check) => check.target_record_id === "sample-archive-artifact-2026"
    );

    assert.equal(audit.workflow_audit.numeric_extraction.ready, false);
    assert.equal(numericCheck.numeric_results_extracted, "missing");
    assert.ok(
      audit.workflow_audit.numeric_extraction.warnings.some((warning) =>
        warning.includes("numeric_results_extracted")
      )
    );
  });
});

test("bundle audit surfaces structured extraction follow-ups for deferred numeric extraction", async () => {
  await withWorkspace(async (workspace) => {
    const artifactPath =
      "data/staged-records/archive-question-baseline-2026-05-31/sample-archive-artifact-2026.json";
    const artifact = await readWorkspaceJson(workspace, artifactPath);
    await writeWorkspaceJson(workspace, artifactPath, {
      ...artifact,
      reported_metrics: "Fixture reports a count that still needs table-level extraction.",
      numeric_results_extracted: false
    });
    const findingPath =
      "data/staged-records/archive-question-baseline-2026-05-31/sample-archive-finding-context-2026.json";
    const finding = await readWorkspaceJson(workspace, findingPath);
    await writeWorkspaceJson(workspace, findingPath, {
      ...finding,
      numeric_results_extracted: "not_applicable"
    });

    const audit = await runBundleCli(workspace, ["audit", "--bundle", archiveBundleId], {
      WORKBENCH_DOMAIN: "sample-archive"
    });
    const followUps = audit.workflow_audit.extraction_follow_ups;

    assert.equal(followUps.open_count, 1);
    assert.deepEqual(followUps.actions[0], {
      action_id: "extract-numeric-results-sample-archive-artifact-2026",
      action_type: "numeric_results_extraction",
      status: "open",
      priority: "medium",
      target_record_type: "artifact",
      target_record_id: "sample-archive-artifact-2026",
      source_ids: ["sample-archive-source-2026"],
      taxonomy_node_ids: ["archive-question"],
      metric_fields_present: ["reported_metrics"],
      reason:
        "artifact sample-archive-artifact-2026 reports metric text but numeric_results_extracted is false.",
      recommended_action:
        "Extract table-level numeric results for Synthetic Archive Artifact before quantitative synthesis.",
      artifact_id: "sample-archive-artifact-2026"
    });
    assert.equal(audit.workflow_audit.numeric_extraction.ready, true);
  });
});

test("bundle audit surfaces source-access follow-ups for abstract-only supporting sources", async () => {
  await withWorkspace(async (workspace) => {
    const domainPath = "domain-packs/sample-archive/domain.json";
    const domain = await readWorkspaceJson(workspace, domainPath);
    await writeWorkspaceJson(workspace, domainPath, {
      ...domain,
      source_access_policy: {
        minimum_finding_access_depth: "full_text",
        insufficient_finding_access_action: "warn",
        follow_up_priority: "high"
      }
    });

    const sourcePath = "data/staged-records/archive-question-baseline-2026-05-31/sample-archive-source-2026.json";
    const source = await readWorkspaceJson(workspace, sourcePath);
    await writeWorkspaceJson(workspace, sourcePath, {
      ...source,
      access_status: "abstract_only_paywalled",
      access_depth: "abstract_only",
      access_attempts: [
        {
          attempted_at: "2026-06-02T18:30:00Z",
          url: "https://example.com/sample-archive/archive-question",
          result: "paywalled_abstract_only",
          notes: "Fixture source exposed only abstract text during review."
        }
      ]
    });

    const findingPath =
      "data/staged-records/archive-question-baseline-2026-05-31/sample-archive-finding-context-2026.json";
    const finding = await readWorkspaceJson(workspace, findingPath);
    await writeWorkspaceJson(workspace, findingPath, {
      ...finding,
      source_locator: {
        section: "Publisher abstract",
        url: "https://example.com/sample-archive/archive-question",
        verification_status: "abstract_only"
      }
    });

    const audit = await runBundleCli(workspace, ["audit", "--bundle", archiveBundleId], {
      WORKBENCH_DOMAIN: "sample-archive"
    });
    const sourceAccess = audit.workflow_audit.source_access;

    assert.equal(sourceAccess.ready, false);
    assert.equal(sourceAccess.policy_active, true);
    assert.equal(sourceAccess.required_finding_access_depth, "full_text");
    assert.equal(sourceAccess.follow_ups.open_count, 1);
    assert.deepEqual(sourceAccess.follow_ups.actions[0], {
      action_id: "resolve-source-access-sample-archive-finding-context-2026",
      action_type: "source_access_resolution",
      status: "open",
      priority: "high",
      target_record_type: "finding",
      target_record_id: "sample-archive-finding-context-2026",
      source_ids: ["sample-archive-source-2026"],
      taxonomy_node_ids: ["archive-question"],
      access_status: "abstract_only_paywalled",
      access_depth: "abstract_only",
      locator_depth: "abstract_or_metadata",
      required_access_depth: "full_text",
      reason:
        "create-archive-finding: finding sample-archive-finding-context-2026 relies on Synthetic Archive Source with abstract only/paywalled, below the domain minimum of full_text.",
      recommended_action:
        "Retrieve full text for Synthetic Archive Source, replace or downgrade the finding, or mark the source as screening-only before synthesis use.",
      finding_id: "sample-archive-finding-context-2026",
      artifact_id: "sample-archive-artifact-2026"
    });
    assert.ok(
      audit.workflow_audit.warnings.some((warning) =>
        warning.includes("below the domain minimum of full_text")
      )
    );
  });
});

test("bundle audit flags timestamp ordering inversions", async () => {
  await withWorkspace(async (workspace) => {
    const bundlePath = "data/candidate-bundles/example-topic-bootstrap-2026-05-31.json";
    const bundle = await readWorkspaceJson(workspace, bundlePath);
    await writeWorkspaceJson(workspace, bundlePath, {
      ...bundle,
      submitted_at: "2026-06-01T00:00:00Z"
    });

    const audit = await runBundleCli(workspace, ["audit", "--bundle", "example-topic-bootstrap-2026-05-31"], {
      WORKBENCH_DOMAIN: "sample-research"
    });

    assert.equal(audit.workflow_audit.timestamp_order.ready, false);
    assert.ok(
      audit.workflow_audit.timestamp_order.warnings.some((warning) =>
        warning.includes("bundle submitted_at") && warning.includes("published_at")
      )
    );
  });
});

test("bundle CLI precommit summarizes workflow state and verification commands", async () => {
  await withWorkspace(async (workspace) => {
    const summary = await runBundleCli(workspace, ["precommit", "--bundle", archiveBundleId], {
      WORKBENCH_DOMAIN: "sample-archive"
    });

    assert.equal(summary.action, "precommit_summary");
    assert.equal(summary.bundle_id, archiveBundleId);
    assert.equal(summary.public_graph_delta.by_record_type.claim.created, 1);
    assert.equal(summary.evidence_reviews.ready, true);
    assert.equal(summary.workflow_audit.source_access_follow_up_count, 0);
    assert.deepEqual(summary.source_access_follow_ups, {
      open_count: 0,
      actions: []
    });
    assert.ok(summary.verification_commands.includes("npm run validate"));
    assert.ok(
      summary.verification_commands.includes(
        `WORKBENCH_DOMAIN=sample-archive npm run research:bundle -- validate --bundle ${archiveBundleId}`
      )
    );
    assert.equal(summary.planning.domain_matches, false);
    assert.equal(summary.planning.next_queue_item, null);
  });
});

test("evidence review scaffold includes lane checklist and correction metadata", async () => {
  await withWorkspace(async (workspace) => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        reviewScriptPath,
        "scaffold",
        "--bundle",
        archiveBundleId,
        "--lane",
        "source_fidelity",
        "--dry-run"
      ],
      {
        cwd: workspace,
        env: {
          ...process.env,
          WORKBENCH_DOMAIN: "sample-archive"
        }
      }
    );

    const draft = JSON.parse(stdout);
    assert.deepEqual(draft.corrections_applied, []);
    assert.ok(draft.__draft.lane_checklist.some((item) => item.includes("deepest available locator")));
  });
});
