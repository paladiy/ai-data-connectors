import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { z } from "zod";
import { AiToolsFile } from "../../schemas/ai-tool.ts";
import { SiteConfig } from "../../schemas/site.ts";
import { SkillsLock, UpstreamSkillsIndex } from "../../schemas/skills.ts";
import { sha256 } from "./hash.ts";
import { SOURCE_FILE, SOURCES_DIR, sourceFile } from "./paths.ts";
import { PrivateEvidenceFile, Source } from "../../schemas/source.ts";
import type { Evidence } from "../../schemas/common.ts";

export class ContentError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join("\n"));
    this.name = "ContentError";
  }
}

export const SKILLS_INDEX_FILE = path.join("data", "upstream", "skills-index.json");
export const SKILLS_LOCK_FILE = path.join("data", "upstream", "skills-lock.json");

function parseFile<T extends z.ZodType>(schema: T, file: string, label: string): z.infer<T> {
  let raw: unknown;
  try {
    raw = parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new ContentError([`${label}: could not be parsed (${(error as Error).message})`]);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ContentError(
      result.error.issues.map((issue) => `${label}: ${issue.path.join(".") || "(root)"}: ${issue.message}`),
    );
  }
  return result.data;
}

export interface SourceBundle {
  record: Source;
  privateEvidence: Evidence[];
  file: string;
}

export interface SkillsSnapshot {
  index: UpstreamSkillsIndex;
  lock: SkillsLock;
}

export interface Content {
  root: string;
  site: SiteConfig;
  aiTools: AiToolsFile;
  sources: SourceBundle[];
  /** Null when the snapshot has not been synced yet. A build must still succeed without it. */
  skills: SkillsSnapshot | null;
}

export type SiteConfigType = z.infer<typeof SiteConfig>;

function loadPrivateEvidence(root: string, sourceId: string): Evidence[] {
  const file = path.join(root, "data", "private", "evidence", `${sourceId}.yaml`);
  if (!existsSync(file)) return [];
  const parsed = parseFile(PrivateEvidenceFile, file, `data/private/evidence/${sourceId}.yaml`);
  if (parsed.source_id !== sourceId) {
    throw new ContentError([
      `data/private/evidence/${sourceId}.yaml: source_id "${parsed.source_id}" does not match the file name`,
    ]);
  }
  return parsed.evidence;
}

function loadSkills(root: string): SkillsSnapshot | null {
  const indexFile = path.join(root, SKILLS_INDEX_FILE);
  const lockFile = path.join(root, SKILLS_LOCK_FILE);
  if (!existsSync(indexFile) || !existsSync(lockFile)) return null;

  const lock = parseFile(SkillsLock, lockFile, SKILLS_LOCK_FILE);
  const index = parseFile(UpstreamSkillsIndex, indexFile, SKILLS_INDEX_FILE);
  const actual = sha256(readFileSync(indexFile));
  if (actual !== lock.sha256) {
    throw new ContentError([
      `${SKILLS_LOCK_FILE}: sha256 ${lock.sha256} does not match ${SKILLS_INDEX_FILE} (${actual}). ` +
        "Run `npm run sync:skills` instead of editing the snapshot by hand.",
    ]);
  }
  return { index, lock };
}

export function loadContent(root: string = process.cwd()): Content {
  const site = parseFile(SiteConfig, path.join(root, "data", "site.yaml"), "data/site.yaml");
  const aiTools = parseFile(AiToolsFile, path.join(root, "data", "ai-tools.yaml"), "data/ai-tools.yaml");

  const problems: string[] = [];
  const folders: string[] = [];
  const sourcesDir = path.join(root, SOURCES_DIR);
  if (existsSync(sourcesDir)) {
    for (const entry of readdirSync(sourcesDir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.ya?ml$/.test(entry.name)) continue;
      const relative = path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/");
      const folder = path.relative(sourcesDir, entry.parentPath);
      if (entry.name === SOURCE_FILE && folder !== "" && !folder.includes(path.sep)) folders.push(folder);
      else problems.push(`${relative}: a source record must be ${SOURCES_DIR}/<slug>/${SOURCE_FILE}`);
    }
  }

  const sources: SourceBundle[] = [];
  for (const folder of folders.sort()) {
    const label = sourceFile(folder);
    try {
      const record = parseFile(Source, path.join(root, label), label);
      if (record.slug !== folder) {
        problems.push(`${label}: folder name must match the slug "${record.slug}"`);
      }
      sources.push({ record, privateEvidence: loadPrivateEvidence(root, record.id), file: label });
    } catch (error) {
      if (error instanceof ContentError) problems.push(...error.problems);
      else throw error;
    }
  }
  if (problems.length > 0) throw new ContentError(problems);

  return { root, site, aiTools, sources, skills: loadSkills(root) };
}

export function allEvidence(bundle: SourceBundle): Evidence[] {
  return [...bundle.record.evidence, ...bundle.privateEvidence];
}
