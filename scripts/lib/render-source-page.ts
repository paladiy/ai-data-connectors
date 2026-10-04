import { SURFACES } from "../../schemas/source.ts";
import type { Claim } from "../../schemas/common.ts";
import { formatValue } from "./markdown.ts";
import { SURFACE_LABELS, type ModelOption, type ModelSource } from "./model.ts";

/**
 * Body of a source page, in the order a reader decides things: what this is, how to install it,
 * what it can do, what data it reaches, then where to go next.
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

function badgesFor(option: ModelOption): string {
  const parts = [
    option.provider === "Coupler.io" ? badge("Recommended", "accent") : null,
    badge(accessLabel(option), option.access.status === "known" && option.access.value === "read_write" ? "accent" : "plain"),
    availabilityBadge(option),
  ].filter((part): part is string => part !== null);
  return `<p class="sp-badges">${parts.join("")}</p>`;
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

function routeHeading(option: ModelOption, prefix: string): string {
  return (
    `<div class="sp-route-head"><h3 id="${prefix}-${e(option.id)}">${e(option.name)}</h3>` +
    `<p>${e(option.provider)} · ${e(option.method_label)}</p></div>`
  );
}

function route(option: ModelOption, prefix: string, body: string[]): string {
  const limited = option.route_status.status === "known" && option.route_status.value !== "available";
  const cls = limited ? "sp-route sp-route--limited not-content" : "sp-route not-content";
  return `<article class="${cls}">${routeHeading(option, prefix)}<div class="sp-route-body">${body.join("")}</div></article>`;
}

/* ---------- Description ---------- */

function bestFor(source: ModelSource, option: ModelOption): string | null {
  const jobs = source.recommendations.filter((recommendation) => recommendation.option_id === option.id);
  return jobs.length > 0 ? jobs.map((job) => job.job).join("; ") : null;
}

function routeList(source: ModelSource): string {
  const items = source.options.map((option) => {
    const best = bestFor(source, option);
    return (
      `<a class="sp-route-link" href="#install-${e(option.id)}">${e(option.name)}</a>` +
      `<span class="sp-route-meta">${e(option.provider)} · ${e(option.method_label)} · ${e(option.maintainer_label)}</span>` +
      badgesFor(option) +
      (best ? `<span class="sp-route-best">Best for: ${e(best)}</span>` : "")
    );
  });
  return list(items, "sp-routes not-content");
}

export function descriptionSection(source: ModelSource): string[] {
  const out = ["## Description", `<p>${e(source.summary)}</p>`];
  if (source.aliases.length > 0) {
    out.push(`<p class="sp-muted">Also searched as ${source.aliases.map(e).join(", ")}.</p>`);
  }
  out.push(routeList(source));
  out.push(
    `<p class="sp-muted">Each claim cites the evidence listed at the end of this page. Where a capability is not documented, it says so instead of guessing.</p>`,
  );
  return out;
}

/* ---------- How to install ---------- */

function worksIn(option: ModelOption): string {
  const supported: string[] = [];
  const unconfirmed: string[] = [];
  for (const surface of SURFACES) {
    const claim = option.surfaces[surface] as Claim<string>;
    if (claim.status === "known" && claim.value === "supported") supported.push(SURFACE_LABELS[surface]);
    else if (claim.status === "known" && claim.value === "limited") supported.push(`${SURFACE_LABELS[surface]} (limited)`);
    else if (claim.status === "known" && claim.value === "unsupported") continue;
    else unconfirmed.push(SURFACE_LABELS[surface]);
  }
  const lines: string[] = [];
  if (supported.length > 0) lines.push(`<p><strong>Works in:</strong> ${supported.map(e).join(", ")}</p>`);
  if (unconfirmed.length > 0) {
    lines.push(`<p class="sp-muted">Not documented for ${unconfirmed.map(e).join(", ")}.</p>`);
  }
  return lines.join("");
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
  if (option.description) out.push(`<p>${e(option.description)}</p>`);
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

export function installSection(source: ModelSource): string[] {
  return [
    "## How to install",
    `<p>Pick one route. Each lists what you need first, then the steps, then how to confirm it worked.</p>`,
    ...source.options.map((option) => route(option, "install", installBody(option))),
  ];
}

/* ---------- What it can do ---------- */

function limitsBlock(option: ModelOption): string {
  if (option.limits.status !== "known") return "";
  const value = option.limits.value;
  const items = Array.isArray(value) ? value : [value];
  return `<p class="sp-label">Limits to know</p>${list(items.map((item) => e(String(item))))}`;
}

function canDoBody(option: ModelOption): string[] {
  const out: string[] = [badgesFor(option)];
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

export function canDoSection(source: ModelSource): string[] {
  return ["## What it can do", ...source.options.map((option) => route(option, "can-do", canDoBody(option)))];
}

/* ---------- What data it has access to ---------- */

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

export function dataSection(source: ModelSource): string[] {
  return ["## What data it has access to", ...source.options.map((option) => route(option, "data", dataBody(option)))];
}

/* ---------- Related skills and connectors ---------- */

export function skillsSection(source: ModelSource): string[] {
  const out = ["## Related skills"];
  if (source.related_skills.length === 0) {
    out.push(`<p class="sp-muted">No source-specific skill listed yet.</p>`);
    return out;
  }
  out.push(
    `<p>A skill gives Claude instructions for a task. It does not connect any data, so each one lists what it needs besides ${e(source.name)}.</p>`,
    list(
      source.related_skills.map(
        (skill) =>
          `<a class="sp-route-link" href="${e(encodeURI(skill.url))}">${e(skill.name)}</a>` +
          `<span>${e(skill.description)}</span>` +
          (skill.also_needs.length > 0
            ? `<span class="sp-muted">Also needs ${skill.also_needs.map(e).join(", ")}.</span>`
            : ""),
      ),
      "sp-routes not-content",
    ),
  );
  return out;
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
