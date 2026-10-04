import { describe, expect, it } from "vitest";
import { findBrokenLinks } from "../scripts/lib/links.ts";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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

  it("resolves links under a base path and reports root links that miss it", () => {
    const root = site({
      "index.html": '<a href="/repo/">Home</a><a href="/repo">Bare</a><a href="/repo/sources/a/">A</a><a href="/sources/a/">Root</a>',
      "sources/a/index.html": "<p>A</p>",
    });
    expect(findBrokenLinks(root, "/repo/")).toEqual([{ page: "index.html", href: "/sources/a/" }]);
  });

  it("ignores markup inside inline scripts but checks a script's src", () => {
    const root = site({
      "index.html": '<script>const a = `<a href="${url}">`;</script><script type="module" src="/missing.js"></script>',
    });
    expect(findBrokenLinks(root)).toEqual([{ page: "index.html", href: "/missing.js" }]);
  });
});
