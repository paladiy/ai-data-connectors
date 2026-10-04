import { describe, expect, it } from "vitest";
import { Evidence } from "../schemas/common.ts";
import { Source } from "../schemas/source.ts";
import { fixtureOption, fixtureSource, unknown, verified } from "./fixtures/factory.ts";

function issues(input: unknown): string[] {
  const result = Source.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("source schema", () => {
  it("accepts a valid synthetic record", () => {
    expect(issues(fixtureSource())).toEqual([]);
  });

  it("rejects invalid enums", () => {
    expect(issues(fixtureSource({ category: "finance" }))).not.toEqual([]);
    expect(issues(fixtureSource({ publication: "live" }))).not.toEqual([]);
    expect(issues(fixtureSource({ options: [fixtureOption({ method: "magic" })] }))).not.toEqual([]);
    expect(issues(fixtureSource({ options: [fixtureOption({ maintainer: verified("official") })] }))).not.toEqual([]);
  });

  it("rejects unknown keys", () => {
    expect(issues(fixtureSource({ rating: 5 }))).toEqual([expect.stringContaining("rating")]);
    expect(issues(fixtureSource({ options: [fixtureOption({ stars: 4 })] }))).not.toEqual([]);
  });

  it("rejects verified claims without evidence or value", () => {
    const noEvidence = fixtureOption({ access: { status: "verified", value: "read", evidence_ids: [] } });
    expect(issues(fixtureSource({ options: [noEvidence] }))).toEqual([
      expect.stringContaining("options.0.access.evidence_ids"),
    ]);
    const noValue = fixtureOption({ access: { status: "verified", value: null, evidence_ids: ["fx-docs"] } });
    expect(issues(fixtureSource({ options: [noValue] }))).not.toEqual([]);
  });

  it("keeps unknown claims null and requires notes for not_applicable", () => {
    const unknownWithValue = fixtureOption({ pricing: { status: "unknown", value: "Free", evidence_ids: [] } });
    expect(issues(fixtureSource({ options: [unknownWithValue] }))).not.toEqual([]);
    const naNoNote = fixtureOption({ history: { status: "not_applicable", value: null, evidence_ids: [] } });
    expect(issues(fixtureSource({ options: [naNoNote] }))).not.toEqual([]);
    expect(issues(fixtureSource({ options: [fixtureOption({ history: unknown() })] }))).toEqual([]);
  });

  it("rejects non-ISO dates, non-https URLs, and bad slugs", () => {
    expect(issues(fixtureSource({ research: { searched_on: "2026-9-1", checked_urls: [], coverage_note: "x" } }))).not.toEqual([]);
    expect(issues(fixtureSource({ research: { searched_on: "2026-02-30", checked_urls: [], coverage_note: "x" } }))).not.toEqual([]);
    expect(issues(fixtureSource({ research: { searched_on: "2026-09-01", checked_urls: ["http://a.test"], coverage_note: "x" } }))).not.toEqual([]);
    expect(issues(fixtureSource({ slug: "Fixture_Source" }))).not.toEqual([]);
  });

  it("rejects malformed review hashes", () => {
    const review = { reviewer: "A Person", reviewed_on: "2026-09-02", method: "docs", approved_content_hash: "abc" };
    expect(issues(fixtureSource({ review }))).not.toEqual([]);
  });
});

describe("evidence schema", () => {
  const base = { id: "e1", title: "T", publisher: "P", checked_on: "2026-09-01", kind: "internal_docs" };
  it("requires a url for public evidence and forbids internal refs on it", () => {
    expect(Evidence.safeParse({ ...base, public: true, internal_ref: "doc-1" }).success).toBe(false);
    expect(Evidence.safeParse({ ...base, public: false, internal_ref: "doc-1" }).success).toBe(true);
    expect(Evidence.safeParse({ ...base, public: false }).success).toBe(false);
  });
});
