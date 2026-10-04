import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SyncError, syncSkills } from "./lib/sync-skills.ts";

const root = process.cwd();
const REPORT_FILE = path.join("reports", "skills-sync.md");

try {
  const result = await syncSkills({
    root,
    fetch: globalThis.fetch,
    today: new Date().toISOString().slice(0, 10),
  });

  mkdirSync(path.join(root, path.dirname(REPORT_FILE)), { recursive: true });
  writeFileSync(path.join(root, REPORT_FILE), result.report);

  // Consumed by the scheduled workflow to title the pull request.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `changed=${result.changed}\ncommit=${result.lock.commit_sha}\nshort=${result.lock.commit_sha.slice(0, 7)}\n`,
    );
  }

  console.log(result.report.trim());
  console.log(
    result.changed
      ? `\nSnapshot updated. Run npm run generate and commit the result. Report: ${REPORT_FILE}`
      : "\nNothing to do.",
  );
} catch (error) {
  if (error instanceof SyncError) {
    console.error(`sync:skills failed, the committed snapshot was left unchanged:\n  ${error.message}`);
    process.exit(1);
  }
  throw error;
}
