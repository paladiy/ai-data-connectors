/**
 * Reviewer tooling. `approve` records a human editorial approval and must only be run by the named
 * reviewer after reading the draft. Coding agents must not run it (see AGENTS.md).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, parseDocument } from "yaml";
import { Source } from "../schemas/source.ts";
import { contentHash } from "./lib/hash.ts";
import { ContentError, loadContent } from "./lib/load.ts";
import { formatProblems, validateContent } from "./lib/validate.ts";

const [command, slug, ...rest] = process.argv.slice(2);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function flag(name: string): string | undefined {
  const index = rest.indexOf(`--${name}`);
  return index === -1 ? undefined : rest[index + 1];
}

function recordFile(root: string, wanted: string): string {
  const file = path.join(root, "data", "sources", `${wanted}.yaml`);
  try {
    readFileSync(file);
  } catch {
    fail(`No record at data/sources/${wanted}.yaml.`);
  }
  return file;
}

if (command !== "hash" && command !== "approve") {
  fail("Usage:\n  npm run review:hash -- <slug>\n  npm run review:approve -- <slug> --reviewer \"Name\" --method docs|tested|both");
}
if (!slug) fail("A source slug is required.");

let content;
try {
  content = loadContent();
} catch (error) {
  if (error instanceof ContentError) fail(`Content could not be loaded:\n${error.problems.map((p) => `  ${p}`).join("\n")}`);
  throw error;
}

const file = recordFile(content.root, slug);
const record = Source.parse(parse(readFileSync(file, "utf8")));

if (command === "hash") {
  console.log(contentHash(record));
  if (record.review) {
    const matches = record.review.approved_content_hash === contentHash(record);
    console.log(matches ? "Matches the recorded approval." : "Does NOT match the recorded approval; re-review is required.");
  } else {
    console.log("No review recorded yet.");
  }
  process.exit(0);
}

const reviewer = flag("reviewer");
const method = flag("method");
const reviewedOn = flag("date") ?? new Date().toISOString().slice(0, 10);

if (!reviewer) fail('--reviewer "Your Name" is required: the approval records who checked the facts.');
if (method !== "docs" && method !== "tested" && method !== "both") {
  fail("--method must be docs, tested, or both. Do not record a test that did not happen.");
}

const hash = contentHash(record);
const candidate = Source.parse({
  ...record,
  publication: "published",
  review: { reviewer, reviewed_on: reviewedOn, method, approved_content_hash: hash },
});

const problems = validateContent({
  ...content,
  sources: content.sources.map((bundle) =>
    bundle.record.slug === slug ? { ...bundle, record: candidate } : bundle,
  ),
});
if (problems.length > 0) {
  fail(`This record cannot be published yet:\n\n${formatProblems(problems)}`);
}

// Edit the document in place so comments and formatting in the record survive.
const document = parseDocument(readFileSync(file, "utf8"));
document.set("publication", "published");
document.set("review", { reviewer, reviewed_on: reviewedOn, method, approved_content_hash: hash });
writeFileSync(file, document.toString({ lineWidth: 0 }));

console.log(`Approved ${slug} as ${reviewer} (${method}) on ${reviewedOn}.`);
console.log(`Recorded hash ${hash}.`);
console.log("Run npm run generate && npm run build, then commit the record and the regenerated files.");
