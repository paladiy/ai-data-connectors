import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Content } from "./load.ts";
import { buildModel, type Model } from "./model.ts";
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

export interface Outputs {
  files: Map<string, string>;
  ownedDirectories: string[];
}

function githubOutputs(model: Model): Map<string, string> {
  const files = new Map<string, string>([["README.md", renderReadme(model)]]);
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

export function generateOutputs(content: Content): Outputs {
  const model = buildModel(content);

  const files = new Map<string, string>([
    ...githubOutputs(model),
    ...siteOutputs(model),
  ]);
  return { files: sortFiles(files), ownedDirectories: [...SITE_OUTPUT_DIRECTORIES] };
}

export function committedOutputs(outputs: Outputs): Outputs {
  const files = new Map(
    [...outputs.files].filter(([file]) => file === "README.md"),
  );
  return { files, ownedDirectories: [] };
}

function sortFiles(files: Map<string, string>): Map<string, string> {
  return new Map([...files.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function listFiles(root: string, directory: string): string[] {
  const absolute = path.join(root, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)))
    .sort();
}

export function writeOutputs(root: string, outputs: Outputs): string[] {
  for (const directory of outputs.ownedDirectories) {
    rmSync(path.join(root, directory), { recursive: true, force: true });
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
  for (const directory of outputs.ownedDirectories) {
    for (const file of listFiles(root, directory)) {
      if (!outputs.files.has(file)) differences.push({ file, reason: "unexpected" });
    }
  }
  return differences.sort((a, b) => a.file.localeCompare(b.file));
}
