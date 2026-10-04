import { describe, expect, it } from "vitest";
import { Source } from "../schemas/source.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { buildPublicDataset, PublicDataset, serializePublicDataset } from "../scripts/lib/public-export.ts";
import { fixtureContent, publishedFixture } from "./fixtures/content.ts";
import { FIXTURE_MARKER, fixtureOption, fixtureOurOption, fixtureSource, unknown, verified } from "./fixtures/factory.ts";

const privateEvidence = [
  {
    id: "fx-internal",
    internal_ref: "fixture-internal-doc",
    title: "Fixture internal note",
    publisher: "Coupler.io",
    checked_on: "2026-09-01",
    kind: "internal_docs" as const,
    public: false,
  },
];

describe("model", () => {
  it("excludes records that are not published by default", () => {
    const content = fixtureContent([Source.parse(fixtureSource()), publishedFixture({ slug: "published-source", id: "published-source" })]);
    expect(buildModel(content).sources.map((s) => s.slug)).toEqual(["published-source"]);
    expect(buildModel(content, { includeDrafts: true }).sources.map((s) => s.slug).sort()).toEqual([
      "fixture-source",
      "published-source",
    ]);
  });

  it("orders options by maintainer rank, then provider", () => {
    const record = publishedFixture({
      options: [
        fixtureOption({ id: "manual", provider: "Zed Co", maintainer: verified("manual"), method: "file_upload" }),
        fixtureOurOption(),
        fixtureOption({ id: "community", provider: "Alpha Co", maintainer: verified("community") }),
        fixtureOption({ id: "vendor", provider: "Mid Co", maintainer: verified("source_vendor") }),
      ],
      recommendations: [{ job: "x", option_id: "vendor", reason: "r", evidence_ids: ["fx-docs"] }],
    });
    const [source] = buildModel(fixtureContent([record])).sources;
    expect(source!.options.map((o) => o.id)).toEqual(["vendor", "fx-ours", "community", "manual"]);
  });

  it("ranks routes a reader cannot use today below available ones, whoever maintains them", () => {
    const record = publishedFixture({
      options: [
        fixtureOption({
          id: "vendor-pilot",
          provider: "Alpha Co",
          maintainer: verified("source_vendor"),
          route_status: verified("limited"),
        }),
        fixtureOption({
          id: "vendor-gone",
          provider: "Alpha Co",
          maintainer: verified("source_vendor"),
          route_status: verified("unavailable"),
        }),
        fixtureOurOption(),
      ],
      recommendations: [{ job: "x", option_id: "fx-ours", reason: "r", evidence_ids: ["fx-docs"] }],
    });
    const [source] = buildModel(fixtureContent([record])).sources;
    expect(source!.options.map((o) => o.id)).toEqual(["fx-ours", "vendor-pilot", "vendor-gone"]);
  });

  it("labels maintainers and marks unverified ones as not verified", () => {
    const record = publishedFixture({
      options: [fixtureOption({ maintainer: unknown() }), fixtureOurOption()],
    });
    const option = buildModel(fixtureContent([record])).sources[0]!.options.find((o) => o.id === "fx-route")!;
    expect(option.maintainer_label).toBe("Not verified");
    expect(option.badges).not.toContain("Source-vendor maintained");
  });

  it("strips private evidence references from every rendered field", () => {
    const record = publishedFixture({
      options: [
        fixtureOption({
          limits: verified("Documented limit.", ["fx-docs", "fx-internal"]),
          setup_steps: [{ text: "Step one.", evidence_ids: ["fx-docs", "fx-internal"] }],
        }),
        fixtureOurOption(),
      ],
    });
    const content = fixtureContent([], {
      sources: [{ record, privateEvidence, file: "data/sources/fixture-source.yaml" }],
    });
    const option = buildModel(content).sources[0]!.options.find((o) => o.id === "fx-route")!;
    expect(option.limits.evidence_ids).toEqual(["fx-docs"]);
    expect(option.setup_steps[0]!.evidence_ids).toEqual(["fx-docs"]);
    expect(JSON.stringify(buildModel(content))).not.toContain("fixture-internal-doc");
  });

  it("resolves related sources only when the target is visible", () => {
    const published = publishedFixture({ id: "published-source", slug: "published-source" });
    const draftTarget = Source.parse(fixtureSource({ id: "draft-source", slug: "draft-source" }));
    const record = publishedFixture({ related_source_ids: ["published-source", "draft-source"] });
    const model = buildModel(fixtureContent([record, published, draftTarget]));
    const source = model.sources.find((s) => s.id === "fixture-source")!;
    expect(source.related.map((r) => r.id)).toEqual(["published-source"]);

    const withDrafts = buildModel(fixtureContent([record, published, draftTarget]), { includeDrafts: true });
    expect(withDrafts.sources.find((s) => s.id === "fixture-source")!.related.map((r) => r.id)).toEqual([
      "published-source",
      "draft-source",
    ]);
  });

  it("builds categories only for categories that have visible sources", () => {
    const model = buildModel(fixtureContent([publishedFixture()]));
    expect(model.categories.map((c) => c.id)).toEqual(["analytics"]);
  });
});

describe("public dataset", () => {
  it("contains no drafts", () => {
    const content = fixtureContent([Source.parse(fixtureSource())]);
    const dataset = buildPublicDataset(buildModel(content, { includeDrafts: true }));
    expect(dataset.sources).toEqual([]);
  });

  it("contains no fixture markers when only real records are published", () => {
    const dataset = serializePublicDataset(buildModel(fixtureContent([Source.parse(fixtureSource())])));
    expect(dataset).not.toContain(FIXTURE_MARKER);
  });

  it("omits internal references, private evidence, and review hashes", () => {
    const record = publishedFixture({
      options: [fixtureOption({ limits: verified("Note.", ["fx-docs", "fx-internal"]) }), fixtureOurOption()],
    });
    const content = fixtureContent([], {
      sources: [{ record, privateEvidence, file: "data/sources/fixture-source.yaml" }],
    });
    const json = serializePublicDataset(buildModel(content));
    expect(json).not.toContain("internal_ref");
    expect(json).not.toContain("fixture-internal-doc");
    expect(json).not.toContain("approved_content_hash");
    expect(json).not.toContain("fx-internal");
  });

  it("declares schema version 1 with publisher and affiliation metadata", () => {
    const dataset = buildPublicDataset(buildModel(fixtureContent([publishedFixture()])));
    expect(dataset.schema_version).toBe(1);
    expect(dataset.affiliation).toBe("Fixture affiliation statement.");
    expect(dataset.sources[0]!.url).toBe("http://localhost:4321/sources/fixture-source/");
  });

  it("rejects unknown keys so new internal fields cannot leak", () => {
    const dataset = buildPublicDataset(buildModel(fixtureContent([publishedFixture()])));
    expect(PublicDataset.safeParse({ ...dataset, internal_notes: "leak" }).success).toBe(false);
    const leakyOption = { ...dataset.sources[0]!.options[0]!, internal_ref: "leak" };
    const leaky = {
      ...dataset,
      sources: [{ ...dataset.sources[0]!, options: [leakyOption] }],
    };
    expect(PublicDataset.safeParse(leaky).success).toBe(false);
  });
});
