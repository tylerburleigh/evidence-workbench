import { loadDomainWorkbenchData } from "../../scripts/lib/workbench-data.mjs";

export async function getWorkbenchData() {
  return loadDomainWorkbenchData();
}

export function getPublicLabels(data) {
  return data.domainPack.publicCopy.labels ?? {};
}

export function getScopeUnit(data) {
  return data.domainPack.domain.default_scope_unit ?? "topic";
}

export function getScopeLabel(data) {
  const scopeUnit = getScopeUnit(data);
  const labels = getPublicLabels(data);
  return labels[scopeUnit] ?? labels.topic ?? titleCase(scopeUnit);
}

export function pluralize(label) {
  if (label.endsWith("y")) {
    return `${label.slice(0, -1)}ies`;
  }

  if (label.endsWith("s")) {
    return label;
  }

  return `${label}s`;
}

export function getScopePluralLabel(data) {
  return pluralize(getScopeLabel(data));
}

export function getStageLabel(data, stage) {
  return data.domainPack.publicCopy.stage_labels?.[stage.id] ?? stage.label ?? titleCase(stage.id);
}

export function getConfidenceEntries(data) {
  return Object.entries(data.domainPack.publicCopy.confidence_labels ?? {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

export function getDefaultReviewLaneIds(data) {
  return new Set(data.domainPack.domain.default_review_lanes ?? []);
}

export function getScopeNodes(data) {
  const scopeUnit = getScopeUnit(data);
  return (data.domainPack.taxonomy.nodes ?? [])
    .filter((node) => node.node_type === scopeUnit)
    .sort((left, right) => (left.canonical_order ?? 0) - (right.canonical_order ?? 0) || left.name.localeCompare(right.name));
}

export function getNodeById(data, nodeId) {
  return (data.domainPack.taxonomy.nodes ?? []).find((node) => node.id === nodeId);
}

export function getParentNode(data, node) {
  return node?.parent_id ? getNodeById(data, node.parent_id) : undefined;
}

export function getClaimsForNode(data, nodeId) {
  return data.collections.claims
    .map(({ record }) => record)
    .filter((claim) => claim.subject_type === "taxonomy_node" && claim.subject_id === nodeId)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getFindingsForNode(data, nodeId) {
  return data.collections.findings
    .map(({ record }) => record)
    .filter((finding) => (finding.taxonomy_node_ids ?? []).includes(nodeId))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getArtifactsForNode(data, nodeId) {
  return data.collections.artifacts
    .map(({ record }) => record)
    .filter((artifact) => (artifact.taxonomy_node_ids ?? []).includes(nodeId))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getBundlesForNode(data, nodeId) {
  const reportById = new Map(data.bundleReports.map((report) => [report.bundle_id, report]));
  return data.collections.candidateBundles
    .map(({ record }) => ({
      record,
      report: reportById.get(record.id)
    }))
    .filter(({ record }) => (record.scope?.taxonomy_node_ids ?? []).includes(nodeId))
    .sort((left, right) => right.record.submitted_at.localeCompare(left.record.submitted_at));
}

export function getSourcesForIds(data, sourceIds) {
  const idSet = new Set(sourceIds);
  return data.collections.sources
    .map(({ record }) => record)
    .filter((source) => idSet.has(source.id))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getArtifactById(data, artifactId) {
  return data.collections.artifacts.map(({ record }) => record).find((artifact) => artifact.id === artifactId);
}

export function getClaimById(data, claimId) {
  return data.collections.claims.map(({ record }) => record).find((claim) => claim.id === claimId);
}

export function getFindingById(data, findingId) {
  return data.collections.findings.map(({ record }) => record).find((finding) => finding.id === findingId);
}

export function getSourceById(data, sourceId) {
  return data.collections.sources.map(({ record }) => record).find((source) => source.id === sourceId);
}

export function getPublishedCount(data) {
  return data.collections.candidateBundles.filter(({ record }) => record.lifecycle_status === "published").length;
}

export function getOpenBundleCount(data) {
  return data.collections.candidateBundles.filter(
    ({ record }) => !["published", "rejected"].includes(record.lifecycle_status)
  ).length;
}

export function getActivityFeed(data) {
  const publicationEvents = data.collections.publicationEvents.map(({ record }) => {
    const bundle = data.collections.candidateBundles
      .map((entry) => entry.record)
      .find((candidate) => candidate.id === record.candidate_bundle_id);

    return {
      id: record.id,
      timestamp: record.published_at,
      type: "publication",
      title: record.name,
      summary: record.change_note ?? record.summary,
      status: record.event_type,
      bundle,
      targets: record.published_targets ?? []
    };
  });

  const bundleEvents = data.collections.candidateBundles.map(({ record }) => ({
    id: `${record.id}-submitted`,
    timestamp: record.submitted_at,
    type: "bundle",
    title: record.name,
    summary: record.summary,
    status: record.lifecycle_status,
    bundle: record,
    targets: record.proposed_changes ?? []
  }));

  return [...publicationEvents, ...bundleEvents].sort((left, right) =>
    String(right.timestamp ?? "").localeCompare(String(left.timestamp ?? ""))
  );
}

export function formatDate(value) {
  if (!value) {
    return "Unspecified";
  }

  return value.slice(0, 10);
}

export function titleCase(value) {
  return String(value)
    .split(/[-_.\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function statusLabel(value) {
  return titleCase(value ?? "unknown");
}
