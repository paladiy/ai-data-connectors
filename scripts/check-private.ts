import { checkRepository } from "./lib/private.ts";

const violations = checkRepository(process.cwd());
if (violations.length > 0) {
  console.error("Private or internal content is tracked by git:");
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log("check:private passed: no private paths or markers are tracked.");
