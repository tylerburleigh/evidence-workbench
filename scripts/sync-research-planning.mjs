#!/usr/bin/env node

import { syncResearchPlanning } from "./lib/planning.mjs";

try {
  const result = await syncResearchPlanning();
  process.stdout.write(`${JSON.stringify({ action: "synced", ...result }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exit(1);
}
