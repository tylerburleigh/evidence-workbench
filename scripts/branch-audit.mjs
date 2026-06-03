#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { parseArgs } from "node:util";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const categories = [
  {
    id: "core_platform",
    label: "Core Platform",
    action: "Candidate for a core/<feature> branch and eventual merge to main.",
    matches: [
      /^src\//,
      /^scripts\//,
      /^schemas\//,
      /^skills\//,
      /^tests\//,
      /^plans\/generic-research-ops-framework\//,
      /^package\.json$/,
      /^package-lock\.json$/,
      /^workbench\.config\.json$/,
      /^next\.config\./
    ]
  },
  {
    id: "domain_pack",
    label: "Domain Pack",
    action: "Promote to main only if this domain is an intentional fixture or maintained example.",
    matches: [/^domain-packs\//]
  },
  {
    id: "research_records",
    label: "Research Records",
    action: "Normally keep on research/<domain-or-question> branches.",
    matches: [/^data\//]
  },
  {
    id: "research_worklog",
    label: "Research Worklog And Syntheses",
    action: "Normally keep on research branches unless a template/doc pattern is being generalized.",
    matches: [/^research\/sessions\//, /^research\/syntheses\//]
  },
  {
    id: "research_state",
    label: "Generated Research State",
    action: "Keep with the active research branch; regenerate after domain publications.",
    matches: [/^research\/state\//, /^research\/backlog\//]
  }
];

function usage(exitCode = 0) {
  const message = `
Usage:
  npm run branch:audit -- [--base main] [--head HEAD] [--json]

Examples:
  npm run branch:audit -- --base main --head HEAD
  npm run branch:audit -- --base main --head research/synthetic-student-responses
  npm --silent run branch:audit -- --base origin/main --head origin/bold-canyon --json

This command is read-only. It classifies changed paths so operators can harvest core
platform changes separately from domain-specific research corpus files.
`.trim();

  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${message}\n`);
  process.exit(exitCode);
}

function classifyPath(filePath) {
  for (const category of categories) {
    if (category.matches.some((pattern) => pattern.test(filePath))) {
      return category.id;
    }
  }

  return "other";
}

function parseNameStatus(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const status = parts[0];
      const pathIndex = status.startsWith("R") || status.startsWith("C") ? 2 : 1;
      return {
        status,
        path: parts[pathIndex] ?? parts[1] ?? ""
      };
    })
    .filter((entry) => entry.path);
}

function summarize(entries) {
  const byCategory = new Map();

  for (const entry of entries) {
    const categoryId = classifyPath(entry.path);
    const group = byCategory.get(categoryId) ?? [];
    group.push(entry);
    byCategory.set(categoryId, group);
  }

  return [
    ...categories.map((category) => ({
      ...category,
      entries: byCategory.get(category.id) ?? []
    })),
    {
      id: "other",
      label: "Other",
      action: "Inspect manually before deciding whether this belongs in core or research.",
      entries: byCategory.get("other") ?? []
    }
  ];
}

function printMarkdown({ base, head, groups, shortstat }) {
  process.stdout.write(`# Branch Audit\n\n`);
  process.stdout.write(`Base: \`${base}\`\n`);
  process.stdout.write(`Head: \`${head}\`\n`);
  process.stdout.write(`Diff: \`${base}..${head}\`\n\n`);

  if (shortstat) {
    process.stdout.write(`Summary: ${shortstat}\n\n`);
  }

  for (const group of groups) {
    process.stdout.write(`## ${group.label} (${group.entries.length})\n\n`);
    process.stdout.write(`${group.action}\n\n`);

    if (!group.entries.length) {
      process.stdout.write(`No changed paths.\n\n`);
      continue;
    }

    for (const entry of group.entries) {
      process.stdout.write(`- \`${entry.status}\` \`${entry.path}\`\n`);
    }

    process.stdout.write("\n");
  }
}

async function git(args) {
  const { stdout } = await execFile("git", args, { maxBuffer: 1024 * 1024 * 50 });
  return stdout.trim();
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: "string", default: "main" },
      head: { type: "string", default: "HEAD" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false }
    },
    allowPositionals: false
  });

  if (values.help) {
    usage(0);
  }

  const base = values.base;
  const head = values.head;
  const diffRange = `${base}..${head}`;
  const nameStatus = await git(["diff", "--name-status", "--find-renames", diffRange]);
  const shortstat = await git(["diff", "--shortstat", diffRange]).catch(() => "");
  const entries = parseNameStatus(nameStatus);
  const groups = summarize(entries);

  if (values.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          base,
          head,
          diff_range: diffRange,
          shortstat,
          groups: groups.map((group) => ({
            id: group.id,
            label: group.label,
            action: group.action,
            count: group.entries.length,
            entries: group.entries
          }))
        },
        null,
        2
      )}\n`
    );
    return;
  }

  printMarkdown({ base, head, groups, shortstat });
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
