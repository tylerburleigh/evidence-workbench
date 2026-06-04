#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  dataRoot,
  fileExists,
  loadActiveDomainPack,
  readJson,
  readJsonCollection,
  researchRoot,
  toPosixRelative,
  withFileLock,
  workspaceRoot,
  writeJson
} from "./lib/workspace.mjs";

const candidateBundlesRoot = path.join(dataRoot, "candidate-bundles");
const evidenceAppraisalsRoot = path.join(dataRoot, "evidence-appraisals");
const draftEvidenceAppraisalsRoot = path.join(researchRoot, "drafts", "evidence-appraisals");

const appraiserKinds = new Set(["agent", "human"]);
const appraisalStatuses = new Set(["complete", "superseded"]);
const appraisalVerdicts = new Set(["accept", "needs_revision", "reject", "needs_human_judgment"]);
const findingSeverities = new Set(["critical", "major", "minor", "note"]);
const findingCategories = new Set([
  "source_mismatch",
  "endpoint_boundary",
  "interpretation_overreach",
  "missing_caveat",
  "activity_vs_evidence",
  "safety_limitation",
  "taxonomy_mapping",
  "claim_overreach",
  "uncertainty",
  "support_map_gap",
  "construct_conflation",
  "method_misclassification",
  "missing_comparator",
  "scorer_relevance_gap",
  "metric_overreach",
  "other"
]);
const findingResolutionStates = new Set(["open", "addressed", "closed"]);

function usage(exitCode = 0) {
  const message = `
Usage:
  npm run research:appraise-evidence -- status --bundle <bundle-id>
  npm run research:appraise-evidence -- scaffold --bundle <bundle-id> --lane <lane> [--appraiser-kind agent|human] [--appraiser-id <id>] [--appraisal-round <n>] [--output <path>] [--dry-run]
  npm run research:appraise-evidence -- apply --file <draft-path> [--keep-draft]

Notes:
  - scaffold writes a draft appraisal JSON under research/drafts/evidence-appraisals/ by default.
  - apply promotes a completed appraisal into data/evidence-appraisals/ and updates bundle metadata.
  - lanes are loaded from the active domain pack.
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

function titleCaseFromIdentifier(value) {
  return value
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPlaceholderText(value) {
  return typeof value === "string" && value.includes("TODO:");
}

function parseInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    fail(`${label} must be a positive integer.`);
  }

  return parsed;
}

async function loadCandidateBundle(bundleId) {
  const bundlePath = path.join(candidateBundlesRoot, `${bundleId}.json`);
  if (!(await fileExists(bundlePath))) {
    fail(`Bundle not found: ${toPosixRelative(bundlePath)}`);
  }

  return {
    filePath: bundlePath,
    record: await readJson(bundlePath)
  };
}

async function loadEvidenceAppraisals() {
  return readJsonCollection("data/evidence-appraisals");
}

function getBundleScopeSlug(bundle) {
  const taxonomyNodeId = bundle.scope?.taxonomy_node_ids?.[0];
  if (taxonomyNodeId) {
    return taxonomyNodeId;
  }

  return bundle.id;
}

function getCurrentRevision(bundle) {
  return bundle.revision_number ?? 1;
}

function getMatchingAppraisals(appraisals, bundleId, revisionNumber) {
  return appraisals.filter(
    ({ record }) =>
      record.candidate_bundle_id === bundleId && record.bundle_revision_number === revisionNumber
  );
}

function deriveAppraisalRound(revisionAppraisals, laneAppraisals, explicitAppraisalRound) {
  if (explicitAppraisalRound) {
    return explicitAppraisalRound;
  }

  if (laneAppraisals.length > 0) {
    return Math.max(...revisionAppraisals.map(({ record }) => record.appraisal_round ?? 1)) + 1;
  }

  if (revisionAppraisals.length > 0) {
    return Math.max(...revisionAppraisals.map(({ record }) => record.appraisal_round ?? 1));
  }

  return 1;
}

function deriveAppraisalId(bundle, lane, revisionNumber, appraisalRound, laneAppraisals) {
  const laneSlug = lane.replaceAll("_", "-");
  const base = `evidence-appraisal-${getBundleScopeSlug(bundle)}-${laneSlug}-r${revisionNumber}`;
  return laneAppraisals.length > 0 ? `${base}-round-${appraisalRound}` : base;
}

function deriveAppraisalName(bundle, lane) {
  const laneName = titleCaseFromIdentifier(lane);
  const scopeName = titleCaseFromIdentifier(getBundleScopeSlug(bundle));
  return `${laneName} appraisal for ${scopeName} bundle`;
}

function getLaneChecklist(lane) {
  const shared = [
    "Record any corrections made during appraisal in corrections_applied[].",
    "Keep appraised_change_ids aligned with the bundle changes actually covered by this pass."
  ];
  const laneSpecific = {
    source_fidelity: [
      "Verify bibliographic metadata against the cited source.",
      "Check study details, sample counts, model versions, metrics, and dates.",
      "Record source access_status/access_depth and access_attempts[] when only abstract, metadata, or a paywalled page is available.",
      "Prefer the deepest available locator: full text, method/result section, table, appendix, then abstract or metadata.",
      "Flag abstract-only extraction when full text, PDF, or HTML is available."
    ],
    construct_mapping: [
      "Check that response origin, rubric label space, label source, human scoring, and AI scoring are not conflated.",
      "Verify that real-response comparators and generated labels are described separately."
    ],
    method_classification: [
      "Verify generation model, prompt strategy, generation workflow, response type, and evaluation method.",
      "Do not infer unreported model versions, prompt templates, or filtering steps."
    ],
    scorer_validation_relevance: [
      "Separate scorer validation, calibration, benchmarking, and stress testing from training augmentation or prototype testing.",
      "Flag adjacent synthetic-data use when the bundle treats it as direct scorer-validation evidence."
    ],
    synthesis_overreach: [
      "Check that confidence, support roles, limitations, and support-map rationale match the evidence.",
      "Reject field-wide claims from one task, rubric, model, prompt pattern, dataset, or metric."
    ],
    search_protocol: [
      "Verify queries, databases, dates, inclusion/exclusion criteria, deduplication notes, and screening decisions.",
      "Check that included screening source_ids match search_protocol.source_ids, bundle.source_ids, and staged or live source records."
    ]
  };

  return [...(laneSpecific[lane] ?? ["Check lane-specific appraisal requirements from the active domain pack."]), ...shared];
}

function buildDraftAppraisal({
  bundle,
  lane,
  appraiserKind,
  appraiserId,
  appraisalRound,
  existingLaneAppraisals
}) {
  const revisionNumber = getCurrentRevision(bundle);
  const appraisalId = deriveAppraisalId(bundle, lane, revisionNumber, appraisalRound, existingLaneAppraisals);
  const draftAppraisal = {
    __draft: {
      generated_at: new Date().toISOString(),
      generated_by: "scripts/appraise-evidence.mjs",
      output_path: `data/evidence-appraisals/${appraisalId}.json`,
      supersedes_appraisal_ids: existingLaneAppraisals
        .filter(({ record }) => record.status === "complete")
        .map(({ record }) => record.id),
      instructions: [
        "Replace placeholder summary, verdict, blocking flag, and findings after completing the review.",
        "Set corrections_applied[] when the appraisal changes staged records before acceptance."
      ],
      lane_checklist: getLaneChecklist(lane)
    },
    schema_version: "1.0.0",
    record_type: "evidence_appraisal",
    id: appraisalId,
    name: deriveAppraisalName(bundle, lane),
    candidate_bundle_id: bundle.id,
    bundle_revision_number: revisionNumber,
    appraisal_round: appraisalRound,
    appraisal_lane: lane,
    appraiser_kind: appraiserKind,
    status: "complete",
    verdict: "needs_human_judgment",
    blocking: true,
    summary: "TODO: replace with a bounded evidence-appraisal summary.",
    appraised_change_ids: bundle.proposed_changes.map((change) => change.change_id),
    corrections_applied: [],
    findings: []
  };

  if (appraiserKind === "human") {
    draftAppraisal.appraiser_id = appraiserId ?? "local-curator";
  } else {
    draftAppraisal.skill_name = "evidence-appraisal";
    if (appraiserId) {
      draftAppraisal.appraiser_id = appraiserId;
    }
  }

  return draftAppraisal;
}

async function validateAppraisalShape(review, bundle, domainPack) {
  const requiredStringFields = [
    "schema_version",
    "record_type",
    "id",
    "name",
    "candidate_bundle_id",
    "appraisal_lane",
    "appraiser_kind",
    "status",
    "verdict",
    "summary"
  ];

  for (const field of requiredStringFields) {
    if (!nonEmptyString(review[field])) {
      fail(`Appraisal field ${field} must be a non-empty string.`);
    }
  }

  if (review.schema_version !== "1.0.0") {
    fail("Appraisal schema_version must be 1.0.0.");
  }

  if (review.record_type !== "evidence_appraisal") {
    fail("Appraisal record_type must be evidence_appraisal.");
  }

  if (review.candidate_bundle_id !== bundle.id) {
    fail("Appraisal candidate_bundle_id does not match the target bundle.");
  }

  const revisionNumber = getCurrentRevision(bundle);
  if (!Number.isInteger(review.bundle_revision_number) || review.bundle_revision_number !== revisionNumber) {
    fail(`Appraisal bundle_revision_number must match the bundle revision (${revisionNumber}).`);
  }

  if (!Number.isInteger(review.appraisal_round) || review.appraisal_round < 1) {
    fail("Appraisal appraisal_round must be a positive integer.");
  }

  if (!domainPack.appraisalLaneIds.has(review.appraisal_lane)) {
    fail(`Unsupported appraisal lane for active domain pack: ${review.appraisal_lane}`);
  }

  if (!appraiserKinds.has(review.appraiser_kind)) {
    fail(`Unsupported appraiser kind: ${review.appraiser_kind}`);
  }

  if (!appraisalStatuses.has(review.status)) {
    fail(`Unsupported appraisal status: ${review.status}`);
  }

  if (!appraisalVerdicts.has(review.verdict)) {
    fail(`Unsupported appraisal verdict: ${review.verdict}`);
  }

  if (typeof review.blocking !== "boolean") {
    fail("Appraisal blocking must be a boolean.");
  }

  if (review.appraiser_kind === "agent" && typeof review.skill_name !== "string") {
    fail("Agent appraisal must include skill_name.");
  }

  if (review.appraiser_kind === "human" && typeof review.appraiser_id !== "string") {
    fail("Human appraisal must include appraiser_id.");
  }

  if (isPlaceholderText(review.summary)) {
    fail("Appraisal summary still contains a TODO placeholder.");
  }

  if (!Array.isArray(review.appraised_change_ids) || review.appraised_change_ids.length === 0) {
    fail("Appraisal appraised_change_ids must contain at least one bundle change.");
  }

  const validChangeIds = new Set(bundle.proposed_changes.map((change) => change.change_id));
  for (const changeId of review.appraised_change_ids) {
    if (!validChangeIds.has(changeId)) {
      fail(`Appraisal references unknown change_id: ${changeId}`);
    }
  }

  if (review.corrections_applied !== undefined) {
    if (!Array.isArray(review.corrections_applied)) {
      fail("Appraisal corrections_applied must be an array when present.");
    }

    review.corrections_applied.forEach((correction, index) => {
      if (!nonEmptyString(correction.change_id)) {
        fail(`Correction ${index + 1} is missing change_id.`);
      }

      if (!validChangeIds.has(correction.change_id)) {
        fail(`Correction ${index + 1} references unknown change_id: ${correction.change_id}`);
      }

      if (!nonEmptyString(correction.summary)) {
        fail(`Correction ${index + 1} is missing summary.`);
      }

      if (isPlaceholderText(correction.summary)) {
        fail(`Correction ${index + 1} still contains a TODO placeholder in summary.`);
      }
    });
  }

  if (!Array.isArray(review.findings)) {
    fail("Appraisal findings must be an array.");
  }

  review.findings.forEach((finding, index) => {
    if (!nonEmptyString(finding.finding_id)) {
      fail(`Finding ${index + 1} is missing finding_id.`);
    }

    if (!findingSeverities.has(finding.severity)) {
      fail(`Finding ${finding.finding_id} has unsupported severity: ${finding.severity}`);
    }

    if (!findingCategories.has(finding.category)) {
      fail(`Finding ${finding.finding_id} has unsupported category: ${finding.category}`);
    }

    if (!findingResolutionStates.has(finding.resolution_status)) {
      fail(`Finding ${finding.finding_id} has unsupported resolution_status: ${finding.resolution_status}`);
    }

    for (const field of ["claim_or_issue", "why_it_matters", "recommended_action"]) {
      if (!nonEmptyString(finding[field])) {
        fail(`Finding ${finding.finding_id} is missing ${field}.`);
      }

      if (isPlaceholderText(finding[field])) {
        fail(`Finding ${finding.finding_id} still contains a TODO placeholder in ${field}.`);
      }
    }

    if (finding.applies_to_change_id && !validChangeIds.has(finding.applies_to_change_id)) {
      fail(`Finding ${finding.finding_id} references unknown applies_to_change_id: ${finding.applies_to_change_id}`);
    }
  });
}

function summarizeAppraisalState(bundle, appraisals) {
  const revisionNumber = getCurrentRevision(bundle);
  const revisionAppraisals = getMatchingAppraisals(appraisals, bundle.id, revisionNumber).filter(
    ({ record }) => record.status === "complete"
  );
  const requiredLanes = bundle.required_appraisal_lanes ?? [];
  const minAppraisalsPerLane = bundle.appraisal_requirement?.min_complete_appraisals_per_lane ?? 1;
  const blockOnOpenCriticalFindings = bundle.appraisal_requirement?.block_on_open_critical_findings ?? true;
  const blockOnOpenMajorFindings = bundle.appraisal_requirement?.block_on_open_major_findings ?? false;

  const laneCounts = new Map();
  for (const { record } of revisionAppraisals) {
    laneCounts.set(record.appraisal_lane, (laneCounts.get(record.appraisal_lane) ?? 0) + 1);
  }

  const missingLanes = requiredLanes.filter((lane) => (laneCounts.get(lane) ?? 0) < minAppraisalsPerLane);
  const blockingAppraisalIds = revisionAppraisals
    .filter(({ record }) => record.blocking || record.verdict === "needs_revision" || record.verdict === "reject")
    .map(({ record }) => record.id);

  const openBlockingFindings = revisionAppraisals.flatMap(({ record }) =>
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

  return {
    bundle_id: bundle.id,
    lifecycle_status: bundle.lifecycle_status,
    revision_number: revisionNumber,
    required_lanes: requiredLanes,
    completed_appraisals: revisionAppraisals.map(({ record }) => ({
      id: record.id,
      lane: record.appraisal_lane,
      round: record.appraisal_round,
      verdict: record.verdict,
      blocking: record.blocking,
      status: record.status
    })),
    missing_lanes: missingLanes,
    blocking_appraisal_ids: blockingAppraisalIds,
    open_blocking_findings: openBlockingFindings,
    ready:
      requiredLanes.length > 0 &&
      missingLanes.length === 0 &&
      blockingAppraisalIds.length === 0 &&
      openBlockingFindings.length === 0
  };
}

async function commandStatus(options) {
  const bundleId = options.bundle;
  if (!bundleId) {
    fail("status requires --bundle <bundle-id>.");
  }

  const { record: bundle } = await loadCandidateBundle(bundleId);
  const appraisals = await loadEvidenceAppraisals();
  process.stdout.write(`${JSON.stringify(summarizeAppraisalState(bundle, appraisals), null, 2)}\n`);
}

async function commandScaffold(options) {
  const bundleId = options.bundle;
  const lane = options.lane;
  if (!bundleId || !lane) {
    fail("scaffold requires --bundle <bundle-id> and --lane <lane>.");
  }

  const domainPack = await loadActiveDomainPack();
  if (!domainPack.appraisalLaneIds.has(lane)) {
    fail(`Unsupported lane for active domain pack: ${lane}`);
  }

  const appraiserKind = options["appraiser-kind"] ?? "agent";
  if (!appraiserKinds.has(appraiserKind)) {
    fail(`Unsupported appraiser kind: ${appraiserKind}`);
  }

  const explicitAppraisalRound = options["appraisal-round"]
    ? parseInteger(options["appraisal-round"], "--appraisal-round")
    : undefined;

  const { record: bundle } = await loadCandidateBundle(bundleId);
  const appraisals = await loadEvidenceAppraisals();
  const revisionAppraisals = getMatchingAppraisals(appraisals, bundle.id, getCurrentRevision(bundle));
  const laneAppraisals = revisionAppraisals.filter(({ record }) => record.appraisal_lane === lane);
  const appraisalRound = deriveAppraisalRound(revisionAppraisals, laneAppraisals, explicitAppraisalRound);
  const draftAppraisal = buildDraftAppraisal({
    bundle,
    lane,
    appraiserKind,
    appraiserId: options["appraiser-id"],
    appraisalRound,
    existingLaneAppraisals: laneAppraisals
  });

  if (options["dry-run"]) {
    process.stdout.write(`${JSON.stringify(draftAppraisal, null, 2)}\n`);
    return;
  }

  const outputPath = options.output
    ? path.resolve(workspaceRoot, options.output)
    : path.join(draftEvidenceAppraisalsRoot, `${draftAppraisal.id}.json`);

  await writeJson(outputPath, draftAppraisal);

  process.stdout.write(
    `${JSON.stringify(
      {
        action: "scaffolded",
        bundle_id: bundle.id,
        lane,
        output_path: toPosixRelative(outputPath),
        appraisal_id: draftAppraisal.id,
        appraisal_round: draftAppraisal.appraisal_round
      },
      null,
      2
    )}\n`
  );
}

async function commandApply(options) {
  const filePathOption = options.file;
  if (!filePathOption) {
    fail("apply requires --file <draft-path>.");
  }

  const sourceFilePath = path.resolve(workspaceRoot, filePathOption);
  if (!(await fileExists(sourceFilePath))) {
    fail(`Appraisal file not found: ${toPosixRelative(sourceFilePath)}`);
  }

  const draftAppraisal = await readJson(sourceFilePath);
  const bundleId = draftAppraisal.candidate_bundle_id;
  if (!nonEmptyString(bundleId)) {
    fail("Appraisal file must include candidate_bundle_id.");
  }

  const { filePath: bundlePath, record: bundle } = await loadCandidateBundle(bundleId);
  const domainPack = await loadActiveDomainPack();
  await validateAppraisalShape(draftAppraisal, bundle, domainPack);

  const appraisals = await loadEvidenceAppraisals();
  const revisionNumber = getCurrentRevision(bundle);
  const sameLaneAppraisals = getMatchingAppraisals(appraisals, bundle.id, revisionNumber).filter(
    ({ record }) => record.appraisal_lane === draftAppraisal.appraisal_lane && record.id !== draftAppraisal.id && record.status === "complete"
  );

  const timestamp = new Date().toISOString();
  for (const existingAppraisal of sameLaneAppraisals) {
    const supersededAppraisal = {
      ...existingAppraisal.record,
      status: "superseded",
      updated_at: timestamp
    };

    await writeJson(existingAppraisal.filePath, supersededAppraisal);
  }

  const finalAppraisal = { ...draftAppraisal };
  delete finalAppraisal.__draft;

  if (!finalAppraisal.created_at) {
    finalAppraisal.created_at = timestamp;
  }
  finalAppraisal.updated_at = timestamp;

  const finalAppraisalPath = path.join(evidenceAppraisalsRoot, `${finalAppraisal.id}.json`);
  await writeJson(finalAppraisalPath, finalAppraisal);

  await withFileLock(`${bundlePath}.lock`, async () => {
    const latestBundle = await readJson(bundlePath);
    const nextReviewIds = Array.from(new Set([...(latestBundle.evidence_appraisal_ids ?? []), finalAppraisal.id]));
    const updatedBundle = {
      ...latestBundle,
      evidence_appraisal_ids: nextReviewIds
    };
    await writeJson(bundlePath, updatedBundle);
  });

  if (!options["keep-draft"] && sourceFilePath.startsWith(`${draftEvidenceAppraisalsRoot}${path.sep}`)) {
    await fs.rm(sourceFilePath);
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        action: "applied",
        bundle_id: bundle.id,
        appraisal_id: finalAppraisal.id,
        appraisal_lane: finalAppraisal.appraisal_lane,
        superseded_appraisal_ids: sameLaneAppraisals.map(({ record }) => record.id),
        final_appraisal_path: toPosixRelative(finalAppraisalPath)
      },
      null,
      2
    )}\n`
  );
}

async function main() {
  const [, , commandName, ...rest] = process.argv;
  if (!commandName || commandName === "--help" || commandName === "-h") {
    usage(0);
  }

  const { values } = parseArgs({
    args: rest,
    options: {
      bundle: { type: "string" },
      lane: { type: "string" },
      file: { type: "string" },
      output: { type: "string" },
      "appraiser-kind": { type: "string" },
      "appraiser-id": { type: "string" },
      "appraisal-round": { type: "string" },
      "keep-draft": { type: "boolean" },
      "dry-run": { type: "boolean" }
    },
    allowPositionals: false
  });

  switch (commandName) {
    case "status":
      await commandStatus(values);
      break;
    case "scaffold":
      await commandScaffold(values);
      break;
    case "apply":
      await commandApply(values);
      break;
    default:
      usage(1);
  }
}

await main();
