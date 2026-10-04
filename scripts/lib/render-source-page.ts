import { SURFACES } from "../../schemas/source.ts";
import type { Claim } from "../../schemas/common.ts";
import { formatValue } from "./markdown.ts";
import { SURFACE_LABELS, type ModelOption, type ModelSource } from "./model.ts";

/**
 * Body of a source page: what this is, then one route switcher whose selected route shows how to
 * install it, what it can do, and what data it reaches, then where to go next.
 *
 * Every block is emitted as HTML with no blank lines inside it, so Markdown never re-parses the
 * content. All record text goes through escapeHtml; only https URLs from validated records reach
 * an href.
 */

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

/** Plain text of a claim, with a stated reason when there is nothing to show. */
function claimBlock(claim: Claim<unknown>): string {
  if (claim.status === "known") {
    const value = claim.value;
    const body = Array.isArray(value)
      ? list(value.map((entry) => e(formatValue(entry))))
      : `<p>${e(formatValue(value))}</p>`;
    return claim.note ? `${body}<p class="sp-note">${e(claim.note)}</p>` : body;
  }
  const label = claim.status === "not_applicable" ? "Not applicable" : "Unknown";
  return `<p class="sp-muted">${label}${claim.note ? `. ${e(claim.note)}` : ""}</p>`;
}

function fact(label: string, claim: Claim<unknown>): string {
  return `<div class="sp-fact"><dt>${e(label)}</dt><dd>${claimBlock(claim)}</dd></div>`;
}

/* ---------- Description ---------- */

export function descriptionSection(source: ModelSource): string[] {
  const out = ["## Description", `<p>${e(source.summary)}</p>`];
  if (source.aliases.length > 0) {
    out.push(`<p class="sp-muted">Also searched as ${source.aliases.map(e).join(", ")}.</p>`);
  }
  out.push(`<p class="sp-muted">Where a capability is not documented, this page says so instead of guessing.</p>`);
  return out;
}

/* ---------- Connection routes ----------
   One switcher for the whole source. A route is chosen once, with a radio input, and its install
   steps, capabilities, and data show together. Without JavaScript the radios still work (CSS only);
   a small script in Head.astro adds deep links (#install-notfair opens that route). */

function bestFor(source: ModelSource, option: ModelOption): string | null {
  const jobs = source.recommendations.filter((recommendation) => recommendation.option_id === option.id);
  return jobs.length > 0 ? jobs.map((job) => job.job).join("; ") : null;
}

/** Decorative 24px line icons, one per Claude surface. */
const svg = (paths: string) =>
  `<svg class="sp-surf-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

const SURFACE_ICONS: Record<(typeof SURFACES)[number], string> = {
  // Browser window.
  claude_web: svg(`<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18"/><circle cx="6.2" cy="6.8" r=".5"/><circle cx="8.6" cy="6.8" r=".5"/>`),
  // Desktop monitor.
  claude_desktop: svg(`<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M9 20h6M12 16.5V20"/>`),
  // Terminal prompt.
  claude_code: svg(`<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7.5 10 3 2.5-3 2.5M13 15h3.5"/>`),
  // Shared workspace: two people.
  cowork: svg(`<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.4-3 2.6-4.8 5.5-4.8s5.1 1.8 5.5 4.8"/><path d="M15.5 5.7a3 3 0 0 1 0 5.6M17.2 14.5c2 .6 3.1 2.2 3.3 4.5"/>`),
};

/** One tile per surface, so support reads at a glance; the state is also written out, never colour alone. */
function worksIn(option: ModelOption): string {
  const tiles = SURFACES.map((surface) => {
    const claim = option.surfaces[surface] as Claim<string>;
    let state: "supported" | "limited" | "unsupported" | "unknown" = "unknown";
    if (claim.status === "known" && claim.value === "supported") state = "supported";
    else if (claim.status === "known" && claim.value === "limited") state = "limited";
    else if (claim.status === "known" && claim.value === "unsupported") state = "unsupported";
    const text = { supported: "Works", limited: "Limited", unsupported: "Not supported", unknown: "Not documented" }[state];
    return (
      `<li class="sp-surf sp-surf--${state}">${SURFACE_ICONS[surface]}` +
      `<span class="sp-surf-name">${e(SURFACE_LABELS[surface])}</span>` +
      `<span class="sp-surf-state">${text}</span></li>`
    );
  });
  return `<p class="sp-label">Works in</p><ul class="sp-surfaces">${tiles.join("")}</ul>`;
}

function setupTime(option: ModelOption): string {
  const claim = option.setup_time;
  if (!claim || claim.status !== "known" || !claim.value) return "";
  const { min_minutes: min, max_minutes: max, basis } = claim.value;
  const range = min === max ? `${min} minutes` : `${min} to ${max} minutes`;
  return `<p><strong>Setup time:</strong> ${e(range)}. <span class="sp-muted">${e(basis)}</span></p>`;
}

function installBody(option: ModelOption): string[] {
  const out: string[] = [];
  out.push(worksIn(option));

  if (option.prerequisites.status === "known") {
    const value = option.prerequisites.value;
    const items = Array.isArray(value) ? value : [value];
    out.push(`<p class="sp-label">Before you start</p>`, list(items.map((item) => e(String(item)))));
  }
  out.push(`<p class="sp-label">Cost</p>`, claimBlock(option.pricing));
  if (option.setup_steps.length > 0) {
    out.push(
      `<p class="sp-label">Steps</p>`,
      `<ol>${option.setup_steps.map((step) => `<li>${e(step.text)}</li>`).join("")}</ol>`,
    );
  }
  if (option.claude_configuration.length > 0) {
    out.push(`<p class="sp-label">In Claude</p>`, list(option.claude_configuration.map((step) => e(step.text))));
  }
  if (option.success_check) {
    out.push(`<p class="sp-label">Check it worked</p>`, `<p>${e(option.success_check.text)}</p>`);
  }
  out.push(setupTime(option));

  const links: string[] = [];
  if (option.links.setup) links.push(anchor("Provider setup instructions", option.links.setup));
  if (option.links.overview && option.links.overview !== option.links.setup) {
    links.push(anchor("Overview", option.links.overview));
  }
  if (option.links.pricing) links.push(anchor("Pricing", option.links.pricing));
  if (option.directory_listing.status === "known" && option.directory_listing.value !== option.links.overview) {
    links.push(anchor("Claude directory entry", option.directory_listing.value!));
  }
  if (links.length > 0) out.push(`<p class="sp-links">${links.join("")}</p>`);
  return out.filter((part) => part !== "");
}

function limitsBlock(option: ModelOption): string {
  if (option.limits.status !== "known") return "";
  const value = option.limits.value;
  const items = Array.isArray(value) ? value : [value];
  return `<p class="sp-label">Limits to know</p>${list(items.map((item) => e(String(item))))}`;
}

function canDoBody(option: ModelOption): string[] {
  const out: string[] = [];
  if (option.access.status === "known" && option.access.note) {
    out.push(`<p class="sp-note">${e(option.access.note)}</p>`);
  }
  if (option.capabilities.length > 0) {
    out.push(`<p class="sp-label">Ask Claude to</p>`, list(option.capabilities.map((item) => e(item.text))));
  } else {
    out.push(`<p class="sp-muted">The actions this route supports are not itemised yet.</p>`);
  }
  if (option.sample_query) {
    out.push(`<p class="sp-label">A good first question</p>`, `<blockquote>${e(option.sample_query)}</blockquote>`);
  }
  out.push(limitsBlock(option));
  return out.filter((part) => part !== "");
}

function dataBody(option: ModelOption): string[] {
  return [
    `<p class="sp-label">Data available</p>`,
    claimBlock(option.data_available),
    `<dl class="sp-facts">`,
    fact("How far back", option.history),
    fact("How fresh", option.refresh),
    fact("Where queries run", option.data_path),
    fact("Several sources at once", option.multi_source),
    `</dl>`,
  ];
}

function section(option: ModelOption, kind: "install" | "can-do" | "data", title: string, body: string[]): string {
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

function panel(option: ModelOption): string {
  const limited = option.route_status.status === "known" && option.route_status.value !== "available";
  const intro = option.description ? `<p class="sp-panel-intro">${e(option.description)}</p>` : "";
  return (
    `<div class="sp-panel${limited ? " sp-panel--limited" : ""}" data-option="${e(option.id)}">` +
    intro +
    section(option, "install", "How to install", installBody(option)) +
    section(option, "can-do", "What it can do", canDoBody(option)) +
    section(option, "data", "What data it has access to", dataBody(option)) +
    `</div>`
  );
}

export function routesSection(source: ModelSource): string[] {
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
    "## Connection routes",
    `<p>${options.length === 1 ? "One route is recorded." : `Choose a route. ${options.length} are recorded.`} Each one shows what you need first, the steps, what Claude can then do, and which data it reaches.</p>`,
    `<div class="sp-switch not-content">${radios}<div class="sp-tabs">${cards}</div>` +
      `<div class="sp-pillbar" aria-label="Switch route">${pills}</div>` +
      options.map((option) => panel(option)).join("") +
      `</div>`,
  ];
}

/* ---------- Related skills and connectors ---------- */

/** Live skills index. Skills are never indexed in this repository; the browser reads this file. */
export const SKILLS_INDEX_URL = "https://raw.githubusercontent.com/coupler-io/skills/main/skills-index.json";
export const SKILLS_REPO_URL = "https://github.com/coupler-io/skills";

/**
 * Renders only a placeholder carrying the names to match on. The script in
 * site/src/components/Head.astro fills it from the live coupler-io/skills index.
 */
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
      source.related.map((related) => `<a class="sp-route-link" href="/sources/${e(related.slug)}/">${e(related.name)} to Claude</a>`),
      "sp-routes not-content",
    ),
  );
  return out;
}
