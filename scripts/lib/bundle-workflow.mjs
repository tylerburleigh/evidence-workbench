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
import { syncResearchPlanning } from "./planning.mjs";

const candidateBundlesRoot = path.join(dataRoot, "candidate-bundles");
const evidenceReviewsRoot = path.join(dataRoot, "evidence-reviews");
const publicationEventsRoot = path.join(dataRoot, "publication-events");
const reviewCommentsRoot = path.join(dataRoot, "review-comments");
const stagedRecordsRoot = path.join(dataRoot, "staged-records");

const recordCollections = {
  source: "sources",
  artifact: "artifacts",
  finding: "findings",
  claim: "claims",
  activity_item: "activity-items",
  search_protocol: "search-protocols"
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
  npm run research:bundle -- validate --bundle <bundle-id>
  npm run research:bundle -- comment --bundle <bundle-id> --comment <text>
  npm run research:bundle -- request-changes --bundle <bundle-id> [--reason <text>]
  npm run research:bundle -- reject --bundle <bundle-id> [--reason <text>]
  npm run research:bundle -- approve --bundle <bundle-id>
  npm run research:bundle -- publish --bundle <bundle-id>
  npm run research:bundle -- smoke --bundle <bundle-id> [--base-url <url>]

Notes:
  - validate checks staged files, record IDs/types, references, support maps, and published-file drift.
  - approve requires a structurally valid bundle and clean evidence-review gates when configured.
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

async function loadEvidenceReviews() {
  return readJsonCollection("data/evidence-reviews");
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

async function evaluateEvidenceReviewGate(bundle, domainPack) {
  const currentRevision = getCurrentRevision(bundle);
  const requiredLanes = bundle.required_review_lanes ?? [];
  const minReviewsPerLane = bundle.review_requirement?.min_complete_reviews_per_lane ?? 1;
  const blockOnOpenCriticalFindings = bundle.review_requirement?.block_on_open_critical_findings ?? true;
  const blockOnOpenMajorFindings = bundle.review_requirement?.block_on_open_major_findings ?? false;
  const reviews = (await loadEvidenceReviews()).filter(
    ({ record }) =>
      record.candidate_bundle_id === bundle.id &&
      record.bundle_revision_number === currentRevision &&
      record.status === "complete"
  );

  const issues = [];
  for (const lane of requiredLanes) {
    if (!domainPack.reviewLaneIds.has(lane)) {
      issues.push(`Required evidence review lane is not defined by the active domain pack: ${lane}.`);
    }
  }

  const laneCounts = new Map();
  for (const { record } of reviews) {
    laneCounts.set(record.review_lane, (laneCounts.get(record.review_lane) ?? 0) + 1);
  }

  const completedLanes = Array.from(laneCounts.keys()).sort();
  const missingLanes = requiredLanes.filter((lane) => (laneCounts.get(lane) ?? 0) < minReviewsPerLane);
  const blockingReviewIds = reviews
    .filter(({ record }) => record.blocking || record.verdict === "needs_revision" || record.verdict === "reject")
    .map(({ record }) => record.id)
    .sort();

  const openBlockingFindings = reviews.flatMap(({ record }) =>
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
        review_id: record.id,
        finding_id: finding.finding_id,
        severity: finding.severity,
        category: finding.category
      }))
  );

  if (missingLanes.length > 0) {
    issues.push(`Missing complete evidence review lanes for revision ${currentRevision}: ${missingLanes.join(", ")}.`);
  }

  if (blockingReviewIds.length > 0) {
    issues.push(`Blocking evidence reviews remain open for revision ${currentRevision}.`);
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
    min_complete_reviews_per_lane: minReviewsPerLane,
    completed_reviews: reviews
      .map(({ record }) => ({
        id: record.id,
        lane: record.review_lane,
        round: record.review_round,
        verdict: record.verdict,
        blocking: record.blocking
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    missing_lanes: missingLanes,
    blocking_review_ids: blockingReviewIds,
    open_blocking_findings: openBlockingFindings,
    issues,
    reviews: reviews.map(({ record }) => record)
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

    if (bundle.lifecycle_status === "published" && targetExists && targetResolvedPath) {
      liveRecord = await readJson(targetResolvedPath);
      if (stagedRecord && JSON.stringify(liveRecord) !== JSON.stringify(stagedRecord)) {
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
      stagedRecord,
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
    publication_events: publicationEvents.map((event) => ({
      id: event.id,
      published_at: event.published_at,
      published_targets: event.published_targets?.length ?? 0,
      affected_claim_ids: event.affected_claim_ids ?? []
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
  const evidenceReviewGate = await evaluateEvidenceReviewGate(bundle, domainPack);
  const publication = await evaluatePublication(bundle, promotion);

  issues.push(...promotion.issues, ...stagedSemantics.issues, ...publication.issues);
  warnings.push(...promotion.warnings, ...stagedSemantics.warnings, ...publication.warnings);

  if (["approved", "published"].includes(bundle.lifecycle_status) && evidenceReviewGate.eligible && !evidenceReviewGate.ready) {
    issues.push(...evidenceReviewGate.issues);
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
    evidence_review_gate: evidenceReviewGate,
    publication
  };
}

function toPublicReport(report) {
  return {
    bundle_id: report.bundle.id,
    lifecycle_status: report.bundle.lifecycle_status,
    revision_number: getCurrentRevision(report.bundle),
    validation: report.validation,
    evidence_review_gate: {
      eligible: report.evidence_review_gate.eligible,
      ready: report.evidence_review_gate.ready,
      revision_number: report.evidence_review_gate.revision_number,
      required_lanes: report.evidence_review_gate.required_lanes,
      completed_lanes: report.evidence_review_gate.completed_lanes,
      min_complete_reviews_per_lane: report.evidence_review_gate.min_complete_reviews_per_lane,
      completed_reviews: report.evidence_review_gate.completed_reviews,
      missing_lanes: report.evidence_review_gate.missing_lanes,
      blocking_review_ids: report.evidence_review_gate.blocking_review_ids,
      open_blocking_findings: report.evidence_review_gate.open_blocking_findings,
      issues: report.evidence_review_gate.issues
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
        ready: change.ready,
        issues: change.issues,
        warnings: change.warnings
      }))
    },
    publication: report.publication
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

    if (report.evidence_review_gate.eligible && !report.evidence_review_gate.ready) {
      throw new Error(
        `Candidate bundle ${latestBundle.id} is not ready for approval: ${report.evidence_review_gate.issues.join(" ")}`
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
    const commentId = `review-comment-${latestBundle.id}-${slugTimestamp(timestamp)}`;
    const comment = {
      schema_version: "1.0.0",
      record_type: "review_comment",
      id: commentId,
      candidate_bundle_id: latestBundle.id,
      author_kind: options.authorKind ?? "human",
      author_id: options.authorId ?? "local-curator",
      body,
      created_at: timestamp
    };

    const commentPath = path.join(reviewCommentsRoot, `${commentId}.json`);
    await writeJson(commentPath, comment);

    const updatedBundle = {
      ...latestBundle,
      review_comment_ids: Array.from(new Set([...(latestBundle.review_comment_ids ?? []), commentId]))
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

    if (report.evidence_review_gate.eligible && !report.evidence_review_gate.ready) {
      throw new Error(
        `Candidate bundle ${bundle.id} is blocked by evidence review: ${report.evidence_review_gate.issues.join(" ")}`
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
      affected_claim_ids: affectedClaimIds,
      approving_evidence_review_ids: report.evidence_review_gate.eligible
        ? report.evidence_review_gate.reviews.map((review) => review.id)
        : undefined,
      change_note:
        bundle.proposed_claim_implications?.[0]?.note ??
        "A reviewed candidate bundle was published to the public evidence graph."
    };

    const publicationEventPath = path.join(publicationEventsRoot, `${publicationEventId}.json`);
    await writeJson(publicationEventPath, publicationEvent);

    const updatedBundle = {
      ...bundle,
      lifecycle_status: "published",
      next_actions: ["Publication complete. Review downstream pages if this change affects shared surfaces."],
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
      affected_claim_ids: affectedClaimIds,
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
  buildBundleReport,
  commandApprove,
  commandComment,
  commandPublish,
  commandReject,
  commandRequestChanges,
  commandSmoke,
  commandStatus,
  commandValidate,
  evaluateEvidenceReviewGate,
  evaluatePromotionFiles,
  getCurrentRevision,
  loadCandidateBundle,
  loadEvidenceReviews,
  publishCandidateBundle,
  toPublicReport,
  updateCandidateBundleStatus
};
