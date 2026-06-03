#!/usr/bin/env node

import { parseArgs } from "node:util";
import {
  addScreeningDecision,
  completeSearchProtocol,
  scaffoldSearchProtocol
} from "./lib/search-workflow.mjs";

function usage(exitCode = 0) {
  const message = `
Usage:
  npm run research:search -- scaffold --id <protocol-id> --name <name> --taxonomy-node <node-id> --query <query> [--bundle <bundle-id>]
  npm run research:search -- screen --id <protocol-id> --title <title> --decision <include|exclude|maybe|duplicate|not_relevant|no_full_text> [--bundle <bundle-id>]
  npm run research:search -- complete --id <protocol-id> --summary <text> [--bundle <bundle-id>]

Notes:
  - With --bundle, the protocol is written under data/staged-records/<bundle-id>/ and attached as a search_protocol proposed change.
  - Without --bundle, the protocol is written under data/search-protocols/.
  - Repeat --query, --database, --taxonomy-node, --include-criterion, or --exclude-criterion for multiple values.
`.trim();

  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${message}\n`);
  process.exit(exitCode);
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const [, , commandName, ...rest] = process.argv;
  if (!commandName || commandName === "--help" || commandName === "-h") {
    usage(0);
  }

  const { values } = parseArgs({
    args: rest,
    options: {
      id: { type: "string" },
      name: { type: "string" },
      bundle: { type: "string" },
      "taxonomy-node": { type: "string", multiple: true },
      query: { type: "string", multiple: true },
      database: { type: "string", multiple: true },
      "include-criterion": { type: "string", multiple: true },
      "exclude-criterion": { type: "string", multiple: true },
      "dedupe-method": { type: "string" },
      "systematicity-level": { type: "string" },
      status: { type: "string" },
      title: { type: "string" },
      decision: { type: "string" },
      reason: { type: "string" },
      "candidate-id": { type: "string" },
      "source-id": { type: "string" },
      doi: { type: "string" },
      url: { type: "string" },
      summary: { type: "string" },
      "started-at": { type: "string" },
      "completed-at": { type: "string" },
      "searched-at": { type: "string" },
      "result-count": { type: "string" },
      "records-identified": { type: "string" },
      limitation: { type: "string", multiple: true },
      replace: { type: "boolean" }
    },
    allowPositionals: false
  });

  switch (commandName) {
    case "scaffold":
      printJson(await scaffoldSearchProtocol(values));
      break;
    case "screen":
      printJson(await addScreeningDecision(values));
      break;
    case "complete":
      printJson(await completeSearchProtocol(values));
      break;
    default:
      usage(1);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
