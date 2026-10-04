/**
 * Synthetic fixtures for tests only. Every value is fictional and marked SYNTHETIC-FIXTURE so
 * leakage tests can prove fixtures never reach public outputs.
 */
import type { Source } from "../../schemas/source.ts";

export const FIXTURE_MARKER = "SYNTHETIC-FIXTURE";

type Json = Record<string, unknown>;

export function verified<T>(value: T, evidence_ids: string[] = ["fx-docs"], note?: string) {
  return { status: "verified" as const, value, evidence_ids, ...(note ? { note } : {}) };
}

export function unknown() {
  return { status: "unknown" as const, value: null, evidence_ids: [] as string[] };
}

export function fixtureOption(overrides: Json = {}): Json {
  return {
    id: "fx-route",
    name: `Fixture Route ${FIXTURE_MARKER}`,
    provider: "Fixture Vendor",
    maintainer: verified("source_vendor"),
    method: "remote_mcp",
    route_status: verified("available"),
    directory_listing: unknown(),
    links: { overview: "https://vendor.example.test/overview", setup: "https://vendor.example.test/setup" },
    surfaces: {
      claude_web: verified("supported"),
      claude_desktop: verified("supported"),
      claude_code: unknown(),
      cowork: unknown(),
    },
    access: verified("read", ["fx-docs"], "Read-only reporting scope."),
    data_available: verified(["Fixture reports"]),
    history: unknown(),
    refresh: verified("Live API requests at query time."),
    multi_source: unknown(),
    prerequisites: verified(["A fixture account"]),
    pricing: unknown(),
    data_path: verified("Claude calls the vendor API directly."),
    limits: unknown(),
    setup_steps: [{ text: "Open the fixture connector settings.", evidence_ids: ["fx-docs"] }],
    claude_configuration: [{ text: "Enable the connector in Claude settings.", evidence_ids: ["fx-docs"] }],
    sample_query: "Show last month's fixture totals.",
    success_check: { text: "Claude lists fixture reports.", evidence_ids: ["fx-docs"] },
    ...overrides,
  };
}

export function fixtureOurOption(overrides: Json = {}): Json {
  return fixtureOption({
    id: "fx-ours",
    name: `Fixture Ours ${FIXTURE_MARKER}`,
    provider: "Coupler.io",
    maintainer: verified("third_party"),
    method: "data_platform",
    links: {
      overview: "https://ours.example.test/overview",
    },
    ...overrides,
  });
}

export function fixtureSource(overrides: Json = {}): Json {
  return {
    schema_version: 1,
    id: "fixture-source",
    slug: "fixture-source",
    name: `Fixture Source ${FIXTURE_MARKER}`,
    aliases: ["FXS"],
    category: "analytics",
    publication: "draft",
    review: null,
    summary: "Fixture summary covering two verified routes.",
    meta_description: "Fixture meta description.",
    research: {
      searched_on: "2026-09-01",
      checked_urls: ["https://directory.example.test/search"],
      coverage_note: "Fixture coverage note.",
    },
    evidence: [
      {
        id: "fx-docs",
        url: "https://vendor.example.test/docs",
        title: "Fixture docs",
        publisher: "Fixture Vendor",
        checked_on: "2026-09-01",
        kind: "vendor_docs",
        public: true,
      },
    ],
    options: [fixtureOption(), fixtureOurOption()],
    recommendations: [
      { job: "Quick questions", option_id: "fx-route", reason: "Direct access.", evidence_ids: ["fx-docs"] },
    ],
    faq: [{ question: "Is this a fixture?", answer: "Yes.", evidence_ids: ["fx-docs"] }],
    related_source_ids: [],
    ...overrides,
  };
}

export type FixtureSource = Source;
