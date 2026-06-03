import { pathToFileURL } from "node:url";
import { loadDomainWorkbenchData } from "./lib/workbench-data.mjs";

const defaultBaseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3002";

function titleCase(value) {
  return String(value)
    .split(/[-_.\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pluralize(label) {
  if (label.endsWith("y")) {
    return `${label.slice(0, -1)}ies`;
  }

  if (label.endsWith("s")) {
    return label;
  }

  return `${label}s`;
}

function getScopeUnit(data) {
  return data.domainPack.domain.default_scope_unit ?? "topic";
}

function getScopeLabel(data) {
  const scopeUnit = getScopeUnit(data);
  const labels = data.domainPack.publicCopy.labels ?? {};
  return labels[scopeUnit] ?? labels.topic ?? titleCase(scopeUnit);
}

function getScopePluralLabel(data) {
  return pluralize(getScopeLabel(data));
}

function getScopeNodes(data) {
  const scopeUnit = getScopeUnit(data);
  return (data.domainPack.taxonomy.nodes ?? [])
    .filter((node) => node.node_type === scopeUnit)
    .sort((left, right) => (left.canonical_order ?? 0) - (right.canonical_order ?? 0) || left.name.localeCompare(right.name));
}

function records(entries) {
  return entries.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));
}

function addRoute(routes, path, expectedText) {
  routes.push({ path, expectedText });
}

export function buildRouteChecks(data) {
  const routes = [];
  const scopePlural = getScopePluralLabel(data);
  const scopeNodes = getScopeNodes(data);
  const claims = records(data.collections.claims);
  const findings = records(data.collections.findings);
  const artifacts = records(data.collections.artifacts);
  const sources = records(data.collections.sources);
  const bundles = records(data.collections.candidateBundles);
  const reportArtifacts = records(data.collections.reportArtifacts);

  addRoute(routes, "/", ["Evidence Workbench", data.domainPack.domain.name, "Record Index", "Published Claims"]);
  addRoute(routes, "/scope", ["Scope Index", scopePlural]);
  addRoute(routes, "/claims", ["Public Records", "Claims"]);
  addRoute(routes, "/findings", ["Public Records", "Findings"]);
  addRoute(routes, "/artifacts", ["Public Records", "Artifacts"]);
  addRoute(routes, "/sources", ["Public Records", "Sources", "Full text", "Abstract only", "No full text"]);
  addRoute(routes, "/activity", ["Public Change Feed", "Activity Is Not Evidence", "Timeline"]);
  addRoute(routes, "/reports", [
    "Reports",
    "Source Access Audit",
    "Synthesis Matrix",
    "Synthesis Inputs",
    "Report Artifacts",
    "CSV",
    "Markdown",
    "Search Protocols",
    "Access-Limited Screened Sources"
  ]);
  addRoute(routes, "/methods", ["Trust Model", "Evidence Ladder", "Review Process"]);
  addRoute(routes, "/admin/review", ["Candidate Bundle Queue", "Review Queue", "Review Surface"]);

  for (const node of scopeNodes) {
    addRoute(routes, `/scope/${node.id}`, [node.name, "Claims", "Bundle State", "Findings", "Artifacts", "Sources"]);
  }

  for (const claim of claims) {
    addRoute(routes, `/claims/${claim.id}`, [claim.name, "Support Map", "Claim Details", "Findings", "Sources"]);
  }

  for (const finding of findings) {
    addRoute(routes, `/findings/${finding.id}`, [finding.name, "Details", "Links", "Endpoint"]);
  }

  for (const artifact of artifacts) {
    addRoute(routes, `/artifacts/${artifact.id}`, [artifact.name, "Details", "Scope", "Sources", "Findings"]);
  }

  for (const source of sources) {
    addRoute(routes, `/sources/${source.id}`, [source.name, "Metadata", "Access Status", "Artifacts", "Findings"]);
  }

  for (const report of reportArtifacts) {
    addRoute(routes, `/reports/${report.id}`, [report.name, "Report", "Traceability", "Linked Sources", "Linked Claims"]);
  }

  for (const bundle of bundles) {
    addRoute(routes, `/admin/review/${bundle.id}`, [
      bundle.name,
      "Actions",
      "Validation",
      "Promotion",
      "Proposed Changes",
      "Evidence Reviews"
    ]);
  }

  return routes;
}

async function assertRoute(baseUrl, path, expectedText) {
  const response = await fetch(new URL(path, baseUrl));
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  if (body.includes("/topics")) {
    throw new Error(`${path} still links to /topics`);
  }

  for (const text of expectedText) {
    if (!body.includes(text)) {
      throw new Error(`${path} is missing expected text: ${text}`);
    }
  }

  console.log(`${path} ${response.status} ok`);
}

async function assertOldScopeRouteRemoved(baseUrl, data) {
  const [firstScopeNode] = getScopeNodes(data);
  if (!firstScopeNode) {
    return;
  }

  const oldScopeRoute = await fetch(new URL(`/topics/${firstScopeNode.id}`, baseUrl));
  if (oldScopeRoute.status !== 404) {
    throw new Error(`/topics/${firstScopeNode.id} returned ${oldScopeRoute.status}; expected 404`);
  }

  console.log(`/topics/${firstScopeNode.id} 404 ok`);
}

export async function smokeRoutes(options = {}) {
  const baseUrl = options.baseUrl ?? defaultBaseUrl;
  const data = options.data ?? await loadDomainWorkbenchData();
  const routes = buildRouteChecks(data);

  for (const { path, expectedText } of routes) {
    await assertRoute(baseUrl, path, expectedText);
  }

  await assertOldScopeRouteRemoved(baseUrl, data);

  console.log(`Checked ${routes.length} route(s) for ${data.domainPack.domain.id}.`);
  return { route_count: routes.length, domain_id: data.domainPack.domain.id };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  smokeRoutes().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exit(1);
  });
}
