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

async function readFixtureText(relativePath) {
  return readFile(path.join(workspaceRoot, relativePath), "utf8");
}

const coreSkillNames = [
  "research-bootstrap",
  "surveillance-update",
  "evidence-review",
  "editorial-review"
];

const domainSkillAdapters = {
  "sample-research": {
    "bootstrap.md": "research-bootstrap",
    "surveillance.md": "surveillance-update",
    "evidence-review.md": "evidence-review",
    "editorial-review.md": "editorial-review"
  },
  "sample-archive": {
    "bootstrap.md": "research-bootstrap",
    "surveillance.md": "surveillance-update",
    "evidence-review.md": "evidence-review",
    "editorial-review.md": "editorial-review"
  },
  "software-supply-chain": {
    "bootstrap.md": "research-bootstrap",
    "surveillance.md": "surveillance-update",
    "evidence-review.md": "evidence-review",
    "editorial-review.md": "editorial-review"
  }
};

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

test("downstream software supply-chain pack loads without core code changes", async () => {
  const domainPack = await loadDomainPack("software-supply-chain");

  assert.equal(domainPack.domain.default_scope_unit, "control");
  assert.equal(domainPack.domain.planning.stale_after_days, 60);
  assert.ok(domainPack.taxonomyNodeIds.has("release-provenance-control"));
  assert.ok(domainPack.reviewLaneIds.has("control_fit"));
  assert.ok(domainPack.reviewLaneIds.has("risk_framing"));
  assert.ok(domainPack.extractionSchema.fields.some((field) => field.id === "risk_interpretation"));
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

test("workbench data facade loads published downstream supply-chain graph", async () => {
  const data = await loadDomainWorkbenchData({ domainId: "software-supply-chain" });

  assert.equal(data.domainPack.domain.name, "Software Supply Chain Review");
  assert.equal(data.collections.claims.length, 3);
  assert.equal(data.collections.sources.length, 3);
  assert.equal(data.collections.candidateBundles.length, 3);

  const bundleReports = new Map(data.bundleReports.map((report) => [report.bundle_id, report]));
  assert.equal(bundleReports.get("release-provenance-control-baseline-2026-06-01")?.validation.ready, true);
  assert.equal(bundleReports.get("dependency-exposure-control-baseline-2026-06-01")?.validation.ready, true);
  assert.equal(bundleReports.get("maintenance-signal-control-baseline-2026-06-01")?.validation.ready, true);
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

test("core agent skills expose codex-style metadata and workflow sections", async () => {
  for (const skillName of coreSkillNames) {
    const text = await readFixtureText(`skills/${skillName}/SKILL.md`);

    assert.match(text, /^---\n/);
    assert.match(text, new RegExp(`name: ${skillName}`));
    assert.match(text, /description: /);
    assert.match(text, /## Read First/);
    assert.match(text, /## Workflow/);
    assert.match(text, /## Boundaries/);
    assert.match(text, /## Expected Outputs/);
  }
});

test("domain skill adapters map fixture packs to core workflows", async () => {
  for (const [domainId, adapters] of Object.entries(domainSkillAdapters)) {
    for (const [fileName, coreSkillName] of Object.entries(adapters)) {
      const text = await readFixtureText(`domain-packs/${domainId}/skills/${fileName}`);

      assert.match(text, /^---\n/);
      assert.match(text, new RegExp(`domain_id: ${domainId}`));
      assert.match(text, new RegExp(`adapter_for: ${coreSkillName}`));
      assert.match(text, /## Read First/);
      assert.match(text, /## Domain Rules/);
      assert.match(text, /## Output Checks/);
      assert.match(text, new RegExp(`Use with \`skills/${coreSkillName}/SKILL.md\``));
    }
  }

  const sampleResearchBootstrap = await readFixtureText("domain-packs/sample-research/skills/bootstrap.md");
  assert.match(sampleResearchBootstrap, /subject/);
  assert.match(sampleResearchBootstrap, /limitations/);

  const sampleArchiveBootstrap = await readFixtureText("domain-packs/sample-archive/skills/bootstrap.md");
  assert.match(sampleArchiveBootstrap, /archive_item/);
  assert.match(sampleArchiveBootstrap, /context_boundary/);

  const softwareBootstrap = await readFixtureText("domain-packs/software-supply-chain/skills/bootstrap.md");
  assert.match(softwareBootstrap, /control_signal/);
  assert.match(softwareBootstrap, /risk_interpretation/);
});
