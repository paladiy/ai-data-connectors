import path from "node:path";
import { countPages, findBrokenLinks } from "./lib/links.ts";

const target = process.argv[2] ?? "site/dist";
const distRoot = path.resolve(process.cwd(), target);

const pages = countPages(distRoot);
if (pages === 0) {
  console.error(`No built HTML found in ${target}. Run npm run build first.`);
  process.exit(1);
}

const broken = findBrokenLinks(distRoot);
if (broken.length > 0) {
  console.error(`${broken.length} broken internal link(s) in ${target}:`);
  for (const link of broken) console.error(`  ${link.page} -> ${link.href}`);
  process.exit(1);
}
console.log(`check:links passed: ${pages} page(s), all internal links resolve.`);
