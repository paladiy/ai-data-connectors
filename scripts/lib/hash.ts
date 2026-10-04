import { createHash } from "node:crypto";
import type { Source } from "../../schemas/source.ts";

/** JSON with recursively sorted object keys; arrays keep their order. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) out[key] = sortKeys(child);
    }
    return out;
  }
  return value;
}

export function sha256(text: string | Buffer): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Hash of a record's editorial fields. Excludes `review` (which stores the hash) and
 * `publication` (set together with the approval). Skill cards are generated, not stored.
 */
export function contentHash(source: Source): string {
  const { review: _review, publication: _publication, ...editorial } = source;
  return `sha256:${sha256(canonicalJson(editorial))}`;
}
