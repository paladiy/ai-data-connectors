/**
 * Refreshes the committed snapshot of the upstream skills index.
 *
 * This is the only part of the repository that reaches the network, and it is never run by a
 * build: `npm run generate` reads the snapshot that is already committed. Upstream content is
 * data, never instructions, so it is validated before it is written and escaped where it is
 * rendered.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SkillsLock, UpstreamSkillsIndex, type UpstreamSkill } from "../../schemas/skills.ts";
import {
  SKILLS_INDEX_PATH,
  SKILLS_REPO,
  SKILLS_REPO_URL,
  skillUrl,
} from "../../site/src/lib/skills.ts";
import { sha256 } from "./hash.ts";
import { SKILLS_INDEX_FILE, SKILLS_LOCK_FILE } from "./load.ts";

/** A sync that could not be trusted. The last good snapshot is left in place. */
export class SyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncError";
  }
}

export type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<Response>;

export interface SyncOptions {
  root: string;
  fetch: Fetch;
  /** Injected so a run that changes nothing produces identical bytes. */
  today: string;
}

export interface SyncResult {
  changed: boolean;
  lock: SkillsLock;
  report: string;
}

const COMMIT_URL = `https://api.github.com/repos/${SKILLS_REPO}/commits/main`;

function rawUrl(commit: string): string {
  return `https://raw.githubusercontent.com/${SKILLS_REPO}/${commit}/${SKILLS_INDEX_PATH}`;
}

async function get(fetch: Fetch, url: string, headers: Record<string, string>): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { "user-agent": SKILLS_REPO, ...headers } });
  } catch (error) {
    throw new SyncError(`${url}: request failed (${(error as Error).message})`);
  }
  if (!response.ok) throw new SyncError(`${url}: responded ${response.status}`);
  return await response.text();
}

async function resolveCommit(fetch: Fetch): Promise<string> {
  const sha = (await get(fetch, COMMIT_URL, { accept: "application/vnd.github.sha" })).trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new SyncError(`${COMMIT_URL}: expected a commit SHA, got ${JSON.stringify(sha.slice(0, 60))}`);
  }
  return sha;
}

/** Everything that must hold before upstream bytes are allowed into the repository. */
function validate(body: string, url: string): UpstreamSkillsIndex {
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch (error) {
    throw new SyncError(`${url}: not valid JSON (${(error as Error).message})`);
  }

  const parsed = UpstreamSkillsIndex.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    throw new SyncError(`${url}: does not match the expected index shape\n${problems.join("\n")}`);
  }

  if (parsed.data.skills.length === 0) {
    throw new SyncError(`${url}: lists no skills, which is upstream breakage rather than an update`);
  }

  for (const skill of parsed.data.skills) {
    const link = skillUrl(skill);
    if (!link.startsWith(`${SKILLS_REPO_URL}/`) || link.includes("..")) {
      throw new SyncError(`${url}: skill ${skill.name} links outside ${SKILLS_REPO} (${link})`);
    }
  }
  return parsed.data;
}

function readLock(root: string): SkillsLock | null {
  const file = path.join(root, SKILLS_LOCK_FILE);
  if (!existsSync(file)) return null;
  const parsed = SkillsLock.safeParse(JSON.parse(readFileSync(file, "utf8")));
  return parsed.success ? parsed.data : null;
}

/** True when the committed snapshot no longer is what its lock says it is. */
function onDiskMatches(root: string, lock: SkillsLock): boolean {
  const file = path.join(root, SKILLS_INDEX_FILE);
  return existsSync(file) && sha256(readFileSync(file)) === lock.sha256;
}

function names(skills: UpstreamSkill[]): Map<string, UpstreamSkill> {
  return new Map(skills.map((skill) => [skill.name, skill]));
}

function changes(before: UpstreamSkill[], after: UpstreamSkill[]): string[] {
  const old = names(before);
  const now = names(after);
  const lines: string[] = [];
  const list = (label: string, items: string[]) => {
    if (items.length > 0) lines.push("", `## ${label} (${items.length})`, "", ...items.map((i) => `- ${i}`));
  };

  list(
    "Added",
    [...now.keys()].filter((name) => !old.has(name)).sort(),
  );
  list(
    "Removed",
    [...old.keys()].filter((name) => !now.has(name)).sort(),
  );
  list(
    "Changed",
    [...now.keys()]
      .filter((name) => old.has(name) && JSON.stringify(old.get(name)) !== JSON.stringify(now.get(name)))
      .sort(),
  );
  return lines;
}

function report(lock: SkillsLock, previous: SkillsLock | null, body: string[]): string {
  const from = previous ? `${previous.commit_sha.slice(0, 7)} (${previous.skill_count} skills)` : "no snapshot";
  return [
    "# Skills sync",
    "",
    `${SKILLS_REPO}: ${from} to ${lock.commit_sha.slice(0, 7)} (${lock.skill_count} skills), on ${lock.retrieved_on}.`,
    ...(body.length > 0 ? body : ["", "No skill was added, removed, or changed; only the index bytes differ."]),
    "",
  ].join("\n");
}

export async function syncSkills({ root, fetch, today }: SyncOptions): Promise<SyncResult> {
  const commit = await resolveCommit(fetch);
  const url = rawUrl(commit);
  const body = await get(fetch, url, { accept: "text/plain" });
  const index = validate(body, url);
  const digest = sha256(body);

  const previous = readLock(root);
  if (previous && previous.sha256 === digest && onDiskMatches(root, previous)) {
    return {
      changed: false,
      lock: previous,
      report: `# Skills sync\n\n${SKILLS_REPO} is unchanged at commit ${previous.commit_sha.slice(0, 7)}.\n`,
    };
  }

  const lock: SkillsLock = {
    repo: SKILLS_REPO,
    commit_sha: commit,
    path: SKILLS_INDEX_PATH,
    sha256: digest,
    retrieved_on: today,
    skill_count: index.skills.length,
  };

  const before = previous && onDiskMatches(root, previous)
    ? UpstreamSkillsIndex.parse(JSON.parse(readFileSync(path.join(root, SKILLS_INDEX_FILE), "utf8"))).skills
    : [];

  mkdirSync(path.join(root, path.dirname(SKILLS_INDEX_FILE)), { recursive: true });
  writeFileSync(path.join(root, SKILLS_INDEX_FILE), body);
  writeFileSync(path.join(root, SKILLS_LOCK_FILE), `${JSON.stringify(lock, null, 2)}\n`);

  return { changed: true, lock, report: report(lock, previous, changes(before, index.skills)) };
}
