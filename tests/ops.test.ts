import { describe, expect, it } from "vitest";
import { Source } from "../schemas/source.ts";
import { buildFreshnessReport, formatFreshnessReport } from "../scripts/lib/freshness.ts";
import { findBrokenLinks } from "../scripts/lib/links.ts";
import { fixtureContent, publishedFixture } from "./fixtures/content.ts";
import { fixtureSource } from "./fixtures/factory.ts";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const NOW = new Date("2026-10-04T08:00:00Z");

describe("freshness report", () => {
  it("flags reviews older than the configured limit without changing them", () => {
    const stale = publishedFixture();
    const record = Source.parse({
      ...stale,
      review: { ...stale.review!, reviewed_on: "2026-01-01" },
    });
    const content = fixtureContent([record]);
    const report = buildFreshnessReport(content, NOW);

    expect(report.overdue).toEqual([{ slug: "fixture-source", reviewed_on: "2026-01-01", age_days: 276 }]);
    expect(record.review!.reviewed_on).toBe("2026-01-01");
    expect(formatFreshnessReport(report, content)).toContain("The recorded dates are left untouched.");
  });

  it("lists records awaiting a first review", () => {
    const content = fixtureContent([Source.parse(fixtureSource())]);
    expect(buildFreshnessReport(content, NOW).unreviewed).toEqual(["fixture-source"]);
  });

});

describe("link checker", () => {
  function site(files: Record<string, string>): string {
    const root = mkdtempSync(path.join(tmpdir(), "links-"));
    for (const [file, contents] of Object.entries(files)) {
      const absolute = path.join(root, file);
      mkdirSync(path.dirname(absolute), { recursive: true });
      writeFileSync(absolute, contents);
    }
    return root;
  }

  it("accepts directory links that resolve to an index file", () => {
    const root = site({
      "index.html": '<a href="/sources/a/">A</a><a href="#top">Top</a><a href="https://x.test">Out</a>',
      "sources/a/index.html": "<p>A</p>",
    });
    expect(findBrokenLinks(root)).toEqual([]);
  });

  it("reports a missing internal target", () => {
    const root = site({ "index.html": '<a href="/sources/missing/">Missing</a>' });
    expect(findBrokenLinks(root)).toEqual([{ page: "index.html", href: "/sources/missing/" }]);
  });

  it("reports a missing asset", () => {
    const root = site({ "index.html": '<img src="/favicon.svg">' });
    expect(findBrokenLinks(root)).toEqual([{ page: "index.html", href: "/favicon.svg" }]);
  });
});
