#!/usr/bin/env node

import { parseArgs } from "node:util";
import { getNextQueueItem, readPlanningStatus, syncResearchPlanning } from "./lib/planning.mjs";

function usage(exitCode = 0) {
  const message = `
Usage:
  npm run research:planning -- status
  npm run research:planning -- next [--mode bootstrap|surveillance]
  npm run research:planning -- sync

Notes:
  - status exposes normalized queues as queues.bootstrap and queues.surveillance.
  - next returns the highest-priority queue item for the requested mode, or the recommended next item.
  - sync rewrites research/state/coverage-status.v1.json and research/backlog/priority-queue.v1.json.
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
      mode: { type: "string" }
    },
    allowPositionals: false
  });

  switch (commandName) {
    case "status":
      printJson(await readPlanningStatus());
      break;
    case "next": {
      const mode = values.mode;
      if (mode && !["bootstrap", "surveillance"].includes(mode)) {
        throw new Error("--mode must be bootstrap or surveillance.");
      }

      const status = await readPlanningStatus();
      printJson({
        domain_id: status.domain_id,
        domain_matches: status.domain_matches,
        mode: mode ?? "recommended",
        item: getNextQueueItem(status, mode) ?? null,
        warning: status.warning
      });
      break;
    }
    case "sync":
      printJson({ action: "synced", ...(await syncResearchPlanning()) });
      break;
    default:
      usage(1);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
