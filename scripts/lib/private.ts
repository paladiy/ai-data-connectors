import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export const PRIVATE_PATH_PATTERNS: RegExp[] = [
  /^docs\//,
  /^briefs\//,
  /^plans\//,
  /^research\//,
  /^\.cursor\//,
  /^\.claude\//,
  /^data\/private\//,
  /\.private\.md$/,
  /\.internal\.md$/,
];

const PRIVATE_CONTENT_MARKERS: RegExp[] = [
  /^\s*-?\s*internal_ref\s*:/m,
  /"internal_ref"\s*:/,
];

const CONTENT_PATHS: RegExp[] = [
  /^data\//,
  /^guides\//,
  /^site\/(src|public)\//,
  /^README\.md$/,
  /^llms\.txt$/,
];

export function isPrivatePath(file: string): boolean {
  return PRIVATE_PATH_PATTERNS.some((pattern) => pattern.test(file));
}

export function isContentPath(file: string): boolean {
  return CONTENT_PATHS.some((pattern) => pattern.test(file));
}

export function findPrivateViolations(
  files: string[],
  readFile: (file: string) => string,
): string[] {
  const violations: string[] = [];
  for (const file of files) {
    if (isPrivatePath(file)) {
      violations.push(`${file}: private path is tracked`);
      continue;
    }
    if (!isContentPath(file)) continue;
    const content = readFile(file);
    for (const marker of PRIVATE_CONTENT_MARKERS) {
      if (marker.test(content)) violations.push(`${file}: contains private marker ${marker}`);
    }
  }
  return violations;
}

export function trackedFiles(root: string): string[] {
  const out = execFileSync("git", ["ls-files", "--cached", "-z"], { cwd: root, encoding: "utf8" });
  return out.split("\0").filter(Boolean);
}

export function checkRepository(root: string): string[] {
  return findPrivateViolations(trackedFiles(root), (file) =>
    readFileSync(path.join(root, file), "utf8"),
  );
}
