import path from "node:path";
import {
  dataRoot,
  fileExists,
  isUnderPath,
  loadActiveDomainPack,
  readJson,
  toPosixRelative,
  workspaceRoot,
  writeJson
} from "./workspace.mjs";

const candidateBundlesRoot = path.join(dataRoot, "candidate-bundles");
const searchProtocolsRoot = path.join(dataRoot, "search-protocols");
const stagedRecordsRoot = path.join(dataRoot, "staged-records");

const searchProtocolStatuses = new Set(["draft", "searched", "screened", "included_sources_staged", "complete"]);
const screeningDecisions = new Set(["include", "exclude", "maybe", "duplicate", "not_relevant", "no_full_text"]);
const systematicityLevels = new Set(["targeted_bootstrap", "scoping_review", "systematic_review", "manual_note"]);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function asArray(value) {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function unique(values) {
  return Array.from(new Set(values.filter(nonEmptyString)));
}

function slugFromText(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^0-9a-z]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function resolveDataRelativePath(relativePath, label) {
  if (!nonEmptyString(relativePath)) {
    throw new Error(`${label} must be a non-empty data path.`);
  }

  const resolvedPath = path.resolve(workspaceRoot, relativePath);
  if (!isUnderPath(dataRoot, resolvedPath)) {
    throw new Error(`${label} must stay under data/: ${relativePath}`);
  }

  return resolvedPath;
}

function getProtocolRelativePath(options) {
  if (nonEmptyString(options.filePath)) {
    return options.filePath;
  }

  if (!nonEmptyString(options.protocolId)) {
    throw new Error("Search protocol id is required.");
  }

  const bundleId = options.bundleId ?? options.bundle;
  if (nonEmptyString(bundleId)) {
    return `data/staged-records/${bundleId}/${options.protocolId}.json`;
  }

  return `data/search-protocols/${options.protocolId}.json`;
}

function getProtocolPath(options) {
  return resolveDataRelativePath(getProtocolRelativePath(options), "Search protocol path");
}

async function loadCandidateBundle(bundleId) {
  const bundlePath = path.join(candidateBundlesRoot, `${bundleId}.json`);
  if (!(await fileExists(bundlePath))) {
    throw new Error(`Candidate bundle not found: ${toPosixRelative(bundlePath)}`);
  }

  return {
    filePath: bundlePath,
    record: await readJson(bundlePath)
  };
}

function buildSearchQueries(options, timestamp) {
  const queries = asArray(options.queries ?? options.query).map((query) => String(query).trim()).filter(Boolean);
  if (queries.length === 0) {
    throw new Error("At least one --query value is required to scaffold a search protocol.");
  }

  const databases = asArray(options.databases ?? options.database)
    .map((database) => String(database).trim())
    .filter(Boolean);
  const searchedAt = options.searchedAt ?? options["searched-at"] ?? timestamp;

  return queries.map((query, index) => ({
    database: databases[index] ?? databases[0] ?? "Manual search",
    query,
    searched_at: searchedAt,
    ...(options.resultCount ?? options["result-count"] ? { result_count: options.resultCount ?? options["result-count"] } : {})
  }));
}

async function attachProtocolChangeToBundle(bundleId, protocolId, protocolPath, options = {}) {
  const { filePath, record: bundle } = await loadCandidateBundle(bundleId);
  const stagedRoot = path.join(stagedRecordsRoot, bundleId);
  if (!isUnderPath(stagedRoot, protocolPath)) {
    throw new Error(`Bundled search protocols must be staged under data/staged-records/${bundleId}/.`);
  }

  const existingChange = (bundle.proposed_changes ?? []).find(
    (change) => change.target_record_type === "search_protocol" && change.target_record_id === protocolId
  );
  if (existingChange) {
    return {
      bundle,
      bundlePath: filePath,
      changeAdded: false,
      changeId: existingChange.change_id
    };
  }

  const changeId = options.changeId ?? `create-${protocolId}`;
  const updatedBundle = {
    ...bundle,
    proposed_changes: [
      ...(bundle.proposed_changes ?? []),
      {
        change_id: changeId,
        change_type: "create_record",
        target_record_type: "search_protocol",
        target_record_id: protocolId,
        file_path: `data/search-protocols/${protocolId}.json`,
        staged_file_path: toPosixRelative(protocolPath),
        summary: options.changeSummary ?? `Stage search protocol ${protocolId}.`,
        rationale: options.changeRationale ?? "The bundle needs an auditable search and screening record."
      }
    ]
  };

  await writeJson(filePath, updatedBundle);

  return {
    bundle: updatedBundle,
    bundlePath: filePath,
    changeAdded: true,
    changeId
  };
}

async function scaffoldSearchProtocol(options = {}) {
  const protocolId = options.protocolId ?? options.id;
  const name = options.name;
  if (!nonEmptyString(protocolId)) {
    throw new Error("Search protocol id is required.");
  }
  if (!nonEmptyString(name)) {
    throw new Error("Search protocol name is required.");
  }

  const domainPack = await loadActiveDomainPack();
  const taxonomyNodeIds = unique(asArray(options.taxonomyNodeIds ?? options["taxonomy-node"] ?? options.taxonomyNodeId));
  if (taxonomyNodeIds.length === 0) {
    throw new Error("At least one taxonomy node id is required.");
  }
  for (const nodeId of taxonomyNodeIds) {
    if (!domainPack.taxonomyNodeIds.has(nodeId)) {
      throw new Error(`Unknown taxonomy node for active domain ${domainPack.domain.id}: ${nodeId}`);
    }
  }

  const protocolPath = getProtocolPath({ ...options, protocolId });
  if ((await fileExists(protocolPath)) && !options.replace) {
    throw new Error(`Search protocol already exists: ${toPosixRelative(protocolPath)}.`);
  }

  const timestamp = options.startedAt ?? options["started-at"] ?? new Date().toISOString();
  const searchQueries = buildSearchQueries(options, timestamp);
  const databases = unique([
    ...asArray(options.databases ?? options.database),
    ...searchQueries.map((query) => query.database)
  ]);
  const status = options.status ?? "draft";
  if (!searchProtocolStatuses.has(status)) {
    throw new Error(`Unsupported search protocol status: ${status}`);
  }

  const systematicityLevel = options.systematicityLevel ?? options["systematicity-level"] ?? "targeted_bootstrap";
  if (!systematicityLevels.has(systematicityLevel)) {
    throw new Error(`Unsupported systematicity level: ${systematicityLevel}`);
  }

  const protocol = {
    schema_version: "1.0.0",
    record_type: "search_protocol",
    id: protocolId,
    name,
    domain_id: domainPack.domain.id,
    taxonomy_node_ids: taxonomyNodeIds,
    status,
    systematicity_level: systematicityLevel,
    search_started_at: timestamp,
    search_completed_at: options.completedAt ?? options["completed-at"] ?? timestamp,
    databases,
    search_queries: searchQueries,
    inclusion_criteria: asArray(options.inclusionCriteria ?? options["include-criterion"]),
    exclusion_criteria: asArray(options.exclusionCriteria ?? options["exclude-criterion"]),
    dedupe_method: options.dedupeMethod ?? options["dedupe-method"] ?? "Not yet recorded.",
    screening_counts: {
      records_identified: options.recordsIdentified ?? options["records-identified"] ?? "not yet counted",
      records_screened: 0,
      full_text_reviewed: 0,
      sources_included: 0
    },
    screening_decisions: [],
    source_ids: [],
    screening_summary: options.summary ?? "Draft search protocol scaffolded; screening is not complete.",
    limitations: asArray(options.limitations ?? options.limitation)
  };

  await writeJson(protocolPath, protocol);

  let bundleAttachment;
  if (nonEmptyString(options.bundleId ?? options.bundle)) {
    bundleAttachment = await attachProtocolChangeToBundle(options.bundleId ?? options.bundle, protocolId, protocolPath, options);
  }

  return {
    action: "scaffolded_search_protocol",
    protocol_id: protocolId,
    protocol_path: toPosixRelative(protocolPath),
    bundle_id: options.bundleId ?? options.bundle,
    bundle_change_added: bundleAttachment?.changeAdded ?? false,
    bundle_change_id: bundleAttachment?.changeId,
    status: protocol.status,
    systematicity_level: protocol.systematicity_level,
    query_count: protocol.search_queries.length
  };
}

async function addScreeningDecision(options = {}) {
  const protocolId = options.protocolId ?? options.id;
  const protocolPath = getProtocolPath({ ...options, protocolId });
  if (!(await fileExists(protocolPath))) {
    throw new Error(`Search protocol not found: ${toPosixRelative(protocolPath)}.`);
  }

  const protocol = await readJson(protocolPath);
  if (protocol.record_type !== "search_protocol") {
    throw new Error(`Record is not a search_protocol: ${toPosixRelative(protocolPath)}.`);
  }

  const title = options.title;
  const decision = options.decision;
  if (!nonEmptyString(title)) {
    throw new Error("Screening decision title is required.");
  }
  if (!screeningDecisions.has(decision)) {
    throw new Error(`Unsupported screening decision: ${decision}`);
  }

  const candidateId = options.candidateId ?? options["candidate-id"] ?? `candidate-${slugFromText(title)}`;
  const nextDecision = {
    candidate_id: candidateId,
    title,
    decision,
    ...(nonEmptyString(options.reason) ? { reason: options.reason } : {}),
    ...(nonEmptyString(options.sourceId ?? options["source-id"]) ? { source_id: options.sourceId ?? options["source-id"] } : {}),
    ...(nonEmptyString(options.doi) ? { doi: options.doi } : {}),
    ...(nonEmptyString(options.url) ? { url: options.url } : {})
  };

  const screeningDecisionsList = [...(protocol.screening_decisions ?? []), nextDecision];
  const sourceIds = unique([
    ...(protocol.source_ids ?? []),
    nextDecision.decision === "include" ? nextDecision.source_id : undefined
  ]);
  const includedCount = screeningDecisionsList.filter((entry) => entry.decision === "include").length;
  const fullTextCount = screeningDecisionsList.filter((entry) =>
    ["include", "exclude", "maybe"].includes(entry.decision)
  ).length;
  const nextStatus =
    includedCount > 0 && sourceIds.length > 0
      ? "included_sources_staged"
      : protocol.status === "draft" || protocol.status === "searched"
        ? "screened"
        : protocol.status;

  const updatedProtocol = {
    ...protocol,
    status: nextStatus,
    screening_decisions: screeningDecisionsList,
    source_ids: sourceIds,
    screening_counts: {
      ...(protocol.screening_counts ?? {}),
      records_screened: screeningDecisionsList.length,
      full_text_reviewed: fullTextCount,
      sources_included: includedCount
    },
    screening_summary:
      protocol.screening_summary === "Draft search protocol scaffolded; screening is not complete."
        ? "Screening decisions have been recorded; update this summary before publication."
        : protocol.screening_summary
  };

  await writeJson(protocolPath, updatedProtocol);

  return {
    action: "added_screening_decision",
    protocol_id: protocol.id,
    protocol_path: toPosixRelative(protocolPath),
    candidate_id: candidateId,
    decision,
    status: updatedProtocol.status,
    screening_decision_count: updatedProtocol.screening_decisions.length,
    source_ids: updatedProtocol.source_ids
  };
}

async function completeSearchProtocol(options = {}) {
  const protocolId = options.protocolId ?? options.id;
  const protocolPath = getProtocolPath({ ...options, protocolId });
  if (!(await fileExists(protocolPath))) {
    throw new Error(`Search protocol not found: ${toPosixRelative(protocolPath)}.`);
  }

  const protocol = await readJson(protocolPath);
  if (protocol.record_type !== "search_protocol") {
    throw new Error(`Record is not a search_protocol: ${toPosixRelative(protocolPath)}.`);
  }

  const updatedProtocol = {
    ...protocol,
    status: "complete",
    search_completed_at: options.completedAt ?? options["completed-at"] ?? new Date().toISOString(),
    screening_summary: options.summary ?? protocol.screening_summary
  };
  await writeJson(protocolPath, updatedProtocol);

  return {
    action: "completed_search_protocol",
    protocol_id: protocol.id,
    protocol_path: toPosixRelative(protocolPath),
    status: updatedProtocol.status,
    source_count: updatedProtocol.source_ids?.length ?? 0,
    screening_decision_count: updatedProtocol.screening_decisions?.length ?? 0
  };
}

export {
  addScreeningDecision,
  completeSearchProtocol,
  scaffoldSearchProtocol
};
