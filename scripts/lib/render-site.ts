import { stringify } from "yaml";
import type { SiteConfig } from "../../schemas/site.ts";
import { SURFACES } from "../../schemas/source.ts";
import type { Claim } from "../../schemas/common.ts";
import { bulletList, escapeText, joinSections, link, renderClaim, renderClaimCell } from "./markdown.ts";
import { SURFACE_LABELS, type Model, type ModelOption, type ModelSource } from "./model.ts";
import { pageTitle, correctionUrl } from "./render-github.ts";
import { serializePublicDataset } from "./public-export.ts";

interface HeadTag {
  tag: string;
  attrs?: Record<string, string>;
  content?: string;
}

function absolute(site: SiteConfig, path: string): string {
  return new URL(path, site.url).toString();
}

/** Starlight frontmatter. Serialized through YAML so record text cannot break the document. */
function frontmatter(data: Record<string, unknown>): string {
  return `---\n${stringify(data, { lineWidth: 0 }).trimEnd()}\n---`;
}

function jsonLd(value: unknown): HeadTag {
  return {
    tag: "script",
    attrs: { type: "application/ld+json" },
    // Closing-tag sequences are the only way JSON-LD can escape its script element.
    content: JSON.stringify(value).replace(/<\//g, "<\\/"),
  };
}

function webPage(site: SiteConfig, url: string, name: string, description: string): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    isPartOf: { "@type": "WebSite", name: site.name, url: absolute(site, "/") },
    publisher: { "@type": site.publisher.type, name: site.publisher.name },
  };
}

function breadcrumbs(site: SiteConfig, trail: Array<{ name: string; path: string }>): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absolute(site, entry.path),
    })),
  };
}

function itemList(site: SiteConfig, sources: ModelSource[]): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: sources.map((source, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${source.name} to Claude`,
      url: absolute(site, `/sources/${source.slug}/`),
    })),
  };
}

function headFor(site: SiteConfig, path: string, structuredData: unknown[]): HeadTag[] {
  const tags: HeadTag[] = [{ tag: "link", attrs: { rel: "canonical", href: absolute(site, path) } }];
  tags.push(...structuredData.map(jsonLd));
  return tags;
}

function surfaceRow(option: ModelOption, surface: (typeof SURFACES)[number]): string {
  return renderClaimCell(option.surfaces[surface] as Claim<unknown>);
}

/**
 * Comparison table with one column per option. Wrapped in a scroll container by the site CSS so
 * it stays readable on narrow screens.
 */
function comparisonTable(source: ModelSource): string {
  const options = source.options;
  const header = ["| Field | " + options.map((option) => escapeText(option.name)).join(" | ") + " |"];
  header.push(`| --- |${options.map(() => " --- |").join("")}`);

  const row = (label: string, cells: string[]) => `| ${label} | ${cells.join(" | ")} |`;
  const rows = [
    row("Provider", options.map((option) => escapeText(option.provider))),
    row("Connection method", options.map((option) => escapeText(option.method_label))),
    row("Maintainer", options.map((option) => renderClaimCell(option.maintainer))),
    row("Availability", options.map((option) => renderClaimCell(option.route_status))),
    ...SURFACES.map((surface) => row(SURFACE_LABELS[surface], options.map((option) => surfaceRow(option, surface)))),
    row("Access", options.map((option) => renderClaimCell(option.access))),
    row("Data available", options.map((option) => renderClaimCell(option.data_available))),
    row("Historical data", options.map((option) => renderClaimCell(option.history))),
    row("Refresh", options.map((option) => renderClaimCell(option.refresh))),
    row("Cross-source analysis", options.map((option) => renderClaimCell(option.multi_source))),
    row("Prerequisites", options.map((option) => renderClaimCell(option.prerequisites))),
    row("Price note", options.map((option) => renderClaimCell(option.pricing))),
    row("Listed in Claude directory", options.map((option) => renderClaimCell(option.directory_listing))),
  ];
  return [...header, ...rows].join("\n");
}

function optionSection(source: ModelSource, option: ModelOption, site: SiteConfig): string {
  const lines = [`### ${escapeText(option.name)}`];
  if (option.badges.length > 0) lines.push("", `_${option.badges.map(escapeText).join(" · ")}_`);
  if (option.description) lines.push("", escapeText(option.description));

  const links: string[] = [];
  if (option.links.overview) links.push(link("Overview", option.links.overview));
  if (option.links.setup) links.push(link("Provider setup instructions", option.links.setup));
  if (option.links.pricing) links.push(link("Pricing", option.links.pricing));
  if (option.directory_listing.status === "known") {
    links.push(link("Claude directory entry", option.directory_listing.value!));
  }
  if (links.length > 0) lines.push("", links.join(" · "));

  if (option.prerequisites.status === "known") {
    lines.push("", "**Prerequisites**", "", ...bulletList(toList(option.prerequisites.value)));
  }
  if (option.setup_steps.length > 0) {
    lines.push("", "**Setup**", "");
    option.setup_steps.forEach((step, index) => lines.push(`${index + 1}. ${escapeText(step.text)}`));
  }
  if (option.claude_configuration.length > 0) {
    lines.push("", "**Configure Claude**", "", ...bulletList(option.claude_configuration.map((step) => step.text)));
  }
  if (option.sample_query) lines.push("", "**A safe question to start with**", "", `> ${escapeText(option.sample_query)}`);
  if (option.success_check) lines.push("", `**Check it worked.** ${escapeText(option.success_check.text)}`);
  if (option.setup_time) lines.push("", `**Setup time.** ${escapeText(renderClaim(option.setup_time))}`);

  return lines.join("\n");
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  return value === null || value === undefined ? [] : [String(value)];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function recommendationsSection(source: ModelSource, site: SiteConfig): string | null {
  if (source.recommendations.length === 0) return null;
  const lines = ["## Which route suits which job"];
  for (const recommendation of source.recommendations) {
    lines.push("", `### ${escapeText(recommendation.job)}`, "", `**${escapeText(recommendation.option_name)}.** ${escapeText(recommendation.reason)}`);
    const option = source.options.find((candidate) => candidate.id === recommendation.option_id);
  }
  return lines.join("\n");
}

function limitsSection(source: ModelSource): string | null {
  const relevant = source.options.filter(
    (option) => option.data_path.status === "known" || option.limits.status === "known" || option.access.status === "known",
  );
  if (relevant.length === 0) return null;
  const lines = ["## Limits and data handling"];
  for (const option of relevant) {
    lines.push("", `### ${escapeText(option.name)}`, "");
    lines.push(`- **Data path.** ${escapeText(renderClaim(option.data_path))}`);
    lines.push(`- **Access.** ${escapeText(renderClaim(option.access))}`);
    lines.push(`- **Refresh.** ${escapeText(renderClaim(option.refresh))}`);
    lines.push(`- **Limits.** ${escapeText(renderClaim(option.limits))}`);
  }
  return lines.join("\n");
}

function faqSection(source: ModelSource): string | null {
  if (source.faq.length === 0) return null;
  const lines = ["## Questions"];
  for (const entry of source.faq) {
    lines.push("", `### ${escapeText(entry.question)}`, "", escapeText(entry.answer));
  }
  return lines.join("\n");
}

function sourcesSection(source: ModelSource, site: SiteConfig): string {
  const lines = ["## Sources and corrections"];
  lines.push("", `Alternatives were researched on ${source.research.searched_on}. ${escapeText(source.research.coverage_note)}`);

  if (source.evidence.length > 0) {
    lines.push("", "### Evidence", "");
    for (const item of source.evidence) {
      lines.push(`- ${link(item.title, item.url!)} — ${escapeText(item.publisher)}, checked ${item.checked_on}`);
    }
  }
  const correction = correctionUrl(site, source);
  lines.push(
    "",
    correction
      ? `Something here wrong or out of date? ${link("Open a correction issue", correction)} and it will be re-checked against the source.`
      : `Something here wrong or out of date? ${link("See how corrections are handled", "/about/#corrections")}.`,
  );
  return lines.join("\n");
}

export function renderSourcePage(source: ModelSource, site: SiteConfig): string {
  const path = `/sources/${source.slug}/`;
  const usable = source.options.filter((option) => option.is_usable_route);
  const aliasLine =
    source.aliases.length > 0 ? `Also searched as ${source.aliases.map(escapeText).join(", ")}.` : null;

  const head = headFor(
    site,
    path,
    [
      webPage(site, absolute(site, path), pageTitle(source), source.meta_description),
      breadcrumbs(site, [
        { name: "Sources", path: "/" },
        { name: source.name, path },
      ]),
    ],
  );

  return joinSections([
    frontmatter({
      title: pageTitle(source),
      description: source.meta_description,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      head,
    }),
    `_${escapeText(site.affiliation_statement)}_`,
    escapeText(source.summary),
    usable.length > 0
      ? `**Covered here:** ${usable.map((option) => escapeText(option.name)).join(", ")}.`
      : null,
    aliasLine,
    "## Compare the options",
    comparisonTable(source),
    "_Each claim cites the evidence listed at the end of this page. Where a capability is not documented, it says so instead of guessing._",
    "## Set up each route",
    ...source.options.map((option) => optionSection(source, option, site)),
    recommendationsSection(source, site),
    limitsSection(source),
    faqSection(source),
    sourcesSection(source, site),
    source.related.length > 0
      ? `## Related sources\n\n${source.related
          .map((related) => `- ${link(`${related.name} to Claude`, `/sources/${related.slug}/`)}`)
          .join("\n")}`
      : null,
    `[All sources](/) · [About](/about/)`,
  ]);
}

export function renderIndexPage(model: Model): string {
  const { site } = model;
  const head = headFor(
    site,
    "/",
    [
      webPage(site, absolute(site, "/"), site.name, site.tagline),
      itemList(site, model.sources),
    ],
  );

  return joinSections([
    frontmatter({
      title: site.name,
      description: site.tagline,
      tableOfContents: false,
      head,
    }),
    `import Directory from "../../components/Directory.astro";`,
    `_${escapeText(site.affiliation_statement)}_`,
    escapeText(site.tagline),
    "<Directory />",
    `[About](/about/)`,
  ]);
}

export interface DirectoryData {
  sources: Array<{
    slug: string;
    name: string;
    summary: string;
    aliases: string[];
    routes: number;
    providers: string[];
  }>;
}

export function buildDirectoryData(model: Model): DirectoryData {
  return {
    sources: model.sources.map((source) => ({
      slug: source.slug,
      name: source.name,
      summary: source.summary,
      aliases: source.aliases,
      routes: source.options.filter((option) => option.is_usable_route).length,
      providers: source.options.map((option) => option.provider),
    })),
  };
}

export function renderLlmsTxt(model: Model): string {
  const { site } = model;
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.affiliation_statement}`,
    "",
    site.tagline,
    "",
    "Capabilities are recorded as claims with cited evidence. Anything not documented is labelled",
    'as "Unknown" rather than as unsupported. Coverage is not exhaustive.',
    "",
  ];
  if (model.sources.length > 0) {
    lines.push("## Connectors", "");
    for (const source of model.sources) {
      lines.push(`- [${source.name} to Claude](${absolute(site, `/sources/${source.slug}/`)}): ${source.summary}`);
    }
    lines.push("");
  }
  lines.push("## Data", "", `- [Public dataset, schema version 1](${absolute(site, "/connectors.json")})`);
  lines.push(`- [About and disclosure](${absolute(site, "/about/")})`);
  return `${lines.join("\n")}\n`;
}

export function renderRobotsTxt(model: Model): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${absolute(model.site, "/sitemap-index.xml")}`,
    "",
  ].join("\n");
}

export function renderPublicDataset(model: Model): string {
  return serializePublicDataset(model);
}
