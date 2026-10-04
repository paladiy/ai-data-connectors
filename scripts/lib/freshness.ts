import type { Content } from "./load.ts";
import { daysSince } from "../../site/src/lib/review.ts";
import { isPublished } from "./validate.ts";

export interface FreshnessReport {
  today: string;
  overdue: Array<{ slug: string; reviewed_on: string; age_days: number }>;
  unreviewed: string[];
}

/**
 * Reports what needs re-checking. This never updates a review date: an age is not a
 * fact check, so only a human re-review can move those dates.
 */
export function buildFreshnessReport(content: Content, now: Date): FreshnessReport {
  const overdue: FreshnessReport["overdue"] = [];
  const unreviewed: string[] = [];

  for (const { record } of content.sources) {
    if (!record.review) {
      unreviewed.push(record.slug);
      continue;
    }
    const age = daysSince(record.review.reviewed_on, now);
    if (age !== null && age > content.site.review_overdue_days) {
      overdue.push({ slug: record.slug, reviewed_on: record.review.reviewed_on, age_days: age });
    }
  }

  return {
    today: now.toISOString().slice(0, 10),
    overdue: overdue.sort((a, b) => b.age_days - a.age_days),
    unreviewed: unreviewed.sort(),
  };
}

export function formatFreshnessReport(report: FreshnessReport, content: Content): string {
  const lines = [`Freshness report for ${report.today}.`, ""];

  const published = content.sources.filter((bundle) => isPublished(bundle.record)).length;
  lines.push(`Records: ${content.sources.length} total, ${published} published.`);

  if (report.overdue.length === 0) {
    lines.push(`No published review is older than ${content.site.review_overdue_days} days.`);
  } else {
    lines.push("", `Review overdue (older than ${content.site.review_overdue_days} days):`);
    for (const entry of report.overdue) {
      lines.push(`  ${entry.slug}: reviewed ${entry.reviewed_on}, ${entry.age_days} days ago`);
    }
    lines.push("", "A reviewer must re-check these pages. The recorded dates are left untouched.");
  }

  if (report.unreviewed.length > 0) {
    lines.push("", "Awaiting a first human review:");
    for (const slug of report.unreviewed) lines.push(`  ${slug}`);
  }

  return lines.join("\n");
}
