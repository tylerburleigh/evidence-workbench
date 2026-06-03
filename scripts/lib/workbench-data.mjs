import path from "node:path";
import {
  fileExists,
  loadActiveDomainPack,
  loadDomainPack,
  readJson,
  readJsonCollection,
  workspaceRoot
} from "./workspace.mjs";
import { buildBundleReport, toPublicReport } from "./bundle-workflow.mjs";

const collectionPaths = {
  sources: "data/sources",
  artifacts: "data/artifacts",
  findings: "data/findings",
  claims: "data/claims",
  activityItems: "data/activity-items",
  candidateBundles: "data/candidate-bundles",
  evidenceReviews: "data/evidence-reviews",
  reviewComments: "data/review-comments",
  publicationEvents: "data/publication-events",
  researchSessions: "research/sessions",
  searchProtocols: "data/search-protocols",
  reportArtifacts: "data/report-artifacts"
};

function hasAnyTaxonomyNode(record, taxonomyNodeIds) {
  return (record.taxonomy_node_ids ?? []).some((nodeId) => taxonomyNodeIds.has(nodeId));
}

function claimBelongsToDomain(claim, taxonomyNodeIds) {
  if (claim.subject_type === "taxonomy_node" && taxonomyNodeIds.has(claim.subject_id)) {
    return true;
  }

  return hasAnyTaxonomyNode(claim, taxonomyNodeIds);
}

function collectDomainSourceIds({ artifacts, findings, claims, candidateBundles, searchProtocols, reportArtifacts }) {
  const sourceIds = new Set();

  for (const artifact of artifacts) {
    for (const sourceId of artifact.record.source_ids ?? []) {
      sourceIds.add(sourceId);
    }
  }

  for (const finding of findings) {
    if (finding.record.source_id) {
      sourceIds.add(finding.record.source_id);
    }
  }

  for (const claim of claims) {
    for (const sourceId of claim.record.supporting_source_ids ?? []) {
      sourceIds.add(sourceId);
    }
    for (const support of claim.record.supporting_evidence ?? []) {
      for (const sourceId of support.source_ids ?? []) {
        sourceIds.add(sourceId);
      }
    }
  }

  for (const bundle of candidateBundles) {
    for (const sourceId of bundle.record.source_ids ?? []) {
      sourceIds.add(sourceId);
    }
  }

  for (const protocol of searchProtocols) {
    for (const sourceId of protocol.record.source_ids ?? []) {
      sourceIds.add(sourceId);
    }
    for (const decision of protocol.record.screening_decisions ?? []) {
      if (decision.source_id) {
        sourceIds.add(decision.source_id);
      }
    }
  }

  for (const report of reportArtifacts) {
    for (const sourceId of report.record.source_ids ?? []) {
      sourceIds.add(sourceId);
    }
  }

  return sourceIds;
}

async function readOptionalJson(relativePath) {
  const filePath = path.join(workspaceRoot, relativePath);
  if (!(await fileExists(filePath))) {
    return undefined;
  }

  return readJson(filePath);
}

export async function loadRecordCollections() {
  const entries = await Promise.all(
    Object.entries(collectionPaths).map(async ([key, collectionPath]) => [key, await readJsonCollection(collectionPath)])
  );

  return Object.fromEntries(entries);
}

export async function loadPlanningState(domainId) {
  const [coverageStatus, priorityQueue] = await Promise.all([
    readOptionalJson("research/state/coverage-status.v1.json"),
    readOptionalJson("research/backlog/priority-queue.v1.json")
  ]);

  return {
    coverageStatus: coverageStatus?.domain_id === domainId ? coverageStatus : undefined,
    priorityQueue: priorityQueue?.domain_id === domainId ? priorityQueue : undefined
  };
}

export async function loadBundleReportsForDomain(domainPack, collections) {
  const candidateBundles = collections.candidateBundles.filter(
    ({ record }) => record.scope?.domain_id === domainPack.domain.id
  );

  return Promise.all(
    candidateBundles.map(async ({ record }) => toPublicReport(await buildBundleReport(record, { domainPack })))
  );
}

export async function loadDomainWorkbenchData(options = {}) {
  const domainPack = options.domainId ? await loadDomainPack(options.domainId) : await loadActiveDomainPack();
  const taxonomyNodeIds = domainPack.taxonomyNodeIds;
  const collections = await loadRecordCollections();

  const artifacts = collections.artifacts.filter(({ record }) => hasAnyTaxonomyNode(record, taxonomyNodeIds));
  const findings = collections.findings.filter(({ record }) => hasAnyTaxonomyNode(record, taxonomyNodeIds));
  const claims = collections.claims.filter(({ record }) => claimBelongsToDomain(record, taxonomyNodeIds));
  const activityItems = collections.activityItems.filter(({ record }) => hasAnyTaxonomyNode(record, taxonomyNodeIds));
  const searchProtocols = collections.searchProtocols.filter(
    ({ record }) => record.domain_id === domainPack.domain.id || hasAnyTaxonomyNode(record, taxonomyNodeIds)
  );
  const reportArtifacts = collections.reportArtifacts.filter(
    ({ record }) => record.domain_id === domainPack.domain.id || (record.scope_ids ?? []).some((nodeId) => taxonomyNodeIds.has(nodeId))
  );
  const candidateBundles = collections.candidateBundles.filter(
    ({ record }) => record.scope?.domain_id === domainPack.domain.id
  );
  const researchSessions = collections.researchSessions.filter(
    ({ record }) => record.scope?.domain_id === domainPack.domain.id
  );

  const domainSourceIds = collectDomainSourceIds({ artifacts, findings, claims, candidateBundles, searchProtocols, reportArtifacts });
  const sources = collections.sources.filter(({ record }) => domainSourceIds.has(record.id));

  const bundleIds = new Set(candidateBundles.map(({ record }) => record.id));
  const evidenceReviews = collections.evidenceReviews.filter(({ record }) => bundleIds.has(record.candidate_bundle_id));
  const reviewComments = collections.reviewComments.filter(({ record }) => bundleIds.has(record.candidate_bundle_id));
  const publicationEvents = collections.publicationEvents.filter(({ record }) => bundleIds.has(record.candidate_bundle_id));

  const [bundleReports, planning] = await Promise.all([
    loadBundleReportsForDomain(domainPack, collections),
    loadPlanningState(domainPack.domain.id)
  ]);

  return {
    domainPack,
    collections: {
      sources,
      artifacts,
      findings,
      claims,
      activityItems,
      candidateBundles,
      evidenceReviews,
      reviewComments,
      publicationEvents,
      researchSessions,
      searchProtocols,
      reportArtifacts
    },
    bundleReports,
    planning
  };
}
