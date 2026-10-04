/**
 * Integration test for the production build and its search index.
 *
 * It builds a throwaway copy of the application in a temporary directory, with a single synthetic
 * record, so the test does not depend on the real records.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { stringify } from "yaml";
import { beforeAll, describe, expect, it } from "vitest";
import { Source } from "../schemas/source.ts";
import { generateOutputs, writeOutputs } from "../scripts/lib/generate.ts";
import { loadContent } from "../scripts/lib/load.ts";
import { findBrokenLinks } from "../scripts/lib/links.ts";
import { fixtureOption, fixtureOurOption, fixtureSource } from "./fixtures/factory.ts";
import { validateContent } from "../scripts/lib/validate.ts";

const repo = process.cwd();

/** A record that exercises alias search: the name and the alias differ. */
function analyticsFixture(): Source {
  return Source.parse(
    fixtureSource({
      id: "fixture-analytics",
      slug: "fixture-analytics",
      name: "Fixture Analytics 4",
      aliases: ["GA4", "FixtureAnalytics"],
      summary: "Two routes for getting Fixture Analytics 4 data into Claude.",
      meta_description: "Compare Fixture Analytics 4 connection options for Claude.",
      options: [fixtureOption(), fixtureOurOption()],
    }),
  );
}

let root: string;
let dist: string;

beforeAll(() => {
  // Inside the repository (git-ignored) so Node resolves the installed packages normally.
  mkdirSync(path.join(repo, ".tmp"), { recursive: true });
  root = mkdtempSync(path.join(repo, ".tmp", "build-"));
  dist = path.join(root, "site", "dist");

  for (const entry of ["site/astro.config.mjs", "site/tsconfig.json"]) {
    mkdirSync(path.dirname(path.join(root, entry)), { recursive: true });
    cpSync(path.join(repo, entry), path.join(root, entry));
  }
  cpSync(path.join(repo, "site", "src"), path.join(root, "site", "src"), { recursive: true });
  cpSync(path.join(repo, "site", "public"), path.join(root, "site", "public"), { recursive: true });
  cpSync(path.join(repo, "data"), path.join(root, "data"), { recursive: true });

  // Replace the real records with one synthetic record.
  const sources = path.join(root, "data", "sources");
  rmSync(sources, { recursive: true, force: true });
  mkdirSync(sources, { recursive: true });
  writeFileSync(path.join(sources, "fixture-analytics.yaml"), stringify(analyticsFixture()));

  const content = loadContent(root);
  expect(validateContent(content, { allowReservedHosts: true })).toEqual([]);
  writeOutputs(root, generateOutputs(content));

  execFileSync(path.join(repo, "node_modules", ".bin", "astro"), ["build", "--root", path.join(root, "site")], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });
}, 180_000);

/** Pagefind stores its fragments and inverted index as gzip chunks. */
function pagefindChunks(kind: "fragment" | "index"): string {
  const dir = path.join(dist, "pagefind", kind);
  return readdirSync(dir)
    .map((file) => gunzipSync(readFileSync(path.join(dir, file))).toString(kind === "fragment" ? "utf8" : "latin1"))
    .join("\n");
}

describe("production build", () => {
  it("renders the connector page, the directory, and About", () => {
    for (const page of ["index.html", "sources/fixture-analytics/index.html", "about/index.html", "404.html"]) {
      expect(existsSync(path.join(dist, page)), page).toBe(true);
    }
  });

  it("indexes every published page for search", () => {
    const urls = [...pagefindChunks("fragment").matchAll(/"url":"([^"]+)"/g)].map((match) => match[1]).sort();
    expect(urls).toEqual(["/", "/about/", "/sources/fixture-analytics/"]);
  });

  it("makes an alias searchable, so a search for GA4 can reach the guide", () => {
    const fragments = pagefindChunks("fragment");
    expect(fragments).toContain("GA4");
    expect(/"url":"\/sources\/fixture-analytics\/","content":"[^"]*Fixture Analytics 4/.test(fragments)).toBe(true);
    // The term must also be in the inverted index, which is what a query actually matches against.
    expect(pagefindChunks("index").toLowerCase()).toContain("ga4");
  });

  it("has no broken internal links", () => {
    expect(findBrokenLinks(dist)).toEqual([]);
  });

  it("lists the published page in the sitemap and nothing else", () => {
    const sitemap = readFileSync(path.join(dist, "sitemap-0.xml"), "utf8");
    expect(sitemap).toContain("/sources/fixture-analytics/");
    expect(sitemap).not.toContain("draft");
  });

  it("serves a public dataset that validates and carries the published record", () => {
    const dataset = JSON.parse(readFileSync(path.join(dist, "connectors.json"), "utf8"));
    expect(dataset.schema_version).toBe(1);
    expect(dataset.sources.map((source: { slug: string }) => source.slug)).toEqual(["fixture-analytics"]);
    expect(JSON.stringify(dataset)).not.toContain("internal_ref");
  });

  it("emits a self-referencing canonical and structured data on the guide", () => {
    const html = readFileSync(path.join(dist, "sources", "fixture-analytics", "index.html"), "utf8");
    expect(html).toContain('rel="canonical" href="http://localhost:4321/sources/fixture-analytics/"');
    expect(html).toContain('"@type":"WebPage"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).not.toContain("noindex");
  });

  it("renders the six page sections in order and drops the comparison table", () => {
    const html = readFileSync(path.join(dist, "sources", "fixture-analytics", "index.html"), "utf8");
    const headings = [
      "Description",
      "How to install",
      "What it can do",
      "What data it has access to",
      "Related skills",
      "Related connectors",
    ].map((heading) => html.indexOf(`>${heading}</h2>`));
    expect(headings.every((index) => index > -1)).toBe(true);
    expect(headings).toEqual([...headings].sort((a, b) => a - b));
    expect(html).not.toContain("<table>");
    expect(html).not.toContain("utm_");
  });

  it("ships the search UI", () => {
    const html = readFileSync(path.join(dist, "index.html"), "utf8");
    expect(html).toContain('id="dx-search-input"');
    expect(existsSync(path.join(dist, "guides"))).toBe(false);
  });

  it("allows indexing and advertises the sitemap in robots.txt", () => {
    const robots = readFileSync(path.join(dist, "robots.txt"), "utf8");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap:");
  });
});
