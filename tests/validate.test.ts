import { describe, expect, it } from "vitest";
import { Source } from "../schemas/source.ts";
import { contentHash } from "../scripts/lib/hash.ts";
import { isPublished, validateContent } from "../scripts/lib/validate.ts";
import { bundle, fixtureContent, publishedFixture } from "./fixtures/content.ts";
import { fixtureOption, fixtureOurOption, fixtureSource, unknown, verified } from "./fixtures/factory.ts";

const draft = () => Source.parse(fixtureSource());

function messages(content: Parameters<typeof validateContent>[0], production = false): string[] {
  return validateContent(content, { production, allowReservedHosts: true }).map((p) => `${p.path}: ${p.message}`);
}

/** Reserved hostnames are rejected for real records; this proves the rule is active. */
function messagesWithHostCheck(content: Parameters<typeof validateContent>[0]): string[] {
  return validateContent(content).map((p) => `${p.path}: ${p.message}`);
}

describe("cross-reference validation", () => {
  it("accepts a valid draft", () => {
    expect(messages(fixtureContent([draft()]))).toEqual([]);
  });

  it("rejects duplicate ids and slugs", () => {
    const a = draft();
    const b = Source.parse(fixtureSource({ slug: "other-source" }));
    const problems = messages(fixtureContent([a, b]));
    expect(problems).toContain(`id: duplicate source id "fixture-source" (also in data/sources/fixture-source.yaml)`);
  });

  it("rejects unresolved evidence ids", () => {
    const record = Source.parse(fixtureSource({ options: [fixtureOption({ access: verified("read", ["missing"]) })] }));
    expect(messages(fixtureContent([record]))).toContain('options.fx-route.access: evidence id "missing" does not resolve');
  });

  it("accepts evidence that lives only in the private tree", () => {
    const record = Source.parse(
      fixtureSource({ options: [fixtureOption({ limits: verified("Internal note.", ["fx-internal"]) })] }),
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

  it("rejects an undefined category", () => {
    const record = Source.parse(fixtureSource({ category: "crm" }));
    expect(messages(fixtureContent([record]))).toContain(
      'category: "crm" is not defined in data/categories.yaml',
    );
  });

  it("rejects recommending a route whose availability is not verified", () => {
    const record = Source.parse(fixtureSource({ options: [fixtureOption({ route_status: unknown() })] }));
    expect(messages(fixtureContent([record]))).toContain(
      'recommendations.0: recommends "fx-route", whose availability is not a verified usable route',
    );
  });

  it("rejects recommending an unavailable route", () => {
    const record = Source.parse(fixtureSource({ options: [fixtureOption({ route_status: verified("unavailable") })] }));
    expect(messages(fixtureContent([record]))).toContain(
      'recommendations.0: recommends "fx-route", whose availability is not a verified usable route',
    );
  });

  it("rejects a stale approval hash", () => {
    const record = publishedFixture();
    const edited = Source.parse({ ...record, summary: "Edited after approval." });
    expect(isPublished(edited)).toBe(false);
    expect(messages(fixtureContent([edited]))).toContain(
      "review.approved_content_hash: does not match the record's current content; a reviewer must re-approve",
    );
  });

  it("rejects publication without a review", () => {
    const record = Source.parse(fixtureSource({ publication: "published" }));
    expect(messages(fixtureContent([record]))).toContain("review: a published record requires a human review");
  });

  it("ignores publication status when hashing, so approval survives publishing", () => {
    const a = Source.parse(fixtureSource({ publication: "draft" }));
    const b = Source.parse(fixtureSource({ publication: "published" }));
    expect(contentHash(a)).toBe(contentHash(b));
  });
});

describe("publication rules", () => {
  it("rejects placeholder text", () => {
    const record = publishedFixture({ summary: "TODO: write this." });
    expect(messages(fixtureContent([record]))).toContain("summary: contains placeholder text");
  });

  it("rejects copy that talks about the editorial workflow instead of the source", () => {
    for (const [field, text] of [
      ["summary", "This page is still a draft covering two routes."],
      ["meta_description", "Routes that have not yet been researched for this source."],
    ] as const) {
      const problems = messages(fixtureContent([publishedFixture({ [field]: text })]));
      expect(problems, field).toContain(
        `${field}: describes this repository's editorial workflow; visitor-facing copy should describe the source`,
      );
    }
  });

  it("accepts honest statements about evidence limits", () => {
    const record = publishedFixture({
      research: {
        searched_on: "2026-09-01",
        checked_urls: ["https://directory.example.test/search"],
        coverage_note:
          "The vendor documentation and the directory entry were read in full. The directory page renders in the browser only, so its contents could not be read.",
      },
    });
    expect(messages(fixtureContent([record]))).toEqual([]);
  });

  it("rejects reserved and documentation hostnames in published links", () => {
    const record = publishedFixture({
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
    const problems = messages(fixtureContent([publishedFixture({ options: [weak, fixtureOurOption()] })]));
    expect(problems).toContain("options.fx-route.access: needs a sourced access claim");
    expect(problems).toContain("options.fx-route.prerequisites: needs a sourced prerequisites claim");
    expect(problems).toContain(
      "options.fx-route.surfaces: needs at least one verified supported or limited Claude surface",
    );
    expect(problems).toContain("options.fx-route.success_check: needs a way to confirm the route works");
  });

  it("requires evidence on published setup steps", () => {
    const record = publishedFixture({
      options: [fixtureOption({ setup_steps: [{ text: "Do a thing.", evidence_ids: [] }] }), fixtureOurOption()],
    });
    expect(messages(fixtureContent([record]))).toContain(
      "options.fx-route.setup_steps.0: published setup steps need evidence",
    );
  });

  it("rejects a directory listing that points at a homepage", () => {
    const record = publishedFixture({
      options: [fixtureOption({ directory_listing: verified("https://directory.example.test/") }), fixtureOurOption()],
    });
    expect(messages(fixtureContent([record]))).toContain(
      "options.fx-route.directory_listing: must point at a specific directory entry, not a homepage",
    );
  });

  it("requires a public citation for published recommendations", () => {
    const record = publishedFixture({
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

  it("leaves drafts alone", () => {
    const record = Source.parse(fixtureSource({ summary: "TODO: still drafting." }));
    expect(messages(fixtureContent([record]))).toEqual([]);
  });
});

describe("production readiness", () => {
  it("fails while site metadata is a placeholder", () => {
    const problems = messages(fixtureContent([publishedFixture()]), true);
    expect(problems).toEqual(
      expect.arrayContaining([
        "url: production builds need an absolute https site URL",
        "repo: production builds need the repository for correction links",
        "maintainer.relationship_confirmed: the owner must confirm the disclosed relationship",
      ]),
    );
  });

  it("fails when nothing is published", () => {
    expect(messages(fixtureContent([draft()]), true)).toContain("(any): no reviewed published record to deploy");
  });
});
