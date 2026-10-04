import { describe, expect, it } from "vitest";
import { Source } from "../schemas/source.ts";
import { validateContent } from "../scripts/lib/validate.ts";
import { bundle, fixtureContent, fixtureRecord } from "./fixtures/content.ts";
import { fixtureOption, fixtureOurOption, fixtureSource, unknown, known } from "./fixtures/factory.ts";

const record = () => Source.parse(fixtureSource());

function messages(content: Parameters<typeof validateContent>[0], production = false): string[] {
  return validateContent(content, { production, allowReservedHosts: true }).map((p) => `${p.path}: ${p.message}`);
}

function messagesWithHostCheck(content: Parameters<typeof validateContent>[0]): string[] {
  return validateContent(content).map((p) => `${p.path}: ${p.message}`);
}

describe("cross-reference validation", () => {
  it("accepts a valid record", () => {
    expect(messages(fixtureContent([record()]))).toEqual([]);
  });

  it("rejects duplicate ids and slugs", () => {
    const a = record();
    const b = Source.parse(fixtureSource({ slug: "other-source" }));
    const problems = messages(fixtureContent([a, b]));
    expect(problems).toContain(`id: duplicate source id "fixture-source" (also in data/sources/fixture-source.yaml)`);
  });

  it("rejects unresolved evidence ids", () => {
    const record = Source.parse(fixtureSource({ options: [fixtureOption({ access: known("read", ["missing"]) })] }));
    expect(messages(fixtureContent([record]))).toContain('options.fx-route.access: evidence id "missing" does not resolve');
  });

  it("accepts evidence that lives only in the private tree", () => {
    const record = Source.parse(
      fixtureSource({ options: [fixtureOption({ limits: known("Internal note.", ["fx-internal"]) })] }),
    );
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
    const content = fixtureContent([], { sources: [bundle(record, privateEvidence)] });
    expect(messages(content)).toEqual([]);
  });

  it("rejects duplicate evidence and option ids", () => {
    const dup = fixtureSource({
      evidence: [
        { id: "fx-docs", url: "https://a.example.test/1", title: "A", publisher: "P", checked_on: "2026-09-01", kind: "vendor_docs", public: true },
        { id: "fx-docs", url: "https://a.example.test/2", title: "B", publisher: "P", checked_on: "2026-09-01", kind: "vendor_docs", public: true },
      ],
      options: [fixtureOption(), fixtureOption()],
    });
    const problems = messages(fixtureContent([Source.parse(dup)]));
    expect(problems).toContain("evidence.fx-docs: duplicate evidence id");
    expect(problems).toContain("options.fx-route: duplicate option id");
  });

  it("rejects unresolved option and source references", () => {
    const record = Source.parse(
      fixtureSource({
        recommendations: [{ job: "x", option_id: "nope", reason: "r", evidence_ids: [] }],
        related_source_ids: ["fixture-source", "absent-source"],
      }),
    );
    const problems = messages(fixtureContent([record]));
    expect(problems).toContain('recommendations.0: option id "nope" does not resolve');
    expect(problems).toContain("related_source_ids: a record must not relate to itself");
    expect(problems).toContain('related_source_ids: source id "absent-source" does not resolve');
  });

  it("rejects recommending a route whose availability is not known", () => {
    const record = Source.parse(fixtureSource({ options: [fixtureOption({ route_status: unknown() })] }));
    expect(messages(fixtureContent([record]))).toContain(
      'recommendations.0: recommends "fx-route", whose availability is not a usable route',
    );
  });

  it("rejects recommending an unavailable route", () => {
    const record = Source.parse(fixtureSource({ options: [fixtureOption({ route_status: known("unavailable") })] }));
    expect(messages(fixtureContent([record]))).toContain(
      'recommendations.0: recommends "fx-route", whose availability is not a usable route',
    );
  });

});

describe("record rules", () => {
  it("rejects placeholder text", () => {
    const record = fixtureRecord({ summary: "TODO: write this." });
    expect(messages(fixtureContent([record]))).toContain("summary: contains placeholder text");
  });

  it("accepts honest statements about evidence limits", () => {
    const record = fixtureRecord({
      research: {
        searched_on: "2026-09-01",
        checked_urls: ["https://directory.example.test/search"],
        coverage_note:
          "The vendor documentation and the directory entry were read in full. The directory page renders in the browser only, so its contents could not be read.",
      },
    });
    expect(messages(fixtureContent([record]))).toEqual([]);
  });

  it("rejects reserved and documentation hostnames in links", () => {
    const record = fixtureRecord({
      options: [fixtureOption({ links: { overview: "https://example.com/x" } }), fixtureOurOption()],
    });
    expect(messagesWithHostCheck(fixtureContent([record]))).toContain(
      'options.fx-route.links.overview: "https://example.com/x" looks like a placeholder URL',
    );
  });

  it("requires sourced access, prerequisites, surfaces, and a success check on load-bearing routes", () => {
    const weak = fixtureOption({
      access: unknown(),
      prerequisites: unknown(),
      surfaces: { claude_web: unknown(), claude_desktop: unknown(), claude_code: unknown(), cowork: unknown() },
      success_check: null,
    });
    const problems = messages(fixtureContent([fixtureRecord({ options: [weak, fixtureOurOption()] })]));
    expect(problems).toContain("options.fx-route.access: needs a sourced access claim");
    expect(problems).toContain("options.fx-route.prerequisites: needs a sourced prerequisites claim");
    expect(problems).toContain(
      "options.fx-route.surfaces: needs at least one known supported or limited Claude surface",
    );
    expect(problems).toContain("options.fx-route.success_check: needs a way to confirm the route works");
  });

  it("requires evidence on setup steps", () => {
    const record = fixtureRecord({
      options: [fixtureOption({ setup_steps: [{ text: "Do a thing.", evidence_ids: [] }] }), fixtureOurOption()],
    });
    expect(messages(fixtureContent([record]))).toContain(
      "options.fx-route.setup_steps.0: setup steps need evidence",
    );
  });

  it("rejects a directory listing that points at a homepage", () => {
    const record = fixtureRecord({
      options: [fixtureOption({ directory_listing: known("https://directory.example.test/") }), fixtureOurOption()],
    });
    expect(messages(fixtureContent([record]))).toContain(
      "options.fx-route.directory_listing: must point at a specific directory entry, not a homepage",
    );
  });

  it("requires a public citation for recommendations", () => {
    const record = fixtureRecord({
      evidence: [
        {
          id: "fx-private",
          url: "https://vendor.example.test/docs",
          title: "Internal summary",
          publisher: "Coupler.io",
          checked_on: "2026-09-01",
          kind: "internal_docs",
          public: false,
        },
      ],
      options: [fixtureOption({ setup_steps: [] }), fixtureOurOption({ setup_steps: [] })],
      recommendations: [{ job: "Any", option_id: "fx-route", reason: "Because.", evidence_ids: ["fx-private"] }],
      faq: [],
    });
    expect(messages(fixtureContent([record]))).toContain(
      "recommendations.0.evidence_ids: cites only private evidence; add a public citation",
    );
  });

});

describe("production readiness", () => {
  it("fails while site metadata is a placeholder", () => {
    const problems = messages(fixtureContent([fixtureRecord()]), true);
    expect(problems).toEqual(
      expect.arrayContaining([
        "url: production builds need an absolute https site URL",
        "repo: production builds need the repository for correction links",
        "maintainer.relationship_confirmed: the owner must confirm the disclosed relationship",
      ]),
    );
  });

  it("fails when there are no sources", () => {
    expect(messages(fixtureContent([]), true)).toContain("(any): no source record to deploy");
  });
});

describe("route limits", () => {
  const message = "options: list Coupler.io plus at most two alternatives, official routes first";
  const withOptions = (options: unknown[]) =>
    messages(
      fixtureContent([
        Source.parse(
          fixtureSource({
            options,
            recommendations: [{ job: "x", option_id: "a", reason: "r", evidence_ids: ["fx-docs"] }],
          }),
        ),
      ]),
    );

  it("allows Coupler.io plus two alternatives and no more", () => {
    expect(withOptions([fixtureOurOption(), fixtureOption({ id: "a" }), fixtureOption({ id: "b" })])).not.toContain(message);
    expect(
      withOptions([fixtureOurOption(), fixtureOption({ id: "a" }), fixtureOption({ id: "b" }), fixtureOption({ id: "c" })]),
    ).toContain(message);
  });
});
