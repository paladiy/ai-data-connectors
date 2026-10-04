import { describe, expect, it } from "vitest";
import { SiteConfig } from "../schemas/site.ts";
import { generateOutputs } from "../scripts/lib/generate.ts";
import { escapeRichText } from "../scripts/lib/markdown.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { renderGuide, renderLlmsIndex } from "../scripts/lib/render-guide.ts";
import { fixtureContent, fixtureSite, fixtureRecord } from "./fixtures/content.ts";
import { fixtureOption, fixtureOurOption, known, unknown } from "./fixtures/factory.ts";

function guideFor(overrides: Record<string, unknown> = {}, site = fixtureSite) {
  const model = buildModel(fixtureContent([fixtureRecord(overrides)], { site }));
  return renderGuide(model.sources[0]!, model.site, model.ai_tools);
}

function unescaped(pattern: string): RegExp {
  return new RegExp(`(^|[^\\\\])${pattern}`);
}

describe("rich text escaping", () => {
  it("keeps a code span and escapes the text around it", () => {
    expect(escapeRichText("Run `/mcp` and <b>confirm</b>")).toBe("Run `/mcp` and \\<b\\>confirm\\</b\\>");
  });

  it("does not swallow the spaces next to a code span", () => {
    expect(escapeRichText("a `b` c")).toBe("a `b` c");
  });
});

describe("Markdown guide", () => {
  it("contains no HTML, frontmatter, or client-side placeholder", () => {
    const guide = guideFor();
    expect(guide).not.toMatch(/<[a-zA-Z/]/);
    expect(guide.startsWith("---")).toBe(false);
    expect(guide).not.toContain("data-skills-names");
  });

  it("leads with the any-LLM title and the source summary", () => {
    const guide = guideFor();
    expect(guide.split("\n")[0]).toBe(
      "# Connect Fixture Source SYNTHETIC-FIXTURE to ChatGPT, Claude, Gemini, and other LLMs",
    );
    expect(guide).toContain("Fixture summary covering two routes.");
    expect(guide).toContain("Also known as FXS.");
  });

  it("renders hostile record text inert", () => {
    const guide = guideFor({
      summary: "Summary with {evil} and <img onerror=alert(1)> and | pipes and [x](y)",
      options: [fixtureOption({ name: "Route <b>bold</b>" }), fixtureOurOption()],
    });
    expect(guide).not.toMatch(unescaped("<img"));
    expect(guide).not.toMatch(unescaped("<b>"));
    expect(guide).toContain("\\<img onerror=alert(1)\\>");
    expect(guide).toContain("\\{evil\\}");
    expect(guide).toContain("\\[x\\](y)");
  });

  it("gives every tool a route lists its own install section", () => {
    const guide = guideFor({ options: [fixtureOurOption()], recommendations: [] });
    expect(guide).toContain(
      "#### Connect Fixture Source SYNTHETIC-FIXTURE to Fixture Chat with Fixture Ours SYNTHETIC-FIXTURE",
    );
    expect(guide).toContain(
      "#### Connect Fixture Source SYNTHETIC-FIXTURE to Fixture Agent with Fixture Ours SYNTHETIC-FIXTURE",
    );
    expect(guide).toContain("2. Choose Fixture Chat as the destination.");
    expect(guide).toContain("**Check it worked.** Fixture Chat lists fixture reports.");
    expect(guide).toContain("**Check it worked.** your fixture agent lists fixture reports.");
    expect(guide).toContain("1. Run `/mcp` and authorize.");
    expect(guide).not.toMatch(/\{(tool|destination)\}/);
  });

  it("omits a tool the route does not list", () => {
    const guide = guideFor({ options: [fixtureOurOption({ works_with: ["fx-agent"] })], recommendations: [] });
    expect(guide).toContain("Fixture Agent");
    expect(guide).not.toContain("Fixture Chat");
  });

  it("calls an undocumented capability not documented, never a no", () => {
    const guide = guideFor({ options: [fixtureOurOption({ history: unknown(), limits: unknown() })] });
    expect(guide).toContain("**Historical data.** Not documented");
    expect(guide).not.toMatch(/^- No$/m);
    expect(guide).not.toContain("Unknown");
  });

  it("lists every public evidence item with its publisher and read date", () => {
    expect(guideFor()).toContain("- [Fixture docs](https://vendor.example.test/docs) — Fixture Vendor, read 2026-09-01");
  });

  it("links related sources and the website copy with relative and absolute paths", () => {
    const site = SiteConfig.parse({ ...fixtureSite, url: "https://directory.example/" });
    const guide = guideFor({}, site);
    expect(guide).toContain("This guide is also published at [https://directory.example/sources/fixture-source/]");
  });

  it("leaves the website line out until a production URL is configured", () => {
    expect(guideFor()).not.toContain("also published at");
  });

  it("says plainly when no skill is recorded", () => {
    expect(guideFor()).toContain("No source-specific skill is recorded yet.");
  });

  it("keeps internal references out of every committed guide", () => {
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
    const guide = generateOutputs(leaky).files.get("guides/fixture-source.md")!;
    expect(guide).not.toContain("fixture-internal-doc");
    expect(guide).not.toContain("Internal note");
  });

  it("produces identical bytes from identical inputs", () => {
    expect(guideFor()).toBe(guideFor());
  });
});

describe("repository llms.txt", () => {
  const indexFor = (site = fixtureSite) =>
    renderLlmsIndex(buildModel(fixtureContent([fixtureRecord()], { site })));

  it("discloses the Coupler.io relationship before listing anything", () => {
    const index = indexFor();
    expect(index.indexOf("not an independent comparison")).toBeLessThan(index.indexOf("## Guides"));
    expect(index).toContain("Maintained by Fixture Maintainer.");
    expect(index).toContain("Not affiliated with Anthropic, OpenAI, or Google.");
  });

  it("names the employer only once the relationship is confirmed", () => {
    const confirmed = SiteConfig.parse({ ...fixtureSite, maintainer: { name: "Fixture Maintainer", relationship_confirmed: true } });
    expect(indexFor()).not.toContain("who works at Coupler.io");
    expect(indexFor(confirmed)).toContain("Fixture Maintainer, who works at Coupler.io");
  });

  it("lists each guide with its summary and the AI tools it installs into", () => {
    const index = indexFor();
    expect(index).toContain(
      "- [Connect Fixture Source SYNTHETIC-FIXTURE to ChatGPT, Claude, Gemini, and other LLMs](guides/fixture-source.md): Fixture summary covering two routes. Install steps for Fixture Chat, Fixture Agent.",
    );
  });

  it("points at raw Markdown on GitHub once the repository is configured", () => {
    const site = SiteConfig.parse({ ...fixtureSite, repo: "owner/name", url: "https://directory.example/" });
    const index = indexFor(site);
    expect(index).toContain("(https://raw.githubusercontent.com/owner/name/main/guides/fixture-source.md)");
    expect(index).toContain("- [Website](https://directory.example/)");
    expect(index).toContain("https://directory.example/connectors.json");
  });

  it("falls back to repository-relative paths and omits the unconfigured website", () => {
    const index = indexFor();
    expect(index).toContain("(guides/fixture-source.md)");
    expect(index).toContain("- [README](README.md)");
    expect(index).not.toContain("localhost:4321");
  });
});
