import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { SiteConfig } from "../schemas/site.ts";
import { Source } from "../schemas/source.ts";
import { generateOutputs } from "../scripts/lib/generate.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { renderCategoryPage, renderSourcePage } from "../scripts/lib/render-site.ts";
import { daysSince } from "../site/src/lib/review.ts";
import { fixtureContent, fixtureSite, publishedFixture } from "./fixtures/content.ts";
import { FIXTURE_MARKER, fixtureOption, fixtureOurOption, fixtureSource, verified } from "./fixtures/factory.ts";

function pageFor(overrides: Record<string, unknown> = {}, site = fixtureSite) {
  const model = buildModel(fixtureContent([publishedFixture(overrides)], { site }));
  return renderSourcePage(model.sources[0]!, model.site);
}

function frontmatterOf(page: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---/.exec(page);
  return parse(match![1]!) as Record<string, unknown>;
}

describe("source page", () => {
  it("carries a self-referencing absolute canonical", () => {
    const site = SiteConfig.parse({ ...fixtureSite, url: "https://directory.example/" });
    const head = frontmatterOf(pageFor({}, site)).head as Array<Record<string, never>>;
    expect(head[0]).toEqual({ tag: "link", attrs: { rel: "canonical", href: "https://directory.example/sources/fixture-source/" } });
  });

  it("uses the documented title pattern and a unique description", () => {
    const frontmatter = frontmatterOf(pageFor());
    expect(frontmatter.title).toBe("Fixture Source SYNTHETIC-FIXTURE to Claude: connection options and setup");
    expect(frontmatter.description).toBe("Fixture meta description.");
  });

  it("includes WebPage and BreadcrumbList structured data and no invented ratings", () => {
    const head = frontmatterOf(pageFor()).head as Array<{ tag: string; content?: string }>;
    const types = head
      .filter((tag) => tag.tag === "script")
      .map((tag) => JSON.parse(tag.content!)["@type"]);
    expect(types).toEqual(["WebPage", "BreadcrumbList"]);
    expect(JSON.stringify(head)).not.toMatch(/aggregateRating|Review|ratingValue/);
  });

  it("escapes closing script sequences inside structured data", () => {
    const page = pageFor({ meta_description: "Ends with </script><script>alert(1)</script>." });
    const head = frontmatterOf(page).head as Array<{ tag: string; content?: string }>;
    const jsonLd = head.find((tag) => tag.tag === "script")!.content!;
    expect(jsonLd).not.toContain("</script>");
    expect(jsonLd).toContain("<\\/script>");
  });

  it("marks an unreviewed page noindex and flags it as a local preview", () => {
    const model = buildModel(fixtureContent([Source.parse(fixtureSource())]), { includeDrafts: true });
    const frontmatter = frontmatterOf(renderSourcePage(model.sources[0]!, model.site));
    expect(frontmatter.banner).toEqual({ content: "Editorial preview, visible only in this local build." });
    expect(frontmatter.head).toEqual(
      expect.arrayContaining([{ tag: "meta", attrs: { name: "robots", content: "noindex, nofollow" } }]),
    );
  });

  it("never explains its own review workflow in page content", () => {
    const model = buildModel(fixtureContent([Source.parse(fixtureSource())]), { includeDrafts: true });
    const body = renderSourcePage(model.sources[0]!, model.site).replace(/^---[\s\S]*?\n---/, "");
    for (const phrase of [
      "has not completed",
      "has not been reviewed",
      "not published",
      "draft",
      "excluded from",
    ]) {
      expect(body.toLowerCase(), phrase).not.toContain(phrase);
    }
  });

  it("does not mark a published page noindex", () => {
    expect(JSON.stringify(frontmatterOf(pageFor()).head)).not.toContain("noindex");
  });

  it("explains how claims are checked without hedging about the site itself", () => {
    expect(pageFor()).toContain("Each claim is checked against the evidence listed at the end of this page.");
  });

  it("exposes the review date for the client-side overdue label", () => {
    expect(pageFor()).toContain('data-reviewed-on="2026-09-02" data-overdue-days="90"');
  });

  it("lists aliases as visible text so search can match them", () => {
    expect(pageFor({ aliases: ["GA4", "Universal Analytics"] })).toContain("Also searched as GA4, Universal Analytics.");
  });
});

describe("category page", () => {
  it("includes an ItemList of its sources and an introduction", () => {
    const model = buildModel(fixtureContent([publishedFixture()]));
    const page = renderCategoryPage(model.categories[0]!, model.site);
    const head = frontmatterOf(page).head as Array<{ tag: string; content?: string }>;
    const types = head.filter((tag) => tag.tag === "script").map((tag) => JSON.parse(tag.content!)["@type"]);
    expect(types).toContain("ItemList");
    expect(page).toContain("Fixture analytics intro.");
    expect(page).toContain("(/sources/fixture-source/)");
  });

  it("describes every entry by its verified routes rather than its review status", () => {
    const model = buildModel(fixtureContent([Source.parse(fixtureSource())]), { includeDrafts: true });
    const page = renderCategoryPage(model.categories[0]!, model.site);
    expect(page).toContain("(2 verified routes)");
    expect(page.toLowerCase()).not.toContain("draft");
  });
});

describe("site outputs", () => {
  const published = fixtureContent([publishedFixture()]);

  it("are byte-identical across runs", () => {
    expect([...generateOutputs(published).files.entries()]).toEqual([...generateOutputs(published).files.entries()]);
  });

  it("keep drafts out of every public artefact", () => {
    const draftOnly = fixtureContent([Source.parse(fixtureSource())]);
    const outputs = generateOutputs(draftOnly, { includeDrafts: true });

    expect(JSON.parse(outputs.files.get("site/public/connectors.json")!).sources).toEqual([]);
    expect(outputs.files.get("site/public/llms.txt")).not.toContain("## Source guides");
    expect(outputs.files.get("site/public/_headers")).not.toContain("fixture-source");
    expect([...outputs.files.keys()]).not.toContain("site/public/guides/fixture-source.md");
  });

  it("disallow indexing in a draft preview and allow it in production", () => {
    expect(generateOutputs(published, { includeDrafts: true }).files.get("site/public/robots.txt")).toContain(
      "Disallow: /",
    );
    const production = generateOutputs(published).files.get("site/public/robots.txt")!;
    expect(production).toContain("Allow: /");
    expect(production).toContain("Sitemap: http://localhost:4321/sitemap-index.xml");
  });

  it("point the Markdown copies at their canonical HTML version", () => {
    const headers = generateOutputs(published).files.get("site/public/_headers")!;
    expect(headers).toContain("/guides/fixture-source.md");
    expect(headers).toContain("X-Robots-Tag: noindex");
    expect(headers).toContain('Link: <http://localhost:4321/sources/fixture-source/>; rel="canonical"');
  });

  it("state the affiliation near the beginning of llms.txt", () => {
    const llms = generateOutputs(published).files.get("site/public/llms.txt")!;
    expect(llms.split("\n").slice(0, 4).join("\n")).toContain(fixtureSite.affiliation_statement);
  });

  it("never leak fixture markers into the public dataset from a draft", () => {
    const draftOnly = fixtureContent([Source.parse(fixtureSource())]);
    const outputs = generateOutputs(draftOnly, { includeDrafts: true });
    expect(outputs.files.get("site/public/connectors.json")).not.toContain(FIXTURE_MARKER);
    expect(outputs.files.get("site/public/llms.txt")).not.toContain(FIXTURE_MARKER);
  });

  it("omit internal references from every generated file", () => {
    const record = publishedFixture({
      options: [fixtureOption({ limits: verified("Note.", ["fx-docs", "fx-internal"]) }), fixtureOurOption()],
    });
    const content = fixtureContent([], {
      sources: [
        {
          record,
          privateEvidence: [
            {
              id: "fx-internal",
              internal_ref: "fixture-internal-doc",
              title: "Internal note",
              publisher: "Coupler.io",
              checked_on: "2026-09-01",
              kind: "internal_docs",
              public: false,
            },
          ],
          file: "data/sources/fixture-source.yaml",
        },
      ],
    });
    for (const [file, contents] of generateOutputs(content, { includeDrafts: true }).files) {
      expect(contents, file).not.toContain("fixture-internal-doc");
      expect(contents, file).not.toContain("internal_ref");
    }
  });
});

describe("review freshness label", () => {
  it("measures whole days between the review and today", () => {
    expect(daysSince("2026-09-02", new Date("2026-09-02T23:00:00Z"))).toBe(0);
    expect(daysSince("2026-06-04", new Date("2026-10-04T08:00:00Z"))).toBe(122);
    expect(daysSince("not-a-date", new Date("2026-10-04T08:00:00Z"))).toBeNull();
  });
});
