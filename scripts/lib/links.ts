import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export interface BrokenLink {
  page: string;
  href: string;
}

function htmlFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)))
    .sort();
}

function resolveTarget(root: string, pagePath: string, href: string, base: string): string | null {
  const withoutHash = href.split("#")[0]!;
  if (withoutHash === "") return null;

  if (withoutHash.startsWith("/") && !`${withoutHash}/`.startsWith(base)) return null;
  const fromDirectory = path.dirname(path.join(root, pagePath));
  const target = withoutHash.startsWith("/")
    ? path.join(root, withoutHash.slice(base.length - 1))
    : path.resolve(fromDirectory, withoutHash);

  if (existsSync(target)) {
    return statSync(target).isDirectory() && !existsSync(path.join(target, "index.html")) ? null : target;
  }
  if (existsSync(`${target}.html`)) return `${target}.html`;
  return null;
}

/** `base` is the path the site is served under, such as `/` or `/repo/`; root-relative links outside it are broken. */
export function findBrokenLinks(distRoot: string, base = "/"): BrokenLink[] {
  const broken: BrokenLink[] = [];
  for (const page of htmlFiles(distRoot)) {
    // Inline script bodies hold template strings, not links; a script's own src stays checked.
    const html = readFileSync(path.join(distRoot, page), "utf8").replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, "$1</script>");
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]!);
    for (const href of new Set(hrefs)) {
      if (/^(?:[a-z+.-]+:|\/\/|#|mailto:|data:)/i.test(href)) continue;
      if (resolveTarget(distRoot, page, href, base) === null) broken.push({ page, href });
    }
  }
  return broken;
}

export function countPages(distRoot: string): number {
  return htmlFiles(distRoot).length;
}
