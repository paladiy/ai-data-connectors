# Connect Facebook Ads to ChatGPT, Claude, Gemini, and other LLMs

Facebook Ads (Meta Ads) is Meta's advertising platform for campaigns across Facebook, Instagram, Messenger, and the Audience Network. Its data covers campaigns, ad sets, ads, creatives, spend, reach, clicks, and conversions. To analyze it in ChatGPT, Claude, Gemini, or another LLM, use scheduled Coupler.io imports.

Also known as Meta Ads, Facebook Ads Manager.

## Coupler.io

Coupler.io imports a Facebook Ads report on a schedule and exposes the result to Claude through its own MCP server, so Claude queries a stored dataset instead of calling the Meta Marketing API during the conversation.

- Provider: Coupler.io
- Connection method: Data platform
- Maintainer: Third-party (Coupler.io builds and runs this connector and its MCP server.)
- Availability: Available
- Access: Read-only (Queries against imported data are read-only, and nothing in either source describes changing campaigns, budgets, or bids. Coupler.io's own documentation also describes tools that change your Coupler.io workspace, such as creating a data flow or triggering a run)
- Works with: Claude, ChatGPT, Gemini CLI, Gemini Enterprise, Microsoft Copilot Studio, Perplexity, Cursor, OpenClaw, Custom MCP
- Listed in Claude's connector directory: [directory entry](https://claude.com/connectors/coupler-io)

**Best for Reporting on paid social spend over time or alongside Google Ads, analytics, and CRM data.** Queries run against a stored dataset rather than the Facebook Ads API, so long date ranges do not have to fit into the conversation, and one data flow can join Facebook Ads with Google Ads, Google Analytics, or CRM data before Claude sees it.

### What Coupler.io gives you from Facebook Ads

- Nine report types: Reports and Insights, List of Sponsored Leads, List of Campaigns, List of Ad Sets, List of Ads, List of Ad Creatives, List of Ads with Ad Creatives, List of Activities, and List of Business invoices
- Reports and Insights carries the performance data: account, campaign, ad set, and ad dimensions with performance, click, cost, engagement, video, and conversion metrics
- Conversion events come in Total, Unique, Cost, Unique Cost, and Value variants, with purchase revenue as the Value variant and Purchase ROAS as its own metric; custom conversions and custom events are included
- Breakdowns: age, gender, country, region, Comscore markets, publisher platform, impression device, device platform, product id, frequency value, and hourly stats
- Time splits: daily, weekly, monthly, or totals only for the whole date range
- Structural lists cover campaign, ad set, and ad statuses, budgets, objectives, and targeting; creatives carry image URLs, ad text, and UTM url\_tags
- List of Activities is the account audit log, including billing and funding activity; List of Business invoices gives monthly invoices with billed amounts per campaign

### How the data reaches the AI tool

Coupler.io reads the Facebook Ads API, stores the result as a dataset, and serves it to Claude over its MCP server. Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context. Claude sees only datasets from data flows that have Claude as their destination.

**Historical data**

- You set a start and end date; no hard limit on the range is stated, but very large ranges with many breakdowns can be slow or hit API limits
- For initial backfills the documentation recommends pulling data in monthly chunks

**Refresh**

- A successful manual run is required before a schedule can be set
- Scheduled refresh is described as hourly, daily, or a custom interval
- The platform supports intervals from every 15 minutes to monthly, depending on plan

**Combining several sources**

- One data flow can take several sources and combine them with Join or Append before the data reaches Claude
- Facebook Ads is documented as merging with Google Ads, Google Analytics, CRM, or e-commerce data for a full-funnel view of marketing
- Creative details and performance come from separate report types and are joined on Ad Id

**Prerequisites**

- A Facebook account with access to at least one ad account in Meta Business Suite
- Admin or Advertiser permissions on the ad account you want to pull data from
- A Coupler.io account

### Limits to expect

- The Facebook Ads API has a 1 to 2 day data latency, so today and sometimes yesterday are incomplete
- Attribution windows must match Ads Manager for the numbers to agree; if none is selected in Coupler.io, a 7-day click window is used
- The 1-day engaged-view attribution window is not available through the API, so conversion counts can be lower than in Ads Manager
- Reach and ratio metrics such as CTR, CPC, and CPM cannot be summed across rows
- Since 6 August 2026, Meta returns no data for the Impression device, Frequency value, and Hourly stats by audience time zone breakdowns until they are enabled per ad account in Ads Manager
- Demographic or geographic breakdowns cannot be combined with hourly breakdowns, and action breakdowns can make the parts add up to more than the total
- Any filter in Advanced settings makes the API return active objects only, unless an explicit status filter is added
- Several data flows pulling from one ad account at once can hit Facebook's per-account rate limits; large reports can fail with Async Job failed
- Currency follows the ad account and cannot be converted, and insights are returned in the ad account's timezone

### An example question you can ask

> Which ad sets increased spend last month without a matching rise in purchases, and which creatives were they running?

### How to install Coupler.io

Follow the steps for the AI tool you use.

- Each AI tool sees only the datasets from data flows that have that tool as a destination. To use the same data in several tools, add each one as a destination on the data flow.
- Every AI tool destination replaces the data on each run; append mode is not supported.

#### Connect Facebook Ads to Claude with Coupler.io

Works in Claude web, Claude desktop, Claude mobile, Cowork, Claude Code.

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose Claude as the destination in the data flow's destination step.
5. Give the data flow a clear name, because Claude refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In Claude web, desktop, and Cowork**

1. Install the Coupler.io connector from Claude's connector directory and click Connect.
2. In the Connectors menu, click Connect again and sign in to Coupler.io.
3. Open a new chat. Claude asks permission to use the Coupler.io tools the first time; allow them.

**In Claude Code**

1. Start a new Claude Code session.
2. Paste the connection command shown in the Claude destination step of your data flow.
3. Restart the session.
4. Run `/mcp`, select Coupler.io, and click Authorize in the browser window that opens.

**Check it worked.** Ask Claude to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

**Good to know**

- On individual Claude Free and Pro plans the official connector may connect but fail to load its tools. The documented workaround is a custom connector: in Coupler.io, open AI integrations, click Custom connector, and copy the URL. Remove the official connector in Claude, then go to Connectors, Add, Add custom connector, give it a name with plain letters and spaces only (for example Coupler Custom), paste the URL, and connect.
- Local use with Claude desktop is also available through a Desktop Extension.

[Coupler.io guide for Claude](https://docs.coupler.io/destinations/categories/ai/claude) · [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io)

#### Connect Facebook Ads to ChatGPT with Coupler.io

Connects through the Coupler.io ChatGPT app.

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose ChatGPT as the destination in the data flow's destination step.
5. Give the data flow a clear name, because ChatGPT refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In ChatGPT**

1. Open the Coupler.io app in ChatGPT, from the link in your Coupler.io account or the apps section of ChatGPT settings.
2. Install the app and authorize it with your Coupler.io account.
3. Start a new chat to pick up fresh data after a run, or ask ChatGPT to fetch it again in an ongoing conversation.

**Check it worked.** Ask ChatGPT to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

[Coupler.io guide for ChatGPT](https://docs.coupler.io/destinations/categories/ai/chatgpt)

#### Connect Facebook Ads to Gemini CLI with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose Gemini CLI as the destination in the data flow's destination step.
5. Give the data flow a clear name, because Gemini CLI refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In Gemini CLI**

1. In the Gemini CLI destination step, generate the command that adds the Coupler.io MCP server, then run it in your terminal. It looks like `gemini mcp add coupler --transport=http --scope=user https://mcp.coupler.io/mcp/...`.
2. Start Gemini CLI and run `/mcp auth coupler` to sign in to Coupler.io.

**Check it worked.** Ask Gemini CLI to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

[Coupler.io guide for Gemini CLI](https://docs.coupler.io/destinations/categories/ai/gemini)

#### Connect Facebook Ads to Gemini Enterprise with Coupler.io

Added as a custom MCP data store with OAuth credentials from Coupler.io.

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose Gemini Enterprise as the destination in the data flow's destination step.
5. Give the data flow a clear name, because Gemini Enterprise refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In Gemini Enterprise**

1. In the Gemini Enterprise destination step, create OAuth credentials and copy the Client ID and Client Secret. The secret is shown only once; if you lose it, regenerate it.
2. In Gemini Enterprise, go to Data stores, Create data store, and choose Custom MCP server.
3. Paste the MCP Server URL, Authorization URL, Token URL, and the scope `mcp` from the destination step, together with the Client ID and Client Secret.

**Check it worked.** Ask Gemini Enterprise to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

[Coupler.io guide for Gemini Enterprise](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise) · [Google Cloud documentation](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server)

#### Connect Facebook Ads to Microsoft Copilot Studio with Coupler.io

Added to a Copilot Studio agent as an MCP tool.

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose Microsoft Copilot Studio as the destination in the data flow's destination step.
5. Give the data flow a clear name, because your Copilot Studio agent refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In Microsoft Copilot Studio**

1. Open your agent in Copilot Studio and confirm generative orchestration is on.
2. Go to Tools, Add a tool, New tool, Model Context Protocol, and paste the Coupler.io MCP server URL shown in the destination step.
3. For authentication, choose OAuth 2.0 and Dynamic discovery, then click Create. No client ID or secret is needed.
4. The first time someone uses the tool, they see a consent card in chat and sign in to Coupler.io once.

**Check it worked.** Ask your Copilot Studio agent to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

[Coupler.io guide for Microsoft Copilot Studio](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio) · [Microsoft documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)

#### Connect Facebook Ads to Perplexity with Coupler.io

Perplexity currently uses the local Coupler.io MCP server, which runs in Docker.

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose Perplexity as the destination in the data flow's destination step.
5. Give the data flow a clear name, because Perplexity refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In Perplexity**

1. In Perplexity, go to Settings, Connectors, click Add new connector, and choose the simpler settings.
2. Name the connection coupler-io and enter the command `docker run --pull=always -e COUPLER_ACCESS_TOKEN --rm -i ghcr.io/railsware/coupler-io-mcp-server`.
3. Add an environment variable called `COUPLER_ACCESS_TOKEN`, then generate a Coupler.io personal access token and paste it as the value.
4. Save the configuration and accept the security warning about Docker.

**Check it worked.** Ask Perplexity to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

[Coupler.io guide for Perplexity](https://docs.coupler.io/destinations/categories/ai/perplexity)

#### Connect Facebook Ads to Cursor with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose Cursor as the destination in the data flow's destination step.
5. Give the data flow a clear name, because Cursor refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In Cursor**

1. Open the Coupler.io entry in Cursor's MCP directory and click Add to Cursor.
2. In Cursor, find the new Coupler.io integration, click Needs authentication, then sign in with your Coupler.io account and grant access.
3. Open the AI pane and ask about your dataset.

**Check it worked.** Ask Cursor to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

[Coupler.io guide for Cursor](https://docs.coupler.io/destinations/categories/ai/cursor) · [Coupler.io in the Cursor MCP directory](https://l.rw.rw/couplerio-cursor-mcp)

#### Connect Facebook Ads to OpenClaw with Coupler.io

Connects to the Coupler.io MCP server through mcporter.

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose OpenClaw as the destination in the data flow's destination step.
5. Give the data flow a clear name, because OpenClaw refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In OpenClaw**

1. Install the coupler-io skill from ClawHub. It holds the commands that connect the Coupler.io MCP server to OpenClaw with mcporter.

**Check it worked.** Ask OpenClaw to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

[Coupler.io guide for OpenClaw](https://docs.coupler.io/destinations/categories/ai/openclaw) · [Coupler.io in ClawHub](https://clawhub.ai/nika-is-nika/coupler-io)

#### Connect Facebook Ads to Custom MCP with Coupler.io

Connects any MCP-compatible client with a personal access token.

**In Coupler.io**

1. In Coupler.io, create a data flow, add Facebook Ads as the source, and sign in with your Facebook account, granting every permission it requests.
2. Select the ad accounts to pull from, then choose a report type; Reports and Insights is the one with performance metrics.
3. Set the date range with yesterday as the end date, pick your metrics and breakdowns, and match the attribution window to the one you use in Ads Manager.
4. Choose Custom MCP as the destination in the data flow's destination step.
5. Give the data flow a clear name, because your MCP client refers to the dataset by that name.
6. Run the data flow manually once and wait for it to finish successfully.
7. Set a refresh schedule once that first run has succeeded.

**In your MCP client**

1. In the Custom MCP destination step, click Generate token and copy it together with the MCP server URL.
2. Add the token and URL to your MCP client's JSON config, following the example config shown there.

**Check it worked.** Ask your MCP client to list the datasets it can see; the Facebook Ads data flow should appear under the name you gave it. Then compare total spend for a closed date range with Ads Manager, using the same attribution window.

**Good to know**

- Treat the personal access token as a secret and do not share it.
- Behind a corporate firewall, allow outbound connections to the Coupler.io MCP endpoint.

[Coupler.io guide for Custom MCP](https://docs.coupler.io/destinations/categories/ai/custom_mcp)

More from the provider: [Overview](https://docs.coupler.io/sources/category/ppc/facebook-ads)

## Related skills

A skill gives the AI tool instructions for a task. It connects no data, so connect Facebook Ads first.

- [Audience analysis](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-audience-analysis): for questions like "Which audiences are working on Meta", "Is my lookalike better than broad", "Is retargeting worth it".
- [Budget pacing](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-budget-pacing): for questions like "Am I on track with my Meta budget", "Will I overspend this month", "How much should I be spending a day".
- [Client report](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-client-report): for questions like "What do I tell the client".
- [Creative analysis](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-creative-analysis): for questions like "Which creative is working on Meta", "Which ads should I put money behind", "What should the next round of creative look like".
- [Creative fatigue](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-creative-fatigue): for questions like "Is my Meta creative burning out", "My CTR is dropping", "My CPMs keep rising".
- [Performance review](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-performance-review): for questions like "How are my Meta ads doing", "Why did my cost per result go up", "What changed on Facebook this month".
- [Pixel and attribution audit](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-pixel-and-attribution-audit): for questions like "Can I trust my Meta conversion numbers", "Why does Facebook claim more purchases than Shopify", "Are my conversions double counted".
- [Placement geo and device](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-placement-geo-and-device): for questions like "Is Audience Network wasting my money", "Should I turn off automatic placements", "How are Reels doing versus Feed".
- [Settings audit](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-settings-audit): for questions like "Audit my Meta ads settings", "Is this account set up right", "I inherited this Facebook account, what's wrong with it".
- [Structure and learning review](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-structure-and-learning-review): for questions like "Is my Meta account built right", "Why are my ad sets stuck in learning", "Do I have too many ad sets".
- [Waste and scale](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/facebook-ads/facebook-ads-waste-and-scale): for questions like "Where am I wasting money on Meta", "Which ad sets should I pause", "What should I turn off".
- [Marketing analytics](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/marketing-analytics): for questions like "Why did conversions drop", "Which channel has best ROI", "Where should I spend more". Also needs Google Ads, LinkedIn Ads, Google Analytics 4 (GA4).
- [PPC analytics](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/ppc-analytics): for questions like "How are my ads performing", "Weekly PPC report", "Why did CPA spike". Also needs Google Ads.

Skills list taken from [coupler-io/skills](https://github.com/coupler-io/skills) at commit `cf24f3e`.

## Questions

### Can Claude pause an ad or change my budgets?

No. Coupler.io is read-only against Facebook Ads: Claude queries an imported dataset and cannot change campaigns, budgets, or bids.

### How are ad accounts counted toward my Coupler.io plan?

Facebook Ads is a tenant-based source, so each ad account you select counts as one account toward your plan limit, however many report types or data flows use it.

### Why don't my numbers match Ads Manager?

Usually the attribution window. Coupler.io uses a 7-day click window when none is selected, so set the same window you use in Ads Manager. Then check that the period split, the entity level, and the breakdowns match. Conversions attributed to the 1-day engaged-view window are not available through the API at all, so those counts can stay slightly lower.

### Why is today's data missing or incomplete?

The Facebook Ads API has a 1 to 2 day data latency, so the current day and sometimes yesterday are not fully processed. Set the end date to yesterday for complete numbers.

### Why is my Reach total higher than in Ads Manager?

Reach counts unique people, so adding up daily Reach rows counts anyone who saw an ad on several days more than once. Use the Totals only period split for a single deduplicated figure over a fixed date range, or keep Reach per row. Ratio metrics such as CTR, CPC, and CPM should likewise be recalculated from totals rather than summed.

### Why did the Impression device, Frequency value, or Hourly stats breakdown stop returning data?

Since 6 August 2026, Meta requires these breakdowns to be enabled per ad account in Ads Manager, and until then its API returns no results for them, even if they worked before. Enable the breakdown for the ad account and re-run the data flow; full history, including data from before enablement, comes back.

## Sources and corrections

Researched on 2026-10-04. One route is covered, researched on 4 October 2026: the Coupler.io data platform. No dedicated Facebook Ads or Meta Ads entry was reachable in Claude's connector directory at the obvious addresses; the directory cannot be searched exhaustively, so no claim is made that none exists.

Every claim above was read from one of these pages on the date shown.

- [Claude destination](https://docs.coupler.io/destinations/categories/ai/claude) — Coupler.io, read 2026-10-04
- [Claude destination FAQ](https://docs.coupler.io/destinations/categories/ai/claude/faq) — Coupler.io, read 2026-10-04
- [Claude destination common issues](https://docs.coupler.io/destinations/categories/ai/claude/common-issues) — Coupler.io, read 2026-10-04
- [Facebook Ads best practices](https://docs.coupler.io/sources/category/ppc/facebook-ads/best-practices) — Coupler.io, read 2026-10-04
- [Connect Facebook Ads to Claude](https://www.coupler.io/claude-integrations/facebook-ads-to-claude) — Coupler.io, read 2026-10-04
- [Facebook Ads data overview](https://docs.coupler.io/sources/category/ppc/facebook-ads/data-overview) — Coupler.io, read 2026-10-04
- [Facebook Ads source FAQ](https://docs.coupler.io/sources/category/ppc/facebook-ads/faq) — Coupler.io, read 2026-10-04
- [Facebook Ads source common issues](https://docs.coupler.io/sources/category/ppc/facebook-ads/common-issues) — Coupler.io, read 2026-10-04
- [Facebook Ads source overview](https://docs.coupler.io/sources/category/ppc/facebook-ads) — Coupler.io, read 2026-10-04
- [What the Coupler.io MCP server can and cannot do](https://docs.coupler.io/ai/mcp) — Coupler.io, read 2026-10-04
- [How to set up automatic data refresh](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh) — Coupler.io, read 2026-10-04
- [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) — Anthropic, read 2026-10-04

Something here wrong or out of date? [Open a correction issue](https://github.com/paladiy/ai-data-connectors/issues/new?template=correction.yml&labels=correction&title=Correction%3A+Facebook+Ads&source=facebook-ads).

This guide is also published at [https://ai-data-connector.com/sources/facebook-ads/](https://ai-data-connector.com/sources/facebook-ads/).

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
