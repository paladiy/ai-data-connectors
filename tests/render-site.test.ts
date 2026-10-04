import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { SiteConfig } from "../schemas/site.ts";
import { generateOutputs } from "../scripts/lib/generate.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { renderSourcePage } from "../scripts/lib/render-site.ts";
import { fixtureContent, fixtureSite, fixtureRecord, fixtureSkills } from "./fixtures/content.ts";
import { fixtureOption, fixtureOurOption, known } from "./fixtures/factory.ts";

function pageFor(overrides: Record<string, unknown> = {}, site = fixtureSite) {
  const model = buildModel(fixtureContent([fixtureRecord(overrides)], { site }));
  return renderSourcePage(model.sources[0]!, model.site, model.ai_tools);
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
    expect(frontmatter.title).toBe("Connect Fixture Source SYNTHETIC-FIXTURE to ChatGPT, Claude, Gemini, and other LLMs");
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

  it("does not render an evidence list or point to one", () => {
    const page = pageFor();
    expect(page).not.toContain("### Evidence");
    expect(page).not.toContain("cites the evidence");
  });

  it("lists aliases as visible text so search can match them", () => {
    expect(pageFor({ aliases: ["GA4", "Universal Analytics"] })).toContain("Also searched as GA4, Universal Analytics.");
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

  it("publish every record in the dataset and llms.txt", () => {
    const outputs = generateOutputs(content);
    expect(JSON.parse(outputs.files.get("site/public/connectors.json")!).sources).toHaveLength(1);
    expect(outputs.files.get("site/public/llms.txt")).toContain("## Connectors");
  });

  it("serve every link and URL under a GitHub project pages path", () => {
    const site = SiteConfig.parse({ ...fixtureSite, repo: null, url: "https://owner.github.io/repo" });
    const outputs = generateOutputs(fixtureContent([fixtureRecord()], { site }));
    const page = outputs.files.get("site/src/content/docs/sources/fixture-source.md")!;
    expect(frontmatterOf(page).head).toContainEqual({
      tag: "link",
      attrs: { rel: "canonical", href: "https://owner.github.io/repo/sources/fixture-source/" },
    });
    expect(page).toContain("[All sources](/repo/) · [About](/repo/about/)");
    expect(page).toContain('<a href="/repo/">Browse all connectors</a>');
    expect(page).toContain("(/repo/about/#corrections)");
    expect(outputs.files.get("site/public/robots.txt")).toContain("Sitemap: https://owner.github.io/repo/sitemap-index.xml");
    expect(outputs.files.get("site/public/llms.txt")).toContain("(https://owner.github.io/repo/connectors.json)");
    const dataset = JSON.parse(outputs.files.get("site/public/connectors.json")!);
    expect(dataset.url).toBe("https://owner.github.io/repo/");
    expect(dataset.sources[0].url).toBe("https://owner.github.io/repo/sources/fixture-source/");
    expect(outputs.files.get("README.md")).toContain("(https://owner.github.io/repo/sources/fixture-source/)");
  });

  it("generate no categories or header files", () => {
    const keys = [...generateOutputs(content).files.keys()];
    expect(keys.filter((key) => /categories|_headers/.test(key))).toEqual([]);
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
          file: "sources/fixture-source/source.yaml",
        },
      ],
    });
    for (const [file, contents] of generateOutputs(leaky).files) {
      expect(contents, file).not.toContain("fixture-internal-doc");
      expect(contents, file).not.toContain("internal_ref");
    }
  });
});

describe("source page structure", () => {
  it("lists the sections in order", () => {
    const page = pageFor();
    const order = [
      "## Description",
      "## Connection routes",
      "## Related skills",
      "## Related connectors",
    ].map((heading) => page.indexOf(heading));
    expect(order.every((index) => index > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(page).not.toContain("Compare the options");
  });

  it("shows each route's data, data path, and limits after the install steps", () => {
    const page = pageFor();
    const order = [
      '<h3 id="install-fx-ours">How to install</h3>',
      '<h3 id="data-fx-ours">What Fixture Ours SYNTHETIC-FIXTURE gives you from Fixture Source SYNTHETIC-FIXTURE</h3>',
      '<h3 id="path-fx-ours">How the data reaches the AI tool</h3>',
      '<h3 id="limits-fx-ours">Limits to expect</h3>',
    ].map((heading) => page.indexOf(heading));
    expect(order.every((index) => index > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(page).toContain("<p>Claude calls the vendor API directly.</p>");
    expect(page).toContain("<blockquote>Show last month&#39;s fixture totals.</blockquote>");
  });

  it("labels an undocumented fact as not documented, with its note", () => {
    const page = pageFor({
      options: [
        fixtureOption({ history: { status: "unknown", value: null, evidence_ids: [], note: "no window <stated>" } }),
        fixtureOurOption(),
      ],
    });
    expect(page).toContain('<dt>Historical data</dt><dd><p class="sp-muted">Not documented (no window &lt;stated&gt;)</p></dd>');
  });

  it("leaves claim notes and the not-documented disclaimer out of the page", () => {
    const page = pageFor({
      options: [fixtureOption({ limits: known(["First limit", "Second limit"], ["fx-docs"], "Fixture limits note.") }), fixtureOurOption()],
    });
    expect(page).not.toContain("Fixture limits note.");
    expect(page).not.toContain("Note: ");
    expect(page).not.toContain("instead of guessing");
  });

  it("lists several known values and each capability", () => {
    const page = pageFor({
      options: [
        fixtureOption({
          limits: known(["First limit", "Second limit"]),
          capabilities: [{ text: "Read fixture invoices.", evidence_ids: ["fx-docs"] }],
        }),
        fixtureOurOption(),
      ],
    });
    expect(page).toContain("<ul><li>First limit</li><li>Second limit</li></ul>");
    expect(page).toContain("<li>Read fixture invoices.</li>");
  });

  it("says plainly when no related connector is listed", () => {
    const page = pageFor();
    expect(page).toContain("No related connectors listed yet.");
  });

});

describe("source page related skills", () => {
  const skill = (name: string, extra: Record<string, unknown> = {}) => ({
    name,
    path: `finance/${name}`,
    category: "finance",
    sources: ["Fixture Source SYNTHETIC-FIXTURE"],
    description: 'Use for "am I on track" and "will I overspend", even without the word pacing.',
    ...extra,
  });

  const pageWith = (skills: ReturnType<typeof skill>[], overrides: Record<string, unknown> = {}) => {
    const model = buildModel(fixtureContent([fixtureRecord(overrides)], { skills: fixtureSkills(skills) }));
    return renderSourcePage(model.sources[0]!, model.site, model.ai_tools);
  };

  it("renders the matched skills into the page from the snapshot", () => {
    const page = pageWith([skill("fixture-source-budget-pacing")]);
    expect(page).toContain('<li class="sk-card" data-skill="fixture-source-budget-pacing">');
    expect(page).toContain(
      '<h3 class="sk-name"><a class="sk-title" href="https://github.com/coupler-io/skills/tree/main/finance/fixture-source-budget-pacing"',
    );
    expect(page).toContain("<li>Am I on track</li><li>Will I overspend</li>");
    expect(page).toContain('<span class="sp-badge">Finance</span>');
    expect(page).toContain("It connects no data, so connect Fixture Source SYNTHETIC-FIXTURE first.");
    expect(page).not.toContain("Loading skills");
  });

  it("puts cards beyond the first four behind a toggle that works without JavaScript", () => {
    const page = pageWith(["a", "b", "c", "d", "e", "f"].map((letter) => skill(`fixture-source-${letter}`)));
    const [shown, more] = page.split('<details class="sk-more-wrap">');
    expect(shown!.match(/class="sk-card"/g)).toHaveLength(4);
    expect(more!.match(/class="sk-card"/g)).toHaveLength(2);
    expect(more).toContain("Show 2 more skills");
  });

  it("lists recorded skills first and passes them to the browser", () => {
    const page = pageWith([skill("fixture-source-budget-pacing")], {
      related_skills: [
        {
          name: "Recorded skill",
          description: "Recorded description.",
          url: "https://skills.example.test/recorded",
          evidence_ids: ["fx-docs"],
        },
      ],
    });
    expect(page.indexOf('data-skill="Recorded skill"')).toBeLessThan(page.indexOf('data-skill="fixture-source-budget-pacing"'));
    expect(page).toContain('<p class="sk-desc">Recorded description.</p>');
    expect(page).toContain("data-skills-recorded=");
  });

  it("says so when no skill matches", () => {
    expect(pageWith([skill("other-skill", { sources: ["Stripe"] })])).toContain("No source-specific skill is listed yet.");
  });

  it("escapes upstream text", () => {
    const page = pageWith([skill("fixture-source-x", { description: "", short_description: "Runs <script>alert(1)</script>" })]);
    expect(page).not.toContain("<script>alert(1)");
    expect(page).toContain("Runs &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
