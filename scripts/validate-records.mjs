#!/usr/bin/env node

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
  research_session: "core/research-session.schema.json",
  review_comment: "core/review-comment.schema.json",
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

    if (!validate(value)) {
      for (const error of validate.errors ?? []) {
        issues.push(`${relativePath}: ${formatError(error)}`);
      }
    }
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
