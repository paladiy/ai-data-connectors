# Connect Google Search Console to ChatGPT, Claude, Gemini, and other LLMs

Google Search Console is Google's free tool for monitoring how a website performs in Google Search. Its data covers queries, clicks, impressions, average position, pages, and URL index status. To analyze it in ChatGPT, Claude, Gemini, or another LLM, use scheduled Coupler.io imports.

Also known as GSC, Search Console, Webmaster Tools.

Where a capability is not documented, this guide says so instead of guessing.

## Coupler.io

Coupler.io imports a Search Console report on a schedule and exposes the result to Claude through its own MCP server. Because GSC drops data after 16 months, a scheduled import is also the documented way to keep history Google will not.

- Provider: Coupler.io
- Connection method: Data platform
- Maintainer: Third-party (Coupler.io builds and runs this connector and its MCP server.)
- Availability: Available
- Access: Read-only (Queries against imported data are read-only, and nothing in either source describes submitting sitemaps or requesting indexing. Coupler.io's own documentation also describes tools that change your Coupler.io workspace, such as creating a data flow or triggering a run)
- Works with: Claude, ChatGPT, Gemini CLI, Gemini Enterprise, Microsoft Copilot Studio, Perplexity, Cursor, OpenClaw, Custom MCP
- Listed in Claude's connector directory: [directory entry](https://claude.com/connectors/coupler-io)

**Best for Tracking search performance beyond Google's 16-month window.** Search Console deletes performance data after about 16 months, and recurring exports into a stored dataset are the documented way to keep it. Queries then run against that store rather than the API, and the data can be joined with GA4 by landing page.

### What Coupler.io gives you from Google Search Console

- Five report types: Search results performance, Search results performance by appearance, Discover performance, Google News performance, and URLs index performance
- Shared performance metrics: clicks, impressions, ctr, and position
- Dimensions: date, country, device, page, and query, with availability varying by report
- URL inspection columns include verdict, coverage state, robots.txt state, indexing state, last crawl time, page fetch state, Google and user canonical, crawled-as, and AMP, mobile usability, and rich results verdicts
- Filters by dimension support Contains, Does not contain, Equals, Does not equal, Including Regex, and Excluding Regex
- Other options: search results type (Web, News, Image, Video), aggregation (Auto, Page, Property, News showcase panel), and data state (Final or All)

Note: Query is available on Search results only, and Device is unavailable on Discover, so the breakdowns you can ask for depend on the report

### How the data reaches the AI tool

Coupler.io reads the Search Console API, stores the result as a dataset, and serves it to Claude over its MCP server. Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context. Claude sees only datasets from data flows that have Claude as their destination.

**Historical data**

- Search Console retains performance data for approximately 16 months, and nothing older can be queried
- Discover and Google News have a shorter retention period than Search results

Note: The documented way to keep longer history is to set up recurring exports and store the results in your destination before they expire

**Refresh**

- A successful manual run is required before a schedule can be set
- Scheduled refresh is described as hourly, daily, or a custom interval
- Coupler.io's data freshness TTL for Search Console is 6 hours, so intra-day refreshes return cached data within that window
- Because GSC data lags by 2 to 3 days, the documented advice is a single daily morning refresh

**Combining several sources**

- One data flow can take several sources and combine them with Join or Append before the data reaches Claude
- A worked example joins GSC Search results with GA4 by landing page, noting that GSC uses full URLs while GA4 uses path-only
- GSC clicks and GA4 sessions are counted differently and should be treated as complementary, not equivalent

**Prerequisites**

- A Google Search Console account with verified site ownership or delegated access
- At least Restricted or Full user access to the property
- Owner-level access is not required for performance reports but may be needed for URL inspection data
- A Coupler.io account

### Limits to expect

- Search Console data is typically delayed by 2 to 3 days; with the Final data state the cutoff is typically 3 to 5 days
- When there are too many unique queries, Google groups low-volume ones under (other) to protect privacy, and there is no workaround
- The URL Inspection API has a daily quota per property; Coupler.io fetches up to 20 URLs concurrently
- CTR and position are averages and are not directly summable across dimensions without recalculation
- Row counts in Claude can differ from the Coupler.io preview when an identifier repeats, so the count should be checked in Claude

### An example question you can ask

> Which pages lost the most clicks year over year, and did their average position or their CTR move first?

### How to install Coupler.io

Follow the steps for the AI tool you use.

- Each AI tool sees only the datasets from data flows that have that tool as a destination. To use the same data in several tools, add each one as a destination on the data flow.
- Every AI tool destination replaces the data on each run; append mode is not supported.

#### Connect Google Search Console to Claude with Coupler.io

Works in Claude web, Claude desktop, Claude mobile, Cowork, Claude Code.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose Claude as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Claude refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In Claude web, desktop, and Cowork**

1. Install the Coupler.io connector from Claude's connector directory and click Connect.
2. In the Connectors menu, click Connect again and sign in to Coupler.io.
3. Open a new chat. Claude asks permission to use the Coupler.io tools the first time; allow them.

**In Claude Code**

1. Start a new Claude Code session.
2. Paste the connection command shown in the Claude destination step of your data flow.
3. Restart the session.
4. Run `/mcp`, select Coupler.io, and click Authorize in the browser window that opens.

**Check it worked.** Ask Claude to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count Claude reports with the run in Coupler.io, because the preview alone does not confirm what Claude received.

**Good to know**

- On individual Claude Free and Pro plans the official connector may connect but fail to load its tools. The documented workaround is a custom connector: in Coupler.io, open AI integrations, click Custom connector, and copy the URL. Remove the official connector in Claude, then go to Connectors, Add, Add custom connector, give it a name with plain letters and spaces only (for example Coupler Custom), paste the URL, and connect.
- Local use with Claude desktop is also available through a Desktop Extension.

[Coupler.io guide for Claude](https://docs.coupler.io/destinations/categories/ai/claude) · [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io)

#### Connect Google Search Console to ChatGPT with Coupler.io

Connects through the Coupler.io ChatGPT app.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose ChatGPT as the destination in the data flow's destination step.
4. Give the data flow a clear name, because ChatGPT refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In ChatGPT**

1. Open the Coupler.io app in ChatGPT, from the link in your Coupler.io account or the apps section of ChatGPT settings.
2. Install the app and authorize it with your Coupler.io account.
3. Start a new chat to pick up fresh data after a run, or ask ChatGPT to fetch it again in an ongoing conversation.

**Check it worked.** Ask ChatGPT to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count ChatGPT reports with the run in Coupler.io, because the preview alone does not confirm what ChatGPT received.

[Coupler.io guide for ChatGPT](https://docs.coupler.io/destinations/categories/ai/chatgpt)

#### Connect Google Search Console to Gemini CLI with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose Gemini CLI as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Gemini CLI refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In Gemini CLI**

1. In the Gemini CLI destination step, generate the command that adds the Coupler.io MCP server, then run it in your terminal. It looks like `gemini mcp add coupler --transport=http --scope=user https://mcp.coupler.io/mcp/...`.
2. Start Gemini CLI and run `/mcp auth coupler` to sign in to Coupler.io.

**Check it worked.** Ask Gemini CLI to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count Gemini CLI reports with the run in Coupler.io, because the preview alone does not confirm what Gemini CLI received.

[Coupler.io guide for Gemini CLI](https://docs.coupler.io/destinations/categories/ai/gemini)

#### Connect Google Search Console to Gemini Enterprise with Coupler.io

Added as a custom MCP data store with OAuth credentials from Coupler.io.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose Gemini Enterprise as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Gemini Enterprise refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In Gemini Enterprise**

1. In the Gemini Enterprise destination step, create OAuth credentials and copy the Client ID and Client Secret. The secret is shown only once; if you lose it, regenerate it.
2. In Gemini Enterprise, go to Data stores, Create data store, and choose Custom MCP server.
3. Paste the MCP Server URL, Authorization URL, Token URL, and the scope `mcp` from the destination step, together with the Client ID and Client Secret.

**Check it worked.** Ask Gemini Enterprise to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count Gemini Enterprise reports with the run in Coupler.io, because the preview alone does not confirm what Gemini Enterprise received.

[Coupler.io guide for Gemini Enterprise](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise) · [Google Cloud documentation](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server)

#### Connect Google Search Console to Microsoft Copilot Studio with Coupler.io

Added to a Copilot Studio agent as an MCP tool.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose Microsoft Copilot Studio as the destination in the data flow's destination step.
4. Give the data flow a clear name, because your Copilot Studio agent refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In Microsoft Copilot Studio**

1. Open your agent in Copilot Studio and confirm generative orchestration is on.
2. Go to Tools, Add a tool, New tool, Model Context Protocol, and paste the Coupler.io MCP server URL shown in the destination step.
3. For authentication, choose OAuth 2.0 and Dynamic discovery, then click Create. No client ID or secret is needed.
4. The first time someone uses the tool, they see a consent card in chat and sign in to Coupler.io once.

**Check it worked.** Ask your Copilot Studio agent to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count your Copilot Studio agent reports with the run in Coupler.io, because the preview alone does not confirm what your Copilot Studio agent received.

[Coupler.io guide for Microsoft Copilot Studio](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio) · [Microsoft documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)

#### Connect Google Search Console to Perplexity with Coupler.io

Perplexity currently uses the local Coupler.io MCP server, which runs in Docker.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose Perplexity as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Perplexity refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In Perplexity**

1. In Perplexity, go to Settings, Connectors, click Add new connector, and choose the simpler settings.
2. Name the connection coupler-io and enter the command `docker run --pull=always -e COUPLER_ACCESS_TOKEN --rm -i ghcr.io/railsware/coupler-io-mcp-server`.
3. Add an environment variable called `COUPLER_ACCESS_TOKEN`, then generate a Coupler.io personal access token and paste it as the value.
4. Save the configuration and accept the security warning about Docker.

**Check it worked.** Ask Perplexity to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count Perplexity reports with the run in Coupler.io, because the preview alone does not confirm what Perplexity received.

[Coupler.io guide for Perplexity](https://docs.coupler.io/destinations/categories/ai/perplexity)

#### Connect Google Search Console to Cursor with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose Cursor as the destination in the data flow's destination step.
4. Give the data flow a clear name, because Cursor refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In Cursor**

1. Open the Coupler.io entry in Cursor's MCP directory and click Add to Cursor.
2. In Cursor, find the new Coupler.io integration, click Needs authentication, then sign in with your Coupler.io account and grant access.
3. Open the AI pane and ask about your dataset.

**Check it worked.** Ask Cursor to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count Cursor reports with the run in Coupler.io, because the preview alone does not confirm what Cursor received.

[Coupler.io guide for Cursor](https://docs.coupler.io/destinations/categories/ai/cursor) · [Coupler.io in the Cursor MCP directory](https://l.rw.rw/couplerio-cursor-mcp)

#### Connect Google Search Console to OpenClaw with Coupler.io

Connects to the Coupler.io MCP server through mcporter.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose OpenClaw as the destination in the data flow's destination step.
4. Give the data flow a clear name, because OpenClaw refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In OpenClaw**

1. Install the coupler-io skill from ClawHub. It holds the commands that connect the Coupler.io MCP server to OpenClaw with mcporter.

**Check it worked.** Ask OpenClaw to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count OpenClaw reports with the run in Coupler.io, because the preview alone does not confirm what OpenClaw received.

[Coupler.io guide for OpenClaw](https://docs.coupler.io/destinations/categories/ai/openclaw) · [Coupler.io in ClawHub](https://clawhub.ai/nika-is-nika/coupler-io)

#### Connect Google Search Console to Custom MCP with Coupler.io

Connects any MCP-compatible client with a personal access token.

**In Coupler.io**

1. In Coupler.io, create a data flow and select Google Search Console as the source, then choose the site.
2. Pick one of the five report types, set the report period, and add any dimension filters you need.
3. Choose Custom MCP as the destination in the data flow's destination step.
4. Give the data flow a clear name, because your MCP client refers to the dataset by that name.
5. Run the data flow manually once and wait for it to finish successfully.
6. Schedule a single daily morning refresh, since the data lags by 2 to 3 days and the freshness TTL is 6 hours.

**In your MCP client**

1. In the Custom MCP destination step, click Generate token and copy it together with the MCP server URL.
2. Add the token and URL to your MCP client's JSON config, following the example config shown there.

**Check it worked.** Ask your MCP client to list the datasets it can see; the Search Console data flow should appear under the name you gave it. Then compare the row count your MCP client reports with the run in Coupler.io, because the preview alone does not confirm what your MCP client received.

**Good to know**

- Treat the personal access token as a secret and do not share it.
- Behind a corporate firewall, allow outbound connections to the Coupler.io MCP endpoint.

[Coupler.io guide for Custom MCP](https://docs.coupler.io/destinations/categories/ai/custom_mcp)

More from the provider: [Overview](https://docs.coupler.io/sources/category/marketing/google-search-console)

## Related skills

A skill gives the AI tool instructions for a task. It connects no data, so connect Google Search Console first.

- [Branded vs nonbranded search split](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/branded-vs-nonbranded-search-split): for questions like "Is my SEO growth real or just brand", "Brand vs non-brand organic search", "How much of my search traffic is people searching my name".
- [Content decay detector](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/content-decay-detector): for questions like "Which of my pages are losing search traffic", "What content is decaying", "Which blog posts should I refresh".
- [Country device performance](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/gsc-country-device-performance): for questions like "How does my organic search do by country", "Which markets underperform in search", "Is mobile or desktop better for my search traffic".
- [Search opportunity finder](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/gsc-search-opportunity-finder): for questions like "Which keywords are close to page one on my site", "Striking distance keyword report", "Which of my pages get search impressions but no clicks".
- [New page indexation tracker](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/new-page-indexation-tracker): for questions like "Are my new pages getting indexed by Google", "How long until new content ranks in search", "Which of my pages is Google ignoring".
- [Ai citation to revenue funnel](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/geo/ai-citation-to-revenue-funnel): for questions like "Which of our pages do ChatGPT, Perplexity or Gemini cite", "Does our AI search visibility bring traffic, signups or sales", "Is our Peec visibility worth anything". Also needs Peec AI, Google Analytics 4 (GA4), Shopify, WooCommerce, HubSpot, Pipedrive, Salesforce, Stripe, Paddle.
- [GA4 landing page performance](https://github.com/coupler-io/skills/tree/main/marketing-and-ads/seo/gsc-ga4-landing-page-performance): for questions like "Does my organic search traffic convert", "Which landing pages actually make money from SEO", "Which SEO pages are worth the effort". Also needs Google Analytics 4 (GA4).

Skills list taken from [coupler-io/skills](https://github.com/coupler-io/skills) at commit `cf24f3e`.

## Questions

### Can Claude submit a sitemap or request indexing?

No. Coupler.io is read-only against Search Console: Claude queries an imported dataset and cannot submit sitemaps or request indexing.

### How far back can Claude see my search data?

About 16 months, which is Search Console's own retention period, and Discover and Google News keep even less. No connector can read past it. If you need longer history, the documented approach is recurring exports stored somewhere before the data expires.

### What is the "(other)" row in my query data?

When a property has too many unique queries, Google groups the low-volume ones under (other) to protect privacy and manage data volume. The documentation states there is no workaround, because the underlying data is anonymised by Google before any tool can reach it.

### Why is today's data missing?

Search Console data is typically delayed by 2 to 3 days, and with the Final data state the cutoff is typically 3 to 5 days. Refreshing more often does not help: Coupler.io's freshness TTL for this source is 6 hours, so intra-day refreshes return cached data, and a single daily morning refresh is the documented advice.

### Why can I not just average the CTR and position columns?

Because they are already averages. CTR and position are not directly summable across dimensions without recalculating from clicks and impressions, so asking Claude for an average of the position column will give you a number that does not mean what it looks like.

## Sources and corrections

Researched on 2026-10-04. One route is covered, researched on 4 October 2026: the Coupler.io data platform. No dedicated Search Console entry was reachable in Claude's connector directory at the obvious address; the directory cannot be searched exhaustively, so no claim is made that none exists.

Every claim above was read from one of these pages on the date shown. Where a page documents nothing on a point, this guide says the point is not documented rather than guessing.

- [Claude destination](https://docs.coupler.io/destinations/categories/ai/claude) — Coupler.io, read 2026-10-04
- [Claude destination FAQ](https://docs.coupler.io/destinations/categories/ai/claude/faq) — Coupler.io, read 2026-10-04
- [Claude destination common issues](https://docs.coupler.io/destinations/categories/ai/claude/common-issues) — Coupler.io, read 2026-10-04
- [Google Search Console best practices](https://docs.coupler.io/sources/category/marketing/google-search-console/best-practices) — Coupler.io, read 2026-10-04
- [Connect Google Search Console to Claude](https://www.coupler.io/claude-integrations/google-search-console-to-claude) — Coupler.io, read 2026-10-04
- [Google Search Console data overview](https://docs.coupler.io/sources/category/marketing/google-search-console/data-overview) — Coupler.io, read 2026-10-04
- [Google Search Console source FAQ](https://docs.coupler.io/sources/category/marketing/google-search-console/faq) — Coupler.io, read 2026-10-04
- [Google Search Console source common issues](https://docs.coupler.io/sources/category/marketing/google-search-console/common-issues) — Coupler.io, read 2026-10-04
- [Google Search Console source overview](https://docs.coupler.io/sources/category/marketing/google-search-console) — Coupler.io, read 2026-10-04
- [What the Coupler.io MCP server can and cannot do](https://docs.coupler.io/ai/mcp) — Coupler.io, read 2026-10-04
- [How to set up automatic data refresh](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh) — Coupler.io, read 2026-10-04
- [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) — Anthropic, read 2026-10-04

Something here wrong or out of date? [Open a correction issue](https://github.com/paladiy/ai-data-connectors/issues/new?template=correction.yml&labels=correction&title=Correction%3A+Google+Search+Console&source=google-search-console).

This guide is also published at [https://paladiy.github.io/ai-data-connectors/sources/google-search-console/](https://paladiy.github.io/ai-data-connectors/sources/google-search-console/).

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
