import type { Source } from "../../schemas/source.ts";

export const FIXTURE_MARKER = "SYNTHETIC-FIXTURE";

type Json = Record<string, unknown>;

export function known<T>(value: T, evidence_ids: string[] = ["fx-docs"], note?: string) {
  return { status: "known" as const, value, evidence_ids, ...(note ? { note } : {}) };
}

export function unknown() {
  return { status: "unknown" as const, value: null, evidence_ids: [] as string[] };
}

export function fixtureOption(overrides: Json = {}): Json {
  return {
    id: "fx-route",
    name: `Fixture Route ${FIXTURE_MARKER}`,
    provider: "Fixture Vendor",
    maintainer: known("source_vendor"),
    method: "remote_mcp",
    route_status: known("available"),
    directory_listing: unknown(),
    links: { overview: "https://vendor.example.test/overview", setup: "https://vendor.example.test/setup" },
    works_with: "all",
    access: known("read", ["fx-docs"], "Read-only reporting scope."),
    data_available: known(["Fixture reports"]),
    history: unknown(),
    refresh: known("Live API requests at query time."),
    multi_source: unknown(),
    prerequisites: known(["A fixture account"]),
    pricing: unknown(),
    data_path: known("Claude calls the vendor API directly."),
    limits: unknown(),
    setup_steps: [
      { text: "Open the fixture connector settings.", evidence_ids: ["fx-docs"] },
      { text: "Choose {destination} as the destination.", evidence_ids: ["fx-docs"] },
    ],
    sample_query: "Show last month's fixture totals.",
    success_check: { text: "{tool} lists fixture reports.", evidence_ids: ["fx-docs"] },
    ...overrides,
  };
}

export function fixtureOurOption(overrides: Json = {}): Json {
  return fixtureOption({
    id: "fx-ours",
    name: `Fixture Ours ${FIXTURE_MARKER}`,
    provider: "Coupler.io",
    maintainer: known("third_party"),
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
    summary: "Fixture summary covering two routes.",
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

export function fixtureAiTools(overrides: Json = {}): Json {
  return {
    schema_version: 1,
    evidence: [
      {
        id: "fx-tool-docs",
        url: "https://tools.example.test/docs",
        title: "Fixture tool docs",
        publisher: "Fixture Vendor",
        checked_on: "2026-09-01",
        kind: "vendor_docs",
        public: true,
      },
    ],
    shared_notes: [{ text: "Each fixture tool sees only its own datasets.", evidence_ids: ["fx-tool-docs"] }],
    tools: [
      {
        id: "fx-chat",
        name: "Fixture Chat",
        vendor: "Fixture Labs",
        connection: "remote_mcp",
        available_in: ["Fixture web", "Fixture desktop"],
        prerequisites: [{ text: "A Fixture Chat account.", evidence_ids: ["fx-tool-docs"] }],
        setups: [
          { title: "Fixture web", steps: [{ text: "Install the connector and click Connect.", evidence_ids: ["fx-tool-docs"] }] },
          { title: "Fixture CLI", steps: [{ text: "Run `/mcp` and authorize.", evidence_ids: ["fx-tool-docs"] }] },
        ],
        notes: [{ text: "Free plans may not load the tools.", evidence_ids: ["fx-tool-docs"] }],
        links: {
          setup: "https://tools.example.test/chat",
          directory: { name: "the Fixture directory", url: "https://tools.example.test/directory/coupler" },
        },
      },
      {
        id: "fx-agent",
        name: "Fixture Agent",
        in_text: "your fixture agent",
        connection: "local_mcp",
        connection_note: "Runs the server in a local container.",
        prerequisites: [{ text: "A container runtime.", evidence_ids: ["fx-tool-docs"] }],
        setups: [{ steps: [{ text: "Add the server command.", evidence_ids: ["fx-tool-docs"] }] }],
        links: { setup: "https://tools.example.test/agent", vendor: "https://agent.example.test/mcp" },
      },
    ],
    ...overrides,
  };
}

export type FixtureSource = Source;
