# Connect Google Analytics 4 to ChatGPT, Claude, Gemini, and other LLMs

Google Analytics 4 (GA4) is Google's web and app analytics product. Its data covers traffic, users, sessions, events, conversions, and acquisition sources. To analyze it in ChatGPT, Claude, Gemini, or another LLM, use scheduled Coupler.io imports.

Also known as GA4, Google Analytics.

## Coupler.io

Coupler.io runs a GA4 report you define, on a schedule, and exposes the result to Claude through its own MCP server. Claude queries the stored dataset, so a long date range does not have to fit into the conversation.

- Provider: Coupler.io
- Connection method: Data platform
- Maintainer: Third-party (Coupler.io builds and runs this connector and its MCP server.)
- Availability: Available
- Access: Read-only (Queries against imported data are read-only, and nothing in either source describes writing back to GA4. Coupler.io's own documentation also describes tools that change your Coupler.io workspace, such as creating a data flow or triggering a run)
- Works with: Claude, ChatGPT, Gemini CLI, Gemini Enterprise, Microsoft Copilot Studio, Perplexity, Cursor, OpenClaw, Custom MCP
- Listed in Claude's connector directory: [directory entry](https://claude.com/connectors/coupler-io)

**Best for Tracking GA4 trends over time or alongside ad spend.** Scheduled imports keep a copy of data that GA4 itself deletes after 2 or 14 months, queries run against the stored dataset rather than the API, and one data flow can join GA4 with Google Ads or CRM data before Claude sees it.

### What Coupler.io gives you from Google Analytics 4

- One flexible report type that you build from your own choice of metrics and dimensions, loaded dynamically from the GA4 API for your property
- Traffic metrics: Views, Sessions, Total users, New users, Active users, Bounce rate, Engagement rate, Average session duration, Views per session, Sessions per user, Event count, Key events
- Ecommerce metrics: Purchase revenue, Total revenue, Ecommerce purchases, Add-to-carts, Checkouts, Item revenue, Transactions, Average purchase revenue
- Advertising metrics: Ads cost, Ads clicks, Ads impressions, Return on ad spend, Cost per key event
- Dimensions: date and time splits, session source, medium, campaign and default channel group, country, city, region, device, browser, operating system, page path, page title, landing page, hostname, and item-level ecommerce fields

### How the data reaches the AI tool

Coupler.io reads the GA4 Data API, stores the result as a dataset, and serves it to Claude over its MCP server. Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context. Claude sees only datasets from data flows that have Claude as their destination.

**Historical data**

- GA4 properties have a configurable retention period of either 2 months or 14 months, and only data inside that window can be pulled
- You set a start and end date for the report; no hard limit on the range is stated, but long ranges with many dimensions are slow

**Refresh**

- A successful manual run is required before a schedule can be set
- Scheduled refresh is described as hourly, daily, or a custom interval
- The platform supports intervals from every 15 minutes to monthly, depending on plan

**Combining several sources**

- One data flow can take several sources and combine them with Join or Append before the data reaches Claude
- GA4 is documented as merging with Google Ads, Facebook Ads, CRM, or e-commerce data for a full-funnel view
- Running several reports and joining them is the documented workaround for GA4's 10-metric ceiling

**Prerequisites**

- A Google account with access to at least one GA4 property
- Viewer permissions or higher on the GA4 property
- The analytics.readonly permission must be granted during the OAuth flow
- A Coupler.io account

### Limits to expect

- Up to 10 metrics and 9 dimensions per data flow, which is a GA4 API limit rather than a Coupler.io one
- Not all metric and dimension pairs are compatible; an invalid combination returns a 400 error
- The GA4 Data API applies request quotas per property, so several flows pulling the same property at once can hit them
- GA4 may withhold rows representing too few users through thresholding, especially when Google Signals is enabled
- Data is typically available within a few hours, but some metrics take 24 to 48 hours to finish processing
- Total users broken down by a dimension will not sum to the overall total
- On the free plan only the first 1,000 rows are exported, which shows up as gaps in dates

### An example question you can ask

> Which landing pages lost the most organic sessions this month compared with last, and did their conversion rate move with the traffic?

### How to install Coupler.io

Follow the steps for the AI tool you use.

- Each AI tool sees only the datasets from data flows that have that tool as a destination. To use the same data in several tools, add each one as a destination on the data flow.
- Every AI tool destination replaces the data on each run; append mode is not supported.

#### Connect Google Analytics 4 to Claude with Coupler.io

Works in Claude web, Claude desktop, Claude mobile, Cowork, Claude Code.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
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

**Check it worked.** Ask Claude to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count Claude reports with the run in Coupler.io, because the preview alone does not confirm what Claude received.

**Good to know**

- On individual Claude Free and Pro plans the official connector may connect but fail to load its tools. The documented workaround is a custom connector: in Coupler.io, open AI integrations, click Custom connector, and copy the URL. Remove the official connector in Claude, then go to Connectors, Add, Add custom connector, give it a name with plain letters and spaces only (for example Coupler Custom), paste the URL, and connect.
- Local use with Claude desktop is also available through a Desktop Extension.

[Coupler.io guide for Claude](https://docs.coupler.io/destinations/categories/ai/claude) · [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io)

#### Connect Google Analytics 4 to ChatGPT with Coupler.io

Connects through the Coupler.io ChatGPT app.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose ChatGPT as the destination in the data flow's destination step.
4. Give the data flow a clear name, because ChatGPT refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In ChatGPT**

1. Open the Coupler.io app in ChatGPT, from the link in your Coupler.io account or the apps section of ChatGPT settings.
2. Install the app and authorize it with your Coupler.io account.
3. Start a new chat to pick up fresh data after a run, or ask ChatGPT to fetch it again in an ongoing conversation.

**Check it worked.** Ask ChatGPT to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count ChatGPT reports with the run in Coupler.io, because the preview alone does not confirm what ChatGPT received.

[Coupler.io guide for ChatGPT](https://docs.coupler.io/destinations/categories/ai/chatgpt)

#### Connect Google Analytics 4 to Gemini CLI with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose Gemini CLI as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Gemini CLI refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Gemini CLI**

1. In the Gemini CLI destination step, generate the command that adds the Coupler.io MCP server, then run it in your terminal. It looks like `gemini mcp add coupler --transport=http --scope=user https://mcp.coupler.io/mcp/...`.
2. Start Gemini CLI and run `/mcp auth coupler` to sign in to Coupler.io.

**Check it worked.** Ask Gemini CLI to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count Gemini CLI reports with the run in Coupler.io, because the preview alone does not confirm what Gemini CLI received.

[Coupler.io guide for Gemini CLI](https://docs.coupler.io/destinations/categories/ai/gemini)

#### Connect Google Analytics 4 to Gemini Enterprise with Coupler.io

Added as a custom MCP data store with OAuth credentials from Coupler.io.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose Gemini Enterprise as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Gemini Enterprise refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Gemini Enterprise**

1. In the Gemini Enterprise destination step, create OAuth credentials and copy the Client ID and Client Secret. The secret is shown only once; if you lose it, regenerate it.
2. In Gemini Enterprise, go to Data stores, Create data store, and choose Custom MCP server.
3. Paste the MCP Server URL, Authorization URL, Token URL, and the scope `mcp` from the destination step, together with the Client ID and Client Secret.

**Check it worked.** Ask Gemini Enterprise to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count Gemini Enterprise reports with the run in Coupler.io, because the preview alone does not confirm what Gemini Enterprise received.

[Coupler.io guide for Gemini Enterprise](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise) · [Google Cloud documentation](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server)

#### Connect Google Analytics 4 to Microsoft Copilot Studio with Coupler.io

Added to a Copilot Studio agent as an MCP tool.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose Microsoft Copilot Studio as the destination in the data flow's destination step.
4. Give the data flow a clear name, because your Copilot Studio agent refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Microsoft Copilot Studio**

1. Open your agent in Copilot Studio and confirm generative orchestration is on.
2. Go to Tools, Add a tool, New tool, Model Context Protocol, and paste the Coupler.io MCP server URL shown in the destination step.
3. For authentication, choose OAuth 2.0 and Dynamic discovery, then click Create. No client ID or secret is needed.
4. The first time someone uses the tool, they see a consent card in chat and sign in to Coupler.io once.

**Check it worked.** Ask your Copilot Studio agent to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count your Copilot Studio agent reports with the run in Coupler.io, because the preview alone does not confirm what your Copilot Studio agent received.

[Coupler.io guide for Microsoft Copilot Studio](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio) · [Microsoft documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)

#### Connect Google Analytics 4 to Perplexity with Coupler.io

Perplexity currently uses the local Coupler.io MCP server, which runs in Docker.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose Perplexity as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Perplexity refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Perplexity**

1. In Perplexity, go to Settings, Connectors, click Add new connector, and choose the simpler settings.
2. Name the connection coupler-io and enter the command `docker run --pull=always -e COUPLER_ACCESS_TOKEN --rm -i ghcr.io/railsware/coupler-io-mcp-server`.
3. Add an environment variable called `COUPLER_ACCESS_TOKEN`, then generate a Coupler.io personal access token and paste it as the value.
4. Save the configuration and accept the security warning about Docker.

**Check it worked.** Ask Perplexity to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count Perplexity reports with the run in Coupler.io, because the preview alone does not confirm what Perplexity received.

[Coupler.io guide for Perplexity](https://docs.coupler.io/destinations/categories/ai/perplexity)

#### Connect Google Analytics 4 to Cursor with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose Cursor as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Cursor refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In Cursor**

1. Open the Coupler.io entry in Cursor's MCP directory and click Add to Cursor.
2. In Cursor, find the new Coupler.io integration, click Needs authentication, then sign in with your Coupler.io account and grant access.
3. Open the AI pane and ask about your dataset.

**Check it worked.** Ask Cursor to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count Cursor reports with the run in Coupler.io, because the preview alone does not confirm what Cursor received.

[Coupler.io guide for Cursor](https://docs.coupler.io/destinations/categories/ai/cursor) · [Coupler.io in the Cursor MCP directory](https://l.rw.rw/couplerio-cursor-mcp)

#### Connect Google Analytics 4 to OpenClaw with Coupler.io

Connects to the Coupler.io MCP server through mcporter.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose OpenClaw as the destination in the data flow's destination step.
4. Give the data flow a clear name, because OpenClaw refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In OpenClaw**

1. Install the coupler-io skill from ClawHub. It holds the commands that connect the Coupler.io MCP server to OpenClaw with mcporter.

**Check it worked.** Ask OpenClaw to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count OpenClaw reports with the run in Coupler.io, because the preview alone does not confirm what OpenClaw received.

[Coupler.io guide for OpenClaw](https://docs.coupler.io/destinations/categories/ai/openclaw) · [Coupler.io in ClawHub](https://clawhub.ai/nika-is-nika/coupler-io)

#### Connect Google Analytics 4 to Custom MCP with Coupler.io

Connects any MCP-compatible client with a personal access token.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Analytics 4 as the source.
2. Choose your property, then pick up to 10 metrics and 9 dimensions and set the date range.
3. Choose Custom MCP as the destination in the data flow's destination step.
4. Give the data flow a clear name, because your MCP client refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Set a refresh schedule once that first run has succeeded.

**In your MCP client**

1. In the Custom MCP destination step, click Generate token and copy it together with the MCP server URL.
2. Add the token and URL to your MCP client's JSON config, following the example config shown there.

**Check it worked.** Ask your MCP client to list the datasets it can see; the GA4 data flow should appear under the name you gave it. Then compare the row count your MCP client reports with the run in Coupler.io, because the preview alone does not confirm what your MCP client received.

**Good to know**

- Treat the personal access token as a secret and do not share it.
- Behind a corporate firewall, allow outbound connections to the Coupler.io MCP endpoint.

[Coupler.io guide for Custom MCP](https://docs.coupler.io/destinations/categories/ai/custom_mcp)

More from the provider: [Overview](https://docs.coupler.io/sources/category/ppc/google-analytics)

## Related skills

A skill gives the AI tool instructions for a task. It connects no data, so connect Google Analytics 4 first.

- [Ai traffic vs organic report](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/ai-traffic-vs-organic-report): for questions like "How much traffic does my site get from ChatGPT", "Are AI answer engines sending me visitors", "AI referral vs organic search traffic".
- [Ai citation to revenue funnel](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/geo/ai-citation-to-revenue-funnel): for questions like "Which of our pages do ChatGPT, Perplexity or Gemini cite", "Does our AI search visibility bring traffic, signups or sales", "Is our Peec visibility worth anything". Also needs Peec AI, Google Search Console, Shopify, WooCommerce, HubSpot, Pipedrive, Salesforce, Stripe, Paddle.
- [Ecom analytics](https://github.com/coupler-io/skills/tree/main/ecommerce/ecom-analytics): for questions like "How is my store performing", "What's my conversion rate", "Cart abandonment". Also needs Shopify, WooCommerce, Adobe Commerce (Magento), Stripe, Klaviyo.
- [Gsc GA4 landing page performance](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/gsc-ga4-landing-page-performance): for questions like "Does my organic search traffic convert", "Which landing pages actually make money from SEO", "Which SEO pages are worth the effort". Also needs Google Search Console.
- [Marketing analytics](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/marketing-analytics): for questions like "Why did conversions drop", "Which channel has best ROI", "Where should I spend more". Also needs Google Ads, Facebook Ads (Meta Ads), LinkedIn Ads.

Skills list taken from [coupler-io/skills](https://github.com/coupler-io/skills) at commit `cf24f3e`.

## Questions

### Can Claude change my GA4 configuration?

No. Coupler.io is read-only against GA4: Claude queries an imported dataset and cannot edit your Analytics configuration, settings, or events.

### How far back can Claude see my analytics?

As far as GA4 keeps it. A GA4 property retains data for either 2 or 14 months depending on its setting, and no route can read past that. If you need longer history, the documented approach is to export on a schedule and store the results before they expire.

### Will the numbers Claude reports match the GA4 interface?

Usually, with two documented caveats. GA4 may withhold rows representing too few users through thresholding, especially when Google Signals is on, and Total users broken down by a dimension will not sum to the overall total. Data pulled through the Data API is unsampled, and most metrics settle within a few hours, though some take 24 to 48 hours.

### Why can I only pick 10 metrics?

That ceiling is the GA4 Data API's: up to 10 metrics and 9 dimensions per report. The documented workaround is to run more than one report and join them.

### My export has missing dates. What happened?

Two documented causes. On the free plan only the first 1,000 rows are exported, which shows up as gaps. The other is an incompatible metric and dimension pair, which returns a 400 error rather than partial data. GA4's per-property API quotas can also bite when several flows pull the same property at once.

### The connector shows as connected but Claude cannot see my data. Why?

On individual Claude Free and Pro plans there is a documented defect where the official Coupler.io connector connects but its tools never load, so Claude cannot query the datasets. Coupler.io documents a custom connector URL as a workaround and reports that it works on all plans.

## Sources and corrections

Researched on 2026-10-04. One route is covered, researched on 4 October 2026: the Coupler.io data platform. No dedicated GA4 entry was reachable in Claude's connector directory at the obvious addresses; the directory cannot be searched exhaustively, so no claim is made that none exists.

Every claim above was read from one of these pages on the date shown.

- [Claude destination](https://docs.coupler.io/destinations/categories/ai/claude) — Coupler.io, read 2026-10-04
- [Claude destination FAQ](https://docs.coupler.io/destinations/categories/ai/claude/faq) — Coupler.io, read 2026-10-04
- [Claude connector tools do not load on Free and Pro plans](https://docs.coupler.io/troubleshooting/claude-connector-tools-dont-load-on-free-and-pro-plans) — Coupler.io, read 2026-10-04
- [Claude destination common issues](https://docs.coupler.io/destinations/categories/ai/claude/common-issues) — Coupler.io, read 2026-10-04
- [Connect Google Analytics 4 to Claude](https://www.coupler.io/claude-integrations/google-analytics-to-claude) — Coupler.io, read 2026-10-04
- [Google Analytics 4 data overview](https://docs.coupler.io/sources/category/ppc/google-analytics/data-overview) — Coupler.io, read 2026-10-04
- [Google Analytics 4 source FAQ](https://docs.coupler.io/sources/category/ppc/google-analytics/faq) — Coupler.io, read 2026-10-04
- [Google Analytics 4 source common issues](https://docs.coupler.io/sources/category/ppc/google-analytics/common-issues) — Coupler.io, read 2026-10-04
- [Google Analytics 4 source overview](https://docs.coupler.io/sources/category/ppc/google-analytics) — Coupler.io, read 2026-10-04
- [What the Coupler.io MCP server can and cannot do](https://docs.coupler.io/ai/mcp) — Coupler.io, read 2026-10-04
- [How to set up automatic data refresh](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh) — Coupler.io, read 2026-10-04
- [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) — Anthropic, read 2026-10-04

Something here wrong or out of date? [Open a correction issue](https://github.com/paladiy/ai-data-connectors/issues/new?template=correction.yml&labels=correction&title=Correction%3A+Google+Analytics+4&source=google-analytics-4).

This guide is also published at [https://paladiy.github.io/ai-data-connectors/sources/google-analytics-4/](https://paladiy.github.io/ai-data-connectors/sources/google-analytics-4/).

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
