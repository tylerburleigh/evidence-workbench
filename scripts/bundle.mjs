#!/usr/bin/env node

import { parseArgs } from "node:util";
import {
  commandApprove,
  commandPublish,
  commandSmoke,
  commandStatus,
  commandValidate
} from "./lib/bundle-workflow.mjs";

function usage(exitCode = 0) {
  const message = `
Usage:
  npm run research:bundle -- status --bundle <bundle-id>
  npm run research:bundle -- validate --bundle <bundle-id>
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

async function main() {
  const [, , commandName, ...rest] = process.argv;
  if (!commandName || commandName === "--help" || commandName === "-h") {
    usage(0);
  }

  const { values } = parseArgs({
    args: rest,
    options: {
      bundle: { type: "string" },
      "base-url": { type: "string" },
      "published-by": { type: "string" }
    },
    allowPositionals: false
  });

  switch (commandName) {
    case "status":
      await commandStatus(values);
      break;
    case "validate":
      await commandValidate(values);
      break;
    case "approve":
      await commandApprove(values);
      break;
    case "publish":
      await commandPublish(values);
      break;
    case "smoke":
      await commandSmoke(values);
      break;
    default:
      usage(1);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
