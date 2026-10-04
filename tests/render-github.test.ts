import { describe, expect, it } from "vitest";
import { SiteConfig } from "../schemas/site.ts";
import { Source } from "../schemas/source.ts";
import { committedOutputs, generateOutputs } from "../scripts/lib/generate.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { escapeText } from "../scripts/lib/markdown.ts";
import { renderGuide, renderReadme } from "../scripts/lib/render-github.ts";
import { fixtureContent, fixtureSite, publishedFixture } from "./fixtures/content.ts";
import { FIXTURE_MARKER, fixtureOption, fixtureOurOption, fixtureSource, unknown, verified } from "./fixtures/factory.ts";

const guideFor = (overrides: Record<string, unknown> = {}, site = fixtureSite) => {
  const model = buildModel(fixtureContent([publishedFixture(overrides)], { site }));
  return renderGuide(model.sources[0]!, model.site);
};

/** Matches syntax that is still active, i.e. not preceded by a backslash. */
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

  it("renders hostile record text inert in a generated guide", () => {
    const guide = guideFor({
      summary: "Summary with {evil} and <img onerror=alert(1)> and | pipes",
      options: [fixtureOption({ name: "Route <b>bold</b>" }), fixtureOurOption()],
    });
    expect(guide).not.toMatch(unescaped("<img"));
    expect(guide).not.toMatch(unescaped("<b>"));
    expect(guide).toContain("\\{evil\\}");
  });
});

describe("guide rendering", () => {
  it("uses the documented title pattern and states the affiliation", () => {
    const guide = guideFor();
    expect(guide).toContain("# Fixture Source SYNTHETIC-FIXTURE to Claude: connection options and setup");
    expect(guide).toContain("Fixture affiliation statement.");
  });

  it("shows unverified capabilities as not verified rather than as a no", () => {
    const guide = guideFor({ options: [fixtureOption({ pricing: unknown() }), fixtureOurOption()] });
    expect(guide).toContain("| Price note | Not verified |");
    expect(guide).not.toContain("| Price note | No |");
  });

  it("keeps the note on an unverified claim so the page says what was checked", () => {
    const guide = guideFor({
      options: [
        fixtureOption({
          directory_listing: {
            status: "unknown",
            value: null,
            evidence_ids: [],
            note: "the directory page could not be read",
          },
        }),
        fixtureOurOption(),
      ],
    });
    expect(guide).toContain("Not verified (the directory page could not be read)");
  });

  it("explains a not-applicable claim", () => {
    const guide = guideFor({
      options: [
        fixtureOption({
          history: { status: "not_applicable", value: null, evidence_ids: [], note: "The API returns live data only." },
        }),
        fixtureOurOption(),
      ],
    });
    expect(guide).toContain("Not applicable: The API returns live data only.");
  });

  it("orders vendor-maintained routes ahead of ours and manual export last", () => {
    const guide = guideFor({
      options: [
        fixtureOption({ id: "manual", name: "Manual export", provider: "Zed", maintainer: verified("manual"), method: "file_upload" }),
        fixtureOurOption(),
        fixtureOption({ id: "vendor", name: "Vendor connector", provider: "Mid", maintainer: verified("source_vendor") }),
      ],
      recommendations: [{ job: "x", option_id: "vendor", reason: "r", evidence_ids: ["fx-docs"] }],
    });
    const order = ["Vendor connector", "Fixture Ours", "Manual export"].map((name) => guide.indexOf(name));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("records the reviewer, method, and evidence links", () => {
    const guide = guideFor();
    expect(guide).toContain("Facts reviewed by Fixture Reviewer on 2026-09-02 (documentation review)");
    expect(guide).toContain("[Fixture docs](https://vendor.example.test/docs)");
  });

  it("omits the correction link rather than explaining it is unconfigured", () => {
    const guide = guideFor();
    expect(guide).not.toContain("not configured");
    expect(guide).not.toContain("Found something wrong?");
  });

  it("renders enum values as human labels", () => {
    const guide = guideFor();
    expect(guide).toContain("| Access | Read-only");
    expect(guide).not.toMatch(/\| Access \| read \|/);
    expect(guide).toContain("| Claude web | Supported |");
  });

  it("builds a prefilled correction link once the repository is configured", () => {
    const site = SiteConfig.parse({ ...fixtureSite, repo: "owner/name", url: "https://directory.example/" });
    const guide = guideFor({}, site);
    expect(guide).toContain("https://github.com/owner/name/issues/new?template=correction.yml");
    expect(guide).toContain("source=fixture-source");
    expect(guide).toContain("Canonical version:");
  });
});

describe("README rendering", () => {
  it("describes the inclusion rule rather than announcing an empty table", () => {
    const readme = renderReadme(buildModel(fixtureContent([Source.parse(fixtureSource())])));
    expect(readme).toContain("A source guide is listed here once a reviewer has verified it");
    expect(readme).not.toContain(FIXTURE_MARKER);
  });

  it("lists published records with their review date and verified route count", () => {
    const readme = renderReadme(buildModel(fixtureContent([publishedFixture()])));
    expect(readme).toContain(
      "| Fixture Source SYNTHETIC-FIXTURE | Analytics | 2 | 2026-09-02 | [Guide](guides/fixture-source.md) |",
    );
  });

  it("states that the directory is not a connector service", () => {
    const readme = renderReadme(buildModel(fixtureContent([publishedFixture()])));
    expect(readme).toContain("It is an editorial directory, not a connector service.");
  });
});

describe("generation", () => {
  it("produces identical bytes from identical inputs", () => {
    const content = fixtureContent([publishedFixture()]);
    const first = generateOutputs(content);
    const second = generateOutputs(content);
    expect([...second.files.entries()]).toEqual([...first.files.entries()]);
  });

  it("commits a README and a guide for published records only", () => {
    const content = fixtureContent([publishedFixture(), Source.parse(fixtureSource({ id: "d", slug: "draft-one" }))]);
    const committed = committedOutputs(generateOutputs(content));
    expect([...committed.files.keys()].sort()).toEqual(["README.md", "guides/fixture-source.md"]);
    expect(committed.ownedDirectories).toEqual(["guides"]);
  });

  it("writes no Markdown copy for a draft, even in draft mode", () => {
    const content = fixtureContent([Source.parse(fixtureSource())]);
    const files = [...generateOutputs(content, { includeDrafts: true }).files.keys()];
    expect(files.filter((file) => file.startsWith("guides/"))).toEqual([]);
    expect(files.filter((file) => file.startsWith("site/public/guides/"))).toEqual([]);
    // The draft still gets a page so it can be reviewed in the local draft preview.
    expect(files).toContain("site/src/content/docs/sources/fixture-source.md");
  });

  it("renders no draft page at all in a production generation", () => {
    const content = fixtureContent([Source.parse(fixtureSource())]);
    const files = [...generateOutputs(content).files.keys()];
    expect(files.filter((file) => file.includes("fixture-source"))).toEqual([]);
  });

  it("owns only the directories it regenerates", () => {
    expect(generateOutputs(fixtureContent([])).ownedDirectories).toEqual([
      "guides",
      "site/src/generated",
      "site/src/content/docs/sources",
      "site/src/content/docs/categories",
      "site/public/guides",
    ]);
  });

  it("emits no build timestamp", () => {
    const readme = generateOutputs(fixtureContent([publishedFixture()])).files.get("README.md")!;
    expect(readme).not.toMatch(/20\d\d-\d\d-\d\dT/);
    expect(readme).not.toMatch(/\b(generated|updated) (on|at)\b/i);
  });
});
