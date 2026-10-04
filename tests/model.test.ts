import { describe, expect, it } from "vitest";
import { Source } from "../schemas/source.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { buildPublicDataset, PublicDataset, serializePublicDataset } from "../scripts/lib/public-export.ts";
import { fixtureContent, fixtureRecord } from "./fixtures/content.ts";
import { FIXTURE_MARKER, fixtureOption, fixtureOurOption, fixtureSource, unknown, known } from "./fixtures/factory.ts";

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
  it("includes every record, sorted by name", () => {
    const content = fixtureContent([
      fixtureRecord({ slug: "b-source", id: "b-source", name: "B Source" }),
      fixtureRecord({ slug: "a-source", id: "a-source", name: "A Source" }),
    ]);
    expect(buildModel(content).sources.map((s) => s.slug)).toEqual(["a-source", "b-source"]);
  });

  it("orders options by maintainer rank, then provider", () => {
    const record = fixtureRecord({
      options: [
        fixtureOption({ id: "manual", provider: "Zed Co", maintainer: known("manual"), method: "file_upload" }),
        fixtureOurOption(),
        fixtureOption({ id: "community", provider: "Alpha Co", maintainer: known("community") }),
        fixtureOption({ id: "vendor", provider: "Mid Co", maintainer: known("source_vendor") }),
      ],
      recommendations: [{ job: "x", option_id: "vendor", reason: "r", evidence_ids: ["fx-docs"] }],
    });
    const [source] = buildModel(fixtureContent([record])).sources;
    expect(source!.options.map((o) => o.id)).toEqual(["vendor", "fx-ours", "community", "manual"]);
  });

  it("ranks routes a reader cannot use today below available ones, whoever maintains them", () => {
    const record = fixtureRecord({
      options: [
        fixtureOption({
          id: "vendor-pilot",
          provider: "Alpha Co",
          maintainer: known("source_vendor"),
          route_status: known("limited"),
        }),
        fixtureOption({
          id: "vendor-gone",
          provider: "Alpha Co",
          maintainer: known("source_vendor"),
          route_status: known("unavailable"),
        }),
        fixtureOurOption(),
      ],
      recommendations: [{ job: "x", option_id: "fx-ours", reason: "r", evidence_ids: ["fx-docs"] }],
    });
    const [source] = buildModel(fixtureContent([record])).sources;
    expect(source!.options.map((o) => o.id)).toEqual(["fx-ours", "vendor-pilot", "vendor-gone"]);
  });

  it("labels maintainers and marks unknown ones as unknown", () => {
    const record = fixtureRecord({
      options: [fixtureOption({ maintainer: unknown() }), fixtureOurOption()],
    });
    const option = buildModel(fixtureContent([record])).sources[0]!.options.find((o) => o.id === "fx-route")!;
    expect(option.maintainer_label).toBe("Unknown");
    expect(option.badges).not.toContain("Source-vendor maintained");
  });

  it("strips private evidence references from every rendered field", () => {
    const record = fixtureRecord({
      options: [
        fixtureOption({
          limits: known("Documented limit.", ["fx-docs", "fx-internal"]),
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

  it("resolves related sources and drops dangling ids", () => {
    const other = fixtureRecord({ id: "other-source", slug: "other-source" });
    const record = fixtureRecord({ related_source_ids: ["other-source", "missing-source"] });
    const model = buildModel(fixtureContent([record, other]));
    const source = model.sources.find((s) => s.id === "fixture-source")!;
    expect(source.related.map((r) => r.id)).toEqual(["other-source"]);
  });

  it("builds categories only for categories that have sources", () => {
    const model = buildModel(fixtureContent([fixtureRecord()]));
    expect(model.categories.map((c) => c.id)).toEqual(["analytics"]);
  });
});

describe("public dataset", () => {
  it("omits internal references and private evidence", () => {
    const record = fixtureRecord({
      options: [fixtureOption({ limits: known("Note.", ["fx-docs", "fx-internal"]) }), fixtureOurOption()],
    });
    const content = fixtureContent([], {
      sources: [{ record, privateEvidence, file: "data/sources/fixture-source.yaml" }],
    });
    const json = serializePublicDataset(buildModel(content));
    expect(json).not.toContain("internal_ref");
    expect(json).not.toContain("fixture-internal-doc");
    expect(json).not.toContain("fx-internal");
  });

  it("declares schema version 1 with publisher and affiliation metadata", () => {
    const dataset = buildPublicDataset(buildModel(fixtureContent([fixtureRecord()])));
    expect(dataset.schema_version).toBe(1);
    expect(dataset.affiliation).toBe("Fixture affiliation statement.");
    expect(dataset.sources[0]!.url).toBe("http://localhost:4321/sources/fixture-source/");
  });

  it("rejects unknown keys so new internal fields cannot leak", () => {
    const dataset = buildPublicDataset(buildModel(fixtureContent([fixtureRecord()])));
    expect(PublicDataset.safeParse({ ...dataset, internal_notes: "leak" }).success).toBe(false);
    const leakyOption = { ...dataset.sources[0]!.options[0]!, internal_ref: "leak" };
    const leaky = {
      ...dataset,
      sources: [{ ...dataset.sources[0]!, options: [leakyOption] }],
    };
    expect(PublicDataset.safeParse(leaky).success).toBe(false);
  });
});
