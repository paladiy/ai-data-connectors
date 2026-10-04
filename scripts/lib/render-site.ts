import { stringify } from "yaml";
import type { SiteConfig } from "../../schemas/site.ts";
import { escapeText, joinSections, link } from "./markdown.ts";
import type { Model, ModelSource } from "./model.ts";
import { pageTitle, correctionUrl } from "./render-github.ts";
import { serializePublicDataset } from "./public-export.ts";
import {
  connectorsSection,
  descriptionSection,
  escapeHtml,
  routesSection,
  skillsSection,
} from "./render-source-page.ts";

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

const TROUBLESHOOTING = /\b(why|slow|timing out|time out|error|fail|cannot|can't|not (?:see|load|work)|stuck|missing)\b/i;

/**
 * Order questions so decision-making ones lead: those where Coupler.io is part of the answer come
 * first, other comparison questions next, and troubleshooting last. Order within a tier is kept
 * as written, and no answer text is changed.
 */
function faqRank(entry: ModelSource["faq"][number]): number {
  if (TROUBLESHOOTING.test(entry.question)) return 2;
  return /coupler\.io/i.test(entry.answer) ? 0 : 1;
}

function faqSection(source: ModelSource): string | null {
  if (source.faq.length === 0) return null;
  const ordered = source.faq
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => faqRank(a.entry) - faqRank(b.entry) || a.index - b.index)
    .map(({ entry }) => entry);
  const lines = ["## Questions", "", `<div class="sp-faq">`];
  ordered.forEach((entry, index) => {
    lines.push(
      `<details class="sp-faq-item"${index === 0 ? " open" : ""}>`,
      `<summary>${escapeHtml(entry.question)}</summary>`,
      `<p>${escapeHtml(entry.answer)}</p>`,
      `</details>`,
    );
  });
  lines.push(`</div>`);
  return lines.join("\n");
}

function sourcesSection(source: ModelSource, site: SiteConfig): string {
  const lines = ["## Sources and corrections"];
  lines.push("", `Alternatives were researched on ${source.research.searched_on}. ${escapeText(source.research.coverage_note)}`);

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
      tableOfContents: false,
      head,
    }),
    ...descriptionSection(source),
    ...routesSection(source),
    ...skillsSection(source),
    ...connectorsSection(source),
    faqSection(source),
    sourcesSection(source, site),
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
      template: "splash",
      tableOfContents: false,
      head,
    }),
    `import Directory from "../../components/Directory.tsx";`,
    "<Directory client:load />",
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
    /** Distinct connection methods across the usable routes, in a stable order. */
    methods: string[];
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
      methods: [
        ...new Set(source.options.filter((option) => option.is_usable_route).map((option) => option.method)),
      ].sort(),
    })),
  };
}

export function renderLlmsTxt(model: Model): string {
  const { site } = model;
  const lines = [
    `# ${site.name}`,
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
