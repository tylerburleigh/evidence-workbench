import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { loadActiveDomainPack, loadDomainPack, workspaceRoot } from "../scripts/lib/workspace.mjs";
import { buildBundleReport, toPublicReport } from "../scripts/lib/bundle-workflow.mjs";
import { loadDomainWorkbenchData } from "../scripts/lib/workbench-data.mjs";

async function readFixtureJson(relativePath) {
  const raw = await readFile(path.join(workspaceRoot, relativePath), "utf8");
  return JSON.parse(raw);
}

test("active domain pack is loaded from neutral sample fixture", async () => {
  const domainPack = await loadActiveDomainPack();

  assert.equal(domainPack.domain.id, "sample-research");
  assert.ok(domainPack.taxonomyNodeIds.has("example-topic"));
  assert.ok(domainPack.reviewLaneIds.has("source_fidelity"));
  assert.ok(domainPack.extractionSchema.fields.some((field) => field.id === "limitations"));
});

test("second fixture pack uses different scope units and review lanes", async () => {
  const domainPack = await loadDomainPack("sample-archive");

  assert.equal(domainPack.domain.default_scope_unit, "question");
  assert.ok(domainPack.taxonomyNodeIds.has("archive-question"));
  assert.ok(domainPack.reviewLaneIds.has("scope_fit"));
  assert.ok(domainPack.extractionSchema.fields.some((field) => field.id === "archive_item"));
});

test("active domain can be overridden without editing config", async () => {
  const previousDomain = process.env.WORKBENCH_DOMAIN;
  process.env.WORKBENCH_DOMAIN = "sample-archive";

  try {
    const domainPack = await loadActiveDomainPack();
    assert.equal(domainPack.domain.id, "sample-archive");
  } finally {
    if (previousDomain === undefined) {
      delete process.env.WORKBENCH_DOMAIN;
    } else {
      process.env.WORKBENCH_DOMAIN = previousDomain;
    }
  }
});

test("published fixture claim keeps concrete support links", async () => {
  const claim = await readFixtureJson("data/claims/sample-claim-example-topic-baseline.json");

  assert.equal(claim.record_type, "claim");
  assert.deepEqual(claim.supporting_finding_ids, ["sample-finding-example-topic-context-2026"]);
  assert.deepEqual(claim.supporting_source_ids, ["sample-source-example-topic-2026"]);
  assert.equal(claim.supporting_evidence[0].finding_ids[0], "sample-finding-example-topic-context-2026");
});

test("workbench data facade loads published sample-research graph", async () => {
  const data = await loadDomainWorkbenchData({ domainId: "sample-research" });

  assert.equal(data.domainPack.domain.id, "sample-research");
  assert.equal(data.collections.claims.length, 1);
  assert.equal(data.collections.candidateBundles.length, 1);
  assert.equal(data.bundleReports[0].bundle_id, "example-topic-bootstrap-2026-05-31");
  assert.equal(data.bundleReports[0].validation.ready, true);
});

test("workbench data facade loads unpublished sample-archive review queue", async () => {
  const data = await loadDomainWorkbenchData({ domainId: "sample-archive" });

  assert.equal(data.domainPack.domain.default_scope_unit, "question");
  assert.equal(data.collections.claims.length, 0);
  assert.equal(data.collections.candidateBundles.length, 1);
  assert.equal(data.collections.evidenceReviews.length, 3);
  assert.equal(data.bundleReports[0].evidence_review_gate.ready, true);
});

test("bundle reports are available as reusable workflow data", async () => {
  const domainPack = await loadDomainPack("sample-archive");
  const report = toPublicReport(
    await buildBundleReport("archive-question-baseline-2026-05-31", { domainPack })
  );

  assert.equal(report.bundle_id, "archive-question-baseline-2026-05-31");
  assert.equal(report.validation.ready, true);
  assert.deepEqual(report.evidence_review_gate.required_lanes, [
    "source_fidelity",
    "scope_fit",
    "context_boundaries"
  ]);
});
