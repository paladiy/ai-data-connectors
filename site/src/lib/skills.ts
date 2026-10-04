/**
 * Matching and presentation rules for the upstream coupler-io/skills index. Shared by the
 * generator, which reads the committed snapshot, and by the browser, which reads the live index,
 * so a page and its Markdown guide pick and label the same skills. Pure: no Node, no DOM.
 */

export interface IndexedSkill {
  name: string;
  path: string;
  category?: string;
  sources?: string[];
  short_description?: string;
  description?: string;
}

export const SKILLS_REPO = "coupler-io/skills";
export const SKILLS_INDEX_PATH = "skills-index.json";
export const SKILLS_REPO_URL = `https://github.com/${SKILLS_REPO}`;
export const SKILLS_INDEX_URL = `https://raw.githubusercontent.com/${SKILLS_REPO}/main/${SKILLS_INDEX_PATH}`;

export const CATEGORY_LABELS: Record<string, string> = {
  "marketing-and-ads": "Marketing & Ads",
  ecommerce: "E-commerce",
  finance: "Finance",
  sales: "Sales",
  capability: "Capability",
  utilities: "Utilities",
};

const ACRONYMS: Record<string, string> = {
  ppc: "PPC",
  pmax: "PMax",
  gaql: "GAQL",
  ga4: "GA4",
  seo: "SEO",
  roas: "ROAS",
  ads: "Ads",
};

export function normalize(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** "Google Analytics 4 (GA4)" matches whole, without the brackets, and as the bracketed part. */
export function variants(label: string): Set<string> {
  const out = new Set([normalize(label)]);
  out.add(normalize(label.replace(/\(.*?\)/g, "")));
  for (const match of label.matchAll(/\((.*?)\)/g)) out.add(normalize(match[1] ?? ""));
  out.delete("");
  return out;
}

function variantsOf(labels: string[]): Set<string> {
  return new Set(labels.flatMap((label) => [...variants(label)]));
}

/** Upstream `sources` are display names, so a record's name and aliases are matched against them. */
export function matchSkills(skills: IndexedSkill[], names: string[]): IndexedSkill[] {
  const wanted = variantsOf(names);
  return skills
    .filter((skill) => (skill.sources ?? []).some((source) => [...variants(source)].some((v) => wanted.has(v))))
    .sort(
      (a, b) =>
        Number((a.sources ?? []).length > 1) - Number((b.sources ?? []).length > 1) ||
        a.name.localeCompare(b.name),
    );
}

/** Sources a skill also needs, so a cross-source skill never looks usable with this one alone. */
export function otherSources(skill: IndexedSkill, names: string[]): string[] {
  const own = variantsOf(names);
  return (skill.sources ?? []).filter((source) => ![...variants(source)].some((v) => own.has(v)));
}

export function skillSummary(skill: IndexedSkill): string {
  if (skill.short_description) return skill.short_description;
  // `description` is trigger text written for an agent ("Use this skill when ..."); keep one sentence.
  const text = (skill.description ?? "").replace(/\s+/g, " ").trim();
  const end = text.search(/[.!?](\s|$)/);
  return end > 0 ? text.slice(0, end + 1) : text;
}

/** "google-ads-budget-pacing" reads as "Budget pacing" on the Google Ads page. */
export function skillTitle(name: string, sourceNames: string[]): string {
  let rest = name;
  for (const source of sourceNames) {
    const prefix = `${normalize(source).replace(/ /g, "-")}-`;
    if (rest.startsWith(prefix) && rest.length > prefix.length) rest = rest.slice(prefix.length);
  }
  const text = rest.split("-").map((word) => ACRONYMS[word] ?? word).join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Trigger text is written for an agent to route on, but the quoted phrases inside it are the
 * questions a person would ask, so they are surfaced instead of the trigger wording.
 */
export function skillQuestions(skill: IndexedSkill): string[] {
  const text = (skill.description ?? "").replace(/[\u201c\u201d]/g, '"');
  // Double quotes, or single quotes that are not apostrophes ("isn't").
  const found = [...text.matchAll(/"([^"]{8,90})"|(?<![A-Za-z])'(.{8,90}?)'(?![A-Za-z])/g)].map((match) =>
    (match[1] ?? match[2] ?? "").trim(),
  );
  return [...new Set(found)].slice(0, 3).map((question) => question.charAt(0).toUpperCase() + question.slice(1));
}

export function skillUrl(skill: IndexedSkill, repo: string = SKILLS_REPO_URL): string {
  return `${repo}/tree/main/${skill.path.split("/").map(encodeURIComponent).join("/")}`;
}
