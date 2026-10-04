import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { jsonSchemas } from "./lib/json-schemas.ts";

const outDir = path.join(process.cwd(), "schemas", "json");
mkdirSync(outDir, { recursive: true });
for (const [name, content] of Object.entries(jsonSchemas())) {
  writeFileSync(path.join(outDir, name), content);
}
console.log(`Wrote ${Object.keys(jsonSchemas()).length} JSON Schema files to schemas/json/.`);
