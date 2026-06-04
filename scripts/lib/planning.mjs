import path from "node:path";
import {
  compareDateTimesDescending,
  fileExists,
  loadActiveDomainPack,
  readJson,
  readJsonCollection,
  writeJson,
  workspaceRoot
} from "./workspace.mjs";

const DEFAULT_STALE_AFTER_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function titleCaseFromIdentifier(value) {
  return value
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDefaultQuestion(scopeName, scopeUnitLabel, mode, domainName) {
  if (mode === "baseline_review") {
    return `What is the current evidence landscape for ${scopeName} in ${domainName}, and what belongs in the first public baseline for this ${scopeUnitLabel}?`;
  }

  return `What changed for ${scopeName} since the last meaningful review or publication, and does any change justify a public update?`;
}

function isTerminalBundleStatus(status) {
  return status === "published" || status === "rejected";
}

function getStaleAfterDays(domainPack) {
  const configured = domainPack.domain.planning?.stale_after_days;
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_STALE_AFTER_DAYS;
}

function parseTimestamp(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function resolveNow(options) {
  const now = options.now ? new Date(options.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw new Error("Planning sync now option must be a valid date or timestamp.");
  }

  return now;
}

function getLatestCheck(candidates) {
  return candidates
    .filter((candidate) => parseTimestamp(candidate.at) !== undefined)
    .sort((left, right) => parseTimestamp(right.at) - parseTimestamp(left.at))[0];
}

function addDays(timestamp, days) {
  const parsed = parseTimestamp(timestamp);
  return parsed === undefined ? undefined : new Date(parsed + days * MS_PER_DAY).toISOString();
}

function getDaysSince(timestamp, now) {
  const parsed = parseTimestamp(timestamp);
  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(0, Math.floor((now.getTime() - parsed) / MS_PER_DAY));
}

function getFreshness({
  activeReview,
  claim,
  hasBaseline,
  latestBundle,
  latestPublication,
  latestSession,
  now,
  staleAfterDays
}) {
  if (activeReview) {
    return {
      freshness_status: "in_review",
      stale_after_days: staleAfterDays,
      stale_reason: `Candidate bundle ${latestBundle.id} is still ${latestBundle.lifecycle_status}.`
    };
  }

  if (!hasBaseline) {
    return {
      freshness_status: "uncovered",
      stale_after_days: staleAfterDays,
      stale_reason: "No baseline coverage exists yet."
    };
  }

  const latestCheck = getLatestCheck([
    { at: latestPublication?.published_at, source: "publication" },
    { at: latestSession?.completed_at, source: latestSession ? `${latestSession.mode}_session` : undefined },
    { at: claim?.last_updated, source: "claim" },
    {
      at: latestBundle?.lifecycle_status === "published" ? latestBundle.submitted_at : undefined,
      source: "published_bundle"
    }
  ]);

  if (!latestCheck) {
    return {
      freshness_status: "unknown",
      stale_after_days: staleAfterDays,
      stale_reason: "Baseline coverage has no dated publication, session, or claim check."
    };
  }

  const daysSinceLastCheck = getDaysSince(latestCheck.at, now);
  const staleAt = addDays(latestCheck.at, staleAfterDays);
  const isStale = daysSinceLastCheck >= staleAfterDays;

  return {
    freshness_status: isStale ? "stale" : "fresh",
    last_checked_at: latestCheck.at,
    last_checked_source: latestCheck.source,
    days_since_last_check: daysSinceLastCheck,
    stale_after_days: staleAfterDays,
    stale_at: staleAt,
    stale_reason: isStale
      ? `Latest ${latestCheck.source} check is ${daysSinceLastCheck} days old; stale after ${staleAfterDays} days.`
      : `Latest ${latestCheck.source} check is ${daysSinceLastCheck} days old; stale after ${staleAfterDays} days.`
  };
}

function getQueueState({ activeReview, freshnessStatus, hasBaseline, latestSession }) {
  if (activeReview) {
    return "active_review";
  }

  if (latestSession?.outcome === "blocked") {
    return "deferred";
  }

  if (!hasBaseline) {
    return "ready";
  }

  return freshnessStatus === "stale" || freshnessStatus === "unknown" ? "ready" : "deferred";
}

function getReviewUpdateRationale(row) {
  if (row.freshness_status === "unknown") {
    return "A public baseline exists, but planning cannot find a reliable dated check; run a review update to refresh coverage state.";
  }

  if (row.freshness_status === "stale") {
    return `Baseline coverage is stale: latest check was ${row.days_since_last_check} days ago, with a ${row.stale_after_days}-day stale threshold.`;
  }

  return "A public baseline exists, so this scope unit should be monitored for material changes.";
}

function getNextQueueItem(status, mode) {
  if (mode === "baseline_review") {
    return status.queues.baseline_review[0] ?? null;
  }

  if (mode === "review_update") {
    return status.queues.review_update[0] ?? null;
  }

  return status.queues.baseline_review[0] ?? status.queues.review_update[0] ?? null;
}

export async function readPlanningStatus() {
  const domainPack = await loadActiveDomainPack();
  const coveragePath = path.join(workspaceRoot, "research", "state", "coverage-status.v1.json");
  const priorityQueuePath = path.join(workspaceRoot, "research", "backlog", "priority-queue.v1.json");
  const coverage = (await fileExists(coveragePath)) ? await readJson(coveragePath) : undefined;
  const priorityQueue = (await fileExists(priorityQueuePath)) ? await readJson(priorityQueuePath) : undefined;
  const baselineReviewQueue = priorityQueue?.baseline_review_queue ?? [];
  const reviewUpdateQueue = priorityQueue?.review_update_queue ?? [];
  const status = {
    domain_id: domainPack.domain.id,
    coverage_path: "research/state/coverage-status.v1.json",
    priority_queue_path: "research/backlog/priority-queue.v1.json",
    coverage_domain_id: coverage?.domain_id,
    priority_queue_domain_id: priorityQueue?.domain_id,
    domain_matches:
      coverage?.domain_id === domainPack.domain.id &&
      priorityQueue?.domain_id === domainPack.domain.id,
    updated_at: priorityQueue?.updated_at ?? coverage?.updated_at,
    selection_policy: priorityQueue?.selection_policy ?? coverage?.selection_policy,
    queue_counts: {
      baseline_review: baselineReviewQueue.length,
      review_update: reviewUpdateQueue.length
    },
    queues: {
      baseline_review: baselineReviewQueue,
      review_update: reviewUpdateQueue
    },
    next: {
      baseline_review: getNextQueueItem({ queues: { baseline_review: baselineReviewQueue, review_update: reviewUpdateQueue } }, "baseline_review"),
      review_update: getNextQueueItem({ queues: { baseline_review: baselineReviewQueue, review_update: reviewUpdateQueue } }, "review_update"),
      recommended: getNextQueueItem({ queues: { baseline_review: baselineReviewQueue, review_update: reviewUpdateQueue } })
    }
  };

  if (!coverage || !priorityQueue) {
    status.warning = "Planning files are missing; run sync before relying on queue status.";
  } else if (!status.domain_matches) {
    status.warning = "Planning files were generated for a different active domain; run sync for the current domain.";
  }

  return status;
}

export { getNextQueueItem };

function compareReviewUpdatePriority(left, right) {
  const statusRank = { unknown: 0, stale: 1 };
  const leftRank = statusRank[left.freshness_status] ?? 9;
  const rightRank = statusRank[right.freshness_status] ?? 9;

  return (
    leftRank - rightRank ||
    (right.days_since_last_check ?? -1) - (left.days_since_last_check ?? -1) ||
    (left.canonical_order ?? 0) - (right.canonical_order ?? 0) ||
    left.taxonomy_node_id.localeCompare(right.taxonomy_node_id)
  );
}

export async function syncResearchPlanning(options = {}) {
  const domainPack = await loadActiveDomainPack();
  const now = resolveNow(options);
  const staleAfterDays = getStaleAfterDays(domainPack);
  const scopeUnit = domainPack.domain.default_scope_unit ?? "topic";
  const scopeUnitLabel = titleCaseFromIdentifier(scopeUnit).toLowerCase();
  const topicNodes = (domainPack.taxonomy.nodes ?? [])
    .filter((node) => node.node_type === scopeUnit || node.node_type === "topic")
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
    const nextMode = latestSession?.next_recommended_mode ?? (hasBaseline ? "review_update" : "baseline_review");
    const freshness = getFreshness({
      activeReview,
      claim,
      hasBaseline,
      latestBundle,
      latestPublication,
      latestSession,
      now,
      staleAfterDays
    });
    const queueState = getQueueState({
      activeReview,
      freshnessStatus: freshness.freshness_status,
      hasBaseline,
      latestSession
    });

    let notes;
    if (activeReview) {
      notes = `Candidate bundle ${latestBundle.id} is still ${latestBundle.lifecycle_status}.`;
    } else if (freshness.freshness_status === "stale" || freshness.freshness_status === "unknown") {
      notes = freshness.stale_reason;
    } else if (freshness.freshness_status === "fresh") {
      notes = `${freshness.stale_reason} Next review update is due at ${freshness.stale_at}.`;
    } else if (latestPublication) {
      notes = `Latest publication event: ${latestPublication.id}.`;
    } else if (latestSession) {
      notes = `Latest ${latestSession.mode} session ${latestSession.id} ended as ${latestSession.outcome}.`;
    } else if (claim) {
      notes = "A public claim exists for this topic.";
    } else {
      notes = "No public baseline review has been completed yet.";
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
      ...freshness,
      last_session_id: latestSession?.id,
      last_session_at: latestSession?.completed_at,
      last_session_mode: latestSession?.mode,
      last_session_outcome: latestSession?.outcome,
      last_candidate_bundle_id: latestBundle?.id,
      last_candidate_bundle_status: latestBundle?.lifecycle_status,
      last_publication_event_id: latestPublication?.id,
      last_published_at: latestPublication?.published_at,
      default_research_question: buildDefaultQuestion(node.name, scopeUnitLabel, nextMode, domainPack.domain.name),
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

  const baselineReviewQueue = coverageRows
    .filter((row) => row.next_mode === "baseline_review" && row.queue_state === "ready")
    .map((row, index) => ({
      rank: index + 1,
      taxonomy_node_id: row.taxonomy_node_id,
      priority_tier: index < 3 ? "now" : index < 8 ? "soon" : "later",
      default_mode: "baseline_review",
      rationale: `This ${scopeUnitLabel} lacks a public baseline and is ready for a bounded baseline review pass.`,
      default_question: row.default_research_question
    }));

  const reviewUpdateQueue = coverageRows
    .filter((row) => row.next_mode === "review_update" && row.queue_state === "ready")
    .sort(compareReviewUpdatePriority)
    .map((row, index) => ({
      rank: index + 1,
      taxonomy_node_id: row.taxonomy_node_id,
      priority_tier: index < 3 ? "now" : index < 8 ? "soon" : "later",
      default_mode: "review_update",
      rationale: getReviewUpdateRationale(row),
      default_question: row.default_research_question,
      freshness_status: row.freshness_status,
      last_checked_at: row.last_checked_at,
      days_since_last_check: row.days_since_last_check,
      stale_after_days: row.stale_after_days,
      stale_at: row.stale_at
    }));

  const timestamp = now.toISOString();
  const coverageStatus = {
    schema_version: "1.0.0",
    state_type: "coverage_status",
    domain_id: domainPack.domain.id,
    taxonomy_version: domainPack.taxonomy.taxonomy_version,
    updated_at: timestamp,
    notes: [
      `The default unit of research work is one taxonomy ${scopeUnitLabel}.`,
      "Coverage status is planning state, not a public claim about evidence maturity.",
      `Baseline coverage is stale when the latest dated publication, session, or claim check is at least ${staleAfterDays} days old.`
    ],
    selection_policy: {
      default_unit: scopeUnit,
      stale_after_days: staleAfterDays,
      max_scope_units_per_baseline_review_run: 1,
      max_scope_units_per_review_update_run: 1,
      when_request_is_too_broad: `Decompose to one ${scopeUnitLabel}-level pass before creating records.`
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
      `Baseline Review priority applies to uncovered ${scopeUnitLabel}s.`,
      `Review Update priority applies to stale ${scopeUnitLabel}s with public baseline coverage and no active review bundle.`
    ],
    selection_policy: {
      default_unit: scopeUnit,
      stale_after_days: staleAfterDays,
      when_request_is_vague: `Choose the highest-priority ready ${scopeUnitLabel} from the queue matching the requested mode.`,
      when_request_is_too_broad: `Narrow the work to one ${scopeUnitLabel} before starting.`
    },
    baseline_review_queue: baselineReviewQueue,
    review_update_queue: reviewUpdateQueue
  };

  await writeJson(path.join(workspaceRoot, "research", "state", "coverage-status.v1.json"), coverageStatus);
  await writeJson(path.join(workspaceRoot, "research", "backlog", "priority-queue.v1.json"), priorityQueue);

  return {
    coverage_path: "research/state/coverage-status.v1.json",
    priority_queue_path: "research/backlog/priority-queue.v1.json",
    coverage_node_count: coverageRows.length,
    baseline_review_queue_count: baselineReviewQueue.length,
    review_update_queue_count: reviewUpdateQueue.length
  };
}
