import { z } from "zod";
import { Evidence, EvidencedText, HttpsUrl, NonEmptyText, Slug } from "./common.ts";

export const Connection = z.enum(["remote_mcp", "local_mcp"]);

export const AiTool = z.strictObject({
  id: Slug,
  name: NonEmptyText,
  in_text: NonEmptyText.optional(),
  vendor: NonEmptyText.optional(),
  connection: Connection,
  connection_note: NonEmptyText.optional(),
  available_in: z.array(NonEmptyText).default([]),
  prerequisites: z.array(EvidencedText).min(1),
  setups: z
    .array(
      z.strictObject({
        title: NonEmptyText.optional(),
        steps: z.array(EvidencedText).min(1),
      }),
    )
    .min(1),
  notes: z.array(EvidencedText).default([]),
  links: z.strictObject({
    setup: HttpsUrl,
    vendor: HttpsUrl.optional(),
    directory: z.strictObject({ name: NonEmptyText, url: HttpsUrl }).optional(),
  }),
});

export type AiTool = z.infer<typeof AiTool>;

export const AiToolsFile = z.strictObject({
  schema_version: z.literal(1),
  evidence: z.array(Evidence),
  shared_notes: z.array(EvidencedText).default([]),
  tools: z.array(AiTool).min(1),
});

export type AiToolsFile = z.infer<typeof AiToolsFile>;
