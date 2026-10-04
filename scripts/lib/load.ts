import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { z } from "zod";
import { SiteConfig } from "../../schemas/site.ts";
import { PrivateEvidenceFile, Source } from "../../schemas/source.ts";
import type { Evidence } from "../../schemas/common.ts";

export class ContentError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join("\n"));
    this.name = "ContentError";
  }
}

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

export interface Content {
  root: string;
  site: SiteConfig;
  sources: SourceBundle[];
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

export function loadContent(root: string = process.cwd()): Content {
  const site = parseFile(SiteConfig, path.join(root, "data", "site.yaml"), "data/site.yaml");

  const sourcesDir = path.join(root, "data", "sources");
  const files = existsSync(sourcesDir)
    ? readdirSync(sourcesDir).filter((f) => f.endsWith(".yaml")).sort()
    : [];

  const problems: string[] = [];
  const sources: SourceBundle[] = [];
  for (const file of files) {
    const label = `data/sources/${file}`;
    try {
      const record = parseFile(Source, path.join(sourcesDir, file), label);
      if (`${record.slug}.yaml` !== file) {
        problems.push(`${label}: file name must match the slug "${record.slug}"`);
      }
      sources.push({ record, privateEvidence: loadPrivateEvidence(root, record.id), file: label });
    } catch (error) {
      if (error instanceof ContentError) problems.push(...error.problems);
      else throw error;
    }
  }
  if (problems.length > 0) throw new ContentError(problems);

  return { root, site, sources };
}

export function allEvidence(bundle: SourceBundle): Evidence[] {
  return [...bundle.record.evidence, ...bundle.privateEvidence];
}
