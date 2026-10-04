import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SkillsLock } from "../schemas/skills.ts";
import { sha256 } from "../scripts/lib/hash.ts";
import { SKILLS_INDEX_FILE, SKILLS_LOCK_FILE } from "../scripts/lib/load.ts";
import { SyncError, syncSkills, type Fetch } from "../scripts/lib/sync-skills.ts";

const COMMIT = "c".repeat(40);
const OTHER = "d".repeat(40);

const skill = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  path: `finance/${name}`,
  category: "finance",
  sources: ["Stripe"],
  short_description: `The ${name} skill.`,
  ...extra,
});

const indexOf = (...skills: unknown[]) => `${JSON.stringify({ skills }, null, 2)}\n`;

/** No test touches the network: every response is declared up front. */
function fakeFetch(responses: { commit?: string | number; index: string | number }): Fetch {
  return async (url) => {
    const value = url.startsWith("https://api.github.com/") ? (responses.commit ?? COMMIT) : responses.index;
    if (typeof value === "number") return new Response("", { status: value });
    return new Response(value, { status: 200 });
  };
}

function workspace(index?: string, lock?: Partial<ReturnType<typeof SkillsLock.parse>>): string {
  const root = mkdtempSync(path.join(tmpdir(), "sync-skills-"));
  mkdirSync(path.join(root, "data", "upstream"), { recursive: true });
  if (index !== undefined) {
    writeFileSync(path.join(root, SKILLS_INDEX_FILE), index);
    writeFileSync(
      path.join(root, SKILLS_LOCK_FILE),
      `${JSON.stringify(
        {
          repo: "coupler-io/skills",
          commit_sha: COMMIT,
          path: "skills-index.json",
          sha256: sha256(index),
          retrieved_on: "2026-09-01",
          skill_count: 1,
          ...lock,
        },
        null,
        2,
      )}\n`,
    );
  }
  return root;
}

const run = (root: string, fetch: Fetch, today = "2026-10-04") => syncSkills({ root, fetch, today });

const readLock = (root: string) => SkillsLock.parse(JSON.parse(readFileSync(path.join(root, SKILLS_LOCK_FILE), "utf8")));

describe("sync:skills", () => {
  it("writes the snapshot and a matching lock on a first sync", async () => {
    const root = workspace();
    const index = indexOf(skill("a"));
    const result = await run(root, fakeFetch({ index }));

    expect(result.changed).toBe(true);
    expect(readFileSync(path.join(root, SKILLS_INDEX_FILE), "utf8")).toBe(index);
    expect(readLock(root)).toEqual({
      repo: "coupler-io/skills",
      commit_sha: COMMIT,
      path: "skills-index.json",
      sha256: sha256(index),
      retrieved_on: "2026-10-04",
      skill_count: 1,
    });
  });

  it("does nothing when upstream bytes are unchanged, so no empty pull request is opened", async () => {
    const index = indexOf(skill("a"));
    const root = workspace(index);
    const before = readFileSync(path.join(root, SKILLS_LOCK_FILE), "utf8");

    const result = await run(root, fakeFetch({ commit: OTHER, index }));

    expect(result.changed).toBe(false);
    expect(readFileSync(path.join(root, SKILLS_LOCK_FILE), "utf8")).toBe(before);
    expect(result.report).toContain("unchanged");
  });

  it("reports what upstream added, removed, and changed", async () => {
    const root = workspace(indexOf(skill("a"), skill("gone")), { skill_count: 2 });
    const next = indexOf(skill("a", { short_description: "Reworded." }), skill("new"));

    const result = await run(root, fakeFetch({ commit: OTHER, index: next }));

    expect(result.changed).toBe(true);
    expect(result.report).toContain("## Added (1)\n\n- new");
    expect(result.report).toContain("## Removed (1)\n\n- gone");
    expect(result.report).toContain("## Changed (1)\n\n- a");
    expect(result.report).toContain(`${COMMIT.slice(0, 7)} (2 skills) to ${OTHER.slice(0, 7)} (2 skills)`);
  });

  it("restores a hand-edited snapshot instead of trusting the lock", async () => {
    const index = indexOf(skill("a"));
    const root = workspace(index);
    writeFileSync(path.join(root, SKILLS_INDEX_FILE), indexOf(skill("tampered")));

    const result = await run(root, fakeFetch({ index }));

    expect(result.changed).toBe(true);
    expect(readFileSync(path.join(root, SKILLS_INDEX_FILE), "utf8")).toBe(index);
  });

  describe("refuses input it cannot trust and keeps the last good snapshot", () => {
    const keptIntact = async (fetch: Fetch, message: RegExp) => {
      const index = indexOf(skill("a"));
      const root = workspace(index);
      await expect(run(root, fetch)).rejects.toThrow(message);
      await expect(run(root, fetch)).rejects.toBeInstanceOf(SyncError);
      expect(readFileSync(path.join(root, SKILLS_INDEX_FILE), "utf8")).toBe(index);
      expect(readLock(root).retrieved_on).toBe("2026-09-01");
    };

    it("rejects a body that is not JSON", () =>
      keptIntact(fakeFetch({ index: "<html>404</html>" }), /not valid JSON/));

    it("rejects an index missing a field the guides read", () =>
      keptIntact(fakeFetch({ index: indexOf({ path: "finance/a" }) }), /skills\.0\.name/));

    it("rejects an empty index, which is breakage rather than an update", () =>
      keptIntact(fakeFetch({ index: indexOf() }), /lists no skills/));

    it("rejects a path that would point a guide link at another repository", () =>
      keptIntact(fakeFetch({ index: indexOf(skill("a", { path: "../../evil" })) }), /traverse out of/));

    it("rejects an absolute URL in place of a path", () =>
      keptIntact(fakeFetch({ index: indexOf(skill("a", { path: "https://evil.test/x" })) }), /relative path/));

    it("rejects a ref that is not a commit SHA", () =>
      keptIntact(fakeFetch({ commit: "main", index: indexOf(skill("a")) }), /expected a commit SHA/));

    it("rejects a failed download", () => keptIntact(fakeFetch({ index: 500 }), /responded 500/));

    it("rejects a failed commit lookup", () =>
      keptIntact(fakeFetch({ commit: 403, index: indexOf(skill("a")) }), /responded 403/));
  });

  it("keeps an upstream field it does not use, so the snapshot stays a faithful copy", async () => {
    const root = workspace();
    const index = indexOf(skill("a", { future_field: { nested: true } }));
    await run(root, fakeFetch({ index }));
    expect(readFileSync(path.join(root, SKILLS_INDEX_FILE), "utf8")).toBe(index);
  });

  it("leaves the committed snapshot loadable, so a sync can never break the build", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "sync-skills-real-"));
    cpSync(path.join(process.cwd(), "data"), path.join(root, "data"), { recursive: true });
    const index = readFileSync(path.join(root, SKILLS_INDEX_FILE), "utf8");

    const result = await run(root, fakeFetch({ commit: OTHER, index }));

    expect(result.changed).toBe(false);
  });
});
