import { promises as fs } from "node:fs";
import path from "node:path";

export const workspaceRoot = process.cwd();
export const dataRoot = path.join(workspaceRoot, "data");
export const researchRoot = path.join(workspaceRoot, "research");
export const domainPacksRoot = path.join(workspaceRoot, "domain-packs");
export const schemasRoot = path.join(workspaceRoot, "schemas");

export function toPosixRelative(filePath) {
  return path.relative(workspaceRoot, filePath).split(path.sep).join("/");
}

export function isUnderPath(rootPath, candidatePath) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonCollection(relativePath) {
  const collectionRoot = path.join(workspaceRoot, relativePath);
  if (!(await fileExists(collectionRoot))) {
    return [];
  }

  const fileNames = (await fs.readdir(collectionRoot))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(collectionRoot, fileName);
      return {
        filePath,
        relativePath: toPosixRelative(filePath),
        record: await readJson(filePath)
      };
    })
  );
}

export async function walkJsonFiles(rootPath) {
  if (!(await fileExists(rootPath))) {
    return [];
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => toPosixRelative(left).localeCompare(toPosixRelative(right)));
}

export async function withFileLock(lockPath, fn) {
  let handle;

  try {
    handle = await fs.open(lockPath, "wx");
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(`Lock already exists: ${toPosixRelative(lockPath)}. Retry after the current command finishes.`);
    }

    throw error;
  }

  try {
    return await fn();
  } finally {
    await handle.close();
    await fs.rm(lockPath, { force: true });
  }
}

export async function loadWorkbenchConfig() {
  const configPath = path.join(workspaceRoot, "workbench.config.json");
  if (!(await fileExists(configPath))) {
    return { active_domain: "sample-research" };
  }

  return readJson(configPath);
}

export async function resolveActiveDomainId() {
  const override = process.env.WORKBENCH_DOMAIN;
  if (typeof override === "string" && override.trim().length > 0) {
    return override.trim();
  }

  const config = await loadWorkbenchConfig();
  return config.active_domain;
}

export async function loadDomainPack(domainId) {
  if (typeof domainId !== "string" || domainId.trim().length === 0) {
    throw new Error("Domain id must be a non-empty string.");
  }

  const root = path.join(domainPacksRoot, domainId);
  const domain = await readJson(path.join(root, "domain.json"));
  const taxonomy = await readJson(path.join(root, domain.taxonomy_file ?? "taxonomy.v1.json"));
  const evidenceLadder = await readJson(path.join(root, domain.evidence_ladder_file ?? "evidence-ladder.v1.json"));
  const extractionSchema = await readJson(path.join(root, domain.extraction_schema_file ?? "extraction-schema.v1.json"));
  const reviewLanes = await readJson(path.join(root, domain.review_lanes_file ?? "review-lanes.v1.json"));
  const publicCopy = await readJson(path.join(root, domain.public_copy_file ?? "public-copy.v1.json"));

  return {
    id: domainId,
    root,
    domain,
    taxonomy,
    evidenceLadder,
    extractionSchema,
    reviewLanes,
    publicCopy,
    reviewLaneIds: new Set((reviewLanes.lanes ?? []).map((lane) => lane.id)),
    taxonomyNodeIds: new Set((taxonomy.nodes ?? []).map((node) => node.id))
  };
}

export async function loadActiveDomainPack() {
  return loadDomainPack(await resolveActiveDomainId());
}

export function normalizeDateTimeValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
}

export function compareDateTimesDescending(left, right) {
  return normalizeDateTimeValue(right).localeCompare(normalizeDateTimeValue(left));
}
