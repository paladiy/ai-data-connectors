import { z } from "zod";
import { HttpsUrl, NonEmptyText, SiteUrl } from "./common.ts";

export const SiteConfig = z.strictObject({
  name: NonEmptyText,
  tagline: NonEmptyText,
  url: SiteUrl,
  repo: z
    .string()
    .regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/, "must be owner/name")
    .nullable(),
  maintainer: z.strictObject({
    name: NonEmptyText,
    relationship_confirmed: z.boolean(),
  }),
  publisher: z.strictObject({
    name: NonEmptyText,
    type: z.enum(["Person", "Organization"]),
    url: HttpsUrl.optional(),
  }),
  affiliation_statement: NonEmptyText,
});

export type SiteConfig = z.infer<typeof SiteConfig>;
