/**
 * Adds a "Review overdue" label in the browser. Computed at view time rather than at build time so
 * generated HTML stays byte-identical across builds. The label never changes the recorded review
 * date and never implies fresh verification.
 */
export function daysSince(reviewedOn: string, now: Date): number | null {
  const reviewed = new Date(`${reviewedOn}T00:00:00Z`);
  if (Number.isNaN(reviewed.getTime())) return null;
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.floor((today.getTime() - reviewed.getTime()) / 86_400_000);
}

export function markOverdueReviews(root: Document, now: Date): number {
  let marked = 0;
  for (const element of root.querySelectorAll<HTMLElement>(".review-note[data-reviewed-on]")) {
    const reviewedOn = element.dataset.reviewedOn;
    const limit = Number(element.dataset.overdueDays);
    if (!reviewedOn || !Number.isFinite(limit)) continue;

    const age = daysSince(reviewedOn, now);
    if (age === null || age <= limit) continue;

    const label = root.createElement("span");
    label.className = "review-overdue";
    label.textContent = `Review overdue: last checked ${age} days ago`;
    element.append(" ", label);
    marked += 1;
  }
  return marked;
}
