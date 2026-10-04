import { z } from "zod";

export const CATEGORIES = [
  "accounting",
  "analytics",
  "ads",
  "crm",
  "productivity",
  "email-marketing",
  "customer-support",
  "social",
] as const;

export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase kebab-case");

export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a YYYY-MM-DD string")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, "must be a real calendar date");

export const HttpsUrl = z
  .string()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.length > 0;
    } catch {
      return false;
    }
  }, "must be an absolute https URL");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function isLocalDevelopmentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** https, or an explicit http://localhost / http://127.0.0.1 development URL. */
export const SiteUrl = z
  .string()
  .refine(
    (value) => HttpsUrl.safeParse(value).success || isLocalDevelopmentUrl(value),
    "must be https or an explicit local-development URL",
  );

export const Category = z.enum(CATEGORIES);

export const NonEmptyText = z.string().trim().min(1);

export const TextOrList = z.union([NonEmptyText, z.array(NonEmptyText).min(1)]);

export const EvidenceKind = z.enum(["vendor_docs", "directory", "product_test", "internal_docs"]);

export const Evidence = z
  .strictObject({
    id: Slug,
    url: HttpsUrl.optional(),
    internal_ref: NonEmptyText.optional(),
    title: NonEmptyText,
    publisher: NonEmptyText,
    checked_on: IsoDate,
    kind: EvidenceKind,
    public: z.boolean(),
  })
  .superRefine((evidence, ctx) => {
    if (!evidence.url && !evidence.internal_ref) {
      ctx.addIssue({ code: "custom", message: "evidence needs a url or an internal_ref", path: ["url"] });
    }
    if (evidence.public && !evidence.url) {
      ctx.addIssue({ code: "custom", message: "public evidence needs a url", path: ["url"] });
    }
    if (evidence.public && evidence.internal_ref) {
      ctx.addIssue({ code: "custom", message: "public evidence must not carry an internal_ref", path: ["internal_ref"] });
    }
  });

export type Evidence = z.infer<typeof Evidence>;

export const ClaimStatus = z.enum(["known", "unknown", "not_applicable"]);

export function claim<T extends z.ZodType>(value: T) {
  return z
    .strictObject({
      status: ClaimStatus,
      value: value.nullable(),
      evidence_ids: z.array(Slug),
      note: NonEmptyText.optional(),
    })
    .superRefine((raw, ctx) => {
      const c = raw as Claim<unknown>;
      if (c.status === "known") {
        if (c.value === null) ctx.addIssue({ code: "custom", message: "known claim needs a value", path: ["value"] });
        if (c.evidence_ids.length === 0) {
          ctx.addIssue({ code: "custom", message: "known claim needs at least one evidence id", path: ["evidence_ids"] });
        }
      } else if (c.value !== null) {
        ctx.addIssue({ code: "custom", message: `${c.status} claim must have a null value`, path: ["value"] });
      }
      if (c.status === "not_applicable" && !c.note) {
        ctx.addIssue({ code: "custom", message: "not_applicable claim needs an explanatory note", path: ["note"] });
      }
    });
}

export interface Claim<T> {
  status: "known" | "unknown" | "not_applicable";
  value: T | null;
  evidence_ids: string[];
  note?: string;
}

export const EvidencedText = z.strictObject({
  text: NonEmptyText,
  evidence_ids: z.array(Slug),
});
