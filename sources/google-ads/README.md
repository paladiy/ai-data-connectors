# Connect Google Ads to ChatGPT, Claude, Gemini, and other LLMs

Google Ads is Google's advertising platform for search, display, and video campaigns. Its data covers campaigns, ad groups, ads, keywords, spend, clicks, impressions, and conversions. To analyze it in ChatGPT, Claude, Gemini, or another LLM, use scheduled Coupler.io imports.

Also known as AdWords, Google Adwords.

Where a capability is not documented, this guide says so instead of guessing.

## Coupler.io

Coupler.io imports a Google Ads report on a schedule and exposes the result to Claude through its own MCP server, so Claude queries a stored dataset instead of calling the Ads API during the conversation.

- Provider: Coupler.io
- Connection method: Data platform
- Maintainer: Third-party (Coupler.io builds and runs this connector and its MCP server.)
- Availability: Available
- Access: Read-only (Queries against imported data are read-only, and nothing in either source describes changing campaigns, budgets, or bids. Coupler.io's own documentation also describes tools that change your Coupler.io workspace, such as creating a data flow or triggering a run)
- Works with: Claude, ChatGPT, Gemini CLI, Gemini Enterprise, Microsoft Copilot Studio, Perplexity, Cursor, OpenClaw, Custom MCP
- Listed in Claude's connector directory: [directory entry](https://claude.com/connectors/coupler-io)

**Best for Reporting on spend over time or alongside analytics and CRM data.** Queries run against a stored dataset rather than the Ads API, which sidesteps the quota errors that bite on large backfills, and one data flow can join Google Ads with GA4 or CRM data before Claude sees it.

### What Coupler.io gives you from Google Ads

- Over 30 report types in total
- Frequently used: Campaign performance, Keywords performance, Ad group performance, Ad performance, Asset group performance, Custom GAQL
- Audience and demographics: Ad group audience performance, Campaign audience performance, Age range performance, Gender performance, User interest and user list
- Search and placement: Search query performance, Display keyword performance, Display topics performance, Placement performance, Landing page and Expanded landing page
- Geography and network: Geographic performance by country, state, or region, User location performance, Campaign performance by ad network type
- Other performance: Account performance, Click performance, Shopping performance, Responsive search ad performance, Video campaign performance
- Structural: Accounts, Campaigns, Ad groups, Ads. Settings: Campaign budgets, Campaign criterion, Campaign labels, Bidding strategies, Labels
- Metric categories: Budget, Clicks, Conversions, Cost, Performance, Cross sell and Sales, Video, Phone
- Time splits: Date, Day of week, Week, Month, Quarter, Year

Note: Structural reports and Custom GAQL do not support time period splits, so one row per day is not available for them

### How the data reaches the AI tool

Coupler.io reads the Google Ads API, stores the result as a dataset, and serves it to Claude over its MCP server. Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context. Claude sees only datasets from data flows that have Claude as their destination.

**Historical data**

- You set a start and end date; no hard limit on the range is stated, but long ranges with daily splits are slow
- For initial backfills the documentation recommends pulling in monthly or quarterly chunks to avoid API limits

Note: no fixed Google Ads retention window is stated

**Refresh**

- A successful manual run is required before a schedule can be set
- Scheduled refresh is described as hourly, daily, or a custom interval
- The platform supports intervals from every 15 minutes to monthly, depending on plan

Note: Which intervals each plan allows is not documented

**Combining several sources**

- One data flow can take several sources and combine them with Join or Append before the data reaches Claude
- Google Ads is documented as merging with Google Analytics, Facebook Ads, CRM, or e-commerce data for a full-funnel view of spend and results

**Prerequisites.** A Coupler.io account

### Limits to expect

- Google Ads API quota can be exceeded globally or per account, returning a 429 with a retry delay; the documented fix is to wait roughly 4 hours for the quota to reset
- Rows with all-zero metrics are not returned by the API, so an ad or keyword with no activity in the period simply does not appear
- Low-volume search terms are grouped under Other search terms to meet Google's privacy thresholds
- Custom columns created in the Google Ads interface are not part of the API and cannot be pulled
- Impression share metrics are not summable across rows
- Performance Max campaigns have asset groups rather than traditional ads and ad groups
- Custom GAQL returns cost as cost\_micros, which must be divided by 1,000,000
- Data is typically available within a few hours, but conversions may take 24 to 72 hours to finalise

### An example question you can ask

> Which campaigns increased spend but lost conversions last month, and how much of that was impression share lost to budget?

### How to install Coupler.io

Follow the steps for the AI tool you use.

- Each AI tool sees only the datasets from data flows that have that tool as a destination. To use the same data in several tools, add each one as a destination on the data flow.
- Every AI tool destination replaces the data on each run; append mode is not supported.

#### Connect Google Ads to Claude with Coupler.io

Works in Claude web, Claude desktop, Claude mobile, Cowork, Claude Code.

**In Claude web, desktop, and Cowork**

1. Install the Coupler.io connector from Claude's connector directory and click Connect.
2. In the Connectors menu, click Connect again and sign in to Coupler.io.
3. Open a new chat. Claude asks permission to use the Coupler.io tools the first time; allow them.

**In Claude Code**

1. Start a new Claude Code session.
2. Paste the connection command shown in the Claude destination step of your data flow.
3. Restart the session.
4. Run `/mcp`, select Coupler.io, and click Authorize in the browser window that opens.

**Check it worked.** Ask Claude to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

**Good to know**

- On individual Claude Free and Pro plans the official connector may connect but fail to load its tools. The documented workaround is a custom connector: in Coupler.io, open AI integrations, click Custom connector, and copy the URL. Remove the official connector in Claude, then go to Connectors, Add, Add custom connector, give it a name with plain letters and spaces only (for example Coupler Custom), paste the URL, and connect.
- Local use with Claude desktop is also available through a Desktop Extension.

[Coupler.io guide for Claude](https://docs.coupler.io/destinations/categories/ai/claude) · [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io)

#### Connect Google Ads to ChatGPT with Coupler.io

Connects through the Coupler.io ChatGPT app.

**In ChatGPT**

1. Open the Coupler.io app in ChatGPT, from the link in your Coupler.io account or the apps section of ChatGPT settings.
2. Install the app and authorize it with your Coupler.io account.
3. Start a new chat to pick up fresh data after a run, or ask ChatGPT to fetch it again in an ongoing conversation.

**Check it worked.** Ask ChatGPT to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

[Coupler.io guide for ChatGPT](https://docs.coupler.io/destinations/categories/ai/chatgpt)

#### Connect Google Ads to Gemini CLI with Coupler.io

**In Gemini CLI**

1. In the Gemini CLI destination step, generate the command that adds the Coupler.io MCP server, then run it in your terminal. It looks like `gemini mcp add coupler --transport=http --scope=user https://mcp.coupler.io/mcp/...`.
2. Start Gemini CLI and run `/mcp auth coupler` to sign in to Coupler.io.

**Check it worked.** Ask Gemini CLI to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

[Coupler.io guide for Gemini CLI](https://docs.coupler.io/destinations/categories/ai/gemini)

#### Connect Google Ads to Gemini Enterprise with Coupler.io

Added as a custom MCP data store with OAuth credentials from Coupler.io.

**In Gemini Enterprise**

1. In the Gemini Enterprise destination step, create OAuth credentials and copy the Client ID and Client Secret. The secret is shown only once; if you lose it, regenerate it.
2. In Gemini Enterprise, go to Data stores, Create data store, and choose Custom MCP server.
3. Paste the MCP Server URL, Authorization URL, Token URL, and the scope `mcp` from the destination step, together with the Client ID and Client Secret.

**Check it worked.** Ask Gemini Enterprise to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

[Coupler.io guide for Gemini Enterprise](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise) · [Google Cloud documentation](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server)

#### Connect Google Ads to Microsoft Copilot Studio with Coupler.io

Added to a Copilot Studio agent as an MCP tool.

**In Microsoft Copilot Studio**

1. Open your agent in Copilot Studio and confirm generative orchestration is on.
2. Go to Tools, Add a tool, New tool, Model Context Protocol, and paste the Coupler.io MCP server URL shown in the destination step.
3. For authentication, choose OAuth 2.0 and Dynamic discovery, then click Create. No client ID or secret is needed.
4. The first time someone uses the tool, they see a consent card in chat and sign in to Coupler.io once.

**Check it worked.** Ask your Copilot Studio agent to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

[Coupler.io guide for Microsoft Copilot Studio](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio) · [Microsoft documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)

#### Connect Google Ads to Perplexity with Coupler.io

Perplexity currently uses the local Coupler.io MCP server, which runs in Docker.

**In Perplexity**

1. In Perplexity, go to Settings, Connectors, click Add new connector, and choose the simpler settings.
2. Name the connection coupler-io and enter the command `docker run --pull=always -e COUPLER_ACCESS_TOKEN --rm -i ghcr.io/railsware/coupler-io-mcp-server`.
3. Add an environment variable called `COUPLER_ACCESS_TOKEN`, then generate a Coupler.io personal access token and paste it as the value.
4. Save the configuration and accept the security warning about Docker.

**Check it worked.** Ask Perplexity to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

[Coupler.io guide for Perplexity](https://docs.coupler.io/destinations/categories/ai/perplexity)

#### Connect Google Ads to Cursor with Coupler.io

**In Cursor**

1. Open the Coupler.io entry in Cursor's MCP directory and click Add to Cursor.
2. In Cursor, find the new Coupler.io integration, click Needs authentication, then sign in with your Coupler.io account and grant access.
3. Open the AI pane and ask about your dataset.

**Check it worked.** Ask Cursor to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

[Coupler.io guide for Cursor](https://docs.coupler.io/destinations/categories/ai/cursor) · [Coupler.io in the Cursor MCP directory](https://l.rw.rw/couplerio-cursor-mcp)

#### Connect Google Ads to OpenClaw with Coupler.io

Connects to the Coupler.io MCP server through mcporter.

**In OpenClaw**

1. Install the coupler-io skill from ClawHub. It holds the commands that connect the Coupler.io MCP server to OpenClaw with mcporter.

**Check it worked.** Ask OpenClaw to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

[Coupler.io guide for OpenClaw](https://docs.coupler.io/destinations/categories/ai/openclaw) · [Coupler.io in ClawHub](https://clawhub.ai/nika-is-nika/coupler-io)

#### Connect Google Ads to Custom MCP with Coupler.io

Connects any MCP-compatible client with a personal access token.

**In your MCP client**

1. In the Custom MCP destination step, click Generate token and copy it together with the MCP server URL.
2. Add the token and URL to your MCP client's JSON config, following the example config shown there.

**Check it worked.** Ask your MCP client to list the datasets it can see. Allow the Coupler.io tools if it asks, and your Coupler.io datasets are listed.

**Good to know**

- Treat the personal access token as a secret and do not share it.
- Behind a corporate firewall, allow outbound connections to the Coupler.io MCP endpoint.

[Coupler.io guide for Custom MCP](https://docs.coupler.io/destinations/categories/ai/custom_mcp)

More from the provider: [Overview](https://docs.coupler.io/sources/category/ppc/google-ads)

## Related skills

A skill gives the AI tool instructions for a task. It connects no data, so connect Google Ads first.

- [Budget pacing](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-budget-pacing): for questions like "Am I on track with my Google Ads budget", "Will I overspend this month", "How much should I spend a day".
- [Client report](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-client-report): for questions like "What do I tell the client".
- [Conversion tracking audit](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-conversion-tracking-audit): for questions like "Can I trust my Google Ads conversion numbers", "Audit my conversion tracking", "Why do Google Ads and Analytics disagree".
- [Custom GAQL](https://github.com/coupler-io/skills/tree/main/capability/google-ads-custom-gaql): for questions like "I need a Google Ads field that isn't in any report", "Can I get hourly Google Ads data", "Break conversions down by action at ad group level".
- [Keyword and quality score analysis](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-keyword-and-quality-score-analysis): for questions like "Which keywords make money", "My quality score dropped", "Should I use exact or broad match".
- [Performance review](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-performance-review): for questions like "How are my Google Ads doing", "Why did my cost per lead go up", "Which campaigns improved this month".
- [PMax transparency](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-pmax-transparency): for questions like "How is Performance Max doing", "Is PMax cannibalising my Shopping campaigns", "I can't see anything inside PMax".
- [Settings audit](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-settings-audit): for questions like "Audit my Google Ads settings", "Is my account set up right", "I inherited this account, what's wrong with it".
- [Waste and scale](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/google-ads/google-ads-waste-and-scale): for questions like "Where am I wasting money on Google Ads", "Which keywords should I pause", "Find me negative keywords".
- [Marketing analytics](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/marketing-analytics): for questions like "Why did conversions drop", "Which channel has best ROI", "Where should I spend more". Also needs Facebook Ads (Meta Ads), LinkedIn Ads, Google Analytics 4 (GA4).
- [PPC analytics](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/ppc-analytics): for questions like "How are my ads performing", "Weekly PPC report", "Why did CPA spike". Also needs Facebook Ads (Meta Ads).

Skills list taken from [coupler-io/skills](https://github.com/coupler-io/skills) at commit `cf24f3e`.

## Questions

### Can Claude pause a campaign or change my bids?

No. Coupler.io is read-only against Google Ads: Claude queries an imported dataset and cannot change campaigns, budgets, or bids.

### Does my manager account give Claude access to all my sub-accounts?

No. Manager (MCC) access does not automatically grant data access to sub-accounts; each ad account needs explicit Standard or Admin access. Note also that each ad account you select counts as one account toward your Coupler.io plan limit, because Google Ads is a tenant-based source.

### Why does an import fail with a quota error?

The Google Ads API quota can be exhausted globally or per account, returning a 429 with a retry delay. The documented fix is to wait roughly 4 hours for the quota to reset, and to pull large backfills in monthly or quarterly chunks rather than years at once.

### Why are some campaigns or keywords missing from my data?

The Google Ads API does not return rows where every metric is zero, so anything with no activity in the period simply does not appear. Separately, low-volume search terms are grouped under Other search terms to meet Google's privacy thresholds, and custom columns built in the Google Ads interface are not available through the API at all.

### Why do my conversion numbers keep changing?

Google Ads data is typically available within a few hours, but conversions may take 24 to 72 hours to finalise. A report pulled this morning about yesterday will often disagree with the same report pulled next week.

## Sources and corrections

Researched on 2026-10-04. One route is covered, researched on 4 October 2026: the Coupler.io data platform. No dedicated Google Ads entry was reachable in Claude's connector directory at the obvious address; the directory cannot be searched exhaustively, so no claim is made that none exists.

Every claim above was read from one of these pages on the date shown. Where a page documents nothing on a point, this guide says the point is not documented rather than guessing.

- [Google Ads best practices](https://docs.coupler.io/sources/category/ppc/google-ads/best-practices) — Coupler.io, read 2026-10-04
- [Connect Google Ads to Claude](https://www.coupler.io/claude-integrations/google-ads-to-claude) — Coupler.io, read 2026-10-04
- [Google Ads data overview](https://docs.coupler.io/sources/category/ppc/google-ads/data-overview) — Coupler.io, read 2026-10-04
- [Google Ads source FAQ](https://docs.coupler.io/sources/category/ppc/google-ads/faq) — Coupler.io, read 2026-10-04
- [Google Ads source common issues](https://docs.coupler.io/sources/category/ppc/google-ads/common-issues) — Coupler.io, read 2026-10-04
- [Google Ads source overview](https://docs.coupler.io/sources/category/ppc/google-ads) — Coupler.io, read 2026-10-04
- [Claude destination](https://docs.coupler.io/destinations/categories/ai/claude) — Coupler.io, read 2026-10-04
- [Claude destination FAQ](https://docs.coupler.io/destinations/categories/ai/claude/faq) — Coupler.io, read 2026-10-04
- [Claude destination common issues](https://docs.coupler.io/destinations/categories/ai/claude/common-issues) — Coupler.io, read 2026-10-04
- [What the Coupler.io MCP server can and cannot do](https://docs.coupler.io/ai/mcp) — Coupler.io, read 2026-10-04
- [How to set up automatic data refresh](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh) — Coupler.io, read 2026-10-04
- [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) — Anthropic, read 2026-10-04

Something here wrong or out of date? [Open a correction issue](https://github.com/paladiy/ai-data-connectors/issues/new?template=correction.yml&labels=correction&title=Correction%3A+Google+Ads&source=google-ads).

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
