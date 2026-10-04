import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Content } from "./load.ts";
import { buildModel, type Model } from "./model.ts";
import { GUIDE_FILE_PATTERN, guideFile, SOURCES_DIR } from "./paths.ts";
import { renderGuide, renderLlmsIndex } from "./render-guide.ts";
import { renderReadme } from "./render-github.ts";
import {
  buildDirectoryData,
  renderIndexPage,
  renderLlmsTxt,
  renderPublicDataset,
  renderRobotsTxt,
  renderSourcePage,
} from "./render-site.ts";
import { renderToolCss } from "./render-source-page.ts";

/** Files under `directory` whose repository path matches `pattern`; the rest of the directory is not generated. */
export interface OwnedFiles {
  directory: string;
  pattern: RegExp;
}

export interface Outputs {
  files: Map<string, string>;
  ownedDirectories: string[];
  ownedFiles: OwnedFiles[];
}

function githubOutputs(model: Model): Map<string, string> {
  const files = new Map<string, string>([
    ["README.md", renderReadme(model)],
    ["llms.txt", renderLlmsIndex(model)],
  ]);
  for (const source of model.sources) {
    files.set(
      guideFile(source.slug),
      renderGuide(source, model.site, model.ai_tools, model.skills_snapshot),
    );
  }
  return files;
}

function siteOutputs(model: Model): Map<string, string> {
  const files = new Map<string, string>([
    ["site/src/content/docs/index.mdx", renderIndexPage(model)],
    ["site/src/generated/site.json", `${JSON.stringify(model.site, null, 2)}\n`],
    ["site/src/generated/directory.json", `${JSON.stringify(buildDirectoryData(model), null, 2)}\n`],
    ["site/src/generated/ai-tools.css", renderToolCss(model.ai_tools)],
    ["site/public/connectors.json", renderPublicDataset(model)],
    ["site/public/llms.txt", renderLlmsTxt(model)],
    ["site/public/robots.txt", renderRobotsTxt(model)],
  ]);

  for (const source of model.sources) {
    files.set(`site/src/content/docs/sources/${source.slug}.md`, renderSourcePage(source, model.site, model.ai_tools));
  }
  return files;
}

export const SITE_OUTPUT_DIRECTORIES = [
  "site/src/generated",
  "site/src/content/docs/sources",
];

/**
 * Guides share their folders with the hand-edited source records, so only the guide files are owned:
 * removing a source record removes its committed guide and leaves everything else alone.
 */
export const COMMITTED_OWNED_FILES: OwnedFiles[] = [{ directory: SOURCES_DIR, pattern: GUIDE_FILE_PATTERN }];

export function generateOutputs(content: Content): Outputs {
  const model = buildModel(content);

  const files = new Map<string, string>([
    ...githubOutputs(model),
    ...siteOutputs(model),
  ]);
  return {
    files: sortFiles(files),
    ownedDirectories: [...SITE_OUTPUT_DIRECTORIES],
    ownedFiles: [...COMMITTED_OWNED_FILES],
  };
}

const COMMITTED = (file: string) =>
  file === "README.md" || file === "llms.txt" || GUIDE_FILE_PATTERN.test(file);

export function committedOutputs(outputs: Outputs): Outputs {
  const files = new Map([...outputs.files].filter(([file]) => COMMITTED(file)));
  return { files, ownedDirectories: [], ownedFiles: [...COMMITTED_OWNED_FILES] };
}

function sortFiles(files: Map<string, string>): Map<string, string> {
  return new Map([...files.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function listFiles(root: string, directory: string): string[] {
  const absolute = path.join(root, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
    .sort();
}

function listOwnedFiles(root: string, owned: OwnedFiles): string[] {
  return listFiles(root, owned.directory).filter((file) => owned.pattern.test(file));
}

export function writeOutputs(root: string, outputs: Outputs): string[] {
  for (const directory of outputs.ownedDirectories) {
    rmSync(path.join(root, directory), { recursive: true, force: true });
  }
  for (const owned of outputs.ownedFiles) {
    for (const file of listOwnedFiles(root, owned)) {
      if (outputs.files.has(file)) continue;
      const absolute = path.join(root, file);
      rmSync(absolute);
      const folder = path.dirname(absolute);
      if (readdirSync(folder).length === 0) rmdirSync(folder);
    }
  }
  const written: string[] = [];
  for (const [file, contents] of outputs.files) {
    const absolute = path.join(root, file);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, contents);
    written.push(file);
  }
  return written;
}

export interface Difference {
  file: string;
  reason: "missing" | "stale" | "unexpected";
}

export function diffOutputs(root: string, outputs: Outputs): Difference[] {
  const differences: Difference[] = [];
  for (const [file, contents] of outputs.files) {
    const absolute = path.join(root, file);
    if (!existsSync(absolute)) differences.push({ file, reason: "missing" });
    else if (readFileSync(absolute, "utf8") !== contents) differences.push({ file, reason: "stale" });
  }
  const owned = [
    ...outputs.ownedDirectories.flatMap((directory) => listFiles(root, directory)),
    ...outputs.ownedFiles.flatMap((files) => listOwnedFiles(root, files)),
  ];
  for (const file of owned) {
    if (!outputs.files.has(file)) differences.push({ file, reason: "unexpected" });
  }
  return differences.sort((a, b) => a.file.localeCompare(b.file));
}
