import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { jsonSchemas } from "../scripts/lib/json-schemas.ts";

describe("exported JSON Schemas", () => {
  it("match the committed files in schemas/json", () => {
    for (const [name, content] of Object.entries(jsonSchemas())) {
      const committed = readFileSync(path.join("schemas", "json", name), "utf8");
      expect(committed, `${name} is stale; run npm run schemas:export`).toBe(content);
    }
  });

  it("reject unknown keys for editors", () => {
    const source = JSON.parse(jsonSchemas()["source.schema.json"]!);
    expect(source.additionalProperties).toBe(false);
  });
});
