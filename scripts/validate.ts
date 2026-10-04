import { ContentError, loadContent } from "./lib/load.ts";
import { formatProblems, isPublished, validateContent } from "./lib/validate.ts";

const production = process.argv.includes("--production");

try {
  const content = loadContent();
  const problems = validateContent(content, { production });

  if (problems.length > 0) {
    console.error(`Content validation failed with ${problems.length} problem(s):\n`);
    console.error(formatProblems(problems));
    process.exit(1);
  }

  const published = content.sources.filter((s) => isPublished(s.record)).length;
  const drafts = content.sources.length - published;
  console.log(
    `Content valid: ${published} published, ${drafts} not published, ${content.categories.length} categories.`,
  );
  if (!production && published === 0) {
    console.log("No record is published, so a production build would contain no source pages.");
  }
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`Content could not be loaded:\n${error.problems.map((p) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  throw error;
}
