import path from "node:path";
import {
  compareDateTimesDescending,
  loadActiveDomainPack,
  readJsonCollection,
  writeJson,
  workspaceRoot
} from "./workspace.mjs";

function buildDefaultQuestion(topicName, mode, domainName) {
  if (mode === "bootstrap") {
    return `What is the current evidence landscape for ${topicName} in ${domainName}, and what belongs in the first public baseline?`;
  }

  return `What changed for ${topicName} since the last meaningful review or publication, and does any change justify a public update?`;
}

function isTerminalBundleStatus(status) {
  return status === "published" || status === "rejected";
}

export async function syncResearchPlanning() {
  const domainPack = await loadActiveDomainPack();
  const topicNodes = (domainPack.taxonomy.nodes ?? [])
    .filter((node) => node.node_type === domainPack.domain.default_scope_unit || node.node_type === "topic")
    .sort((left, right) => (left.canonical_order ?? 0) - (right.canonical_order ?? 0) || left.id.localeCompare(right.id));

  const [claims, bundles, publicationEvents, sessions] = await Promise.all([
    readJsonCollection("data/claims"),
    readJsonCollection("data/candidate-bundles"),
    readJsonCollection("data/publication-events"),
    readJsonCollection("research/sessions")
  ]);

  const claimBySubjectId = new Map(
    claims
      .map(({ record }) => record)
      .filter((claim) => claim.subject_type === "taxonomy_node")
      .map((claim) => [claim.subject_id, claim])
  );

  const latestBundleByNodeId = new Map();
  for (const bundle of bundles
    .map(({ record }) => record)
    .sort((left, right) => compareDateTimesDescending(left.submitted_at, right.submitted_at))) {
    for (const nodeId of bundle.scope?.taxonomy_node_ids ?? []) {
      if (!latestBundleByNodeId.has(nodeId)) {
        latestBundleByNodeId.set(nodeId, bundle);
      }
    }
  }

  const latestSessionByNodeId = new Map();
  for (const session of sessions
    .map(({ record }) => record)
    .sort((left, right) => compareDateTimesDescending(left.completed_at, right.completed_at))) {
    for (const nodeId of session.scope?.taxonomy_node_ids ?? []) {
      if (!latestSessionByNodeId.has(nodeId)) {
        latestSessionByNodeId.set(nodeId, session);
      }
    }
  }

  const bundleById = new Map(bundles.map(({ record }) => [record.id, record]));
  const latestPublicationByNodeId = new Map();
  for (const event of publicationEvents
    .map(({ record }) => record)
    .sort((left, right) => compareDateTimesDescending(left.published_at, right.published_at))) {
    const bundle = bundleById.get(event.candidate_bundle_id);
    for (const nodeId of bundle?.scope?.taxonomy_node_ids ?? []) {
      if (!latestPublicationByNodeId.has(nodeId)) {
        latestPublicationByNodeId.set(nodeId, event);
      }
    }
  }

  const coverageRows = topicNodes.map((node) => {
    const claim = claimBySubjectId.get(node.id);
    const latestBundle = latestBundleByNodeId.get(node.id);
    const latestSession = latestSessionByNodeId.get(node.id);
    const latestPublication = latestPublicationByNodeId.get(node.id);
    const activeReview = latestBundle && !isTerminalBundleStatus(latestBundle.lifecycle_status);
    const hasBaseline = Boolean(claim || latestPublication || latestBundle?.lifecycle_status === "published");
    const coverageStatus = hasBaseline ? "baseline" : activeReview ? "in_review" : "not_started";
    const nextMode = latestSession?.next_recommended_mode ?? (hasBaseline ? "surveillance" : "bootstrap");
    const queueState = activeReview ? "active_review" : latestSession?.outcome === "blocked" ? "deferred" : "ready";

    let notes;
    if (activeReview) {
      notes = `Candidate bundle ${latestBundle.id} is still ${latestBundle.lifecycle_status}.`;
    } else if (latestPublication) {
      notes = `Latest publication event: ${latestPublication.id}.`;
    } else if (latestSession) {
      notes = `Latest ${latestSession.mode} session ${latestSession.id} ended as ${latestSession.outcome}.`;
    } else if (claim) {
      notes = "A public claim exists for this topic.";
    } else {
      notes = "No public baseline has been bootstrapped yet.";
    }

    return {
      taxonomy_node_id: node.id,
      taxonomy_node_type: node.node_type,
      parent_id: node.parent_id,
      canonical_order: node.canonical_order,
      name: node.name,
      coverage_status: coverageStatus,
      next_mode: nextMode,
      queue_state: queueState,
      last_session_id: latestSession?.id,
      last_session_at: latestSession?.completed_at,
      last_session_mode: latestSession?.mode,
      last_session_outcome: latestSession?.outcome,
      last_candidate_bundle_id: latestBundle?.id,
      last_candidate_bundle_status: latestBundle?.lifecycle_status,
      last_publication_event_id: latestPublication?.id,
      last_published_at: latestPublication?.published_at,
      default_research_question: buildDefaultQuestion(node.name, nextMode, domainPack.domain.name),
      notes
    };
  });

  const pruneUndefined = (value) => {
    const output = { ...value };
    for (const key of Object.keys(output)) {
      if (output[key] === undefined) {
        delete output[key];
      }
    }
    return output;
  };

  const bootstrapQueue = coverageRows
    .filter((row) => row.next_mode === "bootstrap" && row.queue_state === "ready")
    .map((row, index) => ({
      rank: index + 1,
      taxonomy_node_id: row.taxonomy_node_id,
      priority_tier: index < 3 ? "now" : index < 8 ? "soon" : "later",
      default_mode: "bootstrap",
      rationale: "This topic lacks a public baseline and is ready for a bounded bootstrap pass.",
      default_question: row.default_research_question
    }));

  const surveillanceQueue = coverageRows
    .filter((row) => row.next_mode === "surveillance" && row.queue_state === "ready")
    .map((row, index) => ({
      rank: index + 1,
      taxonomy_node_id: row.taxonomy_node_id,
      priority_tier: index < 3 ? "now" : index < 8 ? "soon" : "later",
      default_mode: "surveillance",
      rationale: "A public baseline exists, so this topic should be monitored for material changes.",
      default_question: row.default_research_question
    }));

  const timestamp = new Date().toISOString();
  const coverageStatus = {
    schema_version: "1.0.0",
    state_type: "coverage_status",
    domain_id: domainPack.domain.id,
    taxonomy_version: domainPack.taxonomy.taxonomy_version,
    updated_at: timestamp,
    notes: [
      "The default unit of research work is one taxonomy topic.",
      "Coverage status is planning state, not a public claim about evidence maturity."
    ],
    selection_policy: {
      default_unit: domainPack.domain.default_scope_unit,
      max_topics_per_bootstrap_run: 1,
      max_topics_per_surveillance_run: 1,
      when_request_is_too_broad: "Decompose to one topic-level pass before creating records."
    },
    nodes: coverageRows.map(pruneUndefined)
  };

  const priorityQueue = {
    schema_version: "1.0.0",
    queue_type: "research_priority_queue",
    domain_id: domainPack.domain.id,
    taxonomy_version: domainPack.taxonomy.taxonomy_version,
    updated_at: timestamp,
    notes: [
      "Bootstrap priority applies to uncovered topics.",
      "Surveillance priority applies to topics with public baseline coverage and no active review bundle."
    ],
    selection_policy: {
      default_unit: domainPack.domain.default_scope_unit,
      when_request_is_vague: "Choose the highest-priority ready topic from the queue matching the requested mode.",
      when_request_is_too_broad: "Narrow the work to one topic before starting."
    },
    bootstrap_queue: bootstrapQueue,
    surveillance_queue: surveillanceQueue
  };

  await writeJson(path.join(workspaceRoot, "research", "state", "coverage-status.v1.json"), coverageStatus);
  await writeJson(path.join(workspaceRoot, "research", "backlog", "priority-queue.v1.json"), priorityQueue);

  return {
    coverage_path: "research/state/coverage-status.v1.json",
    priority_queue_path: "research/backlog/priority-queue.v1.json",
    coverage_node_count: coverageRows.length,
    bootstrap_queue_count: bootstrapQueue.length,
    surveillance_queue_count: surveillanceQueue.length
  };
}
