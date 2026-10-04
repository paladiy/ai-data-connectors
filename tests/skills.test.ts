import { describe, expect, it } from "vitest";
import {
  matchSkills,
  otherSources,
  skillQuestions,
  skillSummary,
  skillTitle,
  skillUrl,
  variants,
  type IndexedSkill,
} from "../site/src/lib/skills.ts";

const skill = (overrides: Partial<IndexedSkill> = {}): IndexedSkill => ({
  name: "google-ads-budget-pacing",
  path: "marketing-and-ads/google-ads-budget-pacing",
  sources: ["Google Ads"],
  ...overrides,
});

describe("source name matching", () => {
  it("reads a bracketed label whole, without the brackets, and as the bracketed part", () => {
    expect([...variants("Google Analytics 4 (GA4)")]).toEqual(["google analytics 4 ga4", "google analytics 4", "ga4"]);
  });

  it("matches an upstream display name against a record's name or any alias", () => {
    const skills = [
      skill({ name: "ga4-landing-pages", sources: ["Google Analytics 4 (GA4)"] }),
      skill({ name: "qbo-aging", sources: ["QuickBooks"] }),
    ];
    const names = ["Google Analytics 4", "GA4", "Google Analytics"];
    expect(matchSkills(skills, names).map((item) => item.name)).toEqual(["ga4-landing-pages"]);
  });

  it("puts single-source skills before cross-source ones", () => {
    const skills = [
      skill({ name: "b-cross", sources: ["Google Ads", "Google Analytics 4 (GA4)"] }),
      skill({ name: "a-cross", sources: ["Google Ads", "Pipedrive"] }),
      skill({ name: "z-own", sources: ["Google Ads"] }),
    ];
    expect(matchSkills(skills, ["Google Ads"]).map((item) => item.name)).toEqual(["z-own", "a-cross", "b-cross"]);
  });

  it("names the other sources a cross-source skill needs", () => {
    const cross = skill({ sources: ["Google Ads", "Pipedrive"] });
    expect(otherSources(cross, ["Google Ads", "AdWords"])).toEqual(["Pipedrive"]);
    expect(otherSources(skill(), ["Google Ads"])).toEqual([]);
  });
});

describe("skill presentation", () => {
  it("prefers the short description and otherwise keeps one sentence of the trigger text", () => {
    expect(skillSummary(skill({ short_description: "Pace budgets." }))).toBe("Pace budgets.");
    expect(skillSummary(skill({ description: "Use when pacing budgets. Also other things." }))).toBe(
      "Use when pacing budgets.",
    );
  });

  it("drops the source prefix from the name and keeps acronyms uppercase", () => {
    expect(skillTitle("google-ads-budget-pacing", ["Google Ads"])).toBe("Budget pacing");
    expect(skillTitle("google-ads-gaql-queries", ["Google Ads"])).toBe("GAQL queries");
    expect(skillTitle("budget-pacing", ["Google Ads"])).toBe("Budget pacing");
  });

  it("surfaces the quoted questions from the trigger text, ignoring apostrophes", () => {
    const described = skill({
      description: `Use when the user asks "which campaigns overspent?" or 'where is my budget going?'. It isn't a connector.`,
    });
    expect(skillQuestions(described)).toEqual(["Which campaigns overspent?", "Where is my budget going?"]);
  });

  it("builds an encoded link into the upstream repository", () => {
    expect(skillUrl(skill())).toBe(
      "https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads-budget-pacing",
    );
  });
});
