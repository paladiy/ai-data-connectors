# AI Data Connectors

**Connect your business data to Claude with Coupler.io, source by source.**

AI Data Connectors is a guide to bringing business data into Claude with [Coupler.io](https://www.coupler.io/). Coupler.io imports data from more than 400 apps, such as Google Ads, Google Analytics 4, QuickBooks, and Pipedrive, keeps it fresh on a schedule, and serves it to Claude through its own MCP server. You then ask questions about your numbers in plain language, with no SQL, exports, or copy-paste.

[Connect your data to Claude](https://www.coupler.io/claude-integrations) · [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) · [Setup documentation](https://docs.coupler.io/destinations/categories/ai/claude)

## How to connect your business data to Claude

1. **Connect.** In Coupler.io, create a data flow: pick one or more sources, filter and shape the data, and choose Claude as the destination.
2. **Schedule.** Run the flow once, then set it to refresh automatically. Coupler.io supports intervals from every 15 minutes to monthly, depending on your plan ([refresh docs](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh)).
3. **Ask.** Add the Coupler.io connector in Claude, open a new chat, and ask, for example, “Which campaigns generated the most conversions last month?” Claude asks permission to use the Coupler.io tools the first time.
4. **Act.** Ask follow-up questions, compare periods, and turn the answers into budget, pipeline, or forecasting decisions.

The same connector works in Claude web, Claude desktop, Claude mobile, Cowork, and Claude Code.

## Why use Coupler.io to connect data to Claude

- **Your source systems stay out of reach.** Claude never connects to Google Ads, QuickBooks, or your CRM directly. It queries the datasets Coupler.io has imported, and those queries are read-only.
- **Large datasets just work.** Queries run on Coupler.io's side through the [Coupler.io MCP server](https://docs.coupler.io/ai/mcp), so a large dataset does not have to fit into Claude's context window.
- **Many sources, one conversation.** A single data flow can join or append several sources, for example ad spend with GA4 sessions and CRM deals, before Claude sees the data.
- **You decide what Claude sees.** Claude only sees datasets from data flows that have Claude as their destination, and you can drop columns or filter rows before they leave Coupler.io.
- **Verified and compliant.** The Coupler.io connector is listed in Claude's connectors directory as Anthropic verified, and Coupler.io states it is SOC 2 Type II certified and GDPR and HIPAA compliant.
- **No code required.** You set everything up in Coupler.io's interface and ask your questions in plain language.

## Data sources you can connect to Claude

Each source below has a researched guide that explains what data Coupler.io imports, how often it refreshes, and which limits to expect. Coupler.io supports far more apps than are listed here; see the [full list of Claude integrations](https://www.coupler.io/claude-integrations).

| Source | Ask Claude, for example | Guides |
| --- | --- | --- |
| Google Ads | “Which campaigns increased spend but lost conversions last month, and how much of that was impression share lost to budget?” | [Google Ads to Claude on Coupler.io](https://www.coupler.io/claude-integrations/google-ads-to-claude) |
| Google Analytics 4 | “Which landing pages lost the most organic sessions this month compared with last, and did their conversion rate move with the traffic?” | [Google Analytics 4 to Claude on Coupler.io](https://www.coupler.io/claude-integrations/google-analytics-to-claude) |
| Google Search Console | “Which pages lost the most clicks year over year, and did their average position or their CTR move first?” | [Google Search Console to Claude on Coupler.io](https://www.coupler.io/claude-integrations/google-search-console-to-claude) |
| Pipedrive | “Which deals have sat in the same stage longest, and what are they worth in total by owner?” | [Pipedrive to Claude on Coupler.io](https://www.coupler.io/claude-integrations/pipedrive-to-claude) |
| QuickBooks Online | “Which vendors did we spend the most with last quarter, and how does that compare with the quarter before?” | [QuickBooks Online to Claude on Coupler.io](https://www.coupler.io/claude-integrations/quickbooks-to-claude) |

## Use the same data in other AI tools

The Coupler.io MCP server also connects your data to other AI assistants and agents. Add each tool as a destination on a data flow to make its datasets available there. See [Coupler.io AI integrations](https://www.coupler.io/ai-integrations).

- [ChatGPT](https://docs.coupler.io/destinations/categories/ai/chatgpt)
- [Cursor](https://docs.coupler.io/destinations/categories/ai/cursor)
- [Perplexity](https://docs.coupler.io/destinations/categories/ai/perplexity)
- [Gemini CLI](https://docs.coupler.io/destinations/categories/ai/gemini)
- [Gemini Enterprise](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise)
- [Microsoft Copilot Studio](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio)
- [OpenClaw](https://docs.coupler.io/destinations/categories/ai/openclaw)
- [Any MCP-compatible client (Custom MCP)](https://docs.coupler.io/destinations/categories/ai/custom_mcp)

## Frequently asked questions

### How do I connect my business data to Claude?

Create a data flow in Coupler.io with your source and Claude as the destination, run it, and add the Coupler.io connector in Claude. The [Claude destination guide](https://docs.coupler.io/destinations/categories/ai/claude) walks through Claude web, desktop, Cowork, and Claude Code.

### Can Claude change the data in my apps?

No. Claude reads the datasets Coupler.io has imported, and those queries are read-only. With your confirmation, Claude can change your Coupler.io workspace, for example by creating a data flow or triggering a refresh, but it cannot edit your campaigns, invoices, or deals. See [what the MCP server can and cannot do](https://docs.coupler.io/ai/mcp).

### How fresh is the data Claude sees?

As fresh as your schedule. Each run replaces the dataset, and Coupler.io supports refresh intervals from every 15 minutes to monthly, depending on your plan. Start a new chat after a run to pick up the latest data.

### Does it work on Claude Free and Pro plans?

Yes, with a caveat. On individual Free and Pro plans, the official connector can connect but fail to load its tools. The documented workaround is to add Coupler.io as a custom connector using the URL from your Coupler.io account ([troubleshooting guide](https://docs.coupler.io/troubleshooting/claude-connector-tools-dont-load-on-free-and-pro-plans)). On Team and Enterprise plans, an admin adds the connector.

### Do I need technical skills?

No. Data flows are configured in Coupler.io's interface, and you analyze the data by asking Claude questions in plain language.

---

## For developers and contributors

### About this repository

This repository holds one maintained dataset describing how to get data from a business source into Claude with Coupler.io, and generates the README, the website, and a public JSON dataset from it.

It is an editorial directory, not a connector service. It does not authenticate users, access business data, or host an MCP server. Coverage is not exhaustive: a source appears once it is documented with cited evidence.

The public website URL is not configured yet.

### How claims are recorded

Each capability is stored as a claim with a status. A known claim cites the evidence it comes from and the date that evidence was read. Anything not documented is shown as “Unknown” rather than as a “no”.

### Repository commands

| Command | Result |
| --- | --- |
| `npm ci` | Install the locked dependency tree. |
| `npm run validate` | Validate records and references. |
| `npm run generate` | Regenerate this README, site content, and public exports. |
| `npm run check:generated` | Fail if committed generated files are stale. |
| `npm test` | Run the schema, generation, and export tests. |
| `npm run build` | Validate, generate, and build the static site and its search index. |
| `npm run preview` | Serve the production build locally, including search. |
| `npm run dev` | Run a development server with hot reload. |

### Corrections

Corrections are reported as repository issues using the correction template, and each source page links to a prefilled issue for its source.

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
