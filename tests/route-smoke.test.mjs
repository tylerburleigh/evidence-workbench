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
  assert.ok(paths.has("/admin/review/archive-question-baseline-2026-05-31"));
  assertRouteHasText(routes, "/admin/review/archive-question-baseline-2026-05-31", [
    "Actions",
    "Validation",
    "Proposed Changes"
  ]);
});
