import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256 } from "../scripts/lib/hash.ts";
import { ContentError, loadContent } from "../scripts/lib/load.ts";

const repo = process.cwd();

function workspace(): string {
  const root = mkdtempSync(path.join(tmpdir(), "skills-snapshot-"));
  cpSync(path.join(repo, "data"), path.join(root, "data"), { recursive: true });
  return root;
}

function writeIndex(root: string, contents: string, sha?: string): void {
  const file = path.join(root, "data", "upstream", "skills-index.json");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents);
  writeFileSync(
    path.join(root, "data", "upstream", "skills-lock.json"),
    `${JSON.stringify(
      {
        repo: "coupler-io/skills",
        commit_sha: "c".repeat(40),
        path: "skills-index.json",
        sha256: sha ?? sha256(contents),
        retrieved_on: "2026-09-01",
        skill_count: 1,
      },
      null,
      2,
    )}\n`,
  );
}

describe("committed skills snapshot", () => {
  it("loads the snapshot that ships with the repository", () => {
    const content = loadContent(repo);
    expect(content.skills?.lock.repo).toBe("coupler-io/skills");
    expect(content.skills!.index.skills.length).toBe(content.skills!.lock.skill_count);
  });

  it("builds without a snapshot, so a fresh checkout is never blocked", () => {
    const root = workspace();
    rmSync(path.join(root, "data", "upstream"), { recursive: true, force: true });
    expect(loadContent(root).skills).toBeNull();
  });

  it("refuses a snapshot whose bytes do not match the lock file", () => {
    const root = workspace();
    writeIndex(root, '{"skills":[]}\n', "d".repeat(64));
    expect(() => loadContent(root)).toThrow(ContentError);
    expect(() => loadContent(root)).toThrow(/does not match/);
  });

  it("refuses an index that lost the fields the renderers read", () => {
    const root = workspace();
    writeIndex(root, '{"skills":[{"path":"a/b"}]}\n');
    expect(() => loadContent(root)).toThrow(/skills\.0\.name/);
  });

  it("accepts an upstream field it does not use, so an additive change cannot break a build", () => {
    const root = workspace();
    writeIndex(root, '{"skills":[{"name":"a","path":"a/b","future_field":1}],"future_top":true}\n');
    expect(loadContent(root).skills!.index.skills).toHaveLength(1);
  });
});
