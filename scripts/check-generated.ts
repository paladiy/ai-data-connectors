import { ContentError, loadContent } from "./lib/load.ts";
import { committedOutputs, diffOutputs, generateOutputs } from "./lib/generate.ts";

try {
  const content = loadContent();
  const differences = diffOutputs(content.root, committedOutputs(generateOutputs(content)));

  if (differences.length > 0) {
    console.error("Committed generated files differ from a fresh generation:\n");
    for (const difference of differences) console.error(`  ${difference.file}: ${difference.reason}`);
    console.error("\nRun npm run generate and commit the result.");
    process.exit(1);
  }
  console.log("check:generated passed: committed generated files are up to date.");
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`Content could not be loaded:\n${error.problems.map((p) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  throw error;
}
