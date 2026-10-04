import { formatValue } from "./markdown.ts";
import type { ModelAiTool, ModelAiTools, ModelOption, ModelSource } from "./model.ts";

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
  return `<a href="${e(encodeURI(url))}">${e(label)}</a>`;
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

function withTool(value: string, tool: ModelAiTool): string {
  return value.split("{destination}").join(tool.name).split("{tool}").join(tool.in_text ?? tool.name);
}

function toolsFor(option: ModelOption, aiTools: ModelAiTools): ModelAiTool[] {
  const wanted = new Set(option.works_with);
  return aiTools.tools.filter((tool) => wanted.has(tool.id));
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

function toolLinks(tool: ModelAiTool): string {
  const links = [anchor(`Coupler.io guide for ${tool.name}`, tool.links.setup)];
  if (tool.links.vendor) links.push(anchor(`${tool.vendor ?? tool.name} documentation`, tool.links.vendor));
  if (tool.links.directory) links.push(anchor(`Coupler.io in ${tool.links.directory.name}`, tool.links.directory.url));
  return `<p class="sp-links">${links.join("")}</p>`;
}

function toolPanel(option: ModelOption, tool: ModelAiTool): string {
  const out: string[] = [];
  const intro = [
    tool.connection_note,
    tool.available_in.length > 0 ? `Works in ${tool.available_in.join(", ")}.` : undefined,
  ].filter((part): part is string => Boolean(part));
  if (intro.length > 0) out.push(`<p class="sp-tool-intro">${intro.map(e).join(" ")}</p>`);

  if (option.setup_steps.length > 0) {
    out.push(
      `<p class="sp-label">In Coupler.io</p>`,
      `<ol>${option.setup_steps.map((step) => `<li>${richText(withTool(step.text, tool))}</li>`).join("")}</ol>`,
    );
  }
  for (const setup of tool.setups) {
    out.push(
      `<p class="sp-label">In ${e(setup.title ?? tool.name)}</p>`,
      `<ol>${setup.steps.map((step) => `<li>${richText(step.text)}</li>`).join("")}</ol>`,
    );
  }
  if (option.success_check) {
    out.push(`<p class="sp-label">Check it worked</p>`, `<p>${richText(withTool(option.success_check.text, tool))}</p>`);
  }
  if (tool.notes.length > 0) {
    out.push(`<p class="sp-label">Good to know</p>`, list(tool.notes.map((note) => richText(note.text))));
  }
  out.push(toolLinks(tool));
  return `<div class="sp-tool-panel" data-tool="${e(tool.id)}">${out.join("")}</div>`;
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

function setupTime(option: ModelOption): string {
  const claim = option.setup_time;
  if (!claim || claim.status !== "known" || !claim.value) return "";
  const { min_minutes: min, max_minutes: max, basis } = claim.value;
  const range = min === max ? `${min} minutes` : `${min} to ${max} minutes`;
  return `<p><strong>Setup time:</strong> ${e(range)}. <span class="sp-muted">${e(basis)}</span></p>`;
}

function installBody(option: ModelOption, tools: ModelAiTool[]): string[] {
  const out: string[] = tools.map((tool) => toolPanel(option, tool));
  out.push(setupTime(option));

  const links: string[] = [];
  if (option.links.setup) links.push(anchor("Provider setup instructions", option.links.setup));
  if (option.links.overview && option.links.overview !== option.links.setup) {
    links.push(anchor("Overview", option.links.overview));
  }
  if (option.links.pricing) links.push(anchor("Pricing", option.links.pricing));
  if (links.length > 0) out.push(`<p class="sp-links">${links.join("")}</p>`);
  return out.filter((part) => part !== "");
}

function section(option: ModelOption, kind: "works" | "install", title: string, body: string[]): string {
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

function panel(option: ModelOption, aiTools: ModelAiTools): string {
  const limited = option.route_status.status === "known" && option.route_status.value !== "available";
  const intro = option.description ? `<p class="sp-panel-intro">${e(option.description)}</p>` : "";
  const tools = toolsFor(option, aiTools);
  return (
    `<div class="sp-panel${limited ? " sp-panel--limited" : ""}" data-option="${e(option.id)}">` +
    intro +
    section(option, "works", "Works with", toolTiles(option, tools, aiTools)) +
    section(option, "install", "How to install", installBody(option, tools)) +
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
      : `<p>Choose a route. ${options.length} are recorded. Each one shows which AI tools it works with and how to install it.</p>`,
    `<div class="sp-switch not-content${options.length === 1 ? " sp-switch--single" : ""}">${radios}<div class="sp-tabs">${cards}</div>` +
      `<div class="sp-pillbar" aria-label="Switch route">${pills}</div>` +
      options.map((option) => panel(option, aiTools)).join("") +
      `</div>`,
  ];
}

export const SKILLS_INDEX_URL = "https://raw.githubusercontent.com/coupler-io/skills/main/skills-index.json";
export const SKILLS_REPO_URL = "https://github.com/coupler-io/skills";

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

export function connectorsSection(source: ModelSource): string[] {
  const out = ["## Related connectors"];
  if (source.related.length === 0) {
    out.push(`<p class="sp-muted">No related connectors listed yet. <a href="/">Browse all connectors</a>.</p>`);
    return out;
  }
  out.push(
    list(
      source.related.map((related) => `<a class="sp-route-link" href="/sources/${e(related.slug)}/">${e(related.name)}</a>`),
      "sp-routes not-content",
    ),
  );
  return out;
}
