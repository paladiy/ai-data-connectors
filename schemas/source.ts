import { z } from "zod";
import {
  claim,
  Evidence,
  EvidencedText,
  HttpsUrl,
  IsoDate,
  NonEmptyText,
  Slug,
  TextOrList,
} from "./common.ts";

export const Maintainer = z.enum(["source_vendor", "anthropic", "third_party", "community"]);
export const Method = z.enum([
  "native_connector",
  "remote_mcp",
  "local_mcp",
  "data_platform",
  "automation",
]);
export const RouteStatus = z.enum(["available", "limited", "unavailable"]);
export const SurfaceSupport = z.enum(["supported", "limited", "unsupported"]);
export const Access = z.enum(["read", "write", "read_write"]);

export const SURFACES = ["claude_web", "claude_desktop", "claude_code", "cowork"] as const;

export const Option = z.strictObject({
  id: Slug,
  name: NonEmptyText,
  provider: NonEmptyText,
  description: NonEmptyText.optional(),
  maintainer: claim(Maintainer),
  method: Method,
  route_status: claim(RouteStatus),
  directory_listing: claim(HttpsUrl),
  links: z.strictObject({
    overview: HttpsUrl.optional(),
    setup: HttpsUrl.optional(),
    pricing: HttpsUrl.optional(),
  }),
  surfaces: z.strictObject({
    claude_web: claim(SurfaceSupport),
    claude_desktop: claim(SurfaceSupport),
    claude_code: claim(SurfaceSupport),
    cowork: claim(SurfaceSupport),
  }),
  access: claim(Access),
  data_available: claim(z.array(NonEmptyText).min(1)),
  history: claim(TextOrList),
  refresh: claim(TextOrList),
  multi_source: claim(TextOrList),
  prerequisites: claim(TextOrList),
  pricing: claim(TextOrList),
  data_path: claim(TextOrList),
  limits: claim(TextOrList),
  setup_time: claim(
    z.strictObject({
      min_minutes: z.number().int().positive(),
      max_minutes: z.number().int().positive(),
      basis: NonEmptyText,
    }),
  ).optional(),
  capabilities: z.array(EvidencedText).default([]),
  setup_steps: z.array(EvidencedText),
  claude_configuration: z.array(EvidencedText).default([]),
  sample_query: NonEmptyText.optional(),
  success_check: EvidencedText.nullable(),
});

export type Option = z.infer<typeof Option>;

export const RelatedSkill = z.strictObject({
  name: NonEmptyText,
  description: NonEmptyText,
  url: HttpsUrl,
  also_needs: z.array(NonEmptyText).default([]),
  evidence_ids: z.array(Slug),
});

export type RelatedSkill = z.infer<typeof RelatedSkill>;

export const Source = z.strictObject({
  schema_version: z.literal(1),
  id: Slug,
  slug: Slug,
  name: NonEmptyText,
  aliases: z.array(NonEmptyText),
  summary: NonEmptyText,
  meta_description: NonEmptyText.max(170),
  research: z.strictObject({
    searched_on: IsoDate,
    checked_urls: z.array(HttpsUrl),
    coverage_note: NonEmptyText,
  }),
  evidence: z.array(Evidence),
  options: z.array(Option),
  recommendations: z.array(
    z.strictObject({
      job: NonEmptyText,
      option_id: Slug,
      reason: NonEmptyText,
      evidence_ids: z.array(Slug),
    }),
  ),
  faq: z.array(
    z.strictObject({
      question: NonEmptyText,
      answer: NonEmptyText,
      evidence_ids: z.array(Slug),
    }),
  ),
  related_skills: z.array(RelatedSkill).default([]),
  related_source_ids: z.array(Slug),
});

export type Source = z.infer<typeof Source>;

export const PrivateEvidenceFile = z.strictObject({
  source_id: Slug,
  evidence: z.array(Evidence),
});

