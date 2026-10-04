import { describe, expect, it } from "vitest";
import { SiteConfig } from "../schemas/site.ts";
import { Source } from "../schemas/source.ts";
import { committedOutputs, generateOutputs } from "../scripts/lib/generate.ts";
import { buildModel } from "../scripts/lib/model.ts";
import { escapeText } from "../scripts/lib/markdown.ts";
import { renderReadme } from "../scripts/lib/render-github.ts";
import { renderSourcePage } from "../scripts/lib/render-site.ts";
import { fixtureContent, fixtureSite, fixtureRecord } from "./fixtures/content.ts";
import { FIXTURE_MARKER, fixtureOption, fixtureOurOption, fixtureSource, known } from "./fixtures/factory.ts";

const guideFor = (overrides: Record<string, unknown> = {}, site = fixtureSite) => {
  const model = buildModel(fixtureContent([fixtureRecord(overrides)], { site }));
  return renderSourcePage(model.sources[0]!, model.site, model.ai_tools);
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
  it("titles the page for any LLM, not Claude alone", () => {
    expect(guideFor()).toContain(
      "title: Connect Fixture Source SYNTHETIC-FIXTURE to ChatGPT, Claude, Gemini, and other LLMs",
    );
  });

  it("leaves cost out of the install steps", () => {
    const guide = guideFor({ options: [fixtureOption({ pricing: known("Free") }), fixtureOurOption()] });
    expect(guide).not.toContain('<p class="sp-label">Cost</p>');
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
    expect(guide).toContain(">Works with</h3>");
    expect(guide).toContain('<span class="sp-tool-meta">Fixture Labs · Remote MCP</span>');
    expect(guide).toContain('<span class="sp-tool-meta">Local MCP</span>');
  });

  it("offers one tile per AI tool, with the first one selected", () => {
    const guide = guideFor({ options: [fixtureOurOption()], recommendations: [] });
    const radios = [...guide.matchAll(/<input class="sp-tool-radio"[^>]*>/g)].map((match) => match[0]);
    expect(radios).toHaveLength(2);
    expect(radios[0]).toContain('value="fx-chat"');
    expect(radios[0]).toContain(" checked");
    expect(radios[1]).not.toContain(" checked");
    expect(guide).toContain("Each fixture tool sees only its own datasets.");
  });

  it("fills the source steps with the selected tool's names in each tool panel", () => {
    const guide = guideFor({ options: [fixtureOurOption()], recommendations: [] });
    const chat = guide.match(/<div class="sp-tool-panel" data-tool="fx-chat">.*?<\/div>/)![0];
    const agent = guide.match(/<div class="sp-tool-panel" data-tool="fx-agent">.*?<\/div>/)![0];
    expect(chat).toContain("<li>Choose Fixture Chat as the destination.</li>");
    expect(chat).toContain("<p>Fixture Chat lists fixture reports.</p>");
    expect(agent).toContain("<li>Choose Fixture Agent as the destination.</li>");
    expect(agent).toContain("<p>your fixture agent lists fixture reports.</p>");
    expect(guide).not.toMatch(/\{(tool|destination)\}/);
  });

  it("renders each tool's own setups, notes, and links", () => {
    const guide = guideFor({ options: [fixtureOurOption()], recommendations: [] });
    const chat = guide.match(/<div class="sp-tool-panel" data-tool="fx-chat">.*?<\/div>/)![0];
    const agent = guide.match(/<div class="sp-tool-panel" data-tool="fx-agent">.*?<\/div>/)![0];
    expect(chat).not.toContain("Before you start");
    expect(chat).not.toContain("A Fixture Chat account.");
    expect(chat).toContain('<p class="sp-label">In Fixture web</p>');
    expect(chat).toContain("<li>Run <code>/mcp</code> and authorize.</li>");
    expect(chat).toContain("Works in Fixture web, Fixture desktop.");
    expect(chat).toContain("Free plans may not load the tools.");
    expect(chat).toContain('<a href="https://tools.example.test/directory/coupler">Coupler.io in the Fixture directory</a>');
    expect(agent).toContain('<p class="sp-label">In Fixture Agent</p>');
    expect(agent).toContain("Runs the server in a local container.");
    expect(agent).toContain('href="https://agent.example.test/mcp"');
    expect(agent).not.toContain("Free plans may not load the tools.");
  });

  it("limits the picker to the tools a route lists", () => {
    const guide = guideFor({ options: [fixtureOurOption({ works_with: ["fx-agent"] })], recommendations: [] });
    expect(guide).toContain('data-tool="fx-agent"');
    expect(guide).not.toContain('data-tool="fx-chat"');
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

  it("lists every record with its Coupler.io sample question", () => {
    const readme = renderReadme(buildModel(fixtureContent([fixtureRecord()])));
    expect(readme).toContain("| Fixture Source SYNTHETIC-FIXTURE | “Show last month's fixture totals.” | — |");
  });

  it("links the Coupler.io landing page cited in a record's evidence", () => {
    const record = fixtureRecord();
    const content = fixtureContent([
      {
        ...record,
        evidence: [
          ...record.evidence,
          {
            id: "fx-landing",
            url: "https://www.coupler.io/claude-integrations/fixture-to-claude",
            title: "Fixture landing page",
            publisher: "Coupler.io",
            checked_on: "2026-09-01",
            kind: "vendor_docs",
            public: true,
          },
        ],
      },
    ]);
    const readme = renderReadme(buildModel(content));
    expect(readme).toContain("(https://www.coupler.io/claude-integrations/fixture-to-claude)");
  });

  it("lists the AI tools beyond Claude", () => {
    const readme = renderReadme(buildModel(fixtureContent([fixtureRecord()])));
    for (const tool of ["| Claude |", "| ChatGPT |", "| Gemini CLI |", "| Microsoft Copilot Studio |", "| Any MCP-compatible client |"]) {
      expect(readme).toContain(tool);
    }
  });

  it("puts the Coupler.io overview before the developer material", () => {
    const readme = renderReadme(buildModel(fixtureContent([fixtureRecord()])));
    const order = [
      "## How to connect your business data to an LLM",
      "## Supported LLMs and AI tools",
      "## Data sources you can connect",
      "## Frequently asked questions",
      "## For developers and contributors",
      "### Repository commands",
    ].map((heading) => readme.indexOf(heading));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
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
