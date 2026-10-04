import { AiToolsFile } from "../../schemas/ai-tool.ts";
import { SiteConfig } from "../../schemas/site.ts";
import { Source } from "../../schemas/source.ts";
import type { UpstreamSkill } from "../../schemas/skills.ts";
import type { Content, SkillsSnapshot, SourceBundle } from "../../scripts/lib/load.ts";
import { fixtureAiTools, fixtureSource } from "./factory.ts";

export const fixtureSite = SiteConfig.parse({
  name: "Fixture Directory",
  tagline: "Fixture tagline.",
  url: "http://localhost:4321",
  repo: null,
  maintainer: { name: "Fixture Maintainer", relationship_confirmed: false },
  publisher: { name: "Fixture Maintainer", type: "Person" },
});

export const fixtureTools = AiToolsFile.parse(fixtureAiTools());

export function fixtureRecord(overrides: Record<string, unknown> = {}): Source {
  return Source.parse(fixtureSource(overrides));
}

export function bundle(record: Source, privateEvidence: SourceBundle["privateEvidence"] = []): SourceBundle {
  return { record, privateEvidence, file: `data/sources/${record.slug}.yaml` };
}

export function fixtureSkills(skills: UpstreamSkill[]): SkillsSnapshot {
  return {
    index: { skills },
    lock: {
      repo: "coupler-io/skills",
      commit_sha: "a".repeat(40),
      path: "skills-index.json",
      sha256: "b".repeat(64),
      retrieved_on: "2026-09-01",
      skill_count: skills.length,
    },
  };
}

export function fixtureContent(records: Source[], overrides: Partial<Content> = {}): Content {
  return {
    root: "/fixture",
    site: fixtureSite,
    aiTools: fixtureTools,
    sources: records.map((record) => bundle(record)),
    skills: null,
    ...overrides,
  };
}
