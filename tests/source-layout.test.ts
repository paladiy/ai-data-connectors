import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { stringify } from "yaml";
import { describe, expect, it } from "vitest";
import { committedOutputs, diffOutputs, generateOutputs, writeOutputs } from "../scripts/lib/generate.ts";
import { loadContent } from "../scripts/lib/load.ts";
import { fixtureSource } from "./fixtures/factory.ts";

const repo = process.cwd();

function workspace(): string {
  const root = mkdtempSync(path.join(tmpdir(), "source-layout-"));
  cpSync(path.join(repo, "data"), path.join(root, "data"), { recursive: true });
  return root;
}

function write(root: string, file: string, contents: string): void {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), contents);
}

describe("source folder layout", () => {
  it("loads sources/<slug>/source.yaml", () => {
    const root = workspace();
    write(root, "sources/fixture-source/source.yaml", stringify(fixtureSource()));
    const content = loadContent(root);
    expect(content.sources.map((source) => source.file)).toEqual(["sources/fixture-source/source.yaml"]);
  });

  it("requires the folder name to match the slug", () => {
    const root = workspace();
    write(root, "sources/other-name/source.yaml", stringify(fixtureSource()));
    expect(() => loadContent(root)).toThrow(/folder name must match the slug "fixture-source"/);
  });

  it("rejects a record that is not in its own folder or not named source.yaml", () => {
    const root = workspace();
    write(root, "sources/fixture-source.yaml", stringify(fixtureSource()));
    write(root, "sources/fixture-source/record.yml", stringify(fixtureSource()));
    expect(() => loadContent(root)).toThrow(/sources\/fixture-source\.yaml: a source record must be/);
    expect(() => loadContent(root)).toThrow(/sources\/fixture-source\/record\.yml: a source record must be/);
  });

  it("writes the guide next to its record and removes the guide of a deleted record", () => {
    const root = workspace();
    write(root, "sources/fixture-source/source.yaml", stringify(fixtureSource()));
    write(root, "sources/gone/README.md", "stale guide\n");
    write(root, "sources/kept/notes.txt", "not generated\n");

    writeOutputs(root, generateOutputs(loadContent(root)));

    expect(readFileSync(path.join(root, "sources/fixture-source/README.md"), "utf8")).toContain("# ");
    expect(existsSync(path.join(root, "sources/fixture-source/source.yaml"))).toBe(true);
    expect(existsSync(path.join(root, "sources/gone"))).toBe(false);
    expect(existsSync(path.join(root, "sources/kept/notes.txt"))).toBe(true);
  });

  it("reports a committed guide whose record was removed", () => {
    const root = workspace();
    write(root, "sources/fixture-source/source.yaml", stringify(fixtureSource()));
    const content = loadContent(root);
    writeOutputs(root, generateOutputs(content));
    write(root, "sources/gone/README.md", "stale guide\n");

    expect(diffOutputs(root, committedOutputs(generateOutputs(content)))).toEqual([
      { file: "sources/gone/README.md", reason: "unexpected" },
    ]);
  });
});
