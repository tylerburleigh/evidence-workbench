import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { loadActiveDomainPack, loadDomainPack, workspaceRoot } from "../scripts/lib/workspace.mjs";

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
