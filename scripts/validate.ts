import { ContentError, loadContent } from "./lib/load.ts";
import { formatProblems, validateContent } from "./lib/validate.ts";

const production = process.argv.includes("--production");

try {
  const content = loadContent();
  const problems = validateContent(content, { production });

  if (problems.length > 0) {
    console.error(`Content validation failed with ${problems.length} problem(s):\n`);
    console.error(formatProblems(problems));
    process.exit(1);
  }

  console.log(`Content valid: ${content.sources.length} sources.`);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`Content could not be loaded:\n${error.problems.map((p) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  throw error;
}
