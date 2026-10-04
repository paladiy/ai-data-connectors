import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { SiteConfig } from "../schemas/site.ts";
import { generateOutputs } from "../scripts/lib/generate.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { renderCategoryPage, renderSourcePage } from "../scripts/lib/render-site.ts";
import { fixtureContent, fixtureSite, fixtureRecord } from "./fixtures/content.ts";
import { fixtureOption, fixtureOurOption, known } from "./fixtures/factory.ts";

function pageFor(overrides: Record<string, unknown> = {}, site = fixtureSite) {
  const model = buildModel(fixtureContent([fixtureRecord(overrides)], { site }));
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

  it("does not mark a page noindex", () => {
    expect(JSON.stringify(frontmatterOf(pageFor()).head)).not.toContain("noindex");
  });

  it("explains how claims are checked without hedging about the site itself", () => {
    expect(pageFor()).toContain("Each claim cites the evidence listed at the end of this page.");
  });

  it("lists aliases as visible text so search can match them", () => {
    expect(pageFor({ aliases: ["GA4", "Universal Analytics"] })).toContain("Also searched as GA4, Universal Analytics.");
  });
});

describe("category page", () => {
  it("includes an ItemList of its sources and an introduction", () => {
    const model = buildModel(fixtureContent([fixtureRecord()]));
    const page = renderCategoryPage(model.categories[0]!, model.site);
    const head = frontmatterOf(page).head as Array<{ tag: string; content?: string }>;
    const types = head.filter((tag) => tag.tag === "script").map((tag) => JSON.parse(tag.content!)["@type"]);
    expect(types).toContain("ItemList");
    expect(page).toContain("Fixture analytics intro.");
    expect(page).toContain("(/sources/fixture-source/)");
  });

  it("describes every entry by its routes", () => {
    const model = buildModel(fixtureContent([fixtureRecord()]));
    const page = renderCategoryPage(model.categories[0]!, model.site);
    expect(page).toContain("(2 routes)");
  });
});

describe("site outputs", () => {
  const content = fixtureContent([fixtureRecord()]);

  it("are byte-identical across runs", () => {
    expect([...generateOutputs(content).files.entries()]).toEqual([...generateOutputs(content).files.entries()]);
  });

  it("allow indexing and advertise the sitemap", () => {
    const robots = generateOutputs(content).files.get("site/public/robots.txt")!;
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: http://localhost:4321/sitemap-index.xml");
  });

  it("publish every record's Markdown copy and dataset entry", () => {
    const outputs = generateOutputs(content);
    expect([...outputs.files.keys()]).toContain("site/public/guides/fixture-source.md");
    expect(JSON.parse(outputs.files.get("site/public/connectors.json")!).sources).toHaveLength(1);
    expect(outputs.files.get("site/public/llms.txt")).toContain("## Source guides");
  });

  it("point the Markdown copies at their canonical HTML version", () => {
    const headers = generateOutputs(content).files.get("site/public/_headers")!;
    expect(headers).toContain("/guides/fixture-source.md");
    expect(headers).toContain("X-Robots-Tag: noindex");
    expect(headers).toContain('Link: <http://localhost:4321/sources/fixture-source/>; rel="canonical"');
  });

  it("state the affiliation near the beginning of llms.txt", () => {
    const llms = generateOutputs(content).files.get("site/public/llms.txt")!;
    expect(llms.split("\n").slice(0, 4).join("\n")).toContain(fixtureSite.affiliation_statement);
  });

  it("omit internal references from every generated file", () => {
    const record = fixtureRecord({
      options: [fixtureOption({ limits: known("Note.", ["fx-docs", "fx-internal"]) }), fixtureOurOption()],
    });
    const leaky = fixtureContent([], {
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
    for (const [file, contents] of generateOutputs(leaky).files) {
      expect(contents, file).not.toContain("fixture-internal-doc");
      expect(contents, file).not.toContain("internal_ref");
    }
  });
});
