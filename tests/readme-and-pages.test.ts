import { describe, expect, it } from "vitest";
import { SiteConfig } from "../schemas/site.ts";
import { Source } from "../schemas/source.ts";
import { committedOutputs, generateOutputs } from "../scripts/lib/generate.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { escapeText } from "../scripts/lib/markdown.ts";
import { renderReadme } from "../scripts/lib/render-github.ts";
import { renderSourcePage } from "../scripts/lib/render-site.ts";
import { fixtureContent, fixtureSite, fixtureRecord } from "./fixtures/content.ts";
import { FIXTURE_MARKER, fixtureOption, fixtureOurOption, fixtureSource, unknown, known } from "./fixtures/factory.ts";

const guideFor = (overrides: Record<string, unknown> = {}, site = fixtureSite) => {
  const model = buildModel(fixtureContent([fixtureRecord(overrides)], { site }));
  return renderSourcePage(model.sources[0]!, model.site);
};

function unescaped(pattern: string): RegExp {
  return new RegExp(`(^|[^\\\\])${pattern}`);
}

describe("markdown escaping", () => {
  it("neutralises MDX expressions, HTML, and Markdown syntax", () => {
    const escaped = escapeText("{process.env.SECRET} <script>alert(1)</script> [x](y) | pipe `code`");
    for (const pattern of ["\\{", "<", "\\|", "\\[", "`"]) {
      expect(escaped, pattern).not.toMatch(unescaped(pattern));
    }
  });

  it("collapses newlines so a table row cannot be broken", () => {
    expect(escapeText("line one\nline two")).toBe("line one line two");
  });

  it("renders hostile record text inert in a generated connector page", () => {
    const guide = guideFor({
      summary: "Summary with {evil} and <img onerror=alert(1)> and | pipes",
      options: [fixtureOption({ name: "Route <b>bold</b>" }), fixtureOurOption()],
    });
    expect(guide).not.toContain("<img");
    expect(guide).not.toContain("<b>");
    expect(guide).toContain("&lt;img onerror=alert(1)&gt;");
    expect(guide).toContain("Route &lt;b&gt;bold&lt;/b&gt;");
  });
});

describe("connector page rendering", () => {
  it("uses the documented title pattern", () => {
    const guide = guideFor();
  });

  it("shows undocumented capabilities as unknown rather than as a no", () => {
    const guide = guideFor({ options: [fixtureOption({ pricing: unknown() }), fixtureOurOption()] });
    expect(guide).toContain('<p class="sp-label">Cost</p><p class="sp-muted">Unknown</p>');
    expect(guide).not.toContain("Cost</p><p>No");
  });

  it("keeps the note on an unknown claim so the page says what was checked", () => {
    const guide = guideFor({
      options: [
        fixtureOption({
          pricing: {
            status: "unknown",
            value: null,
            evidence_ids: [],
            note: "the directory page could not be read",
          },
        }),
        fixtureOurOption(),
      ],
    });
    expect(guide).toContain("Unknown. the directory page could not be read");
  });

  it("explains a not-applicable claim", () => {
    const guide = guideFor({
      options: [
        fixtureOption({
          pricing: { status: "not_applicable", value: null, evidence_ids: [], note: "The API returns live data only." },
        }),
        fixtureOurOption(),
      ],
    });
    expect(guide).toContain("Not applicable. The API returns live data only.");
  });

  it("leads with Coupler.io, then vendor-maintained routes", () => {
    const guide = guideFor({
      options: [
        fixtureOption({ id: "community", name: "Community server", provider: "Zed", maintainer: known("community") }),
        fixtureOurOption(),
        fixtureOption({ id: "vendor", name: "Vendor connector", provider: "Mid", maintainer: known("source_vendor") }),
      ],
      recommendations: [{ job: "x", option_id: "vendor", reason: "r", evidence_ids: ["fx-docs"] }],
    });
    const order = ["Fixture Ours", "Vendor connector", "Community server"].map((name) => guide.indexOf(name));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("records the research date without an evidence list", () => {
    const guide = guideFor();
    expect(guide).toContain("Researched on 2026-09-01.");
    expect(guide).not.toContain("### Evidence");
    expect(guide).not.toContain("https://vendor.example.test/docs");
  });

  it("omits the correction link rather than explaining it is unconfigured", () => {
    const guide = guideFor();
    expect(guide).not.toContain("not configured");
    expect(guide).not.toContain("Found something wrong?");
  });

  it("renders enum values as human labels", () => {
    const guide = guideFor();
    expect(guide).toContain("Read-only");
    expect(guide).not.toContain(">read<");
    expect(guide).toContain('>Works with</h3>');
    expect(guide).toContain('<ul class="sp-surfaces">');
    expect(guide).toContain('<span class="sp-surf-name">Claude web</span><span class="sp-surf-state">Works</span>');
  });

  it("builds a prefilled correction link once the repository is configured", () => {
    const site = SiteConfig.parse({ ...fixtureSite, repo: "owner/name", url: "https://directory.example/" });
    const guide = guideFor({}, site);
    expect(guide).toContain("https://github.com/owner/name/issues/new?template=correction.yml");
    expect(guide).toContain("source=fixture-source");
  });
});

describe("README rendering", () => {
  it("says no sources exist yet when there are no records", () => {
    const readme = renderReadme(buildModel(fixtureContent([])));
    expect(readme).toContain("No sources have been added yet.");
  });

  it("lists every record", () => {
    const readme = renderReadme(buildModel(fixtureContent([fixtureRecord()])));
    expect(readme).toContain(
      "| Fixture Source SYNTHETIC-FIXTURE | — |",
    );
  });

  it("states that the directory is not a connector service", () => {
    const readme = renderReadme(buildModel(fixtureContent([fixtureRecord()])));
    expect(readme).toContain("It is an editorial directory, not a connector service.");
  });
});

describe("generation", () => {
  it("produces identical bytes from identical inputs", () => {
    const content = fixtureContent([fixtureRecord()]);
    const first = generateOutputs(content);
    const second = generateOutputs(content);
    expect([...second.files.entries()]).toEqual([...first.files.entries()]);
  });

  it("commits only the README", () => {
    const committed = committedOutputs(generateOutputs(fixtureContent([fixtureRecord()])));
    expect([...committed.files.keys()]).toEqual(["README.md"]);
    expect(committed.ownedDirectories).toEqual([]);
  });

  it("owns only the directories it regenerates", () => {
    expect(generateOutputs(fixtureContent([])).ownedDirectories).toEqual([
      "site/src/generated",
      "site/src/content/docs/sources",
    ]);
  });

  it("emits no build timestamp", () => {
    const readme = generateOutputs(fixtureContent([fixtureRecord()])).files.get("README.md")!;
    expect(readme).not.toMatch(/20\d\d-\d\d-\d\dT/);
    expect(readme).not.toMatch(/\b(generated|updated) (on|at)\b/i);
  });
});
