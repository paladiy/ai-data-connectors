import type { Claim } from "../../schemas/common.ts";
import { buildInstall, type InstallLink, type OptionInstall, type ToolInstall } from "./install.ts";
import { formatValue } from "./markdown.ts";
import type { ModelAiTool, ModelAiTools, ModelOption, ModelSource } from "./model.ts";
import { SKILLS_INDEX_URL, SKILLS_REPO_URL } from "../../site/src/lib/skills.ts";
import type { SiteConfig } from "../../schemas/site.ts";
import { sitePath } from "./site-url.ts";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const e = escapeHtml;

function anchor(label: string, url: string): string {
  return `<a href="${e(url)}">${e(label)}</a>`;
}

function list(items: string[], className?: string): string {
  const cls = className ? ` class="${className}"` : "";
  return `<ul${cls}>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function badge(text: string, tone: "plain" | "accent" | "muted" = "plain"): string {
  return `<span class="sp-badge sp-badge--${tone}">${e(text)}</span>`;
}

const ACCESS_LABELS = { read: "Read-only", write: "Write only", read_write: "Reads and changes data" } as const;

function accessLabel(option: ModelOption): string {
  const access = option.access;
  if (access.status !== "known") return "Access not documented";
  return ACCESS_LABELS[access.value as keyof typeof ACCESS_LABELS] ?? formatValue(access.value);
}

function availabilityBadge(option: ModelOption): string | null {
  const status = option.route_status;
  if (status.status !== "known") return badge("Availability unknown", "muted");
  if (status.value === "limited") return badge("Limited availability", "muted");
  if (status.value === "unavailable") return badge("Not available", "muted");
  return null;
}

function badgesFor(option: ModelOption, tag: "p" | "span" = "p"): string {
  const parts = [
    option.provider === "Coupler.io" ? badge("Recommended", "accent") : null,
    badge(accessLabel(option), option.access.status === "known" && option.access.value === "read_write" ? "accent" : "plain"),
    availabilityBadge(option),
  ].filter((part): part is string => part !== null);
  return `<${tag} class="sp-badges">${parts.join("")}</${tag}>`;
}

export function descriptionSection(source: ModelSource): string[] {
  const out = ["## Description", `<p>${e(source.summary)}</p>`];
  if (source.aliases.length > 0) {
    out.push(`<p class="sp-muted">Also searched as ${source.aliases.map(e).join(", ")}.</p>`);
  }
  out.push(`<p class="sp-muted">Where a capability is not documented, this page says so instead of guessing.</p>`);
  return out;
}

function bestFor(source: ModelSource, option: ModelOption): string | null {
  const jobs = source.recommendations.filter((recommendation) => recommendation.option_id === option.id);
  return jobs.length > 0 ? jobs.map((job) => job.job).join("; ") : null;
}

function richText(value: string): string {
  return e(value).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function toolTiles(option: ModelOption, tools: ModelAiTool[], aiTools: ModelAiTools): string[] {
  const tiles = tools.map((tool, i) => {
    const meta = [tool.vendor, tool.connection_label].filter(Boolean).join(" · ");
    return (
      `<label class="sp-tool-tile">` +
      `<input class="sp-tool-radio" type="radio" name="tool-${e(option.id)}" value="${e(tool.id)}" data-tool="${e(tool.id)}"${i === 0 ? " checked" : ""}>` +
      `<span class="sp-tool-name">${e(tool.name)}</span>` +
      `<span class="sp-tool-meta">${e(meta)}</span>` +
      `</label>`
    );
  });
  const out = [
    `<p>Pick the AI tool you use. The install steps below change to match it.</p>`,
    `<div class="sp-tools" role="radiogroup" aria-label="AI tool">${tiles.join("")}</div>`,
  ];
  if (aiTools.shared_notes.length > 0) {
    out.push(list(aiTools.shared_notes.map((note) => e(note.text)), "sp-tool-shared"));
  }
  return out;
}

function linkParagraph(links: InstallLink[]): string {
  return `<p class="sp-links">${links.map((item) => anchor(item.label, item.url)).join("")}</p>`;
}

function toolPanel(install: ToolInstall): string {
  const out: string[] = [];
  if (install.intro.length > 0) out.push(`<p class="sp-tool-intro">${install.intro.map(e).join(" ")}</p>`);

  for (const group of install.groups) {
    out.push(
      `<p class="sp-label">${e(group.title)}</p>`,
      `<ol>${group.steps.map((step) => `<li>${richText(step)}</li>`).join("")}</ol>`,
    );
  }
  if (install.success_check) {
    out.push(`<p class="sp-label">Check it worked</p>`, `<p>${richText(install.success_check)}</p>`);
  }
  if (install.notes.length > 0) {
    out.push(`<p class="sp-label">Good to know</p>`, list(install.notes.map(richText)));
  }
  out.push(linkParagraph(install.links));
  return `<div class="sp-tool-panel" data-tool="${e(install.tool.id)}">${out.join("")}</div>`;
}

export function renderToolCss(aiTools: ModelAiTools): string {
  return aiTools.tools
    .map((tool) => {
      const id = tool.id;
      return `.sp-panel:has(.sp-tool-radio[value="${id}"]:checked) .sp-tool-panel[data-tool="${id}"] { display: block; }`;
    })
    .concat("")
    .join("\n");
}

function installBody(install: OptionInstall): string[] {
  const out: string[] = install.tools.map(toolPanel);
  if (install.setup_time) {
    out.push(
      `<p><strong>Setup time:</strong> ${e(install.setup_time.range)}. ` +
        `<span class="sp-muted">${e(install.setup_time.basis)}</span></p>`,
    );
  }
  if (install.links.length > 0) out.push(linkParagraph(install.links));
  return out;
}

/** Unknown is always "Not documented", so a missing fact can never read as a "no". */
function claimHtml(claim: Claim<unknown>): string {
  if (claim.status !== "known") {
    const label = claim.status === "not_applicable" ? "Not applicable" : "Not documented";
    return `<p class="sp-muted">${label}${claim.note ? ` (${e(claim.note)})` : ""}</p>`;
  }
  const values = Array.isArray(claim.value) ? claim.value : [claim.value];
  const body =
    values.length > 1 ? list(values.map((value) => e(formatValue(value)))) : `<p>${e(formatValue(values[0]))}</p>`;
  return claim.note ? `${body}<p class="sp-muted">Note: ${e(claim.note)}</p>` : body;
}

function fact(label: string, claim: Claim<unknown>): string {
  return `<div class="sp-fact"><dt>${e(label)}</dt><dd>${claimHtml(claim)}</dd></div>`;
}

function dataBody(option: ModelOption): string[] {
  const out = [claimHtml(option.data_available)];
  if (option.capabilities.length > 0) {
    out.push(`<p class="sp-label">What you can do</p>`, list(option.capabilities.map((item) => e(item.text))));
  }
  if (option.sample_query) {
    out.push(`<p class="sp-label">An example question you can ask</p>`, `<blockquote>${e(option.sample_query)}</blockquote>`);
  }
  return out;
}

function pathBody(option: ModelOption): string[] {
  return [
    claimHtml(option.data_path),
    `<dl class="sp-facts">` +
      fact("Historical data", option.history) +
      fact("Refresh", option.refresh) +
      fact("Combining several sources", option.multi_source) +
      fact("Prerequisites", option.prerequisites) +
      `</dl>`,
  ];
}

type SectionKind = "works" | "install" | "data" | "path" | "limits";

function section(option: ModelOption, kind: SectionKind, title: string, body: string[]): string {
  return (
    `<section class="sp-route"><div class="sp-route-head"><h3 id="${kind}-${e(option.id)}">${e(title)}</h3></div>` +
    `<div class="sp-route-body">${body.join("")}</div></section>`
  );
}

function tabCard(option: ModelOption, source: ModelSource, index: number): string {
  const best = bestFor(source, option);
  return (
    `<label class="sp-tab" for="route-${index}-${e(option.id)}">` +
    `<span class="sp-tab-name">${e(option.name)}</span>` +
    `<span class="sp-tab-meta">${e(option.provider)} · ${e(option.method_label)} · ${e(option.maintainer_label)}</span>` +
    badgesFor(option, "span") +
    (best ? `<span class="sp-tab-best">Best for: ${e(best)}</span>` : "") +
    `</label>`
  );
}

function compactTab(option: ModelOption, index: number): string {
  return `<label class="sp-pill" for="route-${index}-${e(option.id)}">${e(option.name)}</label>`;
}

function panel(source: ModelSource, option: ModelOption, aiTools: ModelAiTools): string {
  const limited = option.route_status.status === "known" && option.route_status.value !== "available";
  const intro = option.description ? `<p class="sp-panel-intro">${e(option.description)}</p>` : "";
  const install = buildInstall(option, aiTools);
  const tools = install.tools.map((entry) => entry.tool);
  return (
    `<div class="sp-panel${limited ? " sp-panel--limited" : ""}" data-option="${e(option.id)}">` +
    intro +
    section(option, "works", "Works with", toolTiles(option, tools, aiTools)) +
    section(option, "install", "How to install", installBody(install)) +
    section(option, "data", `What ${option.name} gives you from ${source.name}`, dataBody(option)) +
    section(option, "path", "How the data reaches the AI tool", pathBody(option)) +
    section(option, "limits", "Limits to expect", [claimHtml(option.limits)]) +
    `</div>`
  );
}

export function routesSection(source: ModelSource, aiTools: ModelAiTools): string[] {
  const options = source.options;
  const radios = options
    .map(
      (option, i) =>
        `<input class="sp-radio" type="radio" name="sp-route" id="route-${i + 1}-${e(option.id)}" data-option="${e(option.id)}"${i === 0 ? " checked" : ""}>`,
    )
    .join("");
  const cards = options.map((option, i) => tabCard(option, source, i + 1)).join("");
  const pills = options.map((option, i) => compactTab(option, i + 1)).join("");
  return [
    options.length === 1 ? "## How to connect" : "## Connection routes",
    options.length === 1
      ? `<p>Connect ${e(source.name)} to your AI tool with ${e(options[0]!.name)}. Pick the tool you use to see how to install it.</p>`
      : `<p>Choose a route. ${options.length} are recorded. Each one shows which AI tools it works with, how to install it, what data it brings, and its limits.</p>`,
    `<div class="sp-switch not-content${options.length === 1 ? " sp-switch--single" : ""}">${radios}<div class="sp-tabs">${cards}</div>` +
      `<div class="sp-pillbar" aria-label="Switch route">${pills}</div>` +
      options.map((option) => panel(source, option, aiTools)).join("") +
      `</div>`,
  ];
}

export function skillsSection(source: ModelSource): string[] {
  const names = JSON.stringify([source.name, ...source.aliases]);
  return [
    "## Related skills",
    `<div class="sp-skills not-content" data-skills-names="${e(names)}" data-skills-source="${e(source.name)}" data-skills-index="${e(SKILLS_INDEX_URL)}" data-skills-repo="${e(SKILLS_REPO_URL)}">` +
      `<p class="sp-muted sp-skills-status">Loading skills from the <a href="${e(SKILLS_REPO_URL)}">coupler-io/skills</a> repository…</p>` +
      `<noscript><p class="sp-muted">Skills are loaded live. See the <a href="${e(SKILLS_REPO_URL)}">coupler-io/skills</a> repository.</p></noscript>` +
      `</div>`,
  ];
}

export function connectorsSection(source: ModelSource, site: SiteConfig): string[] {
  const out = ["## Related connectors"];
  if (source.related.length === 0) {
    out.push(`<p class="sp-muted">No related connectors listed yet. <a href="${e(sitePath(site, "/"))}">Browse all connectors</a>.</p>`);
    return out;
  }
  out.push(
    list(
      source.related.map(
        (related) =>
          `<a class="sp-route-link" href="${e(sitePath(site, `/sources/${related.slug}/`))}">${e(related.name)}</a>`,
      ),
      "sp-routes not-content",
    ),
  );
  return out;
}
