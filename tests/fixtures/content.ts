/** Builds in-memory Content for tests. Synthetic only; never written to public output. */
import { SiteConfig } from "../../schemas/site.ts";
import { CategoriesFile, Source } from "../../schemas/source.ts";
import type { Content, SourceBundle } from "../../scripts/lib/load.ts";
import { contentHash } from "../../scripts/lib/hash.ts";
import { fixtureSource } from "./factory.ts";

export const fixtureSite = SiteConfig.parse({
  name: "Fixture Directory",
  tagline: "Fixture tagline.",
  url: "http://localhost:4321",
  repo: null,
  maintainer: { name: "Fixture Maintainer", relationship_confirmed: false },
  publisher: { name: "Fixture Maintainer", type: "Person" },
  affiliation_statement: "Fixture affiliation statement.",
  review_overdue_days: 90,
});

export const fixtureCategories = CategoriesFile.parse({
  categories: [
    { id: "analytics", name: "Analytics", intro: "Fixture analytics intro." },
    { id: "accounting", name: "Accounting", intro: "Fixture accounting intro." },
  ],
}).categories;

/** Parses a fixture record and attaches a matching review so it counts as published. */
export function publishedFixture(overrides: Record<string, unknown> = {}): Source {
  const draft = Source.parse(fixtureSource({ ...overrides, publication: "published", review: null }));
  const review = {
    reviewer: "Fixture Reviewer",
    reviewed_on: "2026-09-02",
    method: "docs" as const,
    approved_content_hash: contentHash(draft),
  };
  return Source.parse({ ...draft, review });
}

export function bundle(record: Source, privateEvidence: SourceBundle["privateEvidence"] = []): SourceBundle {
  return { record, privateEvidence, file: `data/sources/${record.slug}.yaml` };
}

export function fixtureContent(records: Source[], overrides: Partial<Content> = {}): Content {
  return {
    root: "/fixture",
    site: fixtureSite,
    categories: fixtureCategories,
    sources: records.map((record) => bundle(record)),
    ...overrides,
  };
}
