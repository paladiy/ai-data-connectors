import { z } from "zod";
import { SiteConfig } from "../../schemas/site.ts";
import { PrivateEvidenceFile, Source } from "../../schemas/source.ts";

const SCHEMAS: Record<string, z.ZodType> = {
  "source.schema.json": Source,
  "site.schema.json": SiteConfig,
  "private-evidence.schema.json": PrivateEvidenceFile,
};

/** JSON Schema files for editors. Cross-field rules are enforced by `npm run validate`. */
export function jsonSchemas(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of Object.keys(SCHEMAS).sort()) {
    const schema = SCHEMAS[name]!;
    const json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any", target: "draft-2020-12" });
    out[name] = `${JSON.stringify(json, null, 2)}\n`;
  }
  return out;
}
