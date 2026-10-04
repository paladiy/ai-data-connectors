import type { Claim } from "../../schemas/common.ts";

/**
 * Escapes text that came from YAML records or the upstream snapshot so it is rendered as prose.
 * Imported text must never become executable MDX, raw HTML, a script, or a shell command, so
 * MDX expression braces and HTML angle brackets are neutralised along with Markdown syntax.
 */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([*_`[\]<>{}|#])/g, "\\$1")
    .replace(/\r?\n/g, " ")
    .trim();
}

/** Escapes text for a Markdown table cell, where a newline would break the row. */
export function escapeCell(value: string): string {
  return escapeText(value) || "—";
}

export function link(label: string, url: string): string {
  return `[${escapeText(label)}](${encodeURI(url)})`;
}

export function claimText(claim: Claim<unknown>, { verified }: { verified: (value: unknown) => string }): string {
  if (claim.status === "verified") return verified(claim.value);
  if (claim.status === "not_applicable") return `Not applicable${claim.note ? `: ${claim.note}` : ""}`;
  return "Not verified";
}

/**
 * Human labels for the schema's enum values, so a page reads "Read-only" rather than "read".
 * Applied only on an exact match against this closed vocabulary, never to free text.
 */
const ENUM_LABELS: Record<string, string> = {
  read: "Read-only",
  write: "Write",
  read_write: "Read and write",
  supported: "Supported",
  limited: "Limited",
  unsupported: "Not supported",
  available: "Available",
  unavailable: "Not available",
  source_vendor: "Source-vendor maintained",
  anthropic: "Anthropic maintained",
  third_party: "Third-party",
  community: "Community",
  manual: "Manual export",
};

export function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((entry) => formatValue(entry)).join("; ");
  if (value === null || value === undefined) return "";
  const text = String(value);
  return ENUM_LABELS[text] ?? text;
}

/**
 * Renders a claim as plain text. An unverified claim keeps its note, so a page can say what was
 * checked and why the answer is still unknown rather than leaving a bare "Not verified".
 */
export function renderClaim(claim: Claim<unknown>): string {
  const text = claimText(claim, { verified: (value) => formatValue(value) });
  if (claim.note && claim.status !== "not_applicable") return `${text} (${claim.note})`;
  return text;
}

export function renderClaimCell(claim: Claim<unknown>): string {
  return escapeCell(renderClaim(claim));
}

export function bulletList(items: string[]): string[] {
  return items.map((item) => `- ${escapeText(item)}`);
}

export function joinSections(sections: Array<string | null>): string {
  return `${sections.filter((section): section is string => section !== null && section !== "").join("\n\n")}\n`;
}
