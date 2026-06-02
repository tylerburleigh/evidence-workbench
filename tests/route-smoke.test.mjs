import assert from "node:assert/strict";
import test from "node:test";
import { buildRouteChecks } from "../scripts/smoke-public-routes.mjs";
import { loadDomainWorkbenchData } from "../scripts/lib/workbench-data.mjs";

function routePaths(routes) {
  return new Set(routes.map((route) => route.path));
}

function assertRouteHasText(routes, path, expectedText) {
  const route = routes.find((item) => item.path === path);
  assert.ok(route, `Missing route check for ${path}`);

  for (const text of expectedText) {
    assert.ok(route.expectedText.includes(text), `${path} should assert ${text}`);
  }
}

test("sample-research route smoke inventory covers public collections, detail routes, and admin review", async () => {
  const data = await loadDomainWorkbenchData({ domainId: "sample-research" });
  const routes = buildRouteChecks(data);
  const paths = routePaths(routes);

  for (const path of [
    "/",
    "/scope",
    "/claims",
    "/findings",
    "/artifacts",
    "/sources",
    "/activity",
    "/reports",
    "/methods",
    "/admin/review",
    "/scope/example-topic",
    "/scope/second-example-topic",
    "/claims/sample-claim-example-topic-baseline",
    "/findings/sample-finding-example-topic-context-2026",
    "/artifacts/sample-artifact-example-topic-2026",
    "/sources/sample-source-example-topic-2026",
    "/admin/review/example-topic-bootstrap-2026-05-31"
  ]) {
    assert.ok(paths.has(path), `Missing route check for ${path}`);
  }

  assertRouteHasText(routes, "/claims/sample-claim-example-topic-baseline", ["Support Map", "Claim Details"]);
  assertRouteHasText(routes, "/findings/sample-finding-example-topic-context-2026", ["Details", "Links"]);
  assertRouteHasText(routes, "/artifacts/sample-artifact-example-topic-2026", ["Scope", "Sources"]);
  assertRouteHasText(routes, "/admin/review/example-topic-bootstrap-2026-05-31", ["Actions", "Evidence Reviews"]);
});

test("sample-archive route smoke inventory still covers unpublished review workspace routes", async () => {
  const data = await loadDomainWorkbenchData({ domainId: "sample-archive" });
  const routes = buildRouteChecks(data);
  const paths = routePaths(routes);

  assert.ok(paths.has("/scope/archive-question"));
  assert.ok(paths.has("/scope/archive-gap-question"));
  assert.ok(paths.has("/reports"));
  assert.ok(paths.has("/admin/review/archive-question-baseline-2026-05-31"));
  assertRouteHasText(routes, "/admin/review/archive-question-baseline-2026-05-31", [
    "Actions",
    "Validation",
    "Proposed Changes"
  ]);
});

test("software supply-chain route smoke inventory covers downstream published graph", async () => {
  const data = await loadDomainWorkbenchData({ domainId: "software-supply-chain" });
  const routes = buildRouteChecks(data);
  const paths = routePaths(routes);

  for (const path of [
    "/",
    "/scope",
    "/claims",
    "/findings",
    "/artifacts",
    "/sources",
    "/activity",
    "/reports",
    "/methods",
    "/admin/review",
    "/scope/release-provenance-control",
    "/scope/dependency-exposure-control",
    "/scope/maintenance-signal-control",
    "/claims/release-provenance-control-baseline-claim",
    "/claims/dependency-exposure-control-baseline-claim",
    "/claims/maintenance-signal-control-baseline-claim",
    "/findings/slsa-build-provenance-control-model-finding-2026",
    "/findings/openssf-scorecard-dependency-exposure-finding-2026",
    "/findings/openssf-scorecard-maintenance-signal-finding-2026",
    "/artifacts/slsa-build-provenance-v1-2-artifact",
    "/artifacts/openssf-scorecard-dependency-exposure-artifact",
    "/artifacts/openssf-scorecard-maintenance-signal-artifact",
    "/sources/slsa-build-provenance-v1-2-source",
    "/sources/openssf-scorecard-checks-source",
    "/sources/openssf-scorecard-maintenance-checks-source",
    "/admin/review/release-provenance-control-baseline-2026-06-01",
    "/admin/review/dependency-exposure-control-baseline-2026-06-01",
    "/admin/review/maintenance-signal-control-baseline-2026-06-01"
  ]) {
    assert.ok(paths.has(path), `Missing route check for ${path}`);
  }

  assertRouteHasText(routes, "/scope/release-provenance-control", [
    "Release Provenance Control",
    "Claims",
    "Bundle State"
  ]);
  assertRouteHasText(routes, "/claims/release-provenance-control-baseline-claim", ["Support Map", "Claim Details"]);
  assertRouteHasText(routes, "/findings/slsa-build-provenance-control-model-finding-2026", ["Details", "Links"]);
  assertRouteHasText(routes, "/artifacts/slsa-build-provenance-v1-2-artifact", ["Scope", "Sources"]);
  assertRouteHasText(routes, "/scope/dependency-exposure-control", [
    "Dependency Exposure Control",
    "Claims",
    "Bundle State"
  ]);
  assertRouteHasText(routes, "/claims/dependency-exposure-control-baseline-claim", ["Support Map", "Claim Details"]);
  assertRouteHasText(routes, "/findings/openssf-scorecard-dependency-exposure-finding-2026", ["Details", "Links"]);
  assertRouteHasText(routes, "/artifacts/openssf-scorecard-dependency-exposure-artifact", ["Scope", "Sources"]);
  assertRouteHasText(routes, "/sources/openssf-scorecard-checks-source", ["Metadata", "Artifacts"]);
  assertRouteHasText(routes, "/scope/maintenance-signal-control", [
    "Maintenance Signal Control",
    "Claims",
    "Bundle State"
  ]);
  assertRouteHasText(routes, "/claims/maintenance-signal-control-baseline-claim", ["Support Map", "Claim Details"]);
  assertRouteHasText(routes, "/findings/openssf-scorecard-maintenance-signal-finding-2026", ["Details", "Links"]);
  assertRouteHasText(routes, "/artifacts/openssf-scorecard-maintenance-signal-artifact", ["Scope", "Sources"]);
  assertRouteHasText(routes, "/sources/openssf-scorecard-maintenance-checks-source", ["Metadata", "Artifacts"]);
  assertRouteHasText(routes, "/admin/review/release-provenance-control-baseline-2026-06-01", [
    "Actions",
    "Evidence Reviews"
  ]);
  assertRouteHasText(routes, "/admin/review/dependency-exposure-control-baseline-2026-06-01", [
    "Actions",
    "Evidence Reviews"
  ]);
  assertRouteHasText(routes, "/admin/review/maintenance-signal-control-baseline-2026-06-01", [
    "Actions",
    "Evidence Reviews"
  ]);
  assertRouteHasText(routes, "/methods", ["Trust Model", "Evidence Ladder", "Review Process"]);
  assertRouteHasText(routes, "/reports", ["Reports", "Synthesis Matrix", "Synthesis Inputs"]);
});

test("synthetic student response route smoke inventory covers configured review questions and reports", async () => {
  const data = await loadDomainWorkbenchData({ domainId: "synthetic-student-responses" });
  const routes = buildRouteChecks(data);
  const paths = routePaths(routes);

  for (const path of [
    "/",
    "/scope",
    "/claims",
    "/findings",
    "/artifacts",
    "/sources",
    "/activity",
    "/reports",
    "/methods",
    "/admin/review",
    "/scope/ssr-scoring-validation-use",
    "/scope/ssr-generation-methods",
    "/scope/ssr-quality-evaluation",
    "/scope/ssr-model-generation-effects",
    "/scope/ssr-prompt-engineering-effects",
    "/scope/ssr-real-response-comparison",
    "/scope/ssr-human-ai-scoring-agreement"
  ]) {
    assert.ok(paths.has(path), `Missing route check for ${path}`);
  }

  assertRouteHasText(routes, "/reports", ["Reports", "Synthesis Matrix", "Synthesis Inputs"]);
  assertRouteHasText(routes, "/scope/ssr-scoring-validation-use", [
    "Use in Automated Scorer Validation",
    "Claims",
    "Bundle State"
  ]);
});
