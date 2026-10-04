# AI Data Connectors

**Connect your business data to ChatGPT, Claude, Gemini, and any other LLM with Coupler.io, source by source.**

AI Data Connectors is a guide to bringing business data into LLMs and AI tools with [Coupler.io](https://www.coupler.io/). Coupler.io imports data from more than 400 apps, such as Google Ads, Google Analytics 4, QuickBooks, and Pipedrive, keeps it fresh on a schedule, and serves it to ChatGPT, Claude, Gemini, Microsoft Copilot Studio, Cursor, Perplexity, or any MCP-compatible client through its own MCP server. You then ask questions about your numbers in plain language, with no SQL, exports, or copy-paste.

[Coupler.io AI integrations](https://www.coupler.io/ai-integrations) · [How the Coupler.io MCP server works](https://docs.coupler.io/ai/mcp) · [Browse the directory](https://paladiy.github.io/ai-data-connectors/)

## How to connect your business data to an LLM

1. **Connect.** In Coupler.io, create a data flow: pick one or more sources, filter and shape the data, and choose your AI tool as the destination.
2. **Schedule.** Run the flow once, then set it to refresh automatically. Coupler.io supports intervals from every 15 minutes to monthly, depending on your plan ([refresh docs](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh)).
3. **Ask.** Connect Coupler.io in your AI tool, open a new chat, and ask, for example, “Which campaigns generated the most conversions last month?”
4. **Act.** Ask follow-up questions, compare periods, and turn the answers into budget, pipeline, or forecasting decisions.

One data flow can have several destinations, so the same dataset can serve ChatGPT for one team and Claude or Copilot Studio for another.

## Supported LLMs and AI tools

Every Coupler.io AI destination runs on the same [Coupler.io MCP server](https://docs.coupler.io/ai/mcp). Each tool sees only the datasets from data flows that have it as a destination.

| AI tool | How it connects | Setup guide |
| --- | --- | --- |
| Claude | Coupler.io connector from Claude's connectors directory. Works in Claude web, desktop, mobile, Cowork, and Claude Code. | [Claude setup](https://docs.coupler.io/destinations/categories/ai/claude) |
| ChatGPT | Coupler.io app in ChatGPT, authorized with your Coupler.io account. | [ChatGPT setup](https://docs.coupler.io/destinations/categories/ai/chatgpt) |
| Gemini CLI | A `gemini mcp add` command generated in the destination step, then `/mcp auth coupler`. | [Gemini CLI setup](https://docs.coupler.io/destinations/categories/ai/gemini) |
| Gemini Enterprise | Custom MCP data store with OAuth credentials created in Coupler.io. | [Gemini Enterprise setup](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise) |
| Microsoft Copilot Studio | MCP tool on a Copilot Studio agent, using OAuth 2.0 with dynamic discovery. | [Microsoft Copilot Studio setup](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio) |
| Cursor | Add to Cursor from Cursor's MCP directory, then sign in to Coupler.io. | [Cursor setup](https://docs.coupler.io/destinations/categories/ai/cursor) |
| Perplexity | Local Coupler.io MCP server running in Docker with a personal access token. | [Perplexity setup](https://docs.coupler.io/destinations/categories/ai/perplexity) |
| OpenClaw | The coupler-io skill from ClawHub, which connects the MCP server through mcporter. | [OpenClaw setup](https://docs.coupler.io/destinations/categories/ai/openclaw) |
| Any MCP-compatible client | Custom MCP: the server URL and a personal access token, for clients such as Zapier, n8n, Make, or your own application. | [Any MCP-compatible client setup](https://docs.coupler.io/destinations/categories/ai/custom_mcp) |

## Why use Coupler.io to connect data to AI

- **Your source systems stay out of reach.** The AI never connects to Google Ads, QuickBooks, or your CRM directly. It queries the datasets Coupler.io has imported, and those queries are read-only.
- **Large datasets just work.** Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context window.
- **One pipeline, any model.** Build the data flow once and send it to as many AI tools as you use, instead of maintaining a separate integration per model.
- **Many sources, one conversation.** A single data flow can join or append several sources, for example ad spend with GA4 sessions and CRM deals, before the AI sees the data.
- **You decide what the AI sees.** Drop columns or filter rows before data leaves Coupler.io, and choose per data flow which tools receive it.
- **Verified and compliant.** Coupler.io is listed in [Claude's connectors directory](https://claude.com/connectors/coupler-io) as Anthropic verified, and states it is SOC 2 Type II certified and GDPR and HIPAA compliant.
- **No code required.** You set everything up in Coupler.io's interface and ask your questions in plain language.

## Data sources you can connect

Each source below has a researched guide, readable here in Markdown, that explains what data Coupler.io imports, how often it refreshes, which limits to expect, and how to install it in each AI tool. Coupler.io supports far more apps than are listed here; see [all 400+ apps](https://www.coupler.io/ai-integrations).

| Source | Example question | Guides |
| --- | --- | --- |
| Facebook Ads | “Which ad sets increased spend last month without a matching rise in purchases, and which creatives were they running?” | [Setup guide](sources/facebook-ads/README.md) · [Website](https://paladiy.github.io/ai-data-connectors/sources/facebook-ads/) · [Facebook Ads on Coupler.io](https://www.coupler.io/claude-integrations/facebook-ads-to-claude) |
| Google Ads | “Which campaigns increased spend but lost conversions last month, and how much of that was impression share lost to budget?” | [Setup guide](sources/google-ads/README.md) · [Website](https://paladiy.github.io/ai-data-connectors/sources/google-ads/) · [Google Ads on Coupler.io](https://www.coupler.io/claude-integrations/google-ads-to-claude) |
| Google Analytics 4 | “Which landing pages lost the most organic sessions this month compared with last, and did their conversion rate move with the traffic?” | [Setup guide](sources/google-analytics-4/README.md) · [Website](https://paladiy.github.io/ai-data-connectors/sources/google-analytics-4/) · [Google Analytics 4 on Coupler.io](https://www.coupler.io/claude-integrations/google-analytics-to-claude) |
| Google Search Console | “Which pages lost the most clicks year over year, and did their average position or their CTR move first?” | [Setup guide](sources/google-search-console/README.md) · [Website](https://paladiy.github.io/ai-data-connectors/sources/google-search-console/) · [Google Search Console on Coupler.io](https://www.coupler.io/claude-integrations/google-search-console-to-claude) |
| Pipedrive | “Which deals have sat in the same stage longest, and what are they worth in total by owner?” | [Setup guide](sources/pipedrive/README.md) · [Website](https://paladiy.github.io/ai-data-connectors/sources/pipedrive/) · [Pipedrive on Coupler.io](https://www.coupler.io/claude-integrations/pipedrive-to-claude) |
| QuickBooks Online | “Which vendors did we spend the most with last quarter, and how does that compare with the quarter before?” | [Setup guide](sources/quickbooks-online/README.md) · [Website](https://paladiy.github.io/ai-data-connectors/sources/quickbooks-online/) · [QuickBooks Online on Coupler.io](https://www.coupler.io/claude-integrations/quickbooks-to-claude) |

## Frequently asked questions

### How do I connect my business data to ChatGPT, Claude, or another LLM?

Create a data flow in Coupler.io with your source and your AI tool as the destination, run it, and connect Coupler.io inside that tool. The setup guide for each tool is linked in the table above.

### Can I use the same data in several AI tools?

Yes. Add each tool as a destination on the data flow. A tool only sees datasets from data flows that list it as a destination, so adding Claude does not make the data visible in ChatGPT.

### Can the AI change the data in my apps?

No. The AI reads the datasets Coupler.io has imported, and those queries are read-only. With your confirmation, it can change your Coupler.io workspace, for example by creating a data flow or triggering a refresh, but it cannot edit your campaigns, invoices, or deals. See [what the MCP server can and cannot do](https://docs.coupler.io/ai/mcp).

### How fresh is the data the AI sees?

As fresh as your schedule. Each run replaces the dataset, and Coupler.io supports refresh intervals from every 15 minutes to monthly, depending on your plan. Start a new chat after a run to pick up the latest data.

### Does it work on free AI plans?

Coupler.io says its ChatGPT app works on all ChatGPT plans, though the Free plan may not be enough for thorough analysis. On individual Claude Free and Pro plans, the official connector can connect but fail to load its tools; the documented workaround is a custom connector URL ([troubleshooting guide](https://docs.coupler.io/troubleshooting/claude-connector-tools-dont-load-on-free-and-pro-plans)).

### Do I need technical skills?

No for the chat assistants: data flows are configured in Coupler.io's interface, and you ask questions in plain language. Developer tools such as Gemini CLI, Perplexity's local server, or a custom MCP client need a terminal command or a JSON config.

---

## For developers and contributors

### About this repository

This repository holds one maintained dataset describing how to get data from a business source into LLMs and AI tools with Coupler.io, and generates this README, a Markdown guide per source, the website, and a public JSON dataset from it.

Each source has its own folder in `sources/`: `source.yaml` is the record, and `README.md` is the guide generated from it. The guides are plain Markdown with no HTML and no scripts, so they can be read, cloned, and indexed straight from the repository without the website.

It is an editorial directory, not a connector service. It does not authenticate users, access business data, or host an MCP server. Coverage is not exhaustive: a source appears once it is documented with cited evidence.

Website: [AI Data Connectors](https://paladiy.github.io/ai-data-connectors/)

### How claims are recorded

Each capability is stored as a claim with a status. A known claim cites the evidence it comes from and the date that evidence was read. Anything not documented is shown as “Unknown” rather than as a “no”.

### Repository commands

| Command | Result |
| --- | --- |
| `npm ci` | Install the locked dependency tree. |
| `npm run validate` | Validate records and references. |
| `npm run generate` | Regenerate this README, `llms.txt`, the guides, site content, and public exports. |
| `npm run check:generated` | Fail if committed generated files are stale. |
| `npm run sync:skills` | Refresh the pinned snapshot of the upstream skills index. The only command that uses the network. |
| `npm test` | Run the schema, generation, and export tests. |
| `npm run build` | Validate, generate, and build the static site and its search index. |
| `npm run preview` | Serve the production build locally, including search. |
| `npm run dev` | Run a development server with hot reload. |

### Corrections

Open an issue in [paladiy/ai-data-connectors](https://github.com/paladiy/ai-data-connectors/issues) using the correction template. Each source page links to a prefilled issue for that source.

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
