# Connect QuickBooks Online to ChatGPT, Claude, Gemini, and other LLMs

QuickBooks Online is Intuit's cloud accounting software. It stores invoices, customers, vendors, transactions, and financial reports such as profit and loss and A/R aging. To analyze that data in ChatGPT, Claude, Gemini, or another LLM, use scheduled Coupler.io imports.

Also known as QBO, QuickBooks, Intuit QuickBooks.

Where a capability is not documented, this guide says so instead of guessing.

## Coupler.io

Coupler.io imports QuickBooks Online entities or reports on a schedule and exposes the result to Claude through its own MCP server, so Claude queries a stored dataset rather than calling Intuit directly.

- Provider: Coupler.io
- Connection method: Data platform
- Maintainer: Third-party (Coupler.io builds and runs this connector and its MCP server.)
- Availability: Available
- Access: Read-only (Queries against imported data are read-only, and nothing in either source describes writing back to QuickBooks Online. Coupler.io's own documentation also describes tools that change your Coupler.io workspace, such as creating a data flow or triggering a run, while the directory entry lists only the four read tools; the two sources disagree on how much of that workspace control the connector currently exposes)
- Works with: Claude, ChatGPT, Gemini CLI, Gemini Enterprise, Microsoft Copilot Studio, Perplexity, Cursor, OpenClaw, Custom MCP
- Listed in Claude's connector directory: [directory entry](https://claude.com/connectors/coupler-io)

**Best for Analysing QuickBooks figures alongside other systems.** One data flow can join or append several sources before Claude sees them, and queries run against the stored dataset rather than the QuickBooks API, so a large report does not have to fit into the conversation.

### What you can do with Coupler.io

- Ask questions about imported QuickBooks entities and pre-built reports, such as invoices, bills, customers, profit and loss, balance sheet, and A/R and A/P aging.
- Keep the data current with a refresh schedule once a first manual run has succeeded.
- Combine QuickBooks with other sources in one data flow, using Join or Append, before Claude sees the result.
- Run SQL against a dataset on Coupler.io's side, so a large dataset does not have to fit into Claude's context.

### What Coupler.io gives you from QuickBooks Online

- Entities: Invoice, Customer, Bill, Payment, Vendor, Employee, Estimate, Purchase, PurchaseOrder, SalesReceipt, CreditMemo, Deposit, Transfer, JournalEntry, Account, Item, Budget, TimeActivity
- Further entities: Attachable, BillPayment, Class, CompanyInfo, Department, ExchangeRate, JournalCode, PaymentMethod, Preferences, RefundReceipt, TaxAgency, TaxCode, TaxRate, Term, VendorCredit
- Summary reports: Profit and Loss Summary, Balance Sheet, Cash Flow, Trial Balance, Expenses by Vendor, Sales by Customer, Sales by Product, Sales by Class Summary, Sales by Department, Tax Summary, Inventory Valuation Summary
- Detail reports: Profit and Loss Detail, General Ledger Detail, Transaction List, Transaction List by Customer, Transaction List by Vendor, Transaction List with Splits, Journal Report
- Aging and balance reports: AP Aging Detail and Summary, AR Aging Detail and Summary, Customer Balance and Detail, Vendor Balance and Detail, Customer Income, Account List Detail

Note: Raw entities and pre-built reports are two separate sources; one entity or report per data flow

### How the data reaches the AI tool

Coupler.io reads the QuickBooks Online API, stores the result as a dataset, and serves it to Claude over its MCP server. Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context. Claude sees only datasets from data flows that have Claude as their destination.

**Historical data.** Not documented (no retention or backfill window is stated; the documented constraint is the size of a single report rather than how far back it can reach)

**Refresh**

- A successful manual run is required before a schedule can be set
- Scheduled refresh is described as hourly, daily, or a custom interval
- The platform supports intervals from every 15 minutes to monthly, depending on plan

Note: Which intervals each plan allows is not documented

**Combining several sources**

- One data flow can take several sources and combine them with Join or Append before the data reaches Claude
- Within Claude, a SQL dataset can be built from datasets in the same data flow, because one query reads one dataset

**Prerequisites**

- A QuickBooks Online account on Simple Start, Essentials, Plus, or Advanced
- Admin or Accountant access to the company file
- Classes, Locations, and Budgets require the Plus or Advanced tier
- A Coupler.io account

### Limits to expect

- The QuickBooks Reports API truncates any report above 400,000 cells (rows times columns); this is Intuit's limit and cannot be raised
- QuickBooks Desktop, including Desktop Enterprise and Desktop Pro, is not supported
- The QuickBooks query language supports AND but not OR, and reports can be grouped by only one dimension at a time
- Custom reports built in the QuickBooks interface are not available through the API
- Entity exports return only active records by default
- Row counts in Claude can differ from the Coupler.io preview when an identifier repeats, so the count should be checked in Claude

### An example question you can ask

> Which vendors did we spend the most with last quarter, and how does that compare with the quarter before?

### How to install Coupler.io

Follow the steps for the AI tool you use.

- Each AI tool sees only the datasets from data flows that have that tool as a destination. To use the same data in several tools, add each one as a destination on the data flow.
- Every AI tool destination replaces the data on each run; append mode is not supported.

#### Connect QuickBooks Online to Claude with Coupler.io

Works in Claude web, Claude desktop, Claude mobile, Cowork, Claude Code.

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Claude as the destination in the data flow's destination step.
3. Give the data flow a clear name, because Claude refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In Claude web, desktop, and Cowork**

1. Install the Coupler.io connector from Claude's connector directory and click Connect.
2. In the Connectors menu, click Connect again and sign in to Coupler.io.
3. Open a new chat. Claude asks permission to use the Coupler.io tools the first time; allow them.

**In Claude Code**

1. Start a new Claude Code session.
2. Paste the connection command shown in the Claude destination step of your data flow.
3. Restart the session.
4. Run `/mcp`, select Coupler.io, and click Authorize in the browser window that opens.

**Check it worked.** Ask Claude to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count Claude reports with the run in Coupler.io, because the preview alone does not confirm what Claude received.

**Good to know**

- On individual Claude Free and Pro plans the official connector may connect but fail to load its tools. The documented workaround is a custom connector: in Coupler.io, open AI integrations, click Custom connector, and copy the URL. Remove the official connector in Claude, then go to Connectors, Add, Add custom connector, give it a name with plain letters and spaces only (for example Coupler Custom), paste the URL, and connect.
- Local use with Claude desktop is also available through a Desktop Extension.

[Coupler.io guide for Claude](https://docs.coupler.io/destinations/categories/ai/claude) · [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io)

#### Connect QuickBooks Online to ChatGPT with Coupler.io

Connects through the Coupler.io ChatGPT app.

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose ChatGPT as the destination in the data flow's destination step.
3. Give the data flow a clear name, because ChatGPT refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In ChatGPT**

1. Open the Coupler.io app in ChatGPT, from the link in your Coupler.io account or the apps section of ChatGPT settings.
2. Install the app and authorize it with your Coupler.io account.
3. Start a new chat to pick up fresh data after a run, or ask ChatGPT to fetch it again in an ongoing conversation.

**Check it worked.** Ask ChatGPT to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count ChatGPT reports with the run in Coupler.io, because the preview alone does not confirm what ChatGPT received.

[Coupler.io guide for ChatGPT](https://docs.coupler.io/destinations/categories/ai/chatgpt)

#### Connect QuickBooks Online to Gemini CLI with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Gemini CLI as the destination in the data flow's destination step.
3. Give the data flow a clear name, because Gemini CLI refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In Gemini CLI**

1. In the Gemini CLI destination step, generate the command that adds the Coupler.io MCP server, then run it in your terminal. It looks like `gemini mcp add coupler --transport=http --scope=user https://mcp.coupler.io/mcp/...`.
2. Start Gemini CLI and run `/mcp auth coupler` to sign in to Coupler.io.

**Check it worked.** Ask Gemini CLI to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count Gemini CLI reports with the run in Coupler.io, because the preview alone does not confirm what Gemini CLI received.

[Coupler.io guide for Gemini CLI](https://docs.coupler.io/destinations/categories/ai/gemini)

#### Connect QuickBooks Online to Gemini Enterprise with Coupler.io

Added as a custom MCP data store with OAuth credentials from Coupler.io.

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Gemini Enterprise as the destination in the data flow's destination step.
3. Give the data flow a clear name, because Gemini Enterprise refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In Gemini Enterprise**

1. In the Gemini Enterprise destination step, create OAuth credentials and copy the Client ID and Client Secret. The secret is shown only once; if you lose it, regenerate it.
2. In Gemini Enterprise, go to Data stores, Create data store, and choose Custom MCP server.
3. Paste the MCP Server URL, Authorization URL, Token URL, and the scope `mcp` from the destination step, together with the Client ID and Client Secret.

**Check it worked.** Ask Gemini Enterprise to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count Gemini Enterprise reports with the run in Coupler.io, because the preview alone does not confirm what Gemini Enterprise received.

[Coupler.io guide for Gemini Enterprise](https://docs.coupler.io/destinations/categories/ai/gemini_enterprise) · [Google Cloud documentation](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server)

#### Connect QuickBooks Online to Microsoft Copilot Studio with Coupler.io

Added to a Copilot Studio agent as an MCP tool.

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Microsoft Copilot Studio as the destination in the data flow's destination step.
3. Give the data flow a clear name, because your Copilot Studio agent refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In Microsoft Copilot Studio**

1. Open your agent in Copilot Studio and confirm generative orchestration is on.
2. Go to Tools, Add a tool, New tool, Model Context Protocol, and paste the Coupler.io MCP server URL shown in the destination step.
3. For authentication, choose OAuth 2.0 and Dynamic discovery, then click Create. No client ID or secret is needed.
4. The first time someone uses the tool, they see a consent card in chat and sign in to Coupler.io once.

**Check it worked.** Ask your Copilot Studio agent to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count your Copilot Studio agent reports with the run in Coupler.io, because the preview alone does not confirm what your Copilot Studio agent received.

[Coupler.io guide for Microsoft Copilot Studio](https://docs.coupler.io/destinations/categories/ai/ms_copilot_studio) · [Microsoft documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)

#### Connect QuickBooks Online to Perplexity with Coupler.io

Perplexity currently uses the local Coupler.io MCP server, which runs in Docker.

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Perplexity as the destination in the data flow's destination step.
3. Give the data flow a clear name, because Perplexity refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In Perplexity**

1. In Perplexity, go to Settings, Connectors, click Add new connector, and choose the simpler settings.
2. Name the connection coupler-io and enter the command `docker run --pull=always -e COUPLER_ACCESS_TOKEN --rm -i ghcr.io/railsware/coupler-io-mcp-server`.
3. Add an environment variable called `COUPLER_ACCESS_TOKEN`, then generate a Coupler.io personal access token and paste it as the value.
4. Save the configuration and accept the security warning about Docker.

**Check it worked.** Ask Perplexity to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count Perplexity reports with the run in Coupler.io, because the preview alone does not confirm what Perplexity received.

[Coupler.io guide for Perplexity](https://docs.coupler.io/destinations/categories/ai/perplexity)

#### Connect QuickBooks Online to Cursor with Coupler.io

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Cursor as the destination in the data flow's destination step.
3. Give the data flow a clear name, because Cursor refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In Cursor**

1. Open the Coupler.io entry in Cursor's MCP directory and click Add to Cursor.
2. In Cursor, find the new Coupler.io integration, click Needs authentication, then sign in with your Coupler.io account and grant access.
3. Open the AI pane and ask about your dataset.

**Check it worked.** Ask Cursor to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count Cursor reports with the run in Coupler.io, because the preview alone does not confirm what Cursor received.

[Coupler.io guide for Cursor](https://docs.coupler.io/destinations/categories/ai/cursor) · [Coupler.io in the Cursor MCP directory](https://l.rw.rw/couplerio-cursor-mcp)

#### Connect QuickBooks Online to OpenClaw with Coupler.io

Connects to the Coupler.io MCP server through mcporter.

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose OpenClaw as the destination in the data flow's destination step.
3. Give the data flow a clear name, because OpenClaw refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In OpenClaw**

1. Install the coupler-io skill from ClawHub. It holds the commands that connect the Coupler.io MCP server to OpenClaw with mcporter.

**Check it worked.** Ask OpenClaw to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count OpenClaw reports with the run in Coupler.io, because the preview alone does not confirm what OpenClaw received.

[Coupler.io guide for OpenClaw](https://docs.coupler.io/destinations/categories/ai/openclaw) · [Coupler.io in ClawHub](https://clawhub.ai/nika-is-nika/coupler-io)

#### Connect QuickBooks Online to Custom MCP with Coupler.io

Connects any MCP-compatible client with a personal access token.

**In Coupler.io**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Custom MCP as the destination in the data flow's destination step.
3. Give the data flow a clear name, because your MCP client refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**In your MCP client**

1. In the Custom MCP destination step, click Generate token and copy it together with the MCP server URL.
2. Add the token and URL to your MCP client's JSON config, following the example config shown there.

**Check it worked.** Ask your MCP client to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count your MCP client reports with the run in Coupler.io, because the preview alone does not confirm what your MCP client received.

**Good to know**

- Treat the personal access token as a secret and do not share it.
- Behind a corporate firewall, allow outbound connections to the Coupler.io MCP endpoint.

[Coupler.io guide for Custom MCP](https://docs.coupler.io/destinations/categories/ai/custom_mcp)

More from the provider: [Overview](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks)

## Related skills

A skill gives the AI tool instructions for a task. It connects no data, so connect QuickBooks Online first.

- [Finance analytics](https://github.com/coupler-io/skills/tree/main/finance/finance-analytics): for questions like "How is revenue trending", "Gross margin", "MRR breakdown". Also needs Xero, Oracle NetSuite, Stripe, Sage.

Skills list taken from [coupler-io/skills](https://github.com/coupler-io/skills) at commit `cf24f3e`.

## Questions

### Does this work with QuickBooks Desktop?

No. Coupler.io connects to the QuickBooks Online API only, and the documentation states that Desktop, including Desktop Enterprise and Desktop Pro, is not supported. Moving to QuickBooks Online would be a prerequisite.

### Can Claude create or send an invoice, or only read my books?

Only read them. Coupler.io is read-only against QuickBooks: Claude queries an imported dataset, and nothing in its documentation describes writing back to your books.

### Which Claude apps can read the data once it is connected?

Coupler.io's documentation names Claude web, Claude desktop, mobile, Cowork, and Claude Code, and says a single web connector covers them; Claude Code is connected with the /mcp command instead. The connector only needs to be installed once.

### Can Claude change my accounting data?

Queries against the imported data are documented as read-only, so the model cannot edit, delete, or overwrite imported rows. The same connection does expose tools that can change your Coupler.io workspace, such as creating a data flow or triggering a run, and the documentation says the model is instructed to confirm before making a change you did not ask for.

### Why can my reports get cut off?

The QuickBooks Reports API truncates a report once it exceeds 400,000 cells, counting rows times columns. This is Intuit's limit, and the documentation says there is no way to raise it, so a long date range on a wide report has to be split up.

### The connector shows as connected but Claude cannot see my data. Why?

On individual Claude Free and Pro plans there is a documented defect where the official connector connects but its tools never load, so Claude cannot query the datasets. Coupler.io documents a custom connector URL as a workaround and reports that it works on all plans.

## Sources and corrections

Researched on 2026-10-04. One route is covered, researched on 4 October 2026: the Coupler.io data platform. Its documentation was read in full, covering the data available, prerequisites, access, and limits.

Every claim above was read from one of these pages on the date shown. Where a page documents nothing on a point, this guide says the point is not documented rather than guessing.

- [Claude destination](https://docs.coupler.io/destinations/categories/ai/claude) — Coupler.io, read 2026-10-04
- [Claude destination FAQ](https://docs.coupler.io/destinations/categories/ai/claude/faq) — Coupler.io, read 2026-10-04
- [Claude connector tools do not load on Free and Pro plans](https://docs.coupler.io/troubleshooting/claude-connector-tools-dont-load-on-free-and-pro-plans) — Coupler.io, read 2026-10-04
- [Claude destination common issues](https://docs.coupler.io/destinations/categories/ai/claude/common-issues) — Coupler.io, read 2026-10-04
- [What the Coupler.io MCP server can and cannot do](https://docs.coupler.io/ai/mcp) — Coupler.io, read 2026-10-04
- [Connect QuickBooks to Claude](https://www.coupler.io/claude-integrations/quickbooks-to-claude) — Coupler.io, read 2026-10-04
- [QuickBooks data overview](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks/data-overview) — Coupler.io, read 2026-10-04
- [QuickBooks source FAQ](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks/faq) — Coupler.io, read 2026-10-04
- [QuickBooks source common issues](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks/common-issues) — Coupler.io, read 2026-10-04
- [QuickBooks source overview](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks) — Coupler.io, read 2026-10-04
- [How to set up automatic data refresh](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh) — Coupler.io, read 2026-10-04
- [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) — Anthropic, read 2026-10-04

Something here wrong or out of date? [Open a correction issue](https://github.com/paladiy/ai-data-connectors/issues/new?template=correction.yml&labels=correction&title=Correction%3A+QuickBooks+Online&source=quickbooks-online).

This guide is also published at [https://paladiy.github.io/ai-data-connectors/sources/quickbooks-online/](https://paladiy.github.io/ai-data-connectors/sources/quickbooks-online/).

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
