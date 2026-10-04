import type { Claim, Evidence } from "../../schemas/common.ts";
import type { CategoryRecord, Option, Source } from "../../schemas/source.ts";
import { SURFACES } from "../../schemas/source.ts";
import type { SiteConfig } from "../../schemas/site.ts";
import type { Content } from "./load.ts";
import { isPublished, isVerifiedRoute } from "./validate.ts";

export const SURFACE_LABELS: Record<(typeof SURFACES)[number], string> = {
  claude_web: "Claude web",
  claude_desktop: "Claude desktop",
  claude_code: "Claude Code",
  cowork: "Cowork",
};

export const MAINTAINER_LABELS = {
  source_vendor: "Source-vendor maintained",
  anthropic: "Anthropic maintained",
  third_party: "Third-party",
  community: "Community",
  manual: "Manual export",
} as const;

export const METHOD_LABELS = {
  native_connector: "Native connector",
  remote_mcp: "Remote MCP server",
  local_mcp: "Local MCP server",
  data_platform: "Data platform",
  automation: "Automation",
  file_upload: "File upload",
} as const;

export interface ModelOption extends Option {
  badges: string[];
  maintainer_label: string;
  method_label: string;
  is_verified_route: boolean;
}

export interface ModelRecommendation {
  job: string;
  option_id: string;
  option_name: string;
  reason: string;
  evidence_ids: string[];
}

export interface ModelSource {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  category_name: string;
  summary: string;
  meta_description: string;
  published: boolean;
  review: { reviewer: string; reviewed_on: string; method: "docs" | "tested" | "both" } | null;
  research: { searched_on: string; coverage_note: string; checked_urls: string[] };
  evidence: Evidence[];
  options: ModelOption[];
  recommendations: ModelRecommendation[];
  faq: Array<{ question: string; answer: string; evidence_ids: string[] }>;
  related: Array<{ id: string; slug: string; name: string }>;
}

export interface ModelCategory extends CategoryRecord {
  sources: ModelSource[];
}

export interface Model {
  site: SiteConfig;
  sources: ModelSource[];
  categories: ModelCategory[];
}

export interface BuildOptions {
  /** Include records that are not published. Only the local draft preview sets this. */
  includeDrafts?: boolean;
}

/**
 * A route a reader cannot use today never leads the comparison, however official it is: an
 * invitation-only pilot is interesting context, not the answer to "how do I connect this?".
 */
function availabilityRank(option: Option): number {
  if (option.route_status.status !== "verified") return 1;
  if (option.route_status.value === "available") return 0;
  if (option.route_status.value === "limited") return 2;
  return 3;
}

/** Ordering: verified vendor/Anthropic routes, other managed routes by provider, community, manual. */
function rank(option: Option): number {
  if (option.maintainer.status === "verified") {
    if (option.maintainer.value === "source_vendor" || option.maintainer.value === "anthropic") return 0;
    if (option.maintainer.value === "community") return 2;
    if (option.maintainer.value === "manual") return 3;
  }
  if (option.method === "file_upload") return 3;
  return 1;
}

function badges(option: Option): string[] {
  const list: string[] = [];
  if (option.maintainer.status === "verified") list.push(MAINTAINER_LABELS[option.maintainer.value!]);
  if (option.directory_listing.status === "verified") list.push("Listed in Claude directory");
  if (option.route_status.status === "verified" && option.route_status.value === "limited") list.push("Limited");
  if (option.route_status.status === "verified" && option.route_status.value === "unavailable") {
    list.push("Not available");
  }
  return list;
}

/** Public evidence only. Private references never reach a rendered artifact or an export. */
function publicEvidence(source: Source): Evidence[] {
  return source.evidence.filter((item) => item.public).sort((a, b) => a.id.localeCompare(b.id));
}

function keepPublic(ids: string[], allowed: Set<string>): string[] {
  return ids.filter((id) => allowed.has(id));
}

function stripClaim<T>(claim: Claim<T>, allowed: Set<string>): Claim<T> {
  return { ...claim, evidence_ids: keepPublic(claim.evidence_ids, allowed) };
}

function toModelOption(option: Option, allowed: Set<string>): ModelOption {
  const surfaces = Object.fromEntries(
    SURFACES.map((surface) => [surface, stripClaim(option.surfaces[surface] as Claim<string>, allowed)]),
  ) as ModelOption["surfaces"];

  return {
    ...option,
    maintainer: stripClaim(option.maintainer, allowed),
    route_status: stripClaim(option.route_status, allowed),
    directory_listing: stripClaim(option.directory_listing, allowed),
    access: stripClaim(option.access, allowed),
    data_available: stripClaim(option.data_available, allowed),
    history: stripClaim(option.history, allowed),
    refresh: stripClaim(option.refresh, allowed),
    multi_source: stripClaim(option.multi_source, allowed),
    prerequisites: stripClaim(option.prerequisites, allowed),
    pricing: stripClaim(option.pricing, allowed),
    data_path: stripClaim(option.data_path, allowed),
    limits: stripClaim(option.limits, allowed),
    ...(option.setup_time ? { setup_time: stripClaim(option.setup_time, allowed) } : {}),
    surfaces,
    setup_steps: option.setup_steps.map((step) => ({ ...step, evidence_ids: keepPublic(step.evidence_ids, allowed) })),
    claude_configuration: option.claude_configuration.map((step) => ({
      ...step,
      evidence_ids: keepPublic(step.evidence_ids, allowed),
    })),
    success_check: option.success_check
      ? { ...option.success_check, evidence_ids: keepPublic(option.success_check.evidence_ids, allowed) }
      : null,
    badges: badges(option),
    maintainer_label:
      option.maintainer.status === "verified" ? MAINTAINER_LABELS[option.maintainer.value!] : "Not verified",
    method_label: METHOD_LABELS[option.method],
    is_verified_route: isVerifiedRoute(option),
  };
}

export function buildModel(content: Content, options: BuildOptions = {}): Model {
  const includeDrafts = options.includeDrafts === true;
  const categoryNames = new Map(content.categories.map((c) => [c.id, c.name]));

  const selected = content.sources
    .filter((bundle) => includeDrafts || isPublished(bundle.record))
    .map((bundle) => bundle.record)
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleIds = new Map(selected.map((record) => [record.id, record]));

  const sources: ModelSource[] = selected.map((record) => {
    const evidence = publicEvidence(record);
    const allowed = new Set(evidence.map((item) => item.id));
    const modelOptions = [...record.options]
      .map((option) => toModelOption(option, allowed))
      .sort(
        (a, b) =>
          availabilityRank(a) - availabilityRank(b) ||
          rank(a) - rank(b) ||
          a.provider.localeCompare(b.provider) ||
          a.name.localeCompare(b.name),
      );
    const optionNames = new Map(modelOptions.map((option) => [option.id, option.name]));

    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      aliases: record.aliases,
      category: record.category,
      category_name: categoryNames.get(record.category) ?? record.category,
      summary: record.summary,
      meta_description: record.meta_description,
      published: isPublished(record),
      review: record.review
        ? { reviewer: record.review.reviewer, reviewed_on: record.review.reviewed_on, method: record.review.method }
        : null,
      research: record.research,
      evidence,
      options: modelOptions,
      recommendations: record.recommendations.map((recommendation) => ({
        job: recommendation.job,
        option_id: recommendation.option_id,
        option_name: optionNames.get(recommendation.option_id) ?? recommendation.option_id,
        reason: recommendation.reason,
        evidence_ids: keepPublic(recommendation.evidence_ids, allowed),
      })),
      faq: record.faq.map((entry) => ({ ...entry, evidence_ids: keepPublic(entry.evidence_ids, allowed) })),
      related: record.related_source_ids
        .map((id) => visibleIds.get(id))
        .filter((related): related is Source => related !== undefined)
        .map((related) => ({ id: related.id, slug: related.slug, name: related.name })),
    };
  });

  const categories: ModelCategory[] = content.categories
    .map((category) => ({ ...category, sources: sources.filter((source) => source.category === category.id) }))
    .filter((category) => category.sources.length > 0);

  return {
    site: content.site,
    sources,
    categories,
  };
}
