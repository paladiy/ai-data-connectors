import { describe, expect, it } from "vitest";
import { findPrivateViolations, isPrivatePath } from "../scripts/lib/private.ts";

describe("private document guard", () => {
  it("flags plans and internal documents", () => {
    for (const file of [
      "docs/implementation-brief.md",
      "docs/implementation-notes.md",
      "briefs/gitbook-context.md",
      "plans/x.md",
      ".cursor/plans/a.plan.md",
      "research/qbo.md",
      "data/private/quickbooks-online.yaml",
      "notes.private.md",
      "guides/x.internal.md",
    ]) {
      expect(isPrivatePath(file), file).toBe(true);
    }
  });

  it("allows public repository files", () => {
    for (const file of ["AGENTS.md", "CLAUDE.md", "README.md", "data/sources/pipedrive.yaml"]) {
      expect(isPrivatePath(file), file).toBe(false);
    }
  });

  it("anchors the rules at the repository root so application paths are not shadowed", () => {
    for (const file of [
      "site/src/content/docs/about.md",
      "site/src/content/docs/sources/pipedrive.md",
      "scripts/lib/research.ts",
    ]) {
      expect(isPrivatePath(file), file).toBe(false);
    }
  });

  it("flags tracked content and output files containing internal references", () => {
    const files = {
      "data/sources/a.yaml": "evidence:\n  - id: x\n    internal_ref: abc\n",
      "data/sources/b.yaml": "id: b\n",
      "site/src/content/docs/a.md": "internal_ref: abc\n",
      "site/public/connectors.json": '{"internal_ref": "abc"}\n',
    };
    const violations = findPrivateViolations(Object.keys(files), (f) => files[f as keyof typeof files]);
    expect(violations).toEqual([
      expect.stringContaining("data/sources/a.yaml"),
      expect.stringContaining("site/src/content/docs/a.md"),
      expect.stringContaining("site/public/connectors.json"),
    ]);
  });

  it("does not flag source code that declares the field name", () => {
    const files = { "schemas/common.ts": "  internal_ref: NonEmptyText.optional(),\n" };
    expect(findPrivateViolations(Object.keys(files), (f) => files[f as keyof typeof files])).toEqual([]);
  });
});
