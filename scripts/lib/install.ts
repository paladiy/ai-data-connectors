import type { ModelAiTool, ModelAiTools, ModelOption } from "./model.ts";

export interface InstallGroup {
  title: string;
  steps: string[];
}

export interface InstallLink {
  label: string;
  url: string;
}

export interface ToolInstall {
  tool: ModelAiTool;
  intro: string[];
  groups: InstallGroup[];
  success_check: string | null;
  notes: string[];
  links: InstallLink[];
}

export interface OptionInstall {
  tools: ToolInstall[];
  setup_time: { range: string; basis: string } | null;
  links: InstallLink[];
}

export function withTool(value: string, tool: ModelAiTool): string {
  return value.split("{destination}").join(tool.name).split("{tool}").join(tool.in_text ?? tool.name);
}

export function toolsFor(option: ModelOption, aiTools: ModelAiTools): ModelAiTool[] {
  const wanted = new Set(option.works_with);
  return aiTools.tools.filter((tool) => wanted.has(tool.id));
}

function toolLinks(tool: ModelAiTool): InstallLink[] {
  const links: InstallLink[] = [{ label: `Coupler.io guide for ${tool.name}`, url: tool.links.setup }];
  if (tool.links.vendor) links.push({ label: `${tool.vendor ?? tool.name} documentation`, url: tool.links.vendor });
  if (tool.links.directory) {
    links.push({ label: `Coupler.io in ${tool.links.directory.name}`, url: tool.links.directory.url });
  }
  return links;
}

function toolInstall(option: ModelOption, tool: ModelAiTool): ToolInstall {
  const intro = [
    tool.connection_note,
    tool.available_in.length > 0 ? `Works in ${tool.available_in.join(", ")}.` : undefined,
  ].filter((part): part is string => Boolean(part));

  const groups: InstallGroup[] = [];
  if (option.setup_steps.length > 0) {
    groups.push({
      title: "In Coupler.io",
      steps: option.setup_steps.map((step) => withTool(step.text, tool)),
    });
  }
  for (const setup of tool.setups) {
    groups.push({
      title: `In ${setup.title ?? tool.name}`,
      steps: setup.steps.map((step) => step.text),
    });
  }

  return {
    tool,
    intro,
    groups,
    success_check: option.success_check ? withTool(option.success_check.text, tool) : null,
    notes: tool.notes.map((note) => note.text),
    links: toolLinks(tool),
  };
}

function setupTime(option: ModelOption): OptionInstall["setup_time"] {
  const claim = option.setup_time;
  if (!claim || claim.status !== "known" || !claim.value) return null;
  const { min_minutes: min, max_minutes: max, basis } = claim.value;
  return { range: min === max ? `${min} minutes` : `${min} to ${max} minutes`, basis };
}

function optionLinks(option: ModelOption): InstallLink[] {
  const links: InstallLink[] = [];
  if (option.links.setup) links.push({ label: "Provider setup instructions", url: option.links.setup });
  if (option.links.overview && option.links.overview !== option.links.setup) {
    links.push({ label: "Overview", url: option.links.overview });
  }
  if (option.links.pricing) links.push({ label: "Pricing", url: option.links.pricing });
  return links;
}

export function buildInstall(option: ModelOption, aiTools: ModelAiTools): OptionInstall {
  return {
    tools: toolsFor(option, aiTools).map((tool) => toolInstall(option, tool)),
    setup_time: setupTime(option),
    links: optionLinks(option),
  };
}
