import { promises as fs } from "node:fs";
import path from "node:path";
import { loadDomainWorkbenchData } from "../../scripts/lib/workbench-data.mjs";
import { isUnderPath, workspaceRoot } from "../../scripts/lib/workspace.mjs";

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

export function getBundleQueue(data) {
  const reportById = new Map(data.bundleReports.map((report) => [report.bundle_id, report]));
  return data.collections.candidateBundles
    .map(({ record }) => ({
      record,
      report: reportById.get(record.id),
      scopeNodes: getNodesForIds(data, record.scope?.taxonomy_node_ids ?? [])
    }))
    .sort((left, right) => {
      const statusOrder = bundleStatusRank(left.record.lifecycle_status) - bundleStatusRank(right.record.lifecycle_status);
      return statusOrder || String(right.record.submitted_at ?? "").localeCompare(String(left.record.submitted_at ?? ""));
    });
}

export function getBundleById(data, bundleId) {
  return data.collections.candidateBundles.map(({ record }) => record).find((bundle) => bundle.id === bundleId);
}

export function getBundleReport(data, bundleId) {
  return data.bundleReports.find((report) => report.bundle_id === bundleId);
}

export function getEvidenceReviewsForBundle(data, bundleId) {
  return data.collections.evidenceReviews
    .map(({ record }) => record)
    .filter((review) => review.candidate_bundle_id === bundleId)
    .sort((left, right) => left.review_lane.localeCompare(right.review_lane) || left.id.localeCompare(right.id));
}

export function getReviewCommentsForBundle(data, bundleId) {
  return data.collections.reviewComments
    .map(({ record }) => record)
    .filter((comment) => comment.candidate_bundle_id === bundleId)
    .sort((left, right) => String(left.created_at ?? "").localeCompare(String(right.created_at ?? "")));
}

export function getPublicationEventsForBundle(data, bundleId) {
  return data.collections.publicationEvents
    .map(({ record }) => record)
    .filter((event) => event.candidate_bundle_id === bundleId)
    .sort((left, right) => String(right.published_at ?? "").localeCompare(String(left.published_at ?? "")));
}

export function getNodesForIds(data, nodeIds) {
  const idSet = new Set(nodeIds);
  return (data.domainPack.taxonomy.nodes ?? [])
    .filter((node) => idSet.has(node.id))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getSourcesForIds(data, sourceIds) {
  const idSet = new Set(sourceIds);
  return data.collections.sources
    .map(({ record }) => record)
    .filter((source) => idSet.has(source.id))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getArtifactsForSource(data, sourceId) {
  return data.collections.artifacts
    .map(({ record }) => record)
    .filter((artifact) => (artifact.source_ids ?? []).includes(sourceId))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getFindingsForSource(data, sourceId) {
  return data.collections.findings
    .map(({ record }) => record)
    .filter((finding) => finding.source_id === sourceId)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function claimReferencesSource(claim, sourceId) {
  return (
    (claim.supporting_source_ids ?? []).includes(sourceId) ||
    (claim.supporting_evidence ?? []).some((support) => (support.source_ids ?? []).includes(sourceId))
  );
}

export function claimReferencesFinding(claim, findingId) {
  return (
    (claim.supporting_finding_ids ?? []).includes(findingId) ||
    (claim.supporting_evidence ?? []).some((support) => (support.finding_ids ?? []).includes(findingId))
  );
}

export function getClaimsForSource(data, sourceId) {
  const findings = getFindingsForSource(data, sourceId);
  const findingIds = new Set(findings.map((finding) => finding.id));
  return data.collections.claims
    .map(({ record }) => record)
    .filter(
      (claim) => claimReferencesSource(claim, sourceId) || [...findingIds].some((findingId) => claimReferencesFinding(claim, findingId))
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getReportsForSource(data, sourceId) {
  return getReportArtifacts(data).filter((report) => (report.source_ids ?? []).includes(sourceId));
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

export function getReportArtifacts(data) {
  return data.collections.reportArtifacts
    .map(({ record }) => record)
    .sort((left, right) => String(right.created_at ?? "").localeCompare(String(left.created_at ?? "")) || left.name.localeCompare(right.name));
}

export function getReportArtifactById(data, reportId) {
  return getReportArtifacts(data).find((report) => report.id === reportId);
}

export async function getReportArtifactMarkdown(report) {
  const reportPath = path.join(workspaceRoot, report.path);
  const synthesesRoot = path.join(workspaceRoot, "research", "syntheses");

  if (!isUnderPath(synthesesRoot, reportPath) || !reportPath.endsWith(".md")) {
    throw new Error(`Report artifact path is outside research/syntheses: ${report.path}`);
  }

  return fs.readFile(reportPath, "utf8");
}

export function getApplicabilityFacetEntries(data, record, recordType) {
  return (data.domainPack.domain.applicability_facets ?? [])
    .filter((facet) => (facet.applies_to ?? []).includes(recordType))
    .map((facet) => {
      const optionLabelById = new Map((facet.values ?? []).map((option) => [option.id, option.label]));
      const values = valueToArray(record?.[facet.id]).map((value) => optionLabelById.get(value) ?? value);
      return {
        id: facet.id,
        label: facet.label,
        description: facet.description,
        value: values.length ? values.join(", ") : "Unspecified"
      };
    });
}

export function getPublishedCount(data) {
  return data.collections.candidateBundles.filter(({ record }) => record.lifecycle_status === "published").length;
}

export function getOpenBundleCount(data) {
  return data.collections.candidateBundles.filter(
    ({ record }) => !["published", "rejected"].includes(record.lifecycle_status)
  ).length;
}

export function getCoverageSnapshot(data) {
  const coverageByNodeId = new Map((data.planning.coverageStatus?.nodes ?? []).map((row) => [row.taxonomy_node_id, row]));
  const groups = new Map();

  for (const node of getScopeNodes(data)) {
    const coverage = coverageByNodeId.get(node.id);
    const status = coverage?.coverage_status ?? "not_started";
    if (!groups.has(status)) {
      groups.set(status, []);
    }
    groups.get(status).push({ node, coverage });
  }

  return [...groups.entries()]
    .map(([status, nodes]) => ({ status, nodes }))
    .sort((left, right) => coverageStatusRank(left.status) - coverageStatusRank(right.status) || left.status.localeCompare(right.status));
}

export function getSourcesMissingSummaries(data) {
  const evidenceSourceIds = new Set([
    ...data.collections.findings.map(({ record }) => record.source_id).filter(Boolean),
    ...data.collections.claims.flatMap(({ record }) => [
      ...(record.supporting_source_ids ?? []),
      ...(record.supporting_evidence ?? []).flatMap((support) => support.source_ids ?? [])
    ])
  ]);

  return data.collections.sources
    .map(({ record }) => record)
    .filter((source) => evidenceSourceIds.has(source.id) && !source.summary?.trim())
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getClaimsWithThinSupport(data) {
  return data.collections.claims
    .map(({ record }) => record)
    .filter(
      (claim) =>
        (claim.supporting_evidence ?? []).length === 0 ||
        (claim.supporting_finding_ids ?? []).length === 0 ||
        (claim.supporting_source_ids ?? []).length === 0
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getEvidenceHealth(data) {
  const sourceAccess = getSourceAccessSummary(data);

  return {
    sourceAccess,
    missingSummaries: getSourcesMissingSummaries(data),
    thinClaims: getClaimsWithThinSupport(data),
    directFullTextRatio: `${sourceAccess.direct_finding_sources.full_text}/${sourceAccess.direct_finding_sources.total}`
  };
}

export function getAttentionItems(data) {
  const items = [];
  const queue = getBundleQueue(data);
  const coverageSnapshot = getCoverageSnapshot(data);
  const health = getEvidenceHealth(data);

  for (const { record, report, scopeNodes } of queue) {
    const closed = ["published", "rejected"].includes(record.lifecycle_status);
    const reviewGateReady = !report?.evidence_review_gate?.eligible || Boolean(report.evidence_review_gate.ready);
    const validationReady = Boolean(report?.validation?.ready);
    const promotionReady = Boolean(report?.promotion?.ready);

    if (!closed) {
      items.push({
        id: `bundle-${record.id}`,
        severity: validationReady && reviewGateReady && promotionReady ? "info" : "warn",
        label: "Bundle",
        title: record.name,
        body: report?.readiness?.message ?? record.summary,
        href: `/admin/review/${record.id}`,
        meta: [statusLabel(record.lifecycle_status), scopeNodes.map((node) => node.name).join(", ") || "Unscoped"].filter(Boolean)
      });
    }

    if (!closed && (!validationReady || !reviewGateReady || !promotionReady)) {
      items.push({
        id: `blocked-${record.id}`,
        severity: "warn",
        label: "Readiness",
        title: `${record.name} has blocked checks`,
        body: [
          validationReady ? undefined : "Validation blocked",
          reviewGateReady ? undefined : "Review gate blocked",
          promotionReady ? undefined : "Promotion blocked"
        ]
          .filter(Boolean)
          .join("; "),
        href: `/admin/review/${record.id}`,
        meta: [statusLabel(record.lifecycle_status)]
      });
    }
  }

  for (const { status, nodes } of coverageSnapshot) {
    if (status === "baseline" || status === "answered_well") {
      continue;
    }

    for (const { node, coverage } of nodes) {
      items.push({
        id: `coverage-${node.id}`,
        severity: status === "not_started" ? "warn" : "info",
        label: "Coverage",
        title: node.name,
        body: coverage?.summary ?? node.summary,
        href: `/scope/${node.id}`,
        meta: [statusLabel(status)]
      });
    }
  }

  if (health.sourceAccess.direct_finding_sources.access_limited > 0) {
    items.push({
      id: "direct-source-access",
      severity: "warn",
      label: "Access",
      title: "Direct finding sources need access attention",
      body: `${health.sourceAccess.direct_finding_sources.access_limited} direct finding source(s) are not full text.`,
      href: "/sources",
      meta: [`Full text ${health.directFullTextRatio}`]
    });
  }

  if (health.missingSummaries.length > 0) {
    items.push({
      id: "source-summaries",
      severity: "warn",
      label: "Sources",
      title: "Evidence-linked sources need summaries",
      body: `${health.missingSummaries.length} source summary gap(s) remain.`,
      href: "/sources",
      meta: ["Summary"]
    });
  }

  if (health.thinClaims.length > 0) {
    items.push({
      id: "thin-claims",
      severity: "warn",
      label: "Claims",
      title: "Claims need stronger support links",
      body: `${health.thinClaims.length} claim(s) have missing support-map, finding, or source links.`,
      href: "/claims",
      meta: ["Support"]
    });
  }

  return items.sort((left, right) => attentionSeverityRank(left.severity) - attentionSeverityRank(right.severity) || left.title.localeCompare(right.title));
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

export function getSearchProtocols(data) {
  return data.collections.searchProtocols
    .map(({ record }) => record)
    .sort((left, right) => String(right.search_completed_at ?? "").localeCompare(String(left.search_completed_at ?? "")));
}

export function getSourceAccessInfo(source) {
  const status = source?.access_status;
  const depth = source?.access_depth;

  if (depth === "full_text" || status === "full_text_verified" || status === "full_text_available") {
    return {
      category: "full_text",
      label: "Full text",
      tone: "good"
    };
  }

  if (status === "abstract_only_paywalled" || status === "unavailable" || depth === "unavailable") {
    return {
      category: "no_full_text",
      label: status === "unavailable" || depth === "unavailable" ? "Unavailable" : "No full text",
      tone: "danger"
    };
  }

  if (depth === "abstract_only" || status === "abstract_only_available") {
    return {
      category: "abstract_only",
      label: "Abstract only",
      tone: "warn"
    };
  }

  if (depth === "metadata_only" || status === "metadata_only") {
    return {
      category: "metadata_only",
      label: "Metadata only",
      tone: "warn"
    };
  }

  return {
    category: "not_checked",
    label: "Not checked",
    tone: "neutral"
  };
}

export function getSourceAccessLabel(source) {
  const access = getSourceAccessInfo(source);
  return access.label;
}

export function getScreenedAccessLimitedCandidates(data) {
  return getSearchProtocols(data).flatMap((protocol) =>
    (protocol.screening_decisions ?? [])
      .filter((decision) => decision.decision === "no_full_text")
      .map((decision) => ({
        ...decision,
        protocol_id: protocol.id,
        protocol_name: protocol.name
      }))
  );
}

export function getSourceAccessSummary(data) {
  const sources = data.collections.sources.map(({ record }) => record);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const categories = {
    full_text: 0,
    abstract_only: 0,
    no_full_text: 0,
    metadata_only: 0,
    not_checked: 0
  };

  for (const source of sources) {
    const category = getSourceAccessInfo(source).category;
    categories[category] = (categories[category] ?? 0) + 1;
  }

  const directFindingSourceIds = new Set(
    data.collections.findings.map(({ record }) => record.source_id).filter((sourceId) => sourceById.has(sourceId))
  );
  const directFindingSources = [...directFindingSourceIds].map((sourceId) => sourceById.get(sourceId)).filter(Boolean);
  const directFindingFullTextCount = directFindingSources.filter(
    (source) => getSourceAccessInfo(source).category === "full_text"
  ).length;

  return {
    total_sources: sources.length,
    categories,
    direct_finding_sources: {
      total: directFindingSources.length,
      full_text: directFindingFullTextCount,
      access_limited: directFindingSources.length - directFindingFullTextCount
    },
    screened_access_limited: getScreenedAccessLimitedCandidates(data).length
  };
}

export function getSynthesisMatrixConfig(data) {
  const config = data.domainPack.domain.synthesis_matrix ?? data.domainPack.publicCopy.synthesis_matrix;
  if (!config || !Array.isArray(config.columns) || config.columns.length === 0) {
    return undefined;
  }

  return {
    row_source: "artifacts",
    ...config
  };
}

export function getSynthesisMatrixCsv(data) {
  const config = getSynthesisMatrixConfig(data);
  if (!config) {
    return "";
  }

  const rows = getSynthesisMatrixRows(data);
  return [
    config.columns.map((column) => csvCell(column.label)).join(","),
    ...rows.map((row) => config.columns.map((column) => csvCell(row.cells[column.id])).join(","))
  ].join("\n");
}

export function getSynthesisMatrixMarkdown(data) {
  const config = getSynthesisMatrixConfig(data);
  if (!config) {
    return "";
  }

  const rows = getSynthesisMatrixRows(data);
  const header = `| ${config.columns.map((column) => markdownCell(column.label)).join(" | ")} |`;
  const separator = `| ${config.columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${config.columns.map((column) => markdownCell(row.cells[column.id])).join(" | ")} |`);
  return [header, separator, ...body].join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function markdownCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSynthesisMatrixRows(data) {
  const config = getSynthesisMatrixConfig(data);
  if (!config) {
    return [];
  }

  const records = getSynthesisRowRecords(data, config.row_source);
  return records.map((record) => {
    const context = buildSynthesisContext(data, record, config.row_source);
    return {
      id: record.id,
      href: getSynthesisRowHref(config.row_source, record),
      record,
      artifact: context.artifact,
      source: context.source,
      findings: context.findings,
      scopeNodes: context.scope_nodes,
      cells: Object.fromEntries(
        config.columns.map((column) => [
          column.id,
          formatSynthesisValue(resolveSynthesisPath(context, column.path), column.empty)
        ])
      )
    };
  });
}

function getSynthesisRowRecords(data, rowSource) {
  const collectionKey = rowSource === "sources" ? "sources" : "artifacts";
  return data.collections[collectionKey]
    .map(({ record }) => record)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getSynthesisRowHref(rowSource, record) {
  return rowSource === "sources" ? `/sources/${record.id}` : `/artifacts/${record.id}`;
}

function buildSynthesisContext(data, record, rowSource) {
  const artifact = rowSource === "sources" ? undefined : record;
  const source =
    rowSource === "sources"
      ? record
      : (artifact.source_ids ?? []).map((sourceId) => getSourceById(data, sourceId)).find(Boolean);
  const sources = rowSource === "sources" ? [record] : (artifact.source_ids ?? []).map((sourceId) => getSourceById(data, sourceId)).filter(Boolean);
  const findings = data.collections.findings
    .map(({ record: finding }) => finding)
    .filter((finding) => {
      if (artifact) {
        return finding.artifact_id === artifact.id;
      }

      return finding.source_id === record.id;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
  const nodeIds = artifact?.taxonomy_node_ids ?? findings.flatMap((finding) => finding.taxonomy_node_ids ?? []);
  const scopeNodes = [...new Set(nodeIds)].map((nodeId) => getNodeById(data, nodeId)).filter(Boolean);

  return {
    artifact,
    source,
    sources,
    findings,
    scope_nodes: scopeNodes,
    record
  };
}

function resolveSynthesisPath(context, pathValue) {
  if (typeof pathValue !== "string" || pathValue.trim().length === 0) {
    return undefined;
  }

  const [rootKey, ...parts] = pathValue.split(".");
  let current = context[rootKey];

  for (const part of parts) {
    if (Array.isArray(current)) {
      current = current.flatMap((item) => valueToArray(item?.[part]));
    } else {
      current = current?.[part];
    }
  }

  return current;
}

function valueToArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined || value === null || value === "" ? [] : [value];
}

function formatSynthesisValue(value, empty = "Unspecified") {
  if (Array.isArray(value)) {
    const values = [...new Set(value.flatMap(valueToArray).map(formatPrimitiveValue).filter(Boolean))];
    return values.length ? values.join("; ") : empty;
  }

  const formatted = formatPrimitiveValue(value);
  return formatted || empty;
}

function formatPrimitiveValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
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

function attentionSeverityRank(severity) {
  return severity === "danger" ? 0 : severity === "warn" ? 1 : severity === "info" ? 2 : 3;
}

function coverageStatusRank(status) {
  const rank = {
    not_started: 0,
    in_progress: 1,
    stale: 2,
    baseline: 3,
    answered_directionally: 4,
    answered_well: 5
  };

  return rank[status] ?? 10;
}

function bundleStatusRank(status) {
  const rank = {
    submitted: 0,
    in_review: 1,
    needs_revision: 2,
    revised: 3,
    approved: 4,
    published: 5,
    rejected: 6
  };

  return rank[status] ?? 10;
}
