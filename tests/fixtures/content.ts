/** Builds in-memory Content for tests. Synthetic only; never written to public output. */
import { SiteConfig } from "../../schemas/site.ts";
import { Source } from "../../schemas/source.ts";
import type { Content, SourceBundle } from "../../scripts/lib/load.ts";
import { fixtureSource } from "./factory.ts";

export const fixtureSite = SiteConfig.parse({
  name: "Fixture Directory",
  tagline: "Fixture tagline.",
  url: "http://localhost:4321",
  repo: null,
  maintainer: { name: "Fixture Maintainer", relationship_confirmed: false },
  publisher: { name: "Fixture Maintainer", type: "Person" },
  affiliation_statement: "Fixture affiliation statement.",
});

/** Parses a fixture record. */
export function fixtureRecord(overrides: Record<string, unknown> = {}): Source {
  return Source.parse(fixtureSource(overrides));
}

export function bundle(record: Source, privateEvidence: SourceBundle["privateEvidence"] = []): SourceBundle {
  return { record, privateEvidence, file: `data/sources/${record.slug}.yaml` };
}

export function fixtureContent(records: Source[], overrides: Partial<Content> = {}): Content {
  return {
    root: "/fixture",
    site: fixtureSite,
    sources: records.map((record) => bundle(record)),
    ...overrides,
  };
}
