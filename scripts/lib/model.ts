import type { AiTool, AiToolsFile } from "../../schemas/ai-tool.ts";
import type { Claim, Evidence } from "../../schemas/common.ts";
import type { Option, RelatedSkill, Source } from "../../schemas/source.ts";
import type { SiteConfig } from "../../schemas/site.ts";
import type { Content } from "./load.ts";
import { isUsableRoute } from "./validate.ts";

export const CONNECTION_LABELS = {
  remote_mcp: "Remote MCP",
  local_mcp: "Local MCP",
} as const;

export const MAINTAINER_LABELS = {
  source_vendor: "Source-vendor maintained",
  anthropic: "Anthropic maintained",
  third_party: "Third-party",
  community: "Community",
} as const;

export const METHOD_LABELS = {
  native_connector: "Native connector",
  remote_mcp: "Remote MCP server",
  local_mcp: "Local MCP server",
  data_platform: "Data platform",
  automation: "Automation",
} as const;

export interface ModelAiTool extends AiTool {
  connection_label: string;
}

export interface ModelAiTools {
  evidence: Evidence[];
  shared_notes: AiToolsFile["shared_notes"];
  tools: ModelAiTool[];
}

export interface ModelOption extends Omit<Option, "works_with"> {
  works_with: string[];
  badges: string[];
  maintainer_label: string;
  method_label: string;
  is_usable_route: boolean;
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
  summary: string;
  meta_description: string;
  research: { searched_on: string; coverage_note: string; checked_urls: string[] };
  evidence: Evidence[];
  options: ModelOption[];
  recommendations: ModelRecommendation[];
  faq: Array<{ question: string; answer: string; evidence_ids: string[] }>;
  related_skills: RelatedSkill[];
  related: Array<{ id: string; slug: string; name: string }>;
}

export interface Model {
  site: SiteConfig;
  ai_tools: ModelAiTools;
  sources: ModelSource[];
}

const TROUBLESHOOTING = /\b(why|slow|timing out|time out|error|fail|cannot|can't|not (?:see|load|work)|stuck|missing)\b/i;

function faqRank(entry: ModelSource["faq"][number]): number {
  if (TROUBLESHOOTING.test(entry.question)) return 2;
  return /coupler\.io/i.test(entry.answer) ? 0 : 1;
}

/** Decision questions first, troubleshooting last, original order within each group. */
export function orderFaq(faq: ModelSource["faq"]): ModelSource["faq"] {
  return faq
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => faqRank(a.entry) - faqRank(b.entry) || a.index - b.index)
    .map(({ entry }) => entry);
}

export function resolveWorksWith(option: Pick<Option, "works_with">, tools: AiTool[]): string[] {
  if (option.works_with === "all") return tools.map((tool) => tool.id);
  const wanted = new Set(option.works_with);
  return tools.filter((tool) => wanted.has(tool.id)).map((tool) => tool.id);
}

function buildAiTools(file: AiToolsFile): ModelAiTools {
  return {
    evidence: file.evidence.filter((item) => item.public).sort((a, b) => a.id.localeCompare(b.id)),
    shared_notes: file.shared_notes,
    tools: file.tools.map((tool) => ({ ...tool, connection_label: CONNECTION_LABELS[tool.connection] })),
  };
}

function availabilityRank(option: Option): number {
  if (option.route_status.status !== "known") return 1;
  if (option.route_status.value === "available") return 0;
  if (option.route_status.value === "limited") return 2;
  return 3;
}

function isRecommended(option: Option): number {
  return option.provider === "Coupler.io" ? 0 : 1;
}

function rank(option: Option): number {
  if (option.maintainer.status === "known") {
    if (option.maintainer.value === "source_vendor" || option.maintainer.value === "anthropic") return 0;
    if (option.maintainer.value === "community") return 2;
  }
  return 1;
}

function badges(option: Option): string[] {
  const list: string[] = [];
  if (option.maintainer.status === "known") list.push(MAINTAINER_LABELS[option.maintainer.value!]);
  if (option.directory_listing.status === "known") list.push("Listed in Claude directory");
  if (option.route_status.status === "known" && option.route_status.value === "limited") list.push("Limited");
  if (option.route_status.status === "known" && option.route_status.value === "unavailable") {
    list.push("Not available");
  }
  return list;
}

function publicEvidence(source: Source): Evidence[] {
  return source.evidence.filter((item) => item.public).sort((a, b) => a.id.localeCompare(b.id));
}

function keepPublic(ids: string[], allowed: Set<string>): string[] {
  return ids.filter((id) => allowed.has(id));
}

function stripClaim<T>(claim: Claim<T>, allowed: Set<string>): Claim<T> {
  return { ...claim, evidence_ids: keepPublic(claim.evidence_ids, allowed) };
}

function toModelOption(option: Option, allowed: Set<string>, tools: AiTool[]): ModelOption {
  return {
    ...option,
    works_with: resolveWorksWith(option, tools),
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
    capabilities: option.capabilities.map((item) => ({ ...item, evidence_ids: keepPublic(item.evidence_ids, allowed) })),
    setup_steps: option.setup_steps.map((step) => ({ ...step, evidence_ids: keepPublic(step.evidence_ids, allowed) })),
    success_check: option.success_check
      ? { ...option.success_check, evidence_ids: keepPublic(option.success_check.evidence_ids, allowed) }
      : null,
    badges: badges(option),
    maintainer_label:
      option.maintainer.status === "known" ? MAINTAINER_LABELS[option.maintainer.value!] : "Unknown",
    method_label: METHOD_LABELS[option.method],
    is_usable_route: isUsableRoute(option),
  };
}

export function buildModel(content: Content): Model {
  const selected = content.sources
    .map((bundle) => bundle.record)
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleIds = new Map(selected.map((record) => [record.id, record]));

  const sources: ModelSource[] = selected.map((record) => {
    const evidence = publicEvidence(record);
    const allowed = new Set(evidence.map((item) => item.id));
    const modelOptions = [...record.options]
      .map((option) => toModelOption(option, allowed, content.aiTools.tools))
      .sort(
        (a, b) =>
          isRecommended(a) - isRecommended(b) ||
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
      summary: record.summary,
      meta_description: record.meta_description,
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
      related_skills: record.related_skills.map((skill) => ({
        ...skill,
        evidence_ids: keepPublic(skill.evidence_ids, allowed),
      })),
      related: record.related_source_ids
        .map((id) => visibleIds.get(id))
        .filter((related): related is Source => related !== undefined)
        .map((related) => ({ id: related.id, slug: related.slug, name: related.name })),
    };
  });

  return {
    site: content.site,
    ai_tools: buildAiTools(content.aiTools),
    sources,
  };
}
