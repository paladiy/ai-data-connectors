import type { SiteConfig } from "../../schemas/site.ts";

/** The path the site is served under, with a trailing slash: `/` at a domain root, `/repo/` on GitHub project pages. */
export function siteBase(site: SiteConfig): string {
  const { pathname } = new URL(site.url);
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

/** A root-relative site path such as `/sources/x/`, served under the site base. */
export function sitePath(site: SiteConfig, path: string): string {
  return `${siteBase(site)}${path.replace(/^\//, "")}`;
}

export function siteUrl(site: SiteConfig, path: string): string {
  return new URL(sitePath(site, path), site.url).toString();
}
