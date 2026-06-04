#!/usr/bin/env node

import path from "node:path";
import {
  dataRoot,
  fileExists,
  isUnderPath,
  loadActiveDomainPack,
  loadDomainPack,
  readJson,
  readJsonCollection,
  toPosixRelative,
  withFileLock,
  workspaceRoot,
  writeJson
} from "./workspace.mjs";
import { readPlanningStatus, syncResearchPlanning } from "./planning.mjs";

const candidateBundlesRoot = path.join(dataRoot, "candidate-bundles");
const evidenceAppraisalsRoot = path.join(dataRoot, "evidence-appraisals");
const publicationEventsRoot = path.join(dataRoot, "publication-events");
const editorialCommentsRoot = path.join(dataRoot, "editorial-comments");
const stagedRecordsRoot = path.join(dataRoot, "staged-records");

const recordCollections = {
  source: "sources",
  artifact: "artifacts",
  finding: "findings",
  claim: "claims",
  activity_item: "activity-items",
  search_protocol: "search-protocols"
};

const supportRoles = new Set([
  "supports",
  "qualifies",
  "direct_support",
  "boundary_condition",
  "adjacent_evidence",
  "counterexample",
  "background"
]);
const directSupportRoles = new Set(["supports", "direct_support"]);
const nonBlockingFollowUpSeverities = new Set(["minor", "note"]);
const shallowLocatorTerms = ["abstract", "metadata", "summary", "snippet", "source page", "repository page"];
const fullTextLocatorTerms = [
  "method",
  "methods",
  "result",
  "results",
  "section",
  "table",
  "appendix",
  "html",
  "pdf",
  "full text",
  "details",
  "dataset",
  "composition",
  "experimental",
  "setup"
];
const sourceAccessDepthRank = {
  unavailable: 0,
  not_checked: 0,
  metadata_only: 1,
  source_page_or_metadata: 1,
  abstract_only: 2,
  full_text: 3,
  full_text_available: 3,
  full_text_verified: 3
};
const sourceAccessStatusDepth = {
  full_text_verified: "full_text",
  full_text_available: "full_text",
  abstract_only_paywalled: "abstract_only",
  abstract_only_available: "abstract_only",
  metadata_only: "metadata_only",
  not_yet_checked: "not_checked",
  unavailable: "unavailable"
};
const sourceAccessStatusLabels = {
  full_text_verified: "full text verified",
  full_text_available: "full text available",
  abstract_only_paywalled: "abstract only/paywalled",
  abstract_only_available: "abstract only",
  metadata_only: "metadata only",
  not_yet_checked: "not yet checked",
  unavailable: "unavailable"
};

const candidateStatusTransitions = {
  submitted: ["in_review", "needs_revision", "approved", "rejected"],
  in_review: ["needs_revision", "approved", "rejected"],
  needs_revision: ["revised", "rejected"],
  revised: ["in_review", "approved", "rejected"],
  approved: ["in_review", "rejected", "published"],
  published: [],
  rejected: []
};

function usage(exitCode = 0) {
  const message = `
Usage:
  npm run research:bundle -- status --bundle <bundle-id>
  npm run research:bundle -- audit --bundle <bundle-id>
  npm run research:bundle -- validate --bundle <bundle-id>
  npm run research:bundle -- comment --bundle <bundle-id> --comment <text>
  npm run research:bundle -- request-changes --bundle <bundle-id> [--reason <text>]
  npm run research:bundle -- reject --bundle <bundle-id> [--reason <text>]
  npm run research:bundle -- approve --bundle <bundle-id>
  npm run research:bundle -- publish --bundle <bundle-id>
  npm run research:bundle -- precommit --bundle <bundle-id>
  npm run research:bundle -- smoke --bundle <bundle-id> [--base-url <url>]

Notes:
  - validate checks staged files, record IDs/types, references, support maps, and published-file drift.
  - approve requires a structurally valid bundle and clean evidence-appraisal gates when configured.
  - publish copies staged JSON into data/, writes a publication event, marks the bundle published, and syncs planning state.
`.trim();

  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${message}\n`);
  process.exit(exitCode);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function addIssueForMissingString(record, field, issues, label) {
  if (!nonEmptyString(record[field])) {
    issues.push(`${label} is missing required field ${field}.`);
  }
}

function hasRequiredValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && !(typeof value === "string" && value.trim().length === 0);
}

function valueList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined || value === null || value === "" ? [] : [value];
}

function resolveDataPath(relativePath, label, issues) {
  if (!nonEmptyString(relativePath)) {
    issues.push(`${label} must be a non-empty path under data/.`);
    return undefined;
  }

  const resolvedPath = path.resolve(workspaceRoot, relativePath);
  if (!isUnderPath(dataRoot, resolvedPath)) {
    issues.push(`${label} must stay under data/: ${relativePath}`);
    return undefined;
  }

  return resolvedPath;
}

function getTargetRecordPath(recordType, recordId) {
  const collection = recordCollections[recordType];
  return collection && recordId ? path.join(dataRoot, collection, `${recordId}.json`) : undefined;
}

function getDerivedStagedFilePath(bundleId, change) {
  const fileName = `${change.target_record_id ?? change.change_id}.json`;
  return path.join(stagedRecordsRoot, bundleId, fileName);
}

async function loadCandidateBundle(bundleId) {
  const filePath = path.join(candidateBundlesRoot, `${bundleId}.json`);
  if (!(await fileExists(filePath))) {
    throw new Error(`Bundle not found: ${toPosixRelative(filePath)}`);
  }

  return {
    filePath,
    record: await readJson(filePath)
  };
}

async function loadEvidenceAppraisals() {
  return readJsonCollection("data/evidence-appraisals");
}

function getCurrentRevision(bundle) {
  return bundle.revision_number ?? 1;
}

function canTransitionCandidateBundleStatus(current, next) {
  return current === next || Boolean(candidateStatusTransitions[current]?.includes(next));
}

function slugTimestamp(timestamp) {
  return timestamp.toLowerCase().replace(/[^0-9a-z]+/g, "-").replace(/^-|-$/g, "");
}

function countTargetsByRecordType(targets = []) {
  const byRecordType = {};

  for (const target of targets) {
    const recordType = target.record_type ?? target.target_record_type;
    if (!nonEmptyString(recordType)) {
      continue;
    }

    const action = target.action ?? (target.change_type === "update_record" ? "updated" : "created");
    if (!byRecordType[recordType]) {
      byRecordType[recordType] = { created: 0, updated: 0, total: 0 };
    }

    if (action === "updated") {
      byRecordType[recordType].updated += 1;
    } else {
      byRecordType[recordType].created += 1;
    }
    byRecordType[recordType].total += 1;
  }

  return {
    total_targets: targets.length,
    by_record_type: byRecordType
  };
}

function parseDateTimeMillis(value) {
  if (!nonEmptyString(value)) {
    return undefined;
  }

  const millis = Date.parse(value);
  return Number.isNaN(millis) ? undefined : millis;
}

function addTimestampWarning(warnings, checks, check) {
  checks.push(check);

  if (check.left_at_millis === undefined || check.right_at_millis === undefined) {
    return;
  }

  if (check.left_at_millis > check.right_at_millis) {
    warnings.push(`${check.left_label} (${check.left_at}) is after ${check.right_label} (${check.right_at}).`);
  }
}

function buildPublicationDeltaFromChanges(changes = []) {
  return countTargetsByRecordType(
    changes.map((change) => ({
      record_type: change.target_record_type,
      action: change.change_type === "update_record" ? "updated" : "created"
    }))
  );
}

function addUniqueRecord(recordMaps, recordType, record, filePath, origin) {
  if (!recordMaps[recordType]) {
    recordMaps[recordType] = new Map();
  }

  if (nonEmptyString(record.id)) {
    recordMaps[recordType].set(record.id, { record, filePath, origin });
  }
}

async function buildRecordMaps(promotionChanges) {
  const recordMaps = Object.fromEntries(Object.keys(recordCollections).map((recordType) => [recordType, new Map()]));

  for (const [recordType, collectionName] of Object.entries(recordCollections)) {
    const entries = await readJsonCollection(`data/${collectionName}`);
    for (const entry of entries) {
      addUniqueRecord(recordMaps, recordType, entry.record, entry.filePath, "live");
    }
  }

  for (const change of promotionChanges) {
    if (change.validationRecord && recordMaps[change.targetRecordType]) {
      addUniqueRecord(
        recordMaps,
        change.targetRecordType,
        change.validationRecord,
        change.stagedResolvedPath,
        change.stagedRecord ? "staged" : "live"
      );
    }
  }

  return recordMaps;
}

function recordExists(recordMaps, recordType, recordId) {
  return nonEmptyString(recordId) && Boolean(recordMaps[recordType]?.has(recordId));
}

async function evaluateEvidenceAppraisalGate(bundle, domainPack) {
  const currentRevision = getCurrentRevision(bundle);
  const requiredLanes = bundle.required_appraisal_lanes ?? [];
  const minAppraisalsPerLane = bundle.appraisal_requirement?.min_complete_appraisals_per_lane ?? 1;
  const blockOnOpenCriticalFindings = bundle.appraisal_requirement?.block_on_open_critical_findings ?? true;
  const blockOnOpenMajorFindings = bundle.appraisal_requirement?.block_on_open_major_findings ?? false;
  const appraisals = (await loadEvidenceAppraisals()).filter(
    ({ record }) =>
      record.candidate_bundle_id === bundle.id &&
      record.bundle_revision_number === currentRevision &&
      record.status === "complete"
  );

  const issues = [];
  for (const lane of requiredLanes) {
    if (!domainPack.appraisalLaneIds.has(lane)) {
      issues.push(`Required evidence appraisal lane is not defined by the active domain pack: ${lane}.`);
    }
  }

  const laneCounts = new Map();
  for (const { record } of appraisals) {
    laneCounts.set(record.appraisal_lane, (laneCounts.get(record.appraisal_lane) ?? 0) + 1);
  }

  const completedLanes = Array.from(laneCounts.keys()).sort();
  const missingLanes = requiredLanes.filter((lane) => (laneCounts.get(lane) ?? 0) < minAppraisalsPerLane);
  const blockingAppraisalIds = appraisals
    .filter(({ record }) => record.blocking || record.verdict === "needs_revision" || record.verdict === "reject")
    .map(({ record }) => record.id)
    .sort();

  const openBlockingFindings = appraisals.flatMap(({ record }) =>
    (record.findings ?? [])
      .filter((finding) => {
        if (finding.resolution_status === "closed") {
          return false;
        }

        if (finding.severity === "critical") {
          return blockOnOpenCriticalFindings;
        }

        if (finding.severity === "major") {
          return blockOnOpenMajorFindings;
        }

        return false;
      })
      .map((finding) => ({
        appraisal_id: record.id,
        finding_id: finding.finding_id,
        severity: finding.severity,
        category: finding.category
      }))
  );

  if (missingLanes.length > 0) {
    issues.push(`Missing complete evidence appraisal lanes for revision ${currentRevision}: ${missingLanes.join(", ")}.`);
  }

  if (blockingAppraisalIds.length > 0) {
    issues.push(`Blocking evidence appraisals remain open for revision ${currentRevision}.`);
  }

  if (openBlockingFindings.length > 0) {
    issues.push(`Open blocking findings remain for revision ${currentRevision}.`);
  }

  return {
    eligible: requiredLanes.length > 0,
    ready: requiredLanes.length === 0 || issues.length === 0,
    revision_number: currentRevision,
    required_lanes: requiredLanes,
    completed_lanes: completedLanes,
    min_complete_appraisals_per_lane: minAppraisalsPerLane,
    completed_appraisals: appraisals
      .map(({ record }) => ({
        id: record.id,
        lane: record.appraisal_lane,
        round: record.appraisal_round,
        verdict: record.verdict,
        blocking: record.blocking
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    missing_lanes: missingLanes,
    blocking_appraisal_ids: blockingAppraisalIds,
    open_blocking_findings: openBlockingFindings,
    issues,
    appraisals: appraisals.map(({ record }) => record)
  };
}

function validateBundleShape(bundle, issues, domainPack) {
  for (const field of ["schema_version", "record_type", "id", "name", "intake_mode", "lifecycle_status", "submitted_at"]) {
    addIssueForMissingString(bundle, field, issues, "Candidate bundle");
  }

  if (bundle.schema_version !== "1.0.0") {
    issues.push("Candidate bundle schema_version must be 1.0.0.");
  }

  if (bundle.record_type !== "candidate_bundle") {
    issues.push("Candidate bundle record_type must be candidate_bundle.");
  }

  if (!candidateStatusTransitions[bundle.lifecycle_status]) {
    issues.push(`Candidate bundle lifecycle_status is unsupported: ${bundle.lifecycle_status}.`);
  }

  for (const nodeId of bundle.scope?.taxonomy_node_ids ?? []) {
    if (!domainPack.taxonomyNodeIds.has(nodeId)) {
      issues.push(`Candidate bundle scope references unknown taxonomy_node_id: ${nodeId}.`);
    }
  }

  if (!Array.isArray(bundle.proposed_changes) || bundle.proposed_changes.length === 0) {
    issues.push("Candidate bundle proposed_changes must contain at least one change.");
    return;
  }

  const seenChangeIds = new Set();
  for (const [index, change] of bundle.proposed_changes.entries()) {
    const label = `Change ${index + 1}`;
    for (const field of ["change_id", "change_type", "target_record_type", "summary", "rationale"]) {
      addIssueForMissingString(change, field, issues, label);
    }

    if (!["create_record", "update_record"].includes(change.change_type)) {
      issues.push(`${label} has unsupported change_type: ${change.change_type}.`);
    }

    if (seenChangeIds.has(change.change_id)) {
      issues.push(`Duplicate change_id: ${change.change_id}.`);
    }
    seenChangeIds.add(change.change_id);
  }
}

async function evaluatePromotionFiles(bundle) {
  const issues = [];
  const warnings = [];
  const changes = [];

  for (const change of bundle.proposed_changes ?? []) {
    const changeIssues = [];
    const changeWarnings = [];
    const expectedTargetPath = getTargetRecordPath(change.target_record_type, change.target_record_id);
    let targetFilePath = change.file_path;

    if (!targetFilePath && expectedTargetPath) {
      targetFilePath = toPosixRelative(expectedTargetPath);
    }

    if (!recordCollections[change.target_record_type]) {
      changeIssues.push(`Unsupported target record type: ${change.target_record_type}.`);
    }

    if (!nonEmptyString(change.target_record_id)) {
      changeIssues.push("Promotion requires target_record_id.");
    }

    if (!targetFilePath) {
      changeIssues.push("Promotion requires file_path.");
    }

    const targetResolvedPath = targetFilePath
      ? resolveDataPath(targetFilePath, "Target file path", changeIssues)
      : undefined;

    if (expectedTargetPath && targetResolvedPath && targetResolvedPath !== expectedTargetPath) {
      changeIssues.push(`Target file path must be ${toPosixRelative(expectedTargetPath)}.`);
    }

    const targetExists = targetResolvedPath ? await fileExists(targetResolvedPath) : false;
    let liveRecord;
    if (bundle.lifecycle_status !== "published" && targetResolvedPath) {
      if (change.change_type === "create_record" && targetExists) {
        changeIssues.push(`Create change targets an existing live file: ${toPosixRelative(targetResolvedPath)}.`);
      }

      if (change.change_type === "update_record" && !targetExists) {
        changeIssues.push(`Update change targets a missing live file: ${toPosixRelative(targetResolvedPath)}.`);
      }
    }

    const stagedFilePath = change.staged_file_path ?? toPosixRelative(getDerivedStagedFilePath(bundle.id, change));
    const stagedResolvedPath = resolveDataPath(stagedFilePath, "Staged file path", changeIssues);
    let stagedRecord;

    if (stagedResolvedPath) {
      if (!isUnderPath(path.join(stagedRecordsRoot, bundle.id), stagedResolvedPath)) {
        changeIssues.push(`Staged file path must stay under data/staged-records/${bundle.id}/.`);
      } else if (!(await fileExists(stagedResolvedPath))) {
        const message = `Missing staged file at ${stagedFilePath}.`;
        if (bundle.lifecycle_status === "published") {
          changeWarnings.push(message);
        } else {
          changeIssues.push(message);
        }
      } else {
        try {
          stagedRecord = await readJson(stagedResolvedPath);
        } catch (error) {
          changeIssues.push(`Could not parse staged file ${stagedFilePath}: ${error.message}`);
        }
      }
    }

    if (stagedRecord) {
      if (stagedRecord.record_type !== change.target_record_type) {
        changeIssues.push(`Staged record_type must be ${change.target_record_type}.`);
      }

      if (change.target_record_id && stagedRecord.id !== change.target_record_id) {
        changeIssues.push(`Staged record id must be ${change.target_record_id}.`);
      }
    }

    if (bundle.lifecycle_status === "published" && !targetExists) {
      changeIssues.push(`Published bundle target file is missing: ${targetFilePath}.`);
    }

    let liveMatchesStaged;
    if (bundle.lifecycle_status === "published" && targetExists && targetResolvedPath) {
      liveRecord = await readJson(targetResolvedPath);
      liveMatchesStaged = stagedRecord ? JSON.stringify(liveRecord) === JSON.stringify(stagedRecord) : undefined;
      if (stagedRecord && !liveMatchesStaged) {
        changeWarnings.push(`Published live record differs from staged record: ${targetFilePath}.`);
      }
    }

    const publicChange = {
      change_id: change.change_id,
      change_type: change.change_type,
      target_record_type: change.target_record_type,
      target_record_id: change.target_record_id,
      target_file_path: targetFilePath,
      staged_file_path: stagedFilePath,
      target_exists: targetExists,
      staged_exists: Boolean(stagedRecord),
      live_matches_staged: liveMatchesStaged,
      ready: changeIssues.length === 0,
      issues: changeIssues,
      warnings: changeWarnings
    };

    changes.push({
      ...publicChange,
      targetRecordType: change.target_record_type,
      targetRecordId: change.target_record_id,
      targetResolvedPath,
      stagedResolvedPath,
      targetExists,
      stagedRecord,
      liveMatchesStaged,
      validationRecord: bundle.lifecycle_status === "published" ? liveRecord ?? stagedRecord : stagedRecord
    });
    issues.push(...changeIssues.map((issue) => `${change.change_id}: ${issue}`));
    warnings.push(...changeWarnings.map((warning) => `${change.change_id}: ${warning}`));
  }

  return { ready: issues.length === 0, issues, warnings, changes };
}

function addReferenceMessage(message, issues, warnings, options) {
  if (options.referenceGapsAreWarnings) {
    warnings.push(message);
  } else {
    issues.push(message);
  }
}

function validateTaxonomyNodes(record, field, domainPack, issues, label) {
  if (!Array.isArray(record[field]) || record[field].length === 0) {
    issues.push(`${label} must include at least one ${field} entry.`);
    return;
  }

  for (const nodeId of record[field]) {
    if (!domainPack.taxonomyNodeIds.has(nodeId)) {
      issues.push(`${label} references unknown taxonomy_node_id: ${nodeId}.`);
    }
  }
}

function validateArtifactRecord(record, recordMaps, issues, warnings, label, domainPack, options = {}) {
  for (const field of ["name", "artifact_type", "status"]) {
    addIssueForMissingString(record, field, issues, label);
  }

  validateTaxonomyNodes(record, "taxonomy_node_ids", domainPack, issues, label);

  if (!Array.isArray(record.source_ids) || record.source_ids.length === 0) {
    issues.push(`${label} must include at least one source_id.`);
  } else {
    for (const sourceId of record.source_ids) {
      if (!recordExists(recordMaps, "source", sourceId)) {
        addReferenceMessage(`${label} references missing source_id: ${sourceId}.`, issues, warnings, options);
      }
    }
  }

  validateDomainExtractionFields(record, "artifact", domainPack, issues, label);
}

function validateFindingRecord(record, recordMaps, issues, warnings, label, domainPack, options = {}) {
  for (const field of [
    "name",
    "source_id",
    "endpoint_category",
    "direction",
    "evidence_tier",
    "confidence",
    "statement"
  ]) {
    addIssueForMissingString(record, field, issues, label);
  }

  validateTaxonomyNodes(record, "taxonomy_node_ids", domainPack, issues, label);

  if (record.source_id && !recordExists(recordMaps, "source", record.source_id)) {
    addReferenceMessage(`${label} references missing source_id: ${record.source_id}.`, issues, warnings, options);
  }

  if (record.artifact_id && !recordExists(recordMaps, "artifact", record.artifact_id)) {
    addReferenceMessage(`${label} references missing artifact_id: ${record.artifact_id}.`, issues, warnings, options);
  }

  validateDomainExtractionFields(record, "finding", domainPack, issues, label);
}

function validateClaimSupportIds(record, recordMaps, issues, warnings, label, options = {}) {
  for (const findingId of record.supporting_finding_ids ?? []) {
    if (!recordExists(recordMaps, "finding", findingId)) {
      addReferenceMessage(`${label} references missing supporting_finding_id: ${findingId}.`, issues, warnings, options);
    }
  }

  for (const sourceId of record.supporting_source_ids ?? []) {
    if (!recordExists(recordMaps, "source", sourceId)) {
      addReferenceMessage(`${label} references missing supporting_source_id: ${sourceId}.`, issues, warnings, options);
    }
  }
}

function validateClaimEvidenceLinks(record, recordMaps, issues, warnings, label, options = {}) {
  if (!Array.isArray(record.supporting_evidence)) {
    return;
  }

  for (const [index, support] of record.supporting_evidence.entries()) {
    const supportLabel = `${label} supporting_evidence[${index}]`;
    for (const field of ["label", "conclusion", "support_role", "rationale"]) {
      addIssueForMissingString(support, field, issues, supportLabel);
    }

    if (support.support_role && !supportRoles.has(support.support_role)) {
      issues.push(`${supportLabel} has unsupported support_role: ${support.support_role}.`);
    }

    if (!Array.isArray(support.finding_ids) || support.finding_ids.length === 0) {
      issues.push(`${supportLabel} must include at least one finding_id.`);
    } else {
      for (const findingId of support.finding_ids) {
        if (!recordExists(recordMaps, "finding", findingId)) {
          addReferenceMessage(`${supportLabel} references missing finding_id: ${findingId}.`, issues, warnings, options);
        }
      }
    }

    for (const sourceId of support.source_ids ?? []) {
      if (!recordExists(recordMaps, "source", sourceId)) {
        addReferenceMessage(`${supportLabel} references missing source_id: ${sourceId}.`, issues, warnings, options);
      }
    }
  }
}

function addSupportMapMessage(message, issues, warnings, options) {
  if (options.supportMapGapsAreWarnings) {
    warnings.push(message);
  } else {
    issues.push(message);
  }
}

function validateClaimRecord(record, recordMaps, issues, warnings, label, domainPack, options = {}) {
  for (const field of ["name", "subject_type", "subject_id", "current_stage", "momentum", "confidence", "summary", "last_updated"]) {
    addIssueForMissingString(record, field, issues, label);
  }

  if (record.subject_type === "taxonomy_node" && !domainPack.taxonomyNodeIds.has(record.subject_id)) {
    issues.push(`${label} references unknown subject_id taxonomy node: ${record.subject_id}.`);
  }

  validateClaimSupportIds(record, recordMaps, issues, warnings, label, options);
  validateClaimEvidenceLinks(record, recordMaps, issues, warnings, label, options);

  if (record.subject_type === "taxonomy_node") {
    if (!Array.isArray(record.supporting_evidence) || record.supporting_evidence.length === 0) {
      addSupportMapMessage(`${label} is a taxonomy-node claim and must include supporting_evidence[].`, issues, warnings, options);
    }

    if (!Array.isArray(record.supporting_finding_ids) || record.supporting_finding_ids.length === 0) {
      addSupportMapMessage(`${label} is a taxonomy-node claim and must include supporting_finding_ids[].`, issues, warnings, options);
    }

    if (!Array.isArray(record.limitations) || record.limitations.length === 0) {
      addSupportMapMessage(`${label} is a taxonomy-node claim and must include limitations[].`, issues, warnings, options);
    }
  }

  const supportRoleValues = (record.supporting_evidence ?? [])
    .map((support) => support.support_role)
    .filter(nonEmptyString);
  const hasDirectSupport = supportRoleValues.some((role) => directSupportRoles.has(role));
  if (record.confidence === "high" && supportRoleValues.length > 0 && !hasDirectSupport) {
    warnings.push(`${label} is high confidence but has no direct support role in supporting_evidence[].`);
  }

  validateDomainExtractionFields(record, "claim", domainPack, issues, label);
}

function validateSearchProtocolRecord(record, recordMaps, issues, warnings, label, domainPack, options = {}) {
  for (const field of ["domain_id", "status", "search_started_at", "search_completed_at", "screening_summary"]) {
    addIssueForMissingString(record, field, issues, label);
  }

  if (record.domain_id !== domainPack.domain.id) {
    issues.push(`${label} domain_id must match active domain ${domainPack.domain.id}.`);
  }

  validateTaxonomyNodes(record, "taxonomy_node_ids", domainPack, issues, label);

  if (!Array.isArray(record.search_queries) || record.search_queries.length === 0) {
    issues.push(`${label} must include at least one search_queries[] entry.`);
  }

  for (const sourceId of record.source_ids ?? []) {
    if (!recordExists(recordMaps, "source", sourceId)) {
      addReferenceMessage(`${label} references missing source_id: ${sourceId}.`, issues, warnings, options);
    }
  }

  for (const [index, decision] of (record.screening_decisions ?? []).entries()) {
    if (decision.source_id && !recordExists(recordMaps, "source", decision.source_id)) {
      addReferenceMessage(`${label} screening_decisions[${index}] references missing source_id: ${decision.source_id}.`, issues, warnings, options);
    }
  }

  validateDomainExtractionFields(record, "search_protocol", domainPack, issues, label);
}

function validateDomainExtractionFields(record, recordType, domainPack, issues, label) {
  if (!domainPack.extractionSchema.validation?.enforce_required_fields) {
    validateApplicabilityFacets(record, recordType, domainPack, issues, label);
    return;
  }

  const requiredFields = (domainPack.extractionSchema.fields ?? []).filter(
    (field) => field.required && (field.applies_to ?? []).includes(recordType)
  );

  for (const field of requiredFields) {
    if (!hasRequiredValue(record[field.id])) {
      issues.push(`${label} is missing required domain extraction field ${field.id}.`);
    }
  }

  validateApplicabilityFacets(record, recordType, domainPack, issues, label);
}

function validateApplicabilityFacets(record, recordType, domainPack, issues, label) {
  for (const facet of domainPack.domain.applicability_facets ?? []) {
    if (!(facet.applies_to ?? []).includes(recordType)) {
      continue;
    }

    const allowedValues = new Set((facet.values ?? []).map((option) => option.id));
    if (allowedValues.size === 0) {
      continue;
    }

    for (const value of valueList(record[facet.id])) {
      if (!allowedValues.has(value)) {
        issues.push(`${label} has unsupported applicability facet ${facet.id} value: ${value}.`);
      }
    }
  }
}

function validateSourceAccessMetadata(record, warnings, label) {
  const access = getExplicitSourceAccess(record);
  if (!access.status && !access.depth) {
    return;
  }

  if (access.status && !Object.prototype.hasOwnProperty.call(sourceAccessStatusDepth, access.status)) {
    warnings.push(`${label} has unrecognized access_status: ${access.status}.`);
  }

  if (access.depth && !Object.prototype.hasOwnProperty.call(sourceAccessDepthRank, access.depth)) {
    warnings.push(`${label} has unrecognized access_depth: ${access.depth}.`);
  }

  if (
    ["abstract_only_paywalled", "unavailable", "not_yet_checked"].includes(access.status) &&
    access.attempts.length === 0
  ) {
    warnings.push(`${label} uses access_status ${access.status} but has no access_attempts[].`);
  }
}

function validateStagedRecordSemantics(promotionChanges, recordMaps, bundleStatus, domainPack) {
  const issues = [];
  const warnings = [];
  const supportMapGapsAreWarnings = bundleStatus === "published";
  const referenceGapsAreWarnings = bundleStatus === "published";
  const semanticOptions = { supportMapGapsAreWarnings, referenceGapsAreWarnings };

  for (const change of promotionChanges) {
    const record = change.validationRecord;
    if (!record) {
      continue;
    }

    const label = `${change.change_id} (${change.targetRecordType}:${change.targetRecordId})`;
    addIssueForMissingString(record, "name", issues, label);

    switch (change.targetRecordType) {
      case "source":
        addIssueForMissingString(record, "source_type", issues, label);
        if (!record.doi && !record.pmid && !record.urls?.length && !record.registry_ids?.length) {
          warnings.push(`${label} has no DOI, PMID, URL, or registry ID.`);
        }
        validateSourceAccessMetadata(record, warnings, label);
        break;
      case "artifact":
        validateArtifactRecord(record, recordMaps, issues, warnings, label, domainPack, semanticOptions);
        break;
      case "finding":
        validateFindingRecord(record, recordMaps, issues, warnings, label, domainPack, semanticOptions);
        break;
      case "claim":
        validateClaimRecord(record, recordMaps, issues, warnings, label, domainPack, semanticOptions);
        break;
      case "activity_item":
        for (const field of ["summary", "activity_type", "activity_lane", "occurred_on"]) {
          addIssueForMissingString(record, field, issues, label);
        }
        break;
      case "search_protocol":
        validateSearchProtocolRecord(record, recordMaps, issues, warnings, label, domainPack, semanticOptions);
        break;
      default:
        break;
    }
  }

  return { ready: issues.length === 0, issues, warnings };
}

function getRecordMapEntry(recordMaps, recordType, recordId) {
  return nonEmptyString(recordId) ? recordMaps[recordType]?.get(recordId) : undefined;
}

function getRecordUrls(record) {
  return [
    ...(Array.isArray(record?.urls) ? record.urls : []),
    ...(nonEmptyString(record?.url) ? [record.url] : [])
  ];
}

function normalizeSourceAccessDepth(value) {
  if (!nonEmptyString(value)) {
    return undefined;
  }

  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (normalized === "abstract" || normalized === "abstract_or_metadata") {
    return "abstract_only";
  }
  if (normalized === "metadata" || normalized === "source_page") {
    return "metadata_only";
  }
  if (normalized === "fulltext" || normalized === "full_text_available" || normalized === "full_text_verified") {
    return "full_text";
  }
  if (Object.prototype.hasOwnProperty.call(sourceAccessDepthRank, normalized)) {
    return normalized;
  }

  return undefined;
}

function normalizeSourceAccessStatus(value) {
  if (!nonEmptyString(value)) {
    return undefined;
  }

  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return Object.prototype.hasOwnProperty.call(sourceAccessStatusDepth, normalized) ? normalized : normalized;
}

function getExplicitSourceAccess(source) {
  const status = normalizeSourceAccessStatus(source?.access_status ?? source?.source_access?.access_status);
  const explicitDepth = normalizeSourceAccessDepth(source?.access_depth ?? source?.source_access?.access_depth);
  const statusDepth = status ? sourceAccessStatusDepth[status] : undefined;
  const depth = explicitDepth ?? statusDepth;

  return {
    status,
    depth,
    attempts: Array.isArray(source?.access_attempts)
      ? source.access_attempts
      : Array.isArray(source?.source_access?.access_attempts)
        ? source.source_access.access_attempts
        : []
  };
}

function inferSourceAvailability(source) {
  const urls = getRecordUrls(source);
  const explicitAccess = getExplicitSourceAccess(source);
  const fullTextUrls = urls.filter((url) => {
    const normalized = String(url).toLowerCase();
    return (
      normalized.includes("arxiv.org/pdf/") ||
      normalized.includes("arxiv.org/html/") ||
      normalized.includes("arxiv.org/abs/") ||
      normalized.endsWith(".pdf") ||
      normalized.includes(".pdf?") ||
      normalized.includes("/pdf/") ||
      normalized.includes("mdpi.com/")
    );
  });
  const heuristicDepth = fullTextUrls.length > 0 ? "full_text_available" : "source_page_or_metadata";

  return {
    depth: explicitAccess.depth ?? heuristicDepth,
    inferred_depth: heuristicDepth,
    access_status: explicitAccess.status,
    access_status_label: explicitAccess.status
      ? (sourceAccessStatusLabels[explicitAccess.status] ?? explicitAccess.status)
      : undefined,
    access_attempts: explicitAccess.attempts,
    access_metadata_present: Boolean(explicitAccess.depth || explicitAccess.status),
    urls,
    full_text_urls: fullTextUrls
  };
}

function getLocatorText(locator) {
  if (!locator) {
    return "";
  }

  if (typeof locator === "string") {
    return locator;
  }

  if (typeof locator === "object") {
    return Object.values(locator)
      .filter((value) => ["string", "number", "boolean"].includes(typeof value))
      .map(String)
      .join(" ");
  }

  return String(locator);
}

function inferLocatorDepth(locator) {
  const text = getLocatorText(locator).toLowerCase();
  if (!text.trim()) {
    return "missing";
  }

  if (fullTextLocatorTerms.some((term) => text.includes(term))) {
    return "section_or_full_text";
  }

  if (shallowLocatorTerms.some((term) => text.includes(term))) {
    return "abstract_or_metadata";
  }

  return "unspecified";
}

function auditSourceDepth(promotionChanges, recordMaps) {
  const warnings = [];
  const checks = [];

  for (const change of promotionChanges) {
    if (change.targetRecordType !== "finding" || !change.validationRecord) {
      continue;
    }

    const finding = change.validationRecord;
    const sourceEntry = getRecordMapEntry(recordMaps, "source", finding.source_id);
    if (!sourceEntry) {
      continue;
    }

    const sourceAvailability = inferSourceAvailability(sourceEntry.record);
    const locatorDepth = inferLocatorDepth(finding.source_locator);
    const check = {
      finding_id: finding.id,
      source_id: finding.source_id,
      source_depth: sourceAvailability.depth,
      source_access_status: sourceAvailability.access_status,
      access_metadata_present: sourceAvailability.access_metadata_present,
      locator_depth: locatorDepth,
      locator_url: finding.source_locator?.url
    };
    checks.push(check);

    if (sourceAvailability.depth === "full_text_available" && locatorDepth === "missing") {
      warnings.push(
        `${change.change_id}: finding ${finding.id} has no source_locator even though ${finding.source_id} appears to have full text available.`
      );
    }

    if (sourceAvailability.depth === "full_text_available" && locatorDepth === "abstract_or_metadata") {
      warnings.push(
        `${change.change_id}: finding ${finding.id} uses an abstract/metadata locator while ${finding.source_id} appears to have full text available.`
      );
    }
  }

  return {
    ready: true,
    warnings,
    checks
  };
}

function getSourceAccessPolicy(domainPack) {
  return domainPack?.domain?.source_access_policy ?? {};
}

function getPolicyMinimumFindingDepth(policy) {
  return normalizeSourceAccessDepth(policy.minimum_finding_access_depth);
}

function isAccessDepthAtLeast(actualDepth, requiredDepth) {
  if (!requiredDepth) {
    return true;
  }

  const actualRank = sourceAccessDepthRank[normalizeSourceAccessDepth(actualDepth) ?? actualDepth] ?? -1;
  const requiredRank = sourceAccessDepthRank[requiredDepth] ?? -1;
  return actualRank >= requiredRank;
}

function buildSourceAccessFollowUp({ change, finding, source, sourceAvailability, locatorDepth, requiredDepth, priority }) {
  const sourceName = source?.name ?? finding.source_id;
  const readableStatus =
    sourceAvailability.access_status_label ??
    sourceAvailability.access_status ??
    sourceAvailability.depth ??
    "unspecified access depth";

  return {
    action_id: `resolve-source-access-${finding.id}`,
    action_type: "source_access_resolution",
    status: "open",
    priority,
    target_record_type: "finding",
    target_record_id: finding.id,
    source_ids: [finding.source_id],
    taxonomy_node_ids: finding.taxonomy_node_ids ?? [],
    access_status: sourceAvailability.access_status ?? "inferred",
    access_depth: sourceAvailability.depth,
    locator_depth: locatorDepth,
    required_access_depth: requiredDepth,
    reason: `${change.change_id}: finding ${finding.id} relies on ${sourceName} with ${readableStatus}, below the domain minimum of ${requiredDepth}.`,
    recommended_action: `Retrieve full text for ${sourceName}, replace or downgrade the finding, or mark the source as screening-only before synthesis use.`,
    finding_id: finding.id,
    artifact_id: finding.artifact_id
  };
}

function auditSourceAccess(promotionChanges, recordMaps, domainPack) {
  const policy = getSourceAccessPolicy(domainPack);
  const requiredDepth = getPolicyMinimumFindingDepth(policy);
  const action = policy.insufficient_finding_access_action ?? "warn";
  const priority = policy.follow_up_priority ?? "high";
  const issues = [];
  const warnings = [];
  const checks = [];
  const actions = [];

  if (!requiredDepth || action === "ignore") {
    return {
      ready: true,
      policy_active: false,
      required_finding_access_depth: requiredDepth,
      issues,
      warnings,
      checks,
      follow_ups: {
        open_count: 0,
        actions: []
      }
    };
  }

  for (const change of promotionChanges) {
    if (change.targetRecordType !== "finding" || !change.validationRecord) {
      continue;
    }

    const finding = change.validationRecord;
    const sourceEntry = getRecordMapEntry(recordMaps, "source", finding.source_id);
    if (!sourceEntry) {
      continue;
    }

    const sourceAvailability = inferSourceAvailability(sourceEntry.record);
    const locatorDepth = inferLocatorDepth(finding.source_locator);
    const enforceInferredAccessDepth = policy.enforce_inferred_access_depth === true;
    const hasExplicitAccessMetadata = sourceAvailability.access_metadata_present;
    const policyEnforced = hasExplicitAccessMetadata || enforceInferredAccessDepth;
    const depthMeetsMinimum = isAccessDepthAtLeast(sourceAvailability.depth, requiredDepth);
    const check = {
      finding_id: finding.id,
      source_id: finding.source_id,
      source_access_status: sourceAvailability.access_status,
      source_access_depth: sourceAvailability.depth,
      source_access_inferred_depth: sourceAvailability.inferred_depth,
      access_metadata_present: sourceAvailability.access_metadata_present,
      locator_depth: locatorDepth,
      locator_url: finding.source_locator?.url,
      required_access_depth: requiredDepth,
      policy_enforced: policyEnforced,
      source_access_depth_meets_minimum: depthMeetsMinimum,
      sufficient_for_finding_support: !policyEnforced || depthMeetsMinimum
    };
    checks.push(check);

    if (!policyEnforced) {
      continue;
    }

    if (depthMeetsMinimum) {
      continue;
    }

    const followUp = buildSourceAccessFollowUp({
      change,
      finding,
      source: sourceEntry.record,
      sourceAvailability,
      locatorDepth,
      requiredDepth,
      priority
    });
    actions.push(followUp);

    if (action === "block_publication") {
      issues.push(followUp.reason);
    } else {
      warnings.push(followUp.reason);
    }
  }

  return {
    ready: issues.length === 0 && warnings.length === 0,
    policy_active: true,
    required_finding_access_depth: requiredDepth,
    issues,
    warnings,
    checks,
    follow_ups: {
      open_count: actions.length,
      actions
    }
  };
}

function isIncludedScreeningDecision(decision) {
  return String(decision?.decision ?? "").toLowerCase() === "include" && nonEmptyString(decision.source_id);
}

function auditSearchLinkage(bundle, promotionChanges, recordMaps) {
  const warnings = [];
  const checks = [];
  const bundleSourceIds = new Set(bundle.source_ids ?? []);
  const sourceChangeIds = new Set(
    promotionChanges
      .filter((change) => change.targetRecordType === "source" && nonEmptyString(change.targetRecordId))
      .map((change) => change.targetRecordId)
  );

  for (const sourceId of sourceChangeIds) {
    if (bundleSourceIds.size > 0 && !bundleSourceIds.has(sourceId)) {
      warnings.push(`Bundle source_ids does not include proposed source record ${sourceId}.`);
    }
  }

  for (const change of promotionChanges) {
    if (change.targetRecordType !== "search_protocol" || !change.validationRecord) {
      continue;
    }

    const protocol = change.validationRecord;
    const protocolSourceIds = new Set(protocol.source_ids ?? []);
    const includedDecisionSourceIds = new Set(
      (protocol.screening_decisions ?? []).filter(isIncludedScreeningDecision).map((decision) => decision.source_id)
    );

    for (const sourceId of includedDecisionSourceIds) {
      if (!protocolSourceIds.has(sourceId)) {
        warnings.push(`${change.change_id}: included screening source ${sourceId} is missing from search_protocol.source_ids.`);
      }

      if (bundleSourceIds.size > 0 && !bundleSourceIds.has(sourceId)) {
        warnings.push(`${change.change_id}: included screening source ${sourceId} is missing from bundle.source_ids.`);
      }

      if (!recordExists(recordMaps, "source", sourceId)) {
        warnings.push(`${change.change_id}: included screening source ${sourceId} has no staged or live source record.`);
      }
    }

    if ((protocol.screening_decisions ?? []).length > 0) {
      for (const sourceId of protocolSourceIds) {
        if (!includedDecisionSourceIds.has(sourceId)) {
          warnings.push(`${change.change_id}: search_protocol.source_ids includes ${sourceId} without an include screening decision.`);
        }
      }
    }

    checks.push({
      search_protocol_id: protocol.id,
      included_decision_source_ids: Array.from(includedDecisionSourceIds).sort(),
      protocol_source_ids: Array.from(protocolSourceIds).sort(),
      bundle_source_ids: Array.from(bundleSourceIds).sort()
    });
  }

  return {
    ready: true,
    warnings,
    checks
  };
}

function getPublicationEventTargetKey(target) {
  return `${target.record_type}:${target.record_id}`;
}

function getPromotionChangeTargetKey(change) {
  return `${change.targetRecordType}:${change.targetRecordId}`;
}

function auditPublicationCompleteness(bundle, promotion, publication) {
  const warnings = [];
  const checks = [];
  const changes = promotion.changes ?? [];

  if (bundle.lifecycle_status !== "published") {
    return {
      eligible: false,
      ready: true,
      warnings,
      checks,
      summary: "Publication completeness is checked after a bundle is published."
    };
  }

  const publicationTargetKeys = new Set(
    (publication.publication_event_records ?? []).flatMap((event) =>
      (event.published_targets ?? []).map(getPublicationEventTargetKey)
    )
  );
  const changeTargetKeys = new Set(changes.map(getPromotionChangeTargetKey));

  for (const change of changes) {
    const targetKey = getPromotionChangeTargetKey(change);
    const check = {
      change_id: change.change_id,
      target_record_type: change.targetRecordType,
      target_record_id: change.targetRecordId,
      target_file_path: change.target_file_path,
      staged_file_path: change.staged_file_path,
      live_target_exists: Boolean(change.targetExists),
      staged_record_exists: Boolean(change.stagedRecord),
      live_matches_staged: change.liveMatchesStaged,
      publication_event_target_exists: publicationTargetKeys.has(targetKey)
    };
    checks.push(check);

    if (!check.live_target_exists) {
      warnings.push(`${change.change_id}: published live target is missing: ${change.target_file_path}.`);
    }

    if (!check.staged_record_exists) {
      warnings.push(`${change.change_id}: staged record is missing: ${change.staged_file_path}.`);
    }

    if (check.live_matches_staged === false) {
      warnings.push(`${change.change_id}: published live record differs from staged record.`);
    }

    if (!check.publication_event_target_exists) {
      warnings.push(`${change.change_id}: target ${targetKey} is missing from publication events.`);
    }
  }

  for (const targetKey of publicationTargetKeys) {
    if (!changeTargetKeys.has(targetKey)) {
      warnings.push(`Publication event target ${targetKey} is not present in bundle proposed_changes.`);
    }
  }

  for (const event of publication.publication_event_records ?? []) {
    const expectedDelta = buildPublicationDeltaFromChanges(changes);
    const eventDelta = event.public_graph_delta ?? countTargetsByRecordType(event.published_targets ?? []);
    if (JSON.stringify(eventDelta) !== JSON.stringify(expectedDelta)) {
      warnings.push(`Publication event ${event.id} public_graph_delta does not match proposed_changes.`);
    }
  }

  return {
    eligible: true,
    ready: warnings.length === 0,
    warnings,
    checks,
    summary: {
      proposed_change_count: changes.length,
      live_target_count: checks.filter((check) => check.live_target_exists).length,
      staged_record_count: checks.filter((check) => check.staged_record_exists).length,
      matched_live_staged_count: checks.filter((check) => check.live_matches_staged === true).length,
      publication_event_target_count: publicationTargetKeys.size
    }
  };
}

async function loadBundleResearchSessions(bundleId) {
  return (await readJsonCollection("research/sessions"))
    .map(({ record }) => record)
    .filter((session) => session.candidate_bundle_id === bundleId);
}

async function auditTimestampOrder(bundle, promotion, evidenceAppraisalGate, publication) {
  const warnings = [];
  const checks = [];
  const bundleSubmittedAtMillis = parseDateTimeMillis(bundle.submitted_at);
  const publicationEvents = publication.publication_event_records ?? [];
  const publicationEventMillis = publicationEvents
    .map((event) => parseDateTimeMillis(event.published_at))
    .filter((millis) => millis !== undefined);
  const earliestPublicationMillis = publicationEventMillis.length > 0 ? Math.min(...publicationEventMillis) : undefined;
  const earliestPublicationAt = publicationEvents
    .map((event) => event.published_at)
    .filter(nonEmptyString)
    .sort()[0];

  for (const event of publicationEvents) {
    addTimestampWarning(warnings, checks, {
      check_type: "bundle_submitted_before_publication",
      left_label: "bundle submitted_at",
      left_at: bundle.submitted_at,
      left_at_millis: bundleSubmittedAtMillis,
      right_label: `publication ${event.id} published_at`,
      right_at: event.published_at,
      right_at_millis: parseDateTimeMillis(event.published_at)
    });
  }

  for (const change of promotion.changes ?? []) {
    const record = change.validationRecord;
    if (change.targetRecordType !== "search_protocol" || !record) {
      continue;
    }

    addTimestampWarning(warnings, checks, {
      check_type: "search_started_before_completed",
      left_label: `search protocol ${record.id} search_started_at`,
      left_at: record.search_started_at,
      left_at_millis: parseDateTimeMillis(record.search_started_at),
      right_label: `search protocol ${record.id} search_completed_at`,
      right_at: record.search_completed_at,
      right_at_millis: parseDateTimeMillis(record.search_completed_at)
    });

    if (earliestPublicationMillis !== undefined) {
      addTimestampWarning(warnings, checks, {
        check_type: "search_completed_before_publication",
        left_label: `search protocol ${record.id} search_completed_at`,
        left_at: record.search_completed_at,
        left_at_millis: parseDateTimeMillis(record.search_completed_at),
        right_label: "earliest publication published_at",
        right_at: earliestPublicationAt,
        right_at_millis: earliestPublicationMillis
      });
    }
  }

  for (const review of evidenceAppraisalGate.appraisals ?? []) {
    addTimestampWarning(warnings, checks, {
      check_type: "bundle_submitted_before_review_created",
      left_label: "bundle submitted_at",
      left_at: bundle.submitted_at,
      left_at_millis: bundleSubmittedAtMillis,
      right_label: `review ${review.id} created_at`,
      right_at: review.created_at,
      right_at_millis: parseDateTimeMillis(review.created_at)
    });

    if (earliestPublicationMillis !== undefined) {
      addTimestampWarning(warnings, checks, {
        check_type: "review_created_before_publication",
        left_label: `review ${review.id} created_at`,
        left_at: review.created_at,
        left_at_millis: parseDateTimeMillis(review.created_at),
        right_label: "earliest publication published_at",
        right_at: earliestPublicationAt,
        right_at_millis: earliestPublicationMillis
      });
    }
  }

  for (const session of await loadBundleResearchSessions(bundle.id)) {
    addTimestampWarning(warnings, checks, {
      check_type: "session_started_before_completed",
      left_label: `research session ${session.id} started_at`,
      left_at: session.started_at,
      left_at_millis: parseDateTimeMillis(session.started_at),
      right_label: `research session ${session.id} completed_at`,
      right_at: session.completed_at,
      right_at_millis: parseDateTimeMillis(session.completed_at)
    });

    if (earliestPublicationMillis !== undefined) {
      addTimestampWarning(warnings, checks, {
        check_type: "session_completed_before_publication",
        left_label: `research session ${session.id} completed_at`,
        left_at: session.completed_at,
        left_at_millis: parseDateTimeMillis(session.completed_at),
        right_label: "earliest publication published_at",
        right_at: earliestPublicationAt,
        right_at_millis: earliestPublicationMillis
      });
    }
  }

  return {
    ready: warnings.length === 0,
    warnings,
    checks
  };
}

function getNumericMetricFields(record) {
  return ["reported_metrics", "quantitative_note"].filter((field) => hasRequiredValue(record[field]));
}

function isValidNumericExtractionStatus(value) {
  return value === true || value === false || value === "not_applicable";
}

function auditNumericExtraction(promotionChanges) {
  const warnings = [];
  const checks = [];

  for (const change of promotionChanges) {
    if (!["artifact", "finding"].includes(change.targetRecordType) || !change.validationRecord) {
      continue;
    }

    const record = change.validationRecord;
    const metricFields = getNumericMetricFields(record);
    if (metricFields.length === 0 && record.numeric_results_extracted === undefined) {
      continue;
    }

    const check = {
      change_id: change.change_id,
      target_record_type: change.targetRecordType,
      target_record_id: change.targetRecordId,
      metric_fields_present: metricFields,
      numeric_results_extracted: record.numeric_results_extracted ?? "missing",
      valid_status: isValidNumericExtractionStatus(record.numeric_results_extracted)
    };
    checks.push(check);

    if (metricFields.length > 0 && !check.valid_status) {
      warnings.push(
        `${change.change_id}: ${change.targetRecordType} ${change.targetRecordId} has metric fields (${metricFields.join(
          ", "
        )}) but no numeric_results_extracted status.`
      );
    }

    if (record.numeric_results_extracted !== undefined && !check.valid_status) {
      warnings.push(
        `${change.change_id}: numeric_results_extracted must be true, false, or "not_applicable".`
      );
    }
  }

  return {
    ready: warnings.length === 0,
    warnings,
    checks
  };
}

function getFollowUpSourceIds(record, recordType) {
  if (recordType === "finding") {
    return Array.from(new Set([record.source_id, ...(record.source_ids ?? [])].filter(nonEmptyString)));
  }

  return Array.from(new Set((record.source_ids ?? []).filter(nonEmptyString)));
}

function buildExtractionFollowUpAction(change, record, metricFields) {
  const sourceIds = getFollowUpSourceIds(record, change.targetRecordType);
  const action = {
    action_id: `extract-numeric-results-${change.targetRecordId}`,
    action_type: "numeric_results_extraction",
    status: "open",
    priority: "medium",
    target_record_type: change.targetRecordType,
    target_record_id: change.targetRecordId,
    source_ids: sourceIds,
    taxonomy_node_ids: record.taxonomy_node_ids ?? [],
    metric_fields_present: metricFields,
    reason: `${change.targetRecordType} ${change.targetRecordId} reports metric text but numeric_results_extracted is false.`,
    recommended_action: `Extract table-level numeric results for ${record.name ?? change.targetRecordId} before quantitative synthesis.`
  };

  if (change.targetRecordType === "artifact") {
    action.artifact_id = record.id;
  }

  if (change.targetRecordType === "finding") {
    action.finding_id = record.id;
    if (nonEmptyString(record.artifact_id)) {
      action.artifact_id = record.artifact_id;
    }
  }

  return action;
}

function buildExtractionFollowUps(promotionChanges) {
  const findingChanges = promotionChanges.filter(
    (change) => change.targetRecordType === "finding" && change.validationRecord?.numeric_results_extracted === false
  );
  const artifactIdsCoveredByFindings = new Set(
    findingChanges.map((change) => change.validationRecord.artifact_id).filter(nonEmptyString)
  );
  const actions = [];

  for (const change of [...findingChanges, ...promotionChanges]) {
    if (!["artifact", "finding"].includes(change.targetRecordType) || !change.validationRecord) {
      continue;
    }

    if (change.validationRecord.numeric_results_extracted !== false) {
      continue;
    }

    if (change.targetRecordType === "artifact" && artifactIdsCoveredByFindings.has(change.targetRecordId)) {
      continue;
    }

    const metricFields = getNumericMetricFields(change.validationRecord);
    if (metricFields.length === 0) {
      continue;
    }

    actions.push(buildExtractionFollowUpAction(change, change.validationRecord, metricFields));
  }

  const seen = new Set();
  const uniqueActions = actions.filter((action) => {
    if (seen.has(action.action_id)) {
      return false;
    }
    seen.add(action.action_id);
    return true;
  });

  return {
    ready: true,
    open_count: uniqueActions.length,
    actions: uniqueActions
  };
}

async function buildWorkflowAudit(bundle, promotion, recordMaps, evidenceAppraisalGate, publication, domainPack) {
  const sourceDepth = auditSourceDepth(promotion.changes, recordMaps);
  const sourceAccess = auditSourceAccess(promotion.changes, recordMaps, domainPack);
  const searchLinkage = auditSearchLinkage(bundle, promotion.changes, recordMaps);
  const publicationCompleteness = auditPublicationCompleteness(bundle, promotion, publication);
  const timestampOrder = await auditTimestampOrder(bundle, promotion, evidenceAppraisalGate, publication);
  const numericExtraction = auditNumericExtraction(promotion.changes);
  const extractionFollowUps = buildExtractionFollowUps(promotion.changes);
  const issues = [
    ...sourceAccess.issues
  ];
  const warnings = [
    ...sourceDepth.warnings,
    ...sourceAccess.warnings,
    ...searchLinkage.warnings,
    ...publicationCompleteness.warnings,
    ...timestampOrder.warnings,
    ...numericExtraction.warnings
  ];

  return {
    ready: issues.length === 0 && warnings.length === 0,
    issues,
    warnings,
    source_depth: sourceDepth,
    source_access: sourceAccess,
    search_linkage: searchLinkage,
    publication_completeness: publicationCompleteness,
    timestamp_order: timestampOrder,
    numeric_extraction: numericExtraction,
    extraction_follow_ups: extractionFollowUps,
    projected_publication_delta: buildPublicationDeltaFromChanges(bundle.proposed_changes ?? [])
  };
}

async function evaluatePublication(bundle, promotion) {
  const issues = [];
  const warnings = [];
  const publicationEventIds = bundle.publication_event_ids ?? [];

  if (bundle.lifecycle_status !== "published") {
    if (publicationEventIds.length > 0) {
      warnings.push("Bundle has publication_event_ids but is not published.");
    }

    return {
      eligible: false,
      ready: true,
      publication_event_ids: publicationEventIds,
      publication_event_records: [],
      issues,
      warnings
    };
  }

  if (publicationEventIds.length === 0) {
    issues.push("Published bundle must include at least one publication_event_id.");
  }

  const publicationEvents = [];
  for (const eventId of publicationEventIds) {
    const eventPath = path.join(publicationEventsRoot, `${eventId}.json`);
    if (!(await fileExists(eventPath))) {
      issues.push(`Missing publication event: ${toPosixRelative(eventPath)}.`);
      continue;
    }

    const eventRecord = await readJson(eventPath);
    publicationEvents.push(eventRecord);
    if (eventRecord.record_type !== "publication_event") {
      issues.push(`Publication event ${eventId} has record_type ${eventRecord.record_type}.`);
    }

    if (eventRecord.candidate_bundle_id !== bundle.id) {
      issues.push(`Publication event ${eventId} points at ${eventRecord.candidate_bundle_id}, not ${bundle.id}.`);
    }
  }

  return {
    eligible: true,
    ready: issues.length === 0 && promotion.ready,
    publication_event_ids: publicationEventIds,
    publication_event_records: publicationEvents,
    publication_events: publicationEvents.map((event) => ({
      id: event.id,
      published_at: event.published_at,
      published_targets: event.published_targets?.length ?? 0,
      public_graph_delta: event.public_graph_delta ?? countTargetsByRecordType(event.published_targets ?? []),
      affected_claim_ids: event.affected_claim_ids ?? [],
      appraisal_follow_up_actions: event.appraisal_follow_up_actions ?? [],
      source_access_follow_up_actions: event.source_access_follow_up_actions ?? [],
      extraction_follow_up_actions: event.extraction_follow_up_actions ?? []
    })),
    issues,
    warnings
  };
}

async function buildBundleReport(bundleIdOrRecord, options = {}) {
  const loaded =
    typeof bundleIdOrRecord === "string"
      ? await loadCandidateBundle(bundleIdOrRecord)
      : {
          filePath: path.join(candidateBundlesRoot, `${bundleIdOrRecord.id}.json`),
          record: bundleIdOrRecord
        };

  const domainPack = options.domainPack ?? (options.domainId ? await loadDomainPack(options.domainId) : await loadActiveDomainPack());
  const bundle = loaded.record;
  const issues = [];
  const warnings = [];

  validateBundleShape(bundle, issues, domainPack);

  const promotion = await evaluatePromotionFiles(bundle);
  const recordMaps = await buildRecordMaps(promotion.changes);
  const stagedSemantics = validateStagedRecordSemantics(
    promotion.changes,
    recordMaps,
    bundle.lifecycle_status,
    domainPack
  );
  const evidenceAppraisalGate = await evaluateEvidenceAppraisalGate(bundle, domainPack);
  const publication = await evaluatePublication(bundle, promotion);
  const workflowAudit = await buildWorkflowAudit(bundle, promotion, recordMaps, evidenceAppraisalGate, publication, domainPack);

  issues.push(...promotion.issues, ...stagedSemantics.issues, ...workflowAudit.issues, ...publication.issues);
  warnings.push(...promotion.warnings, ...stagedSemantics.warnings, ...workflowAudit.warnings, ...publication.warnings);

  if (["approved", "published"].includes(bundle.lifecycle_status) && evidenceAppraisalGate.eligible && !evidenceAppraisalGate.ready) {
    issues.push(...evidenceAppraisalGate.issues);
  }

  return {
    bundle,
    bundlePath: loaded.filePath,
    validation: {
      ready: issues.length === 0,
      issues,
      warnings
    },
    promotion,
    staged_semantics: stagedSemantics,
    workflow_audit: workflowAudit,
    evidence_appraisal_gate: evidenceAppraisalGate,
    publication
  };
}

function toPublicReport(report) {
  const { publication_event_records: _publicationEventRecords, ...publication } = report.publication;
  return {
    bundle_id: report.bundle.id,
    lifecycle_status: report.bundle.lifecycle_status,
    revision_number: getCurrentRevision(report.bundle),
    readiness: buildReadinessSummary(report),
    validation: report.validation,
    evidence_appraisal_gate: {
      eligible: report.evidence_appraisal_gate.eligible,
      ready: report.evidence_appraisal_gate.ready,
      revision_number: report.evidence_appraisal_gate.revision_number,
      required_lanes: report.evidence_appraisal_gate.required_lanes,
      completed_lanes: report.evidence_appraisal_gate.completed_lanes,
      min_complete_appraisals_per_lane: report.evidence_appraisal_gate.min_complete_appraisals_per_lane,
      completed_appraisals: report.evidence_appraisal_gate.completed_appraisals,
      missing_lanes: report.evidence_appraisal_gate.missing_lanes,
      blocking_appraisal_ids: report.evidence_appraisal_gate.blocking_appraisal_ids,
      open_blocking_findings: report.evidence_appraisal_gate.open_blocking_findings,
      issues: report.evidence_appraisal_gate.issues
    },
    promotion: {
      ready: report.promotion.ready,
      issues: report.promotion.issues,
      warnings: report.promotion.warnings,
      changes: report.promotion.changes.map((change) => ({
        change_id: change.change_id,
        change_type: change.change_type,
        target_record_type: change.target_record_type,
        target_record_id: change.target_record_id,
        target_file_path: change.target_file_path,
        staged_file_path: change.staged_file_path,
        target_exists: change.target_exists,
        staged_exists: change.staged_exists,
        live_matches_staged: change.live_matches_staged,
        ready: change.ready,
        issues: change.issues,
        warnings: change.warnings
      }))
    },
    workflow_audit: report.workflow_audit,
    publication
  };
}

function buildReadinessSummary(report) {
  const validationIssueCount = report.validation.issues.length;
  const validationWarningCount = report.validation.warnings.length;
  const promotionIssueCount = report.promotion.issues.length;
  const promotionWarningCount = report.promotion.warnings.length;
  const workflowAuditWarningCount = report.workflow_audit?.warnings?.length ?? 0;
  const missingAppraisalLanes = report.evidence_appraisal_gate.missing_lanes ?? [];
  const reviewIssueCount = report.evidence_appraisal_gate.issues.length;

  const readyForApproval =
    ["submitted", "in_review", "revised"].includes(report.bundle.lifecycle_status) &&
    report.validation.ready &&
    (!report.evidence_appraisal_gate.eligible || report.evidence_appraisal_gate.ready);
  const readyForPublication =
    report.bundle.lifecycle_status === "approved" &&
    report.validation.ready &&
    (!report.evidence_appraisal_gate.eligible || report.evidence_appraisal_gate.ready);

  let message;
  if (report.bundle.lifecycle_status === "published") {
    message = "Published. Promotion files and publication events are available for audit.";
  } else if (!report.validation.ready) {
    message = `Validation has ${validationIssueCount} issue(s). Resolve structural and reference problems before review or publication.`;
  } else if (!report.promotion.ready) {
    message = `Structurally valid, but promotion has ${promotionIssueCount} issue(s). Check staged and target files.`;
  } else if (report.evidence_appraisal_gate.eligible && !report.evidence_appraisal_gate.ready) {
    message = `Structurally valid. Waiting on ${missingAppraisalLanes.length} evidence appraisal lane(s): ${missingAppraisalLanes.join(", ")}.`;
  } else if (readyForPublication) {
    message = "Approved, structurally valid, and review-ready. Ready to publish.";
  } else if (readyForApproval) {
    message = "Structurally valid and review-ready. Ready for approval.";
  } else {
    message = "Structurally valid. Lifecycle status determines the next action.";
  }

  return {
    message,
    ready_for_approval: readyForApproval,
    ready_for_publication: readyForPublication,
    validation_issue_count: validationIssueCount,
    validation_warning_count: validationWarningCount,
    promotion_issue_count: promotionIssueCount,
    promotion_warning_count: promotionWarningCount,
    workflow_audit_warning_count: workflowAuditWarningCount,
    appraisal_issue_count: reviewIssueCount,
    missing_appraisal_lanes: missingAppraisalLanes
  };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function commandStatus(options) {
  if (!options.bundle) {
    fail("status requires --bundle <bundle-id>.");
  }

  printJson(toPublicReport(await buildBundleReport(options.bundle)));
}

async function commandAudit(options) {
  if (!options.bundle) {
    fail("audit requires --bundle <bundle-id>.");
  }

  printJson(toPublicReport(await buildBundleReport(options.bundle)));
}

async function commandValidate(options) {
  if (!options.bundle) {
    fail("validate requires --bundle <bundle-id>.");
  }

  const report = await buildBundleReport(options.bundle);
  printJson(toPublicReport(report));
  if (!report.validation.ready) {
    process.exit(1);
  }
}

async function buildPrecommitSummary(bundleIdOrRecord, options = {}) {
  const report = await buildBundleReport(bundleIdOrRecord, options);
  const publicReport = toPublicReport(report);
  const planningStatus = await readPlanningStatus();
  const domainId = report.bundle.scope?.domain_id ?? planningStatus.domain_id;
  const workflowAudit = report.workflow_audit ?? {};

  return {
    action: "precommit_summary",
    bundle_id: report.bundle.id,
    lifecycle_status: report.bundle.lifecycle_status,
    revision_number: getCurrentRevision(report.bundle),
    public_graph_delta: workflowAudit.projected_publication_delta,
    promotion: {
      ready: report.promotion.ready,
      issue_count: report.promotion.issues.length,
      warning_count: report.promotion.warnings.length
    },
    evidence_appraisals: {
      ready: report.evidence_appraisal_gate.ready,
      required_lanes: report.evidence_appraisal_gate.required_lanes,
      completed_lanes: report.evidence_appraisal_gate.completed_lanes,
      missing_lanes: report.evidence_appraisal_gate.missing_lanes,
      blocking_appraisal_ids: report.evidence_appraisal_gate.blocking_appraisal_ids,
      open_blocking_findings: report.evidence_appraisal_gate.open_blocking_findings
    },
    workflow_audit: {
      ready: workflowAudit.ready,
      warning_count: workflowAudit.warnings?.length ?? 0,
      source_depth_warning_count: workflowAudit.source_depth?.warnings?.length ?? 0,
      source_access_warning_count: workflowAudit.source_access?.warnings?.length ?? 0,
      search_linkage_warning_count: workflowAudit.search_linkage?.warnings?.length ?? 0,
      publication_completeness_warning_count: workflowAudit.publication_completeness?.warnings?.length ?? 0,
      timestamp_order_warning_count: workflowAudit.timestamp_order?.warnings?.length ?? 0,
      numeric_extraction_warning_count: workflowAudit.numeric_extraction?.warnings?.length ?? 0,
      source_access_follow_up_count: workflowAudit.source_access?.follow_ups?.open_count ?? 0,
      extraction_follow_up_count: workflowAudit.extraction_follow_ups?.open_count ?? 0
    },
    source_access_follow_ups: {
      open_count: workflowAudit.source_access?.follow_ups?.open_count ?? 0,
      actions: workflowAudit.source_access?.follow_ups?.actions ?? []
    },
    extraction_follow_ups: {
      open_count: workflowAudit.extraction_follow_ups?.open_count ?? 0,
      actions: workflowAudit.extraction_follow_ups?.actions ?? []
    },
    publication: {
      eligible: report.publication.eligible,
      ready: report.publication.ready,
      publication_event_ids: report.publication.publication_event_ids
    },
    planning: {
      domain_matches: planningStatus.domain_matches,
      warning: planningStatus.warning,
      next_queue_item: planningStatus.domain_matches ? planningStatus.next.recommended : null
    },
    verification_commands: [
      "npm run validate",
      `LIT_REVIEW_STUDIO_DOMAIN=${domainId} npm run research:bundle -- validate --bundle ${report.bundle.id}`,
      "npm test",
      `LIT_REVIEW_STUDIO_DOMAIN=${domainId} npm run build`
    ],
    readiness: publicReport.readiness
  };
}

async function commandPrecommit(options) {
  if (!options.bundle) {
    fail("precommit requires --bundle <bundle-id>.");
  }

  printJson(await buildPrecommitSummary(options.bundle));
}

async function approveCandidateBundle(bundleId) {
  const { filePath, record: bundle } = await loadCandidateBundle(bundleId);
  const result = await withFileLock(`${filePath}.lock`, async () => {
    const latestBundle = await readJson(filePath);
    const report = await buildBundleReport(latestBundle);

    if (!canTransitionCandidateBundleStatus(latestBundle.lifecycle_status, "approved")) {
      throw new Error(`Invalid candidate bundle status transition: ${latestBundle.lifecycle_status} -> approved.`);
    }

    if (!report.validation.ready) {
      throw new Error(`Candidate bundle ${latestBundle.id} is not valid: ${report.validation.issues.join(" ")}`);
    }

    if (report.evidence_appraisal_gate.eligible && !report.evidence_appraisal_gate.ready) {
      throw new Error(
        `Candidate bundle ${latestBundle.id} is not ready for approval: ${report.evidence_appraisal_gate.issues.join(" ")}`
      );
    }

    const updatedBundle = {
      ...latestBundle,
      lifecycle_status: "approved"
    };
    await writeJson(filePath, updatedBundle);

    return {
      action: "approved",
      bundle_id: updatedBundle.id,
      previous_lifecycle_status: latestBundle.lifecycle_status,
      lifecycle_status: updatedBundle.lifecycle_status
    };
  });

  return {
    ...result,
    bundle_path: toPosixRelative(filePath),
    requested_bundle_id: bundle.id
  };
}

async function updateCandidateBundleStatus(bundleId, nextStatus, options = {}) {
  if (!nonEmptyString(nextStatus)) {
    throw new Error("Next status must be a non-empty string.");
  }

  const { filePath, record: bundle } = await loadCandidateBundle(bundleId);
  const result = await withFileLock(`${filePath}.lock`, async () => {
    const latestBundle = await readJson(filePath);

    if (!canTransitionCandidateBundleStatus(latestBundle.lifecycle_status, nextStatus)) {
      throw new Error(`Invalid candidate bundle status transition: ${latestBundle.lifecycle_status} -> ${nextStatus}.`);
    }

    const reason = typeof options.reason === "string" ? options.reason.trim() : "";
    const nextActions =
      reason.length > 0
        ? [reason]
        : nextStatus === "needs_revision"
          ? ["Address requested changes before resubmitting this bundle."]
          : latestBundle.next_actions ?? [];

    const updatedBundle = {
      ...latestBundle,
      lifecycle_status: nextStatus,
      next_actions: nextActions
    };
    await writeJson(filePath, updatedBundle);

    return {
      action: nextStatus,
      bundle_id: updatedBundle.id,
      previous_lifecycle_status: latestBundle.lifecycle_status,
      lifecycle_status: updatedBundle.lifecycle_status
    };
  });

  return {
    ...result,
    bundle_path: toPosixRelative(filePath),
    requested_bundle_id: bundle.id
  };
}

async function addReviewComment(bundleId, options = {}) {
  const body = typeof options.body === "string" ? options.body.trim() : "";
  if (body.length === 0) {
    throw new Error("Review comment body is required.");
  }

  const { filePath, record: bundle } = await loadCandidateBundle(bundleId);
  const result = await withFileLock(`${filePath}.lock`, async () => {
    const latestBundle = await readJson(filePath);
    const timestamp = new Date().toISOString();
    const commentId = `editorial-comment-${latestBundle.id}-${slugTimestamp(timestamp)}`;
    const comment = {
      schema_version: "1.0.0",
      record_type: "editorial_comment",
      id: commentId,
      candidate_bundle_id: latestBundle.id,
      author_kind: options.authorKind ?? "human",
      author_id: options.authorId ?? "local-curator",
      body,
      created_at: timestamp
    };

    const commentPath = path.join(editorialCommentsRoot, `${commentId}.json`);
    await writeJson(commentPath, comment);

    const updatedBundle = {
      ...latestBundle,
      editorial_comment_ids: Array.from(new Set([...(latestBundle.editorial_comment_ids ?? []), commentId]))
    };
    await writeJson(filePath, updatedBundle);

    return {
      action: "commented",
      bundle_id: latestBundle.id,
      comment_id: commentId,
      comment_path: toPosixRelative(commentPath)
    };
  });

  return {
    ...result,
    bundle_path: toPosixRelative(filePath),
    requested_bundle_id: bundle.id
  };
}

async function commandApprove(options) {
  if (!options.bundle) {
    fail("approve requires --bundle <bundle-id>.");
  }

  const result = await approveCandidateBundle(options.bundle);
  printJson(result);
}

async function commandComment(options) {
  if (!options.bundle) {
    fail("comment requires --bundle <bundle-id>.");
  }

  const result = await addReviewComment(options.bundle, {
    body: options.comment,
    authorKind: "human",
    authorId: options["author-id"] ?? "local-curator"
  });
  printJson(result);
}

async function commandRequestChanges(options) {
  if (!options.bundle) {
    fail("request-changes requires --bundle <bundle-id>.");
  }

  const result = await updateCandidateBundleStatus(options.bundle, "needs_revision", {
    reason: options.reason
  });
  printJson(result);
}

async function commandReject(options) {
  if (!options.bundle) {
    fail("reject requires --bundle <bundle-id>.");
  }

  const result = await updateCandidateBundleStatus(options.bundle, "rejected", {
    reason: options.reason
  });
  printJson(result);
}

async function getClaimIdForSubject(subjectType, subjectId) {
  const claims = await readJsonCollection("data/claims");
  return claims.find(({ record }) => record.subject_type === subjectType && record.subject_id === subjectId)?.record.id;
}

function getAppraisalFollowUpActions(evidenceAppraisalGate) {
  const actions = [];

  for (const review of evidenceAppraisalGate.appraisals ?? []) {
    for (const finding of review.findings ?? []) {
      if (!nonBlockingFollowUpSeverities.has(finding.severity)) {
        continue;
      }

      if (!nonEmptyString(finding.recommended_action)) {
        continue;
      }

      actions.push(`${review.appraisal_lane}: ${finding.recommended_action.trim()}`);
    }
  }

  return Array.from(new Set(actions));
}

async function publishCandidateBundle(bundleId, options = {}) {
  const { filePath } = await loadCandidateBundle(bundleId);
  return withFileLock(`${filePath}.lock`, async () => {
    const bundle = await readJson(filePath);
    const report = await buildBundleReport(bundle);

    if (bundle.lifecycle_status === "published") {
      throw new Error(`Candidate bundle ${bundle.id} is already published.`);
    }

    if (bundle.lifecycle_status !== "approved") {
      throw new Error(`Candidate bundle ${bundle.id} must be approved before publication.`);
    }

    if (!report.validation.ready) {
      throw new Error(`Candidate bundle ${bundle.id} is not valid: ${report.validation.issues.join(" ")}`);
    }

    if (report.evidence_appraisal_gate.eligible && !report.evidence_appraisal_gate.ready) {
      throw new Error(
        `Candidate bundle ${bundle.id} is blocked by evidence appraisal: ${report.evidence_appraisal_gate.issues.join(" ")}`
      );
    }

    for (const change of report.promotion.changes) {
      if (!change.targetResolvedPath || !change.stagedResolvedPath || !change.stagedRecord) {
        throw new Error(`Change ${change.change_id} is missing file paths required for promotion.`);
      }

      await writeJson(change.targetResolvedPath, change.stagedRecord);
    }

    const timestamp = new Date().toISOString();
    const publicationEventId = `publish-${bundle.id}-${slugTimestamp(timestamp)}`;
    const claimIdsFromChanges = bundle.proposed_changes
      .filter((change) => change.target_record_type === "claim" && nonEmptyString(change.target_record_id))
      .map((change) => change.target_record_id);
    const claimIdsFromImplications = (
      await Promise.all(
        (bundle.proposed_claim_implications ?? []).map((implication) =>
          getClaimIdForSubject(implication.subject_type, implication.subject_id)
        )
      )
    ).filter(Boolean);
    const affectedClaimIds = Array.from(new Set([...claimIdsFromChanges, ...claimIdsFromImplications]));
    const appraisalFollowUpActions = getAppraisalFollowUpActions(report.evidence_appraisal_gate);
    const extractionFollowUpActions = report.workflow_audit.extraction_follow_ups?.actions ?? [];
    const sourceAccessFollowUpActions = report.workflow_audit.source_access?.follow_ups?.actions ?? [];
    const extractionFollowUpSummary =
      extractionFollowUpActions.length > 0
        ? [`Resolve ${extractionFollowUpActions.length} structured extraction follow-up action(s) before quantitative synthesis.`]
        : [];
    const sourceAccessFollowUpSummary =
      sourceAccessFollowUpActions.length > 0
        ? [`Resolve ${sourceAccessFollowUpActions.length} structured source-access follow-up action(s) before synthesis use.`]
        : [];
    const publicationEvent = {
      schema_version: "1.0.0",
      record_type: "publication_event",
      id: publicationEventId,
      name: `Published ${bundle.name}`,
      summary: bundle.summary,
      candidate_bundle_id: bundle.id,
      event_type: "publish",
      published_at: timestamp,
      published_by: options.publishedBy ?? options["published-by"] ?? "local-curator",
      published_targets: bundle.proposed_changes.map((change) => ({
        record_type: change.target_record_type,
        record_id: change.target_record_id ?? change.change_id,
        action: change.change_type === "create_record" ? "created" : "updated"
      })),
      public_graph_delta: buildPublicationDeltaFromChanges(bundle.proposed_changes ?? []),
      affected_claim_ids: affectedClaimIds,
      approving_evidence_appraisal_ids: report.evidence_appraisal_gate.eligible
        ? report.evidence_appraisal_gate.appraisals.map((review) => review.id)
        : undefined,
      review_corrections_applied: report.evidence_appraisal_gate.appraisals.flatMap((review) =>
        Array.isArray(review.corrections_applied) ? review.corrections_applied : []
      ),
      appraisal_follow_up_actions: appraisalFollowUpActions,
      source_access_follow_up_actions: sourceAccessFollowUpActions,
      extraction_follow_up_actions: extractionFollowUpActions,
      change_note:
        bundle.proposed_claim_implications?.[0]?.note ??
        "A reviewed candidate bundle was published to the public evidence graph."
    };

    const publicationEventPath = path.join(publicationEventsRoot, `${publicationEventId}.json`);
    await writeJson(publicationEventPath, publicationEvent);

    const updatedBundle = {
      ...bundle,
      lifecycle_status: "published",
      next_actions: Array.from(
        new Set([
          "Publication complete. Review downstream pages if this change affects shared surfaces.",
          ...appraisalFollowUpActions,
          ...sourceAccessFollowUpSummary,
          ...extractionFollowUpSummary
        ])
      ),
      source_access_follow_up_actions: sourceAccessFollowUpActions,
      extraction_follow_up_actions: extractionFollowUpActions,
      publication_event_ids: Array.from(new Set([...(bundle.publication_event_ids ?? []), publicationEventId]))
    };
    await writeJson(filePath, updatedBundle);

    const planning = await syncResearchPlanning();

    return {
      action: "published",
      bundle_id: bundle.id,
      publication_event_id: publicationEventId,
      publication_event_path: toPosixRelative(publicationEventPath),
      published_targets: publicationEvent.published_targets,
      public_graph_delta: publicationEvent.public_graph_delta,
      affected_claim_ids: affectedClaimIds,
      review_corrections_applied: publicationEvent.review_corrections_applied,
      appraisal_follow_up_actions: appraisalFollowUpActions,
      source_access_follow_up_actions: sourceAccessFollowUpActions,
      extraction_follow_up_actions: extractionFollowUpActions,
      planning
    };
  });
}

async function commandPublish(options) {
  if (!options.bundle) {
    fail("publish requires --bundle <bundle-id>.");
  }

  const result = await publishCandidateBundle(options.bundle, options);
  printJson(result);
}

async function commandSmoke(options) {
  if (!options.bundle) {
    fail("smoke requires --bundle <bundle-id>.");
  }

  const report = await buildBundleReport(options.bundle);
  const issues = [];

  if (report.bundle.lifecycle_status !== "published") {
    issues.push("Smoke checks require a published bundle.");
  }

  if (!report.validation.ready) {
    issues.push(...report.validation.issues);
  }

  printJson({
    bundle_id: report.bundle.id,
    lifecycle_status: report.bundle.lifecycle_status,
    file_checks_ready: report.validation.ready,
    ready: issues.length === 0,
    issues
  });

  if (issues.length > 0) {
    process.exit(1);
  }
}

export {
  addReviewComment,
  approveCandidateBundle,
  buildReadinessSummary,
  buildBundleReport,
  commandAudit,
  commandApprove,
  commandComment,
  commandPrecommit,
  commandPublish,
  commandReject,
  commandRequestChanges,
  commandSmoke,
  commandStatus,
  commandValidate,
  buildPrecommitSummary,
  evaluateEvidenceAppraisalGate,
  evaluatePromotionFiles,
  getCurrentRevision,
  loadCandidateBundle,
  loadEvidenceAppraisals,
  publishCandidateBundle,
  toPublicReport,
  updateCandidateBundleStatus
};
