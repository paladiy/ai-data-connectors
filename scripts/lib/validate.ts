import type { Claim } from "../../schemas/common.ts";
import type { Option, Source } from "../../schemas/source.ts";
import { SURFACES } from "../../schemas/source.ts";
import { allEvidence, type Content, type SourceBundle } from "./load.ts";

export interface Problem {
  file: string;
  path: string;
  message: string;
}

const PLACEHOLDER_TEXT = /\b(TODO|TBD|FIXME|XXX|lorem ipsum|coming soon)\b/i;

const PLACEHOLDER_HOST = /(^|\.)(example\.(com|org|net|test)|test\.test|localhost)$/i;

/** A route whose availability is known and not "unavailable". */
export function isUsableRoute(option: Option): boolean {
  return option.route_status.status === "known" && option.route_status.value !== "unavailable";
}

export function hasSupportedSurface(option: Option): boolean {
  return SURFACES.some((surface) => {
    const claim = option.surfaces[surface] as Claim<string>;
    return claim.status === "known" && (claim.value === "supported" || claim.value === "limited");
  });
}

function isSourced(claim: Claim<unknown>): boolean {
  return claim.status === "known" && claim.evidence_ids.length > 0;
}

function placeholderUrl(url: string, allowReservedHosts: boolean): boolean {
  try {
    const { hostname } = new URL(url);
    if (allowReservedHosts) return false;
    return PLACEHOLDER_HOST.test(hostname);
  } catch {
    return true;
  }
}

/** Options referenced by the opening answer, setup instructions, or recommendations. */
function loadBearingOptionIds(source: Source): Set<string> {
  const ids = new Set(source.recommendations.map((r) => r.option_id));
  for (const option of source.options) {
    if (option.setup_steps.length > 0) ids.add(option.id);
  }
  return ids;
}

export interface ValidateOptions {
  production?: boolean;
  /**
   * Accept reserved documentation/test hostnames such as example.test. Only tests set this, so
   * synthetic fixtures can exercise the record rules without using a real domain.
   */
  allowReservedHosts?: boolean;
}

export function validateContent(content: Content, options: ValidateOptions = {}): Problem[] {
  const problems: Problem[] = [];
  const add = (file: string, path: string, message: string) => problems.push({ file, path, message });

  const seenIds = new Map<string, string>();
  const seenSlugs = new Map<string, string>();
  const sourceIds = new Set(content.sources.map((s) => s.record.id));

  for (const bundle of content.sources) {
    const { record, file } = bundle;

    const previousId = seenIds.get(record.id);
    if (previousId) add(file, "id", `duplicate source id "${record.id}" (also in ${previousId})`);
    seenIds.set(record.id, file);

    const previousSlug = seenSlugs.get(record.slug);
    if (previousSlug) add(file, "slug", `duplicate slug "${record.slug}" (also in ${previousSlug})`);
    seenSlugs.set(record.slug, file);

    // Evidence identity and references.
    const evidence = allEvidence(bundle);
    const evidenceIds = new Set<string>();
    for (const item of evidence) {
      if (evidenceIds.has(item.id)) add(file, `evidence.${item.id}`, "duplicate evidence id");
      evidenceIds.add(item.id);
    }
    const checkEvidenceRefs = (ids: string[], where: string) => {
      for (const id of ids) {
        if (!evidenceIds.has(id)) add(file, where, `evidence id "${id}" does not resolve`);
      }
    };

    const optionIds = new Set<string>();
    for (const option of record.options) {
      const where = `options.${option.id}`;
      if (optionIds.has(option.id)) add(file, where, "duplicate option id");
      optionIds.add(option.id);

      const claims: Array<[string, Claim<unknown>]> = [
        ["maintainer", option.maintainer],
        ["route_status", option.route_status],
        ["directory_listing", option.directory_listing],
        ["access", option.access],
        ["data_available", option.data_available],
        ["history", option.history],
        ["refresh", option.refresh],
        ["multi_source", option.multi_source],
        ["prerequisites", option.prerequisites],
        ["pricing", option.pricing],
        ["data_path", option.data_path],
        ["limits", option.limits],
        ...SURFACES.map((s) => [`surfaces.${s}`, option.surfaces[s] as Claim<unknown>] as [string, Claim<unknown>]),
        ...(option.setup_time ? ([["setup_time", option.setup_time]] as Array<[string, Claim<unknown>]>) : []),
      ];
      for (const [name, claim] of claims) checkEvidenceRefs(claim.evidence_ids, `${where}.${name}`);
      for (const [stepIndex, step] of option.setup_steps.entries()) {
        checkEvidenceRefs(step.evidence_ids, `${where}.setup_steps.${stepIndex}`);
      }
      for (const [stepIndex, step] of option.claude_configuration.entries()) {
        checkEvidenceRefs(step.evidence_ids, `${where}.claude_configuration.${stepIndex}`);
      }
      if (option.success_check) checkEvidenceRefs(option.success_check.evidence_ids, `${where}.success_check`);

      if (option.setup_time && option.setup_time.status === "known") {
        const value = option.setup_time.value!;
        if (value.min_minutes > value.max_minutes) {
          add(file, `${where}.setup_time`, "min_minutes must not exceed max_minutes");
        }
      }
    }

    for (const [index, recommendation] of record.recommendations.entries()) {
      const where = `recommendations.${index}`;
      checkEvidenceRefs(recommendation.evidence_ids, where);
      const option = record.options.find((o) => o.id === recommendation.option_id);
      if (!option) {
        add(file, where, `option id "${recommendation.option_id}" does not resolve`);
        continue;
      }
      if (!isUsableRoute(option)) {
        add(file, where, `recommends "${option.id}", whose availability is not a usable route`);
      }
    }

    for (const [index, entry] of record.faq.entries()) {
      checkEvidenceRefs(entry.evidence_ids, `faq.${index}`);
    }

    for (const id of record.related_source_ids) {
      if (id === record.id) add(file, "related_source_ids", "a record must not relate to itself");
      else if (!sourceIds.has(id)) add(file, "related_source_ids", `source id "${id}" does not resolve`);
    }

    const aliases = new Set(record.aliases.map((a) => a.toLowerCase()));
    if (aliases.size !== record.aliases.length) add(file, "aliases", "aliases must be unique");

    problems.push(...recordProblems(bundle, options));
  }

  if (options.production) problems.push(...productionProblems(content));
  return problems;
}

function recordProblems(bundle: SourceBundle, options: ValidateOptions): Problem[] {
  const { record, file } = bundle;
  const problems: Problem[] = [];
  const add = (path: string, message: string) => problems.push({ file, path, message });

  if (record.options.length === 0) add("options", "a record needs at least one option");
  if (record.recommendations.length === 0) {
    add("recommendations", "a record needs at least one recommendation");
  }
  if (record.research.checked_urls.length === 0) {
    add("research.checked_urls", "a record must document the sources checked");
  }

  const texts: Array<[string, string]> = [
    ["summary", record.summary],
    ["meta_description", record.meta_description],
    ["research.coverage_note", record.research.coverage_note],
    ...record.recommendations.map((r, i) => [`recommendations.${i}.reason`, r.reason] as [string, string]),
    ...record.faq.flatMap((f, i) => [
      [`faq.${i}.question`, f.question],
      [`faq.${i}.answer`, f.answer],
    ] as Array<[string, string]>),
  ];
  for (const [path, text] of texts) {
    if (PLACEHOLDER_TEXT.test(text)) add(path, "contains placeholder text");
  }

  const publicEvidence = new Set(record.evidence.filter((e) => e.public).map((e) => e.id));
  const loadBearing = loadBearingOptionIds(record);

  for (const option of record.options) {
    const where = `options.${option.id}`;
    for (const [name, url] of Object.entries(option.links)) {
      if (!url) continue;
      if (placeholderUrl(url, options.allowReservedHosts === true)) {
        add(`${where}.links.${name}`, `"${url}" looks like a placeholder URL`);
      }
    }
    if (option.directory_listing.status === "known") {
      const url = option.directory_listing.value!;
      if (new URL(url).pathname === "/") {
        add(`${where}.directory_listing`, "must point at a specific directory entry, not a homepage");
      }
    }

    if (!loadBearing.has(option.id)) continue;
    if (!isUsableRoute(option)) {
      add(`${where}.route_status`, "options used in setup or recommendations need known availability");
    }
    if (!hasSupportedSurface(option)) {
      add(`${where}.surfaces`, "needs at least one known supported or limited Claude surface");
    }
    if (!isSourced(option.access)) add(`${where}.access`, "needs a sourced access claim");
    if (!isSourced(option.prerequisites)) add(`${where}.prerequisites`, "needs a sourced prerequisites claim");
    if (!option.success_check) add(`${where}.success_check`, "needs a way to confirm the route works");

    for (const [index, step] of option.setup_steps.entries()) {
      if (step.evidence_ids.length === 0) {
        add(`${where}.setup_steps.${index}`, "setup steps need evidence");
      }
    }
  }

  // Public pages must be able to cite at least one public source for their recommendations.
  for (const [index, recommendation] of record.recommendations.entries()) {
    if (recommendation.evidence_ids.length > 0 && !recommendation.evidence_ids.some((id) => publicEvidence.has(id))) {
      add(`recommendations.${index}.evidence_ids`, "cites only private evidence; add a public citation");
    }
  }

  return problems;
}

function productionProblems(content: Content): Problem[] {
  const problems: Problem[] = [];
  const add = (path: string, message: string) => problems.push({ file: "data/site.yaml", path, message });
  const { site } = content;

  if (!site.url.startsWith("https://")) add("url", "production builds need an absolute https site URL");
  if (site.repo === null) add("repo", "production builds need the repository for correction links");
  if (!site.maintainer.relationship_confirmed) {
    add("maintainer.relationship_confirmed", "the owner must confirm the disclosed relationship");
  }
  if (content.sources.length === 0) {
    problems.push({ file: "data/sources", path: "(any)", message: "no source record to deploy" });
  }
  return problems;
}

export function formatProblems(problems: Problem[]): string {
  const byFile = new Map<string, Problem[]>();
  for (const problem of problems) {
    const list = byFile.get(problem.file) ?? [];
    list.push(problem);
    byFile.set(problem.file, list);
  }
  const lines: string[] = [];
  for (const file of [...byFile.keys()].sort()) {
    lines.push(file);
    for (const problem of byFile.get(file)!) lines.push(`  ${problem.path}: ${problem.message}`);
  }
  return lines.join("\n");
}
