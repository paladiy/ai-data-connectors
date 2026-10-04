import { z } from "zod";
import type { Claim } from "../../schemas/common.ts";
import { SURFACES } from "../../schemas/source.ts";
import type { Model, ModelOption, ModelSource } from "./model.ts";

export const PUBLIC_SCHEMA_VERSION = 1;

/**
 * Public dataset contract. Serialization is an explicit allowlist: a field reaches connectors.json
 * only because it is named here, so new internal fields cannot leak by default.
 */
const PublicClaim = z.strictObject({
  status: z.enum(["known", "unknown", "not_applicable"]),
  value: z.unknown().nullable(),
  evidence_ids: z.array(z.string()),
  note: z.string().optional(),
});

const PublicEvidence = z.strictObject({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  publisher: z.string(),
  checked_on: z.string(),
  kind: z.enum(["vendor_docs", "directory", "product_test", "internal_docs"]),
});

const PublicOption = z.strictObject({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  method: z.string(),
  method_label: z.string(),
  maintainer: PublicClaim,
  maintainer_label: z.string(),
  route_status: PublicClaim,
  directory_listing: PublicClaim,
  links: z.strictObject({
    overview: z.string().optional(),
    setup: z.string().optional(),
    pricing: z.string().optional(),
  }),
  surfaces: z.record(z.string(), PublicClaim),
  access: PublicClaim,
  data_available: PublicClaim,
  history: PublicClaim,
  refresh: PublicClaim,
  multi_source: PublicClaim,
  prerequisites: PublicClaim,
  pricing: PublicClaim,
  data_path: PublicClaim,
  limits: PublicClaim,
  setup_time: PublicClaim.optional(),
  setup_steps: z.array(z.strictObject({ text: z.string(), evidence_ids: z.array(z.string()) })),
  success_check: z.strictObject({ text: z.string(), evidence_ids: z.array(z.string()) }).nullable(),
});

const PublicSource = z.strictObject({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  url: z.string(),
  summary: z.string(),
  research: z.strictObject({ searched_on: z.string(), coverage_note: z.string() }),
  evidence: z.array(PublicEvidence),
  options: z.array(PublicOption),
  recommendations: z.array(
    z.strictObject({
      job: z.string(),
      option_id: z.string(),
      reason: z.string(),
      evidence_ids: z.array(z.string()),
    }),
  ),
  faq: z.array(z.strictObject({ question: z.string(), answer: z.string(), evidence_ids: z.array(z.string()) })),
  related_source_ids: z.array(z.string()),
});

export const PublicDataset = z.strictObject({
  schema_version: z.literal(PUBLIC_SCHEMA_VERSION),
  name: z.string(),
  url: z.string(),
  publisher: z.strictObject({ name: z.string(), type: z.enum(["Person", "Organization"]) }),
  documentation: z.string(),
  sources: z.array(PublicSource),
});

export type PublicDataset = z.infer<typeof PublicDataset>;

function publicClaim(claim: Claim<unknown>) {
  return {
    status: claim.status,
    value: claim.value,
    evidence_ids: claim.evidence_ids,
    ...(claim.note ? { note: claim.note } : {}),
  };
}

function publicOption(option: ModelOption) {
  return {
    id: option.id,
    name: option.name,
    provider: option.provider,
    method: option.method,
    method_label: option.method_label,
    maintainer: publicClaim(option.maintainer),
    maintainer_label: option.maintainer_label,
    route_status: publicClaim(option.route_status),
    directory_listing: publicClaim(option.directory_listing),
    links: {
      ...(option.links.overview ? { overview: option.links.overview } : {}),
      ...(option.links.setup ? { setup: option.links.setup } : {}),
      ...(option.links.pricing ? { pricing: option.links.pricing } : {}),
    },
    surfaces: Object.fromEntries(
      SURFACES.map((surface) => [surface, publicClaim(option.surfaces[surface] as Claim<unknown>)]),
    ),
    access: publicClaim(option.access),
    data_available: publicClaim(option.data_available),
    history: publicClaim(option.history),
    refresh: publicClaim(option.refresh),
    multi_source: publicClaim(option.multi_source),
    prerequisites: publicClaim(option.prerequisites),
    pricing: publicClaim(option.pricing),
    data_path: publicClaim(option.data_path),
    limits: publicClaim(option.limits),
    ...(option.setup_time ? { setup_time: publicClaim(option.setup_time) } : {}),
    setup_steps: option.setup_steps.map((step) => ({ text: step.text, evidence_ids: step.evidence_ids })),
    success_check: option.success_check
      ? { text: option.success_check.text, evidence_ids: option.success_check.evidence_ids }
      : null,
  };
}

function publicSource(source: ModelSource, siteUrl: string) {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    aliases: source.aliases,
    url: new URL(`/sources/${source.slug}/`, siteUrl).toString(),
    summary: source.summary,
    research: { searched_on: source.research.searched_on, coverage_note: source.research.coverage_note },
    evidence: source.evidence.map((item) => ({
      id: item.id,
      url: item.url!,
      title: item.title,
      publisher: item.publisher,
      checked_on: item.checked_on,
      kind: item.kind,
    })),
    options: source.options.map(publicOption),
    recommendations: source.recommendations.map((recommendation) => ({
      job: recommendation.job,
      option_id: recommendation.option_id,
      reason: recommendation.reason,
      evidence_ids: recommendation.evidence_ids,
    })),
    faq: source.faq,
    related_source_ids: source.related.map((related) => related.id),
  };
}

export function buildPublicDataset(model: Model): PublicDataset {
  return PublicDataset.parse({
    schema_version: PUBLIC_SCHEMA_VERSION,
    name: model.site.name,
    url: new URL("/", model.site.url).toString(),
    publisher: { name: model.site.publisher.name, type: model.site.publisher.type },
    documentation: new URL("/about/", model.site.url).toString(),
    sources: model.sources.map((source) => publicSource(source, model.site.url)),
  });
}

export function serializePublicDataset(model: Model): string {
  return `${JSON.stringify(buildPublicDataset(model), null, 2)}\n`;
}
