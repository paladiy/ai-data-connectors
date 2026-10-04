import { ContentError, loadContent } from "./lib/load.ts";
import { generateOutputs, writeOutputs } from "./lib/generate.ts";

try {
  const content = loadContent();
  const outputs = generateOutputs(content);
  const written = writeOutputs(content.root, outputs);
  console.log(`Generated ${written.length} file(s).`);
  for (const file of written) console.log(`  ${file}`);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`Content could not be loaded:\n${error.problems.map((p) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  throw error;
}
