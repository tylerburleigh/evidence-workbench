#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  readJson,
  schemasRoot,
  toPosixRelative,
  walkJsonFiles,
  workspaceRoot
} from "./lib/workspace.mjs";

const validationRoots = ["data", "domain-packs", "research"];

const schemaByRecordType = {
  activity_item: "core/activity-item.schema.json",
  artifact: "core/artifact.schema.json",
  candidate_bundle: "core/candidate-bundle.schema.json",
  claim: "core/claim.schema.json",
  evidence_review: "core/evidence-review.schema.json",
  finding: "core/finding.schema.json",
  publication_event: "core/publication-event.schema.json",
  report_artifact: "core/report-artifact.schema.json",
  research_session: "core/research-session.schema.json",
  review_comment: "core/review-comment.schema.json",
  search_protocol: "core/search-protocol.schema.json",
  source: "core/source.schema.json"
};

const schemaByStateType = {
  coverage_status: "core/coverage-status.schema.json"
};

const schemaByQueueType = {
  research_priority_queue: "core/priority-queue.schema.json"
};

const schemaByDomainPackFile = {
  "domain.json": "core/domain.schema.json",
  "taxonomy.v1.json": "core/taxonomy.schema.json",
  "evidence-ladder.v1.json": "core/evidence-ladder.schema.json",
  "extraction-schema.v1.json": "core/extraction-schema.schema.json",
  "review-lanes.v1.json": "core/review-lanes.schema.json",
  "public-copy.v1.json": "core/public-copy.schema.json"
};

const recordCollections = {
  source: "sources",
  artifact: "artifacts",
  finding: "findings",
  claim: "claims",
  activity_item: "activity-items",
  report_artifact: "report-artifacts",
  search_protocol: "search-protocols"
};

const extractionRecordTypes = new Set(["artifact", "finding", "claim", "search_protocol"]);

async function loadSchemas() {
  const schemaFiles = await walkJsonFiles(schemasRoot);
  return Promise.all(
    schemaFiles.map(async (filePath) => ({
      schemaId: toPosixRelative(filePath).replace(/^schemas\//, ""),
      schema: await readJson(filePath)
    }))
  );
}

function getDomainPackSchemaId(relativePath) {
  if (!relativePath.startsWith("domain-packs/")) {
    return undefined;
  }

  const fileName = path.basename(relativePath);
  return schemaByDomainPackFile[fileName];
}

function getSchemaId(relativePath, value) {
  return (
    getDomainPackSchemaId(relativePath) ??
    schemaByRecordType[value?.record_type] ??
    schemaByStateType[value?.state_type] ??
    schemaByQueueType[value?.queue_type]
  );
}

function formatError(error) {
  const location = error.instancePath || "/";
  const property = error.params?.additionalProperty ? ` (${error.params.additionalProperty})` : "";
  return `${location} ${error.message}${property}`;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getDomainPackDirectory(relativePath) {
  const parts = relativePath.split("/");
  return parts[0] === "domain-packs" ? parts[1] : undefined;
}

function addIssueForMissingReference(issues, relativePath, field, value, targetLabel) {
  if (!nonEmptyString(value)) {
    issues.push(`${relativePath}: ${field} must be a non-empty ${targetLabel} id.`);
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

function getExpectedTargetPath(recordType, recordId) {
  const collection = recordCollections[recordType];
  return collection && recordId ? `data/${collection}/${recordId}.json` : undefined;
}

function isPathUnder(prefix, relativePath) {
  return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
}

function addDomainNodeChecks({ issues, relativePath, domainId, nodeIds, domainIds, nodeDomainById }) {
  if (!nonEmptyString(domainId)) {
    issues.push(`${relativePath}: scope.domain_id is required for taxonomy-scoped records.`);
    return;
  }

  if (!domainIds.has(domainId)) {
    issues.push(`${relativePath}: references unknown domain_id: ${domainId}.`);
    return;
  }

  if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
    issues.push(`${relativePath}: scope.taxonomy_node_ids must contain at least one taxonomy node id.`);
    return;
  }

  for (const nodeId of nodeIds) {
    const nodeDomainId = nodeDomainById.get(nodeId);
    if (!nodeDomainId) {
      issues.push(`${relativePath}: references unknown taxonomy_node_id: ${nodeId}.`);
    } else if (nodeDomainId !== domainId) {
      issues.push(`${relativePath}: taxonomy_node_id ${nodeId} belongs to ${nodeDomainId}, not ${domainId}.`);
    }
  }
}

function validateDomainPackContracts(entries, issues) {
  const domainIds = new Set();
  const reviewLaneIdsByDomain = new Map();
  const nodeIdsByDomain = new Map();
  const nodeDomainById = new Map();
  const requiredExtractionFieldsByDomain = new Map();
  const applicabilityFacetsByDomain = new Map();

  for (const { relativePath, value } of entries) {
    const directory = getDomainPackDirectory(relativePath);
    if (!directory) {
      continue;
    }

    const fileName = path.basename(relativePath);
    if (fileName === "domain.json") {
      if (value.id !== directory) {
        issues.push(`${relativePath}: domain id must match directory name ${directory}.`);
      }
      domainIds.add(value.id);
    } else if (nonEmptyString(value.domain_id) && value.domain_id !== directory) {
      issues.push(`${relativePath}: domain_id must match directory name ${directory}.`);
    }

    if (fileName === "taxonomy.v1.json") {
      const nodeIds = new Set();
      for (const node of value.nodes ?? []) {
        if (nodeDomainById.has(node.id)) {
          issues.push(`${relativePath}: taxonomy node id is duplicated across domain packs: ${node.id}.`);
        }
        nodeIds.add(node.id);
        nodeDomainById.set(node.id, directory);
      }
      nodeIdsByDomain.set(directory, nodeIds);
    }

    if (fileName === "review-lanes.v1.json") {
      reviewLaneIdsByDomain.set(directory, new Set((value.lanes ?? []).map((lane) => lane.id)));
    }

    if (fileName === "domain.json") {
      const facets = [];
      for (const facet of value.applicability_facets ?? []) {
        const appliesTo = Array.isArray(facet.applies_to) ? facet.applies_to : [];
        if (appliesTo.length === 0) {
          issues.push(`${relativePath}: applicability facet ${facet.id} must declare applies_to[].`);
        }

        for (const recordType of appliesTo) {
          if (!extractionRecordTypes.has(recordType)) {
            issues.push(`${relativePath}: applicability facet ${facet.id} applies_to unsupported record type: ${recordType}.`);
          }
        }

        facets.push({
          id: facet.id,
          label: facet.label ?? facet.id,
          appliesTo: new Set(appliesTo),
          allowedValues: new Set((facet.values ?? []).map((option) => option.id))
        });
      }
      applicabilityFacetsByDomain.set(directory, facets);
    }

    if (fileName === "extraction-schema.v1.json" && value.validation?.enforce_required_fields) {
      const requiredFields = [];
      for (const field of value.fields ?? []) {
        if (!field.required) {
          continue;
        }

        const appliesTo = Array.isArray(field.applies_to) ? field.applies_to : [];
        if (appliesTo.length === 0) {
          issues.push(`${relativePath}: required field ${field.id} must declare applies_to[] when required-field validation is enforced.`);
        }

        for (const recordType of appliesTo) {
          if (!extractionRecordTypes.has(recordType)) {
            issues.push(`${relativePath}: field ${field.id} applies_to unsupported record type: ${recordType}.`);
          }
        }

        requiredFields.push({
          id: field.id,
          label: field.label ?? field.id,
          appliesTo: new Set(appliesTo)
        });
      }
      requiredExtractionFieldsByDomain.set(directory, requiredFields);
    }
  }

  for (const { relativePath, value } of entries) {
    if (!relativePath.endsWith("/domain.json")) {
      continue;
    }

    const directory = getDomainPackDirectory(relativePath);
    const nodeIds = nodeIdsByDomain.get(directory) ?? new Set();
    const reviewLaneIds = reviewLaneIdsByDomain.get(directory) ?? new Set();

    if (![...nodeIds].length) {
      issues.push(`${relativePath}: domain pack must define at least one taxonomy node.`);
    }

    if (![...nodeIds].some((nodeId) => {
      const taxonomy = entries.find((entry) => entry.relativePath === `domain-packs/${directory}/taxonomy.v1.json`)?.value;
      return (taxonomy?.nodes ?? []).some((node) => node.id === nodeId && node.node_type === value.default_scope_unit);
    })) {
      issues.push(`${relativePath}: default_scope_unit has no matching taxonomy nodes: ${value.default_scope_unit}.`);
    }

    for (const laneId of value.default_review_lanes ?? []) {
      if (!reviewLaneIds.has(laneId)) {
        issues.push(`${relativePath}: default_review_lanes references unknown review lane: ${laneId}.`);
      }
    }
  }

  return {
    domainIds,
    reviewLaneIdsByDomain,
    nodeIdsByDomain,
    nodeDomainById,
    requiredExtractionFieldsByDomain,
    applicabilityFacetsByDomain
  };
}

function buildRecordIndexes(entries) {
  const recordsByType = new Map();
  const recordByTypeAndId = new Map();
  const valueByRelativePath = new Map(entries.map((entry) => [entry.relativePath, entry.value]));

  for (const entry of entries) {
    const recordType = entry.value?.record_type;
    if (!nonEmptyString(recordType)) {
      continue;
    }

    if (!recordsByType.has(recordType)) {
      recordsByType.set(recordType, []);
      recordByTypeAndId.set(recordType, new Map());
    }

    recordsByType.get(recordType).push(entry);
    if (nonEmptyString(entry.value.id)) {
      recordByTypeAndId.get(recordType).set(entry.value.id, entry);
    }
  }

  return { recordsByType, recordByTypeAndId, valueByRelativePath };
}

function hasRecord(recordByTypeAndId, recordType, recordId) {
  return nonEmptyString(recordId) && Boolean(recordByTypeAndId.get(recordType)?.has(recordId));
}

function validateExtractionFollowUpActions(actions, context, issues, relativePath) {
  for (const [index, action] of (actions ?? []).entries()) {
    const label = `extraction_follow_up_actions[${index}]`;
    if (action.target_record_type && action.target_record_id) {
      if (!hasRecord(context.recordByTypeAndId, action.target_record_type, action.target_record_id)) {
        issues.push(
          `${relativePath}: ${label} references missing target ${action.target_record_type}:${action.target_record_id}.`
        );
      }
    }

    for (const sourceId of action.source_ids ?? []) {
      if (!hasRecord(context.recordByTypeAndId, "source", sourceId)) {
        issues.push(`${relativePath}: ${label} references missing source_id: ${sourceId}.`);
      }
    }

    if (action.artifact_id && !hasRecord(context.recordByTypeAndId, "artifact", action.artifact_id)) {
      issues.push(`${relativePath}: ${label} references missing artifact_id: ${action.artifact_id}.`);
    }

    if (action.finding_id && !hasRecord(context.recordByTypeAndId, "finding", action.finding_id)) {
      issues.push(`${relativePath}: ${label} references missing finding_id: ${action.finding_id}.`);
    }

    for (const nodeId of action.taxonomy_node_ids ?? []) {
      if (!context.nodeDomainById.has(nodeId)) {
        issues.push(`${relativePath}: ${label} references unknown taxonomy_node_id: ${nodeId}.`);
      }
    }
  }
}

function validateCandidateBundle(entry, context, issues) {
  const { value: bundle, relativePath } = entry;
  const domainId = bundle.scope?.domain_id;
  addDomainNodeChecks({
    issues,
    relativePath,
    domainId,
    nodeIds: bundle.scope?.taxonomy_node_ids,
    domainIds: context.domainIds,
    nodeDomainById: context.nodeDomainById
  });

  const reviewLaneIds = context.reviewLaneIdsByDomain.get(domainId) ?? new Set();
  for (const laneId of bundle.required_review_lanes ?? []) {
    if (!reviewLaneIds.has(laneId)) {
      issues.push(`${relativePath}: required_review_lanes references unknown lane for ${domainId}: ${laneId}.`);
    }
  }

  const seenChangeIds = new Set();
  for (const change of bundle.proposed_changes ?? []) {
    if (seenChangeIds.has(change.change_id)) {
      issues.push(`${relativePath}: duplicate proposed change id: ${change.change_id}.`);
    }
    seenChangeIds.add(change.change_id);

    const expectedTargetPath = getExpectedTargetPath(change.target_record_type, change.target_record_id);
    if (!expectedTargetPath) {
      issues.push(`${relativePath}: change ${change.change_id} has unsupported target record type: ${change.target_record_type}.`);
    } else if (change.file_path && change.file_path !== expectedTargetPath) {
      issues.push(`${relativePath}: change ${change.change_id} file_path must be ${expectedTargetPath}.`);
    }

    if (!nonEmptyString(change.staged_file_path)) {
      issues.push(`${relativePath}: change ${change.change_id} must define staged_file_path.`);
      continue;
    }

    const stagedPrefix = `data/staged-records/${bundle.id}`;
    if (!isPathUnder(stagedPrefix, change.staged_file_path)) {
      issues.push(`${relativePath}: change ${change.change_id} staged_file_path must stay under ${stagedPrefix}/.`);
    }

    const stagedRecord = context.valueByRelativePath.get(change.staged_file_path);
    if (!stagedRecord) {
      issues.push(`${relativePath}: change ${change.change_id} staged file is missing: ${change.staged_file_path}.`);
      continue;
    }

    if (stagedRecord.record_type !== change.target_record_type) {
      issues.push(`${relativePath}: change ${change.change_id} staged record_type must be ${change.target_record_type}.`);
    }

    if (stagedRecord.id !== change.target_record_id) {
      issues.push(`${relativePath}: change ${change.change_id} staged record id must be ${change.target_record_id}.`);
    }
  }

  validateExtractionFollowUpActions(bundle.extraction_follow_up_actions, context, issues, relativePath);
}

function validateArtifact(entry, context, issues) {
  const { value: artifact, relativePath } = entry;
  for (const sourceId of artifact.source_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "source", sourceId)) {
      issues.push(`${relativePath}: references missing source_id: ${sourceId}.`);
    }
  }

  for (const nodeId of artifact.taxonomy_node_ids ?? []) {
    if (!context.nodeDomainById.has(nodeId)) {
      issues.push(`${relativePath}: references unknown taxonomy_node_id: ${nodeId}.`);
    }
  }

  validateRequiredExtractionFields(entry, context, issues);
}

function validateFinding(entry, context, issues) {
  const { value: finding, relativePath } = entry;
  if (!hasRecord(context.recordByTypeAndId, "source", finding.source_id)) {
    issues.push(`${relativePath}: references missing source_id: ${finding.source_id}.`);
  }

  if (finding.artifact_id && !hasRecord(context.recordByTypeAndId, "artifact", finding.artifact_id)) {
    issues.push(`${relativePath}: references missing artifact_id: ${finding.artifact_id}.`);
  }

  for (const nodeId of finding.taxonomy_node_ids ?? []) {
    if (!context.nodeDomainById.has(nodeId)) {
      issues.push(`${relativePath}: references unknown taxonomy_node_id: ${nodeId}.`);
    }
  }

  validateRequiredExtractionFields(entry, context, issues);
}

function validateClaim(entry, context, issues) {
  const { value: claim, relativePath } = entry;
  if (claim.subject_type === "taxonomy_node" && !context.nodeDomainById.has(claim.subject_id)) {
    issues.push(`${relativePath}: references unknown subject taxonomy node: ${claim.subject_id}.`);
  }

  if (claim.subject_type === "taxonomy_node" && (!Array.isArray(claim.limitations) || claim.limitations.length === 0)) {
    issues.push(`${relativePath}: taxonomy-node claims must include limitations[].`);
  }

  for (const findingId of claim.supporting_finding_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "finding", findingId)) {
      issues.push(`${relativePath}: references missing supporting_finding_id: ${findingId}.`);
    }
  }

  for (const sourceId of claim.supporting_source_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "source", sourceId)) {
      issues.push(`${relativePath}: references missing supporting_source_id: ${sourceId}.`);
    }
  }

  for (const [index, support] of (claim.supporting_evidence ?? []).entries()) {
    for (const findingId of support.finding_ids ?? []) {
      if (!hasRecord(context.recordByTypeAndId, "finding", findingId)) {
        issues.push(`${relativePath}: supporting_evidence[${index}] references missing finding_id: ${findingId}.`);
      }
    }

    for (const sourceId of support.source_ids ?? []) {
      if (!hasRecord(context.recordByTypeAndId, "source", sourceId)) {
        issues.push(`${relativePath}: supporting_evidence[${index}] references missing source_id: ${sourceId}.`);
      }
    }
  }

  validateRequiredExtractionFields(entry, context, issues);
}

function getRecordDomainIds(record, context) {
  const domainIds = new Set();

  if (record.record_type === "search_protocol" && nonEmptyString(record.domain_id)) {
    domainIds.add(record.domain_id);
  }

  for (const nodeId of record.taxonomy_node_ids ?? []) {
    const domainId = context.nodeDomainById.get(nodeId);
    if (domainId) {
      domainIds.add(domainId);
    }
  }

  if (record.subject_type === "taxonomy_node") {
    const domainId = context.nodeDomainById.get(record.subject_id);
    if (domainId) {
      domainIds.add(domainId);
    }
  }

  return domainIds;
}

function validateRequiredExtractionFields(entry, context, issues) {
  const { value: record, relativePath } = entry;
  const recordType = record.record_type;
  if (!extractionRecordTypes.has(recordType)) {
    return;
  }

  for (const domainId of getRecordDomainIds(record, context)) {
    const requiredFields = context.requiredExtractionFieldsByDomain.get(domainId) ?? [];
    for (const field of requiredFields) {
      if (field.appliesTo.has(recordType) && !hasRequiredValue(record[field.id])) {
        issues.push(`${relativePath}: ${recordType} for ${domainId} is missing required extraction field ${field.id} (${field.label}).`);
      }
    }
  }

  validateApplicabilityFacets(entry, context, issues);
}

function validateApplicabilityFacets(entry, context, issues) {
  const { value: record, relativePath } = entry;
  const recordType = record.record_type;
  if (!extractionRecordTypes.has(recordType)) {
    return;
  }

  for (const domainId of getRecordDomainIds(record, context)) {
    const facets = context.applicabilityFacetsByDomain.get(domainId) ?? [];
    for (const facet of facets) {
      if (!facet.appliesTo.has(recordType) || facet.allowedValues.size === 0) {
        continue;
      }

      for (const value of valueList(record[facet.id])) {
        if (!facet.allowedValues.has(value)) {
          issues.push(
            `${relativePath}: ${recordType} for ${domainId} has unsupported applicability facet ${facet.id} value: ${value}.`
          );
        }
      }
    }
  }
}

function validateSearchProtocol(entry, context, issues) {
  const { value: protocol, relativePath } = entry;
  addDomainNodeChecks({
    issues,
    relativePath,
    domainId: protocol.domain_id,
    nodeIds: protocol.taxonomy_node_ids,
    domainIds: context.domainIds,
    nodeDomainById: context.nodeDomainById
  });

  for (const sourceId of protocol.source_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "source", sourceId)) {
      issues.push(`${relativePath}: references missing source_id: ${sourceId}.`);
    }
  }

  for (const [index, decision] of (protocol.screening_decisions ?? []).entries()) {
    if (decision.source_id && !hasRecord(context.recordByTypeAndId, "source", decision.source_id)) {
      issues.push(`${relativePath}: screening_decisions[${index}] references missing source_id: ${decision.source_id}.`);
    }
  }

  validateRequiredExtractionFields(entry, context, issues);
}

function validateReportArtifact(entry, context, issues) {
  const { value: report, relativePath } = entry;
  addDomainNodeChecks({
    issues,
    relativePath,
    domainId: report.domain_id,
    nodeIds: report.scope_ids,
    domainIds: context.domainIds,
    nodeDomainById: context.nodeDomainById
  });

  if (!isPathUnder("research/syntheses", report.path) || !report.path.endsWith(".md")) {
    issues.push(`${relativePath}: path must point to a Markdown file under research/syntheses/.`);
    return;
  }

  const markdownPath = path.join(workspaceRoot, report.path);
  if (!fs.existsSync(markdownPath)) {
    issues.push(`${relativePath}: path does not exist: ${report.path}.`);
    return;
  }

  const markdown = fs.readFileSync(markdownPath, "utf8");

  for (const sourceId of report.source_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "source", sourceId)) {
      issues.push(`${relativePath}: references missing source_id: ${sourceId}.`);
    } else if (!markdown.includes(sourceId)) {
      issues.push(`${relativePath}: source_id is not traceable in Markdown content: ${sourceId}.`);
    }
  }

  for (const claimId of report.claim_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "claim", claimId)) {
      issues.push(`${relativePath}: references missing claim_id: ${claimId}.`);
    } else if (!markdown.includes(claimId)) {
      issues.push(`${relativePath}: claim_id is not traceable in Markdown content: ${claimId}.`);
    }
  }

  for (const findingId of report.finding_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "finding", findingId)) {
      issues.push(`${relativePath}: references missing finding_id: ${findingId}.`);
    } else if (!markdown.includes(findingId)) {
      issues.push(`${relativePath}: finding_id is not traceable in Markdown content: ${findingId}.`);
    }
  }

  for (const eventId of report.publication_event_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "publication_event", eventId)) {
      issues.push(`${relativePath}: references missing publication_event_id: ${eventId}.`);
    } else if (!markdown.includes(eventId)) {
      issues.push(`${relativePath}: publication_event_id is not traceable in Markdown content: ${eventId}.`);
    }
  }
}

function normalizeScopeIds(scopeIds) {
  return [...new Set(scopeIds ?? [])].sort((left, right) => left.localeCompare(right));
}

function getCurrentReportKey(report) {
  const scopeKey = normalizeScopeIds(report.scope_ids).join(",");
  return `${report.domain_id}|${report.artifact_type}|${scopeKey}`;
}

function formatCurrentReportKey(report) {
  const scopeKey = normalizeScopeIds(report.scope_ids).join(", ");
  return `${report.domain_id}/${report.artifact_type}/[${scopeKey}]`;
}

function validateCurrentReportArtifactUniqueness(entries, issues) {
  const currentReportsByKey = new Map();

  for (const entry of entries) {
    const { value: report, relativePath } = entry;
    if (
      report?.record_type !== "report_artifact" ||
      report.status !== "current" ||
      !isPathUnder("data/report-artifacts", relativePath)
    ) {
      continue;
    }

    const key = getCurrentReportKey(report);
    const existing = currentReportsByKey.get(key);
    if (existing) {
      issues.push(
        `${relativePath}: duplicate current report_artifact for ${formatCurrentReportKey(report)}; already defined by ${existing.relativePath}.`
      );
    } else {
      currentReportsByKey.set(key, entry);
    }
  }
}

function validateEvidenceReview(entry, context, issues) {
  const { value: review, relativePath } = entry;
  const bundleEntry = context.recordByTypeAndId.get("candidate_bundle")?.get(review.candidate_bundle_id);
  if (!bundleEntry) {
    issues.push(`${relativePath}: references missing candidate_bundle_id: ${review.candidate_bundle_id}.`);
    return;
  }

  const bundle = bundleEntry.value;
  const domainId = bundle.scope?.domain_id;
  const reviewLaneIds = context.reviewLaneIdsByDomain.get(domainId) ?? new Set();
  if (!reviewLaneIds.has(review.review_lane)) {
    issues.push(`${relativePath}: review_lane ${review.review_lane} is not defined for domain ${domainId}.`);
  }

  if (review.bundle_revision_number !== (bundle.revision_number ?? 1)) {
    issues.push(`${relativePath}: bundle_revision_number must match candidate bundle revision.`);
  }

  const validChangeIds = new Set((bundle.proposed_changes ?? []).map((change) => change.change_id));
  for (const changeId of review.reviewed_change_ids ?? []) {
    if (!validChangeIds.has(changeId)) {
      issues.push(`${relativePath}: reviewed_change_ids references unknown change_id: ${changeId}.`);
    }
  }
}

function validateResearchSession(entry, context, issues) {
  const { value: session, relativePath } = entry;
  addDomainNodeChecks({
    issues,
    relativePath,
    domainId: session.scope?.domain_id,
    nodeIds: session.scope?.taxonomy_node_ids,
    domainIds: context.domainIds,
    nodeDomainById: context.nodeDomainById
  });

  if (session.candidate_bundle_id && !hasRecord(context.recordByTypeAndId, "candidate_bundle", session.candidate_bundle_id)) {
    issues.push(`${relativePath}: references missing candidate_bundle_id: ${session.candidate_bundle_id}.`);
  }
}

function validatePublicationEvent(entry, context, issues) {
  const { value: event, relativePath } = entry;
  if (!hasRecord(context.recordByTypeAndId, "candidate_bundle", event.candidate_bundle_id)) {
    issues.push(`${relativePath}: references missing candidate_bundle_id: ${event.candidate_bundle_id}.`);
  }

  for (const reviewId of event.approving_evidence_review_ids ?? []) {
    if (!hasRecord(context.recordByTypeAndId, "evidence_review", reviewId)) {
      issues.push(`${relativePath}: references missing approving_evidence_review_id: ${reviewId}.`);
    }
  }

  for (const target of event.published_targets ?? []) {
    if (!hasRecord(context.recordByTypeAndId, target.record_type, target.record_id)) {
      issues.push(`${relativePath}: published target is missing: ${target.record_type}:${target.record_id}.`);
    }
  }

  validateExtractionFollowUpActions(event.extraction_follow_up_actions, context, issues, relativePath);
}

function validateCrossReferences(entries) {
  const issues = [];
  const domainContext = validateDomainPackContracts(entries, issues);
  const recordContext = buildRecordIndexes(entries);
  const context = { ...domainContext, ...recordContext };

  for (const entry of entries) {
    switch (entry.value?.record_type) {
      case "candidate_bundle":
        validateCandidateBundle(entry, context, issues);
        break;
      case "artifact":
        validateArtifact(entry, context, issues);
        break;
      case "finding":
        validateFinding(entry, context, issues);
        break;
      case "claim":
        validateClaim(entry, context, issues);
        break;
      case "evidence_review":
        validateEvidenceReview(entry, context, issues);
        break;
      case "research_session":
        validateResearchSession(entry, context, issues);
        break;
      case "publication_event":
        validatePublicationEvent(entry, context, issues);
        break;
      case "search_protocol":
        validateSearchProtocol(entry, context, issues);
        break;
      case "report_artifact":
        validateReportArtifact(entry, context, issues);
        break;
      default:
        break;
    }
  }

  validateCurrentReportArtifactUniqueness(entries, issues);

  return issues;
}

async function main() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: true
  });
  addFormats(ajv);

  const schemas = await loadSchemas();
  for (const { schemaId, schema } of schemas) {
    ajv.addSchema(schema, schema.$id ?? schemaId);
    if (schema.$id && schema.$id !== schemaId) {
      ajv.addSchema(schema, schemaId);
    }
  }

  const files = (
    await Promise.all(validationRoots.map((root) => walkJsonFiles(path.join(workspaceRoot, root))))
  )
    .flat()
    .sort((left, right) => toPosixRelative(left).localeCompare(toPosixRelative(right)));

  const issues = [];
  const usedSchemaIds = new Set();
  const parsedEntries = [];

  for (const filePath of files) {
    const relativePath = toPosixRelative(filePath);
    let value;

    try {
      value = await readJson(filePath);
    } catch (error) {
      issues.push(`${relativePath}: invalid JSON: ${error.message}`);
      continue;
    }

    const schemaId = getSchemaId(relativePath, value);
    if (!schemaId) {
      issues.push(`${relativePath}: no schema mapping for JSON file.`);
      continue;
    }

    const validate = ajv.getSchema(schemaId);
    if (!validate) {
      issues.push(`${relativePath}: schema not loaded: ${schemaId}.`);
      continue;
    }

    usedSchemaIds.add(schemaId);
    parsedEntries.push({ relativePath, value });

    if (!validate(value)) {
      for (const error of validate.errors ?? []) {
        issues.push(`${relativePath}: ${formatError(error)}`);
      }
    }
  }

  if (issues.length === 0) {
    issues.push(...validateCrossReferences(parsedEntries));
  }

  if (issues.length > 0) {
    process.stderr.write(`Record validation failed with ${issues.length} issue(s):\n`);
    for (const issue of issues) {
      process.stderr.write(`- ${issue}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(`Validated ${files.length} JSON files against ${usedSchemaIds.size} schema mappings.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exit(1);
});
