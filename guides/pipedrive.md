# Connect Pipedrive to ChatGPT, Claude, Gemini, and other LLMs

Pipedrive is a sales CRM that stores deals, contacts, organizations, and activities. To analyze that data in ChatGPT, Claude, Gemini, or another LLM, use scheduled Coupler.io imports, which load one entity at a time into a queryable dataset.

Also known as Pipedrive CRM.

Where a capability is not documented, this guide says so instead of guessing.

## Coupler.io

Coupler.io imports one Pipedrive entity per data flow on a schedule and exposes the result to Claude through its own MCP server, so Claude queries a stored dataset rather than calling Pipedrive during the conversation.

- Provider: Coupler.io
- Connection method: Data platform
- Maintainer: Third-party (Coupler.io builds and runs this connector and its MCP server.)
- Availability: Available
- Access: Read-only (Queries against imported data are read-only, and nothing in either source describes writing back to Pipedrive. Coupler.io's own documentation also describes tools that change your Coupler.io workspace, such as creating a data flow or triggering a run, while the directory entry lists only the four read tools)
- Works with: Claude, ChatGPT, Gemini CLI, Gemini Enterprise, Microsoft Copilot Studio, Perplexity, Cursor, OpenClaw, Custom MCP
- Listed in Claude's connector directory: [directory entry](https://claude.com/connectors/coupler-io)

**Best for Analysing sales history at length or alongside other systems.** Queries run against a stored dataset rather than the CRM, so a long deal history does not have to fit into the conversation, and one data flow can join Deals with Persons or Organizations before Claude sees them.

### What Coupler.io gives you from Pipedrive

- Entities: Deals, Persons, Organizations, Activities, Files, Leads, Call logs, Products
- A ninth entity, All deals (BETA), is named in troubleshooting and best practices but is not listed in either entity table
- Per-entity options: a Pipedrive filter ID, a last-modified date range, and column selection
- No Pipedrive reports: in-app analytics and forecast reports are not available through the API, so this is raw CRM data only

Note: The overview says nine entities while both entity tables list eight; the count and the tables are not reconciled in the documentation

### How the data reaches the AI tool

Coupler.io reads the Pipedrive API, stores the result as a dataset, and serves it to Claude over its MCP server. Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context. Claude sees only datasets from data flows that have Claude as their destination.

**Historical data.** Not documented (no retention or backfill window is stated; the only date control documented is a last-modified filter, which can be left empty to export every record)

**Refresh**

- A successful manual run is required before a schedule can be set
- Scheduled refresh is described as hourly, daily, or a custom interval
- The platform supports intervals from every 15 minutes to monthly, depending on plan

Note: Which intervals each plan allows is not documented

**Combining several sources**

- One data flow can take several sources and combine them with Join or Append before the data reaches Claude
- Each data flow exports one entity, so combining Deals with Persons means a flow for each and a join
- Documented join keys: Deals to Persons on person\_id.value, and Deals to Organizations on org\_id.value

**Prerequisites**

- A Pipedrive account with access to the data you want to export
- The All deals (BETA) entity requires Pipedrive global admin access
- A Coupler.io account

Note: The prerequisites list names no Pipedrive role or plan tier beyond account access; the documentation notes only that some plan levels restrict visibility of other users' activities

### Limits to expect

- Pipedrive rate limits are 20 requests per 2 seconds on entry-level plans; Coupler.io paces requests automatically for large accounts, which lengthens run times
- An import that does not finish within 30 minutes times out
- Call logs are fetched at a maximum of 50 records per page, a Pipedrive API constraint
- The Activities entity is fetched with user\_id=0, so it returns activities from all users rather than only the connected account
- The Pipedrive API returns active records only; deleted or archived deals, persons, and organizations are excluded
- Date range filtering applies to Deals; for other entities it may have limited or no effect
- Row counts in Claude can differ from the Coupler.io preview when an identifier repeats, so the count should be checked in Claude

### An example question you can ask

> Which deals have sat in the same stage longest, and what are they worth in total by owner?

### How to install Coupler.io

Follow the steps for the AI tool you use.

- Each AI tool sees only the datasets from data flows that have that tool as a destination. To use the same data in several tools, add each one as a destination on the data flow.
- Every AI tool destination replaces the data on each run; append mode is not supported.

#### Connect Pipedrive to Claude with Coupler.io

Works in Claude web, Claude desktop, Claude mobile, Cowork, Claude Code.

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose Claude as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Claude refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Claude web, desktop, and Cowork**

1. Install the Coupler.io connector from Claude's connector directory and click Connect.
2. In the Connectors menu, click Connect again and sign in to Coupler.io.
3. Open a new chat. Claude asks permission to use the Coupler.io tools the first time; allow them.

**In Claude Code**

1. Start a new Claude Code session.
2. Paste the connection command shown in the Claude destination step of your data flow.
3. Restart the session.
4. Run `/mcp`, select Coupler.io, and click Authorize in the browser window that opens.

**Check it worked.** Ask Claude to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count Claude reports with the run in Coupler.io, because the preview alone does not confirm what Claude received.

**Good to know**

- On individual Claude Free and Pro plans the official connector may connect but fail to load its tools. The documented workaround is a custom connector: in Coupler.io, open AI integrations, click Custom connector, and copy the URL. Remove the official connector in Claude, then go to Connectors, Add, Add custom connector, give it a name with plain letters and spaces only (for example Coupler Custom), paste the URL, and connect.
- Local use with Claude desktop is also available through a Desktop Extension.

[Coupler.io guide for Claude](https://docs.coupler.io/destinations/categories/ai/claude) · [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io)

#### Connect Pipedrive to ChatGPT with Coupler.io

Connects through the Coupler.io ChatGPT app.

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose ChatGPT as the destination in the data flow's destination step.
4. Give the data flow a clear name, because ChatGPT refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In ChatGPT**

1. Open the Coupler.io app in ChatGPT, from the link in your Coupler.io account or the apps section of ChatGPT settings.
2. Install the app and authorize it with your Coupler.io account.
3. Start a new chat to pick up fresh data after a run, or ask ChatGPT to fetch it again in an ongoing conversation.

**Check it worked.** Ask ChatGPT to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count ChatGPT reports with the run in Coupler.io, because the preview alone does not confirm what ChatGPT received.

[Coupler.io guide for ChatGPT](https://docs.coupler.io/destinations/categories/ai/chatgpt)

#### Connect Pipedrive to Gemini CLI with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose Gemini CLI as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Gemini CLI refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Gemini CLI**

1. In the Gemini CLI destination step, generate the command that adds the Coupler.io MCP server, then run it in your terminal. It looks like `gemini mcp add coupler --transport=http --scope=user https://mcp.coupler.io/mcp/...`.
2. Start Gemini CLI and run `/mcp auth coupler` to sign in to Coupler.io.

**Check it worked.** Ask Gemini CLI to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count Gemini CLI reports with the run in Coupler.io, because the preview alone does not confirm what Gemini CLI received.

[Coupler.io guide for Gemini CLI](https://docs.coupler.io/destinations/categories/ai/gemini)

#### Connect Pipedrive to Gemini Enterprise with Coupler.io

Added as a custom MCP data store with OAuth credentials from Coupler.io.

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose Gemini Enterprise as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Gemini Enterprise refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Gemini Enterprise**

1. In the Gemini Enterprise destination step, create OAuth credentials and copy the Client ID and Client Secret. The secret is shown only once; if you lose it, regenerate it.
2. In Gemini Enterprise, go to Data stores, Create data store, and choose Custom MCP server.
3. Paste the MCP Server URL, Authorization URL, Token URL, and the scope `mcp` from the destination step, together with the Client ID and Client Secret.

**Check it worked.** Ask Gemini Enterprise to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count Gemini Enterprise reports with the run in Coupler.io, because the preview alone does not confirm what Gemini Enterprise received.

[Coupler.io guide for Gemini Enterprise](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise) · [Google Cloud documentation](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server)

#### Connect Pipedrive to Microsoft Copilot Studio with Coupler.io

Added to a Copilot Studio agent as an MCP tool.

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose Microsoft Copilot Studio as the destination in the data flow's destination step.
4. Give the data flow a clear name, because your Copilot Studio agent refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Microsoft Copilot Studio**

1. Open your agent in Copilot Studio and confirm generative orchestration is on.
2. Go to Tools, Add a tool, New tool, Model Context Protocol, and paste the Coupler.io MCP server URL shown in the destination step.
3. For authentication, choose OAuth 2.0 and Dynamic discovery, then click Create. No client ID or secret is needed.
4. The first time someone uses the tool, they see a consent card in chat and sign in to Coupler.io once.

**Check it worked.** Ask your Copilot Studio agent to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count your Copilot Studio agent reports with the run in Coupler.io, because the preview alone does not confirm what your Copilot Studio agent received.

[Coupler.io guide for Microsoft Copilot Studio](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio) · [Microsoft documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)

#### Connect Pipedrive to Perplexity with Coupler.io

Perplexity currently uses the local Coupler.io MCP server, which runs in Docker.

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose Perplexity as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Perplexity refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Perplexity**

1. In Perplexity, go to Settings, Connectors, click Add new connector, and choose the simpler settings.
2. Name the connection coupler-io and enter the command `docker run --pull=always -e COUPLER_ACCESS_TOKEN --rm -i ghcr.io/railsware/coupler-io-mcp-server`.
3. Add an environment variable called `COUPLER_ACCESS_TOKEN`, then generate a Coupler.io personal access token and paste it as the value.
4. Save the configuration and accept the security warning about Docker.

**Check it worked.** Ask Perplexity to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count Perplexity reports with the run in Coupler.io, because the preview alone does not confirm what Perplexity received.

[Coupler.io guide for Perplexity](https://docs.coupler.io/destinations/categories/ai/perplexity)

#### Connect Pipedrive to Cursor with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose Cursor as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Cursor refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Cursor**

1. Open the Coupler.io entry in Cursor's MCP directory and click Add to Cursor.
2. In Cursor, find the new Coupler.io integration, click Needs authentication, then sign in with your Coupler.io account and grant access.
3. Open the AI pane and ask about your dataset.

**Check it worked.** Ask Cursor to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count Cursor reports with the run in Coupler.io, because the preview alone does not confirm what Cursor received.

[Coupler.io guide for Cursor](https://docs.coupler.io/destinations/categories/ai/cursor) · [Coupler.io in the Cursor MCP directory](https://l.rw.rw/couplerio-cursor-mcp)

#### Connect Pipedrive to OpenClaw with Coupler.io

Connects to the Coupler.io MCP server through mcporter.

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose OpenClaw as the destination in the data flow's destination step.
4. Give the data flow a clear name, because OpenClaw refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In OpenClaw**

1. Install the coupler-io skill from ClawHub. It holds the commands that connect the Coupler.io MCP server to OpenClaw with mcporter.

**Check it worked.** Ask OpenClaw to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count OpenClaw reports with the run in Coupler.io, because the preview alone does not confirm what OpenClaw received.

[Coupler.io guide for OpenClaw](https://docs.coupler.io/destinations/categories/ai/openclaw) · [Coupler.io in ClawHub](https://clawhub.ai/nika-is-nika/coupler-io)

#### Connect Pipedrive to Custom MCP with Coupler.io

Connects any MCP-compatible client with a personal access token.

**In Coupler.io**

1. In Coupler.io, create a data flow and add Pipedrive as the source, then choose the entity you want.
2. Narrow the export with a Pipedrive filter ID, a last-modified date range, or a column selection if you do not need every field.
3. Choose Custom MCP as the destination in the data flow's destination step.
4. Give the data flow a clear name, because your MCP client refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In your MCP client**

1. In the Custom MCP destination step, click Generate token and copy it together with the MCP server URL.
2. Add the token and URL to your MCP client's JSON config, following the example config shown there.

**Check it worked.** Ask your MCP client to list the datasets it can see; the Pipedrive data flow should appear under the name you gave it. Then compare the row count your MCP client reports with the run in Coupler.io, because the preview alone does not confirm what your MCP client received.

**Good to know**

- Treat the personal access token as a secret and do not share it.
- Behind a corporate firewall, allow outbound connections to the Coupler.io MCP endpoint.

[Coupler.io guide for Custom MCP](https://docs.coupler.io/destinations/categories/ai/custom_mcp)

More from the provider: [Overview](https://docs.coupler.io/sources/category/crm/pipedrive)

## Related skills

A skill gives the AI tool instructions for a task. It connects no data, so connect Pipedrive first.

- [Ai citation to revenue funnel](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/geo/ai-citation-to-revenue-funnel): for questions like "Which of our pages do ChatGPT, Perplexity or Gemini cite", "Does our AI search visibility bring traffic, signups or sales", "Is our Peec visibility worth anything". Also needs Peec AI, Google Analytics 4 (GA4), Google Search Console, Shopify, WooCommerce, HubSpot, Salesforce, Stripe, Paddle.
- [Sales analytics](https://github.com/coupler-io/skills/tree/main/sales/sales-analytics): for questions like "How is the pipeline", "Win rate by segment", "Sales cycle". Also needs Salesforce, HubSpot, Close.com, Zoho CRM.

Skills list taken from [coupler-io/skills](https://github.com/coupler-io/skills) at commit `cf24f3e`.

## Questions

### Can Claude update my CRM, or only read it?

Only read it. Coupler.io is read-only against Pipedrive: Claude queries an imported dataset and cannot create or change records.

### Can I get my Pipedrive reports and forecasts into Claude?

Not as reports. Pipedrive's in-app analytics and forecast reports are not available through the API, so Coupler.io exports raw CRM data only and you would rebuild the analysis in Claude.

### Will an import include deals I have deleted or archived?

No. The Pipedrive API returns active records only, so deleted and archived deals, persons, and organizations are excluded from a Coupler.io import.

### Does the activity data cover my whole team?

Yes, and that may surprise you. Coupler.io fetches the Activities entity with user\_id=0, which returns activities from all Pipedrive users rather than only the connected account. Separately, some Pipedrive plan levels restrict visibility of other users' activities.

### Why is my import slow or timing out?

Pipedrive rate limits entry-level plans to 20 requests per 2 seconds, and Coupler.io paces its requests automatically for large accounts, which lengthens runs. An import that does not finish within 30 minutes times out. Narrowing the export with a filter ID, a last-modified date range, or fewer columns is the documented way to keep runs short.

### The connector shows as connected but Claude cannot see my data. Why?

On individual Claude Free and Pro plans there is a documented defect where the official Coupler.io connector connects but its tools never load, so Claude cannot query the datasets. Coupler.io documents a custom connector URL as a workaround and reports that it works on all plans.

## Sources and corrections

Researched on 2026-10-04. One route is covered, researched on 4 October 2026: the Coupler.io data platform. Its documentation was read in full, covering the data available, prerequisites, access, and limits.

Every claim above was read from one of these pages on the date shown. Where a page documents nothing on a point, this guide says the point is not documented rather than guessing.

- [Claude destination](https://docs.coupler.io/destinations/categories/ai/claude) — Coupler.io, read 2026-10-04
- [Claude destination FAQ](https://docs.coupler.io/destinations/categories/ai/claude/faq) — Coupler.io, read 2026-10-04
- [Claude connector tools do not load on Free and Pro plans](https://docs.coupler.io/troubleshooting/claude-connector-tools-dont-load-on-free-and-pro-plans) — Coupler.io, read 2026-10-04
- [Claude destination common issues](https://docs.coupler.io/destinations/categories/ai/claude/common-issues) — Coupler.io, read 2026-10-04
- [What the Coupler.io MCP server can and cannot do](https://docs.coupler.io/ai/mcp) — Coupler.io, read 2026-10-04
- [Pipedrive best practices](https://docs.coupler.io/sources/category/crm/pipedrive/best-practices) — Coupler.io, read 2026-10-04
- [Connect Pipedrive to Claude](https://www.coupler.io/claude-integrations/pipedrive-to-claude) — Coupler.io, read 2026-10-04
- [Pipedrive data overview](https://docs.coupler.io/sources/category/crm/pipedrive/data-overview) — Coupler.io, read 2026-10-04
- [Pipedrive source common issues](https://docs.coupler.io/sources/category/crm/pipedrive/common-issues) — Coupler.io, read 2026-10-04
- [Pipedrive source overview](https://docs.coupler.io/sources/category/crm/pipedrive) — Coupler.io, read 2026-10-04
- [How to set up automatic data refresh](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh) — Coupler.io, read 2026-10-04
- [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) — Anthropic, read 2026-10-04

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
