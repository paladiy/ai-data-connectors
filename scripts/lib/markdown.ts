import type { Claim } from "../../schemas/common.ts";

function escapeInline(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([*_`[\]<>{}|#])/g, "\\$1")
    .replace(/\r?\n/g, " ");
}

export function escapeText(value: string): string {
  return escapeInline(value).trim();
}

/**
 * Keeps `code spans` intact and escapes everything around them. A code span renders its contents
 * literally, so the passed-through text cannot become markup; the pattern excludes backticks, so
 * it cannot close the span early either.
 */
export function escapeRichText(value: string): string {
  return value
    .split(/(`[^`\n]+`)/)
    .map((part) => (part.startsWith("`") ? part : escapeInline(part)))
    .join("")
    .trim();
}

export function escapeCell(value: string): string {
  return escapeText(value) || "—";
}

/**
 * Percent-encodes only what would break a Markdown link destination or let a URL escape its own
 * brackets. `encodeURI` cannot be used here: it re-encodes the `%` of an already-encoded query
 * value, so `?title=Correction%3A+X` would arrive as `Correction%253A+X`.
 */
export function encodeDestination(url: string): string {
  return url.replace(/[\s()<>[\]"\\]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function link(label: string, url: string): string {
  return `[${escapeText(label)}](${encodeDestination(url)})`;
}

export function claimText(claim: Claim<unknown>, { known }: { known: (value: unknown) => string }): string {
  if (claim.status === "known") return known(claim.value);
  if (claim.status === "not_applicable") return `Not applicable${claim.note ? `: ${claim.note}` : ""}`;
  return "Unknown";
}

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
};

export function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((entry) => formatValue(entry)).join("; ");
  if (value === null || value === undefined) return "";
  const text = String(value);
  return ENUM_LABELS[text] ?? text;
}

export function renderClaim(claim: Claim<unknown>): string {
  const text = claimText(claim, { known: (value) => formatValue(value) });
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
