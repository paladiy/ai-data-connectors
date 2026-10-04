import { z } from "zod";
import { IsoDate, NonEmptyText } from "./common.ts";

/**
 * The shape of the upstream coupler-io/skills index, as inspected rather than assumed. Unknown
 * keys are kept, not rejected: an upstream field we do not use must never fail a sync. Only the
 * fields this repository reads are required.
 */
export const UpstreamSkill = z.looseObject({
  name: NonEmptyText,
  path: NonEmptyText,
  category: z.string().optional(),
  sources: z.array(z.string()).default([]),
  short_description: z.string().optional(),
  description: z.string().optional(),
});

export type UpstreamSkill = z.infer<typeof UpstreamSkill>;

export const UpstreamSkillsIndex = z.looseObject({
  skills: z.array(UpstreamSkill),
});

export type UpstreamSkillsIndex = z.infer<typeof UpstreamSkillsIndex>;

/** Provenance for the committed snapshot. Written only by `npm run sync:skills`. */
export const SkillsLock = z.strictObject({
  repo: z.string().regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/, "must be owner/name"),
  commit_sha: z.string().regex(/^[0-9a-f]{40}$/, "must be a full commit SHA"),
  path: NonEmptyText,
  sha256: z.string().regex(/^[0-9a-f]{64}$/, "must be a sha256 hex digest"),
  retrieved_on: IsoDate,
  skill_count: z.number().int().nonnegative(),
});

export type SkillsLock = z.infer<typeof SkillsLock>;
