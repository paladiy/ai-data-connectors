import { buildFreshnessReport, formatFreshnessReport } from "./lib/freshness.ts";
import { ContentError, loadContent } from "./lib/load.ts";

try {
  const content = loadContent();
  const report = buildFreshnessReport(content, new Date());
  console.log(formatFreshnessReport(report, content));
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`Content could not be loaded:\n${error.problems.map((p) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  throw error;
}
