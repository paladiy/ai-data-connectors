# QuickBooks Online to Claude: connection options and setup

_Maintained by Olexander Paladiy, who works at Coupler.io, one of the services listed here. Not affiliated with Anthropic._

QuickBooks Online holds the transactions behind your financial reports, and the practical question is how much of that detail Claude can actually reach. This guide compares each route on the data it exposes, the Claude apps it works in, the access it asks for, and the limits that bite at month end.

**Covered in this guide:** Intuit QuickBooks connector, QuickBooks Online MCP Server (local), Coupler.io, Intuit AI Pilot hosted MCP server.

## Compare the options

| Option | Provider | Connection method | Maintainer | Claude surfaces | Availability |
| --- | --- | --- | --- | --- | --- |
| Intuit QuickBooks connector | Intuit | Remote MCP server | Source-vendor maintained | Claude web, Claude desktop, Claude Code, Cowork | Available (Recorded in the directory as added in March 2026) |
| QuickBooks Online MCP Server (local) | Intuit | Local MCP server | Source-vendor maintained | Claude Code | Available |
| Coupler.io | Coupler.io | Data platform | Third-party | Claude web, Claude desktop, Claude Code, Cowork | Available |
| Intuit AI Pilot hosted MCP server | Intuit | Remote MCP server | Source-vendor maintained | Claude desktop | Limited (Described as a pilot, by invitation only, for AI pilot partners under the Intuit App Partner Program, and provided as is for testing) |

## Option details

### Intuit QuickBooks connector
_Source-vendor maintained · Listed in Claude directory_
Intuit's own connector in Claude's directory. Claude calls Intuit's hosted MCP endpoint when you ask a question, and the same connection can create and send invoices as well as read reports.

| Field | Value |
| --- | --- |
| Provider | Intuit |
| Connection method | Remote MCP server |
| Maintainer | Source-vendor maintained (The directory entry credits Intuit QuickBooks as the maker and marks it Anthropic verified) |
| Availability | Available (Recorded in the directory as added in March 2026) |
| Claude web | Supported (Web connectors are stated to be available to all users on Claude, with mobile covered too) |
| Claude desktop | Supported (Claude Desktop is named among the apps where web connectors are available) |
| Claude Code | Supported (The article states that connectors work across Claude, Claude Desktop, Claude Code, and the API; it does not describe a Claude Code setup for this connector specifically) |
| Cowork | Supported (Cowork is named among the apps where web connectors are available) |
| Access | Read and write (The entry describes creating, updating, sending, duplicating, and scheduling invoices and estimates, adding customers and products, and sending payment links and reminders, always with a preview and your confirmation before anything is sent. Payroll and QuickBooks Capital are described as fast read-only answers, though adding an employee or setting base pay is also listed) |
| Data available | Reports: profit and loss, cash flow, balance sheet, A/R aging summary and detail, sales by customer summary, sales by product summary, product and service list; Entities: customers (create and search), invoices (create, update, delete, duplicate, send, read), estimates, products, payment links and reminders; Benchmarking: performance against similar businesses by industry and region, plus peer lending benchmarks; Payroll and lending: payroll detail lookups, adding an employee or setting base pay, and QuickBooks Capital loan details; Transaction import: CSVs, PDFs, or images can be uploaded, or transactions pasted, with an import status tool; 74 tools in total; the entry shows the first 24 and hides the rest behind a Show all control |
| Historical data | Unknown (the entry does not state how far back the connector can reach) |
| Refresh | Not applicable: There is no import to schedule. The entry publishes an MCP endpoint that Claude calls when you ask a question; whether Intuit caches anything behind it is not described |
| Cross-source analysis | Not applicable: This connector reaches QuickBooks Online only. Combining it with another system means adding that system's own connector and asking Claude to work across both in the conversation |
| Prerequisites | Sign-in is recorded as not required, so the connector can be added before any QuickBooks account is linked; Without a QuickBooks account, the entry describes uploading CSVs, PDFs, or images, or pasting transactions directly; A Claude account on an app where connectors are available |
| Price note | Unknown (the entry states no price and no QuickBooks tier requirement) |
| Data path | Claude calls Intuit's hosted MCP endpoint at https://ai-inc.quickbooks.intuit.com/v1/mcp and the result comes back into the conversation. Claude inherits your permissions in the connected service, so anything you cannot reach in QuickBooks the connector cannot reach either. |
| Limits | Anthropic states that it does not control which tools developers make available and cannot verify that they will work as intended or that they will not change; The entry lists 74 tools but shows only the first 24 without expanding the list, so the full surface cannot be read from the page; Results arrive in the conversation rather than in a queryable store, so a wide report competes with the rest of the context |
| Listed in Claude directory | https://claude.com/connectors/quickbooks |

Links: [Overview](https://claude.com/connectors/quickbooks) · [Setup instructions](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities) · [Claude directory entry](https://claude.com/connectors/quickbooks)

**Setup**

1. Open the connector's directory entry and choose Add to Claude.

**Claude configuration**

- Or add it from a chat: click the + button in the lower left, hover over Connectors, and select Manage connectors.
- Approve the connector's tool request the first time Claude uses it in a conversation.

**Sample question**

> Which customers owe us the most right now, and which of those invoices are more than 60 days overdue?

**Check it worked:** Ask Claude for your A/R aging summary. A working connection answers with figures from your QuickBooks company rather than asking you to upload a file.

### QuickBooks Online MCP Server (local)
_Source-vendor maintained_
An open-source MCP server you run on your own machine against your own Intuit developer app. It covers far more of the QuickBooks API than the directory connector, at the cost of an OAuth setup you maintain yourself.

| Field | Value |
| --- | --- |
| Provider | Intuit |
| Connection method | Local MCP server |
| Maintainer | Source-vendor maintained (Published in Intuit's GitHub organisation under the MIT licence. The README's own clone command still points at a different repository path than the published one, so copying it verbatim will not work) |
| Availability | Available |
| Claude web | Unknown (the README does not name Claude on the web) |
| Claude desktop | Unknown (the README does not name Claude Desktop) |
| Claude Code | Supported (The README names Claude Code and includes a Claude Code MCP configuration block) |
| Cowork | Unknown (the README does not name Cowork) |
| Access | Read and write (Create, read, update, delete, and search across 29 entity types. Each write group can be switched off with QUICKBOOKS\_DISABLE\_WRITE, QUICKBOOKS\_DISABLE\_UPDATE, and QUICKBOOKS\_DISABLE\_DELETE; the README states that read tools are always registered, so a read-only setup is a configuration choice rather than a separate install) |
| Data available | 145 tools in total across 29 entity types and 11 financial reports; Entities with full create, read, update, delete, and search: Customer, Invoice, Estimate, Bill, Vendor, Employee, Item, Journal Entry, Bill Payment, Purchase, Payment, Sales Receipt, Credit Memo, Refund Receipt, Purchase Order, Vendor Credit, Deposit, Transfer, Time Activity, Attachable; Entities without delete: Account, Class, Department, Term, Payment Method; Read and search only: Tax Code, Tax Rate, Tax Agency. Company Info is read and update only; Reports include Balance Sheet, Profit and Loss, Cash Flow, Trial Balance, General Ledger, Customer Sales, and Aged Receivables |
| Historical data | Unknown (the README does not state a retention or backfill window) |
| Refresh | Not applicable: There is no import to schedule. The server calls the QuickBooks Online API when Claude uses a tool |
| Cross-source analysis | Not applicable: One server instance is bound to one QuickBooks company through QUICKBOOKS\_REALM\_ID. The README describes pointing each connection at its own token file, so separate companies mean separate configured instances |
| Prerequisites | An app registered on the Intuit Developer Portal, with its client ID and client secret; A one-time browser-based OAuth handshake; sandbox accepts an http://localhost redirect URI, production requires a public HTTPS callback; A refresh token and the realm ID of the QuickBooks company; Node on the machine that runs the server, to install dependencies and build the project |
| Price note | Published under the MIT licence (no charge is stated for the server itself; the Intuit developer app and your own machine are separate) |
| Data path | The server runs as a stdio subprocess on your own machine and authenticates to a QuickBooks Online company with your OAuth token, so the request path is your machine to Intuit. Results come back into the conversation. |
| Limits | Production authorisation needs a public HTTPS callback; only sandbox accepts http://localhost; The refresh token lapses after 100 days, which means repeating the browser handshake; The server writes the rotated refresh token back into its .env on every refresh, so a read-only or containerised install must set QUICKBOOKS\_TOKEN\_STORE\_PATH to an absolute writable path in the host process environment, not inside .env; When QUICKBOOKS\_TOKEN\_STORE\_PATH is set, the package's own .env is not read at all, so credentials must live in the file it points to; The README's clone command points at a repository path that differs from the published one |
| Listed in Claude directory | Not applicable: A local server is configured by hand in your MCP client, not added from Claude's directory |

Links: [Overview](https://github.com/intuit/quickbooks-online-mcp-server)

**Setup**

1. Register an app on the Intuit Developer Portal and note its client ID and client secret.
2. Clone the repository, install dependencies, and build the project.
3. Complete the one-time browser OAuth handshake to obtain a refresh token for your sandbox or production company.
4. Copy .env.example to .env and fill in the client ID, client secret, refresh token, realm ID, and environment.

**Claude configuration**

- Add the server to your Claude Code MCP configuration as a node command pointing at the built dist/index.js, passing the credentials in the env block.
- To keep a session read-only, set QUICKBOOKS\_DISABLE\_WRITE, QUICKBOOKS\_DISABLE\_UPDATE, and QUICKBOOKS\_DISABLE\_DELETE to true.

**Sample question**

> Pull the general ledger detail for last month and list every journal entry over 5,000.

**Check it worked:** Ask Claude for your company info. A reply naming the right QuickBooks company confirms the server is authenticated to the realm you intended rather than to the sandbox.

### Coupler.io
_Third-party · Listed in Claude directory_
Coupler.io imports QuickBooks Online entities or reports on a schedule and exposes the result to Claude through its own MCP server, so Claude queries a stored dataset rather than calling Intuit directly.

| Field | Value |
| --- | --- |
| Provider | Coupler.io |
| Connection method | Data platform |
| Maintainer | Third-party (Coupler.io builds and runs this connector and its MCP server.) |
| Availability | Available |
| Claude web | Supported |
| Claude desktop | Supported (Local use with Claude Desktop is also described through a Desktop Extension) |
| Claude Code | Supported (Connected with the /mcp command rather than the web connector) |
| Cowork | Supported |
| Access | Read-only (Queries against imported data are read-only, and nothing in either source describes writing back to QuickBooks Online. Coupler.io's own documentation also describes tools that change your Coupler.io workspace, such as creating a data flow or triggering a run, while the directory entry lists only the four read tools; the two sources disagree on how much of that workspace control the connector currently exposes) |
| Data available | Entities: Invoice, Customer, Bill, Payment, Vendor, Employee, Estimate, Purchase, PurchaseOrder, SalesReceipt, CreditMemo, Deposit, Transfer, JournalEntry, Account, Item, Budget, TimeActivity; Further entities: Attachable, BillPayment, Class, CompanyInfo, Department, ExchangeRate, JournalCode, PaymentMethod, Preferences, RefundReceipt, TaxAgency, TaxCode, TaxRate, Term, VendorCredit; Summary reports: Profit and Loss Summary, Balance Sheet, Cash Flow, Trial Balance, Expenses by Vendor, Sales by Customer, Sales by Product, Sales by Class Summary, Sales by Department, Tax Summary, Inventory Valuation Summary; Detail reports: Profit and Loss Detail, General Ledger Detail, Transaction List, Transaction List by Customer, Transaction List by Vendor, Transaction List with Splits, Journal Report; Aging and balance reports: AP Aging Detail and Summary, AR Aging Detail and Summary, Customer Balance and Detail, Vendor Balance and Detail, Customer Income, Account List Detail (Raw entities and pre-built reports are two separate sources; one entity or report per data flow) |
| Historical data | Unknown (no retention or backfill window is stated; the documented constraint is the size of a single report rather than how far back it can reach) |
| Refresh | A successful manual run is required before a schedule can be set; Scheduled refresh is described as hourly, daily, or a custom interval; The platform supports intervals from every 15 minutes to monthly, depending on plan (Which intervals each plan allows is not documented) |
| Cross-source analysis | One data flow can take several sources and combine them with Join or Append before the data reaches Claude; Within Claude, a SQL dataset can be built from datasets in the same data flow, because one query reads one dataset |
| Prerequisites | A QuickBooks Online account on Simple Start, Essentials, Plus, or Advanced; Admin or Accountant access to the company file; Classes, Locations, and Budgets require the Plus or Advanced tier; A Coupler.io account and a Claude account; On a Claude Team or Enterprise plan, admin access is needed to add the connector |
| Price note | Unknown (no pricing page was checked for this record) |
| Data path | Coupler.io reads the QuickBooks Online API, stores the result as a dataset, and serves it to Claude over its MCP server. Queries run on Coupler.io's side, so a large dataset does not have to fit into the model's context. Claude sees only datasets from data flows that have Claude as their destination. |
| Limits | The QuickBooks Reports API truncates any report above 400,000 cells (rows times columns); this is Intuit's limit and cannot be raised; QuickBooks Desktop, including Desktop Enterprise and Desktop Pro, is not supported; The QuickBooks query language supports AND but not OR, and reports can be grouped by only one dimension at a time; Custom reports built in the QuickBooks interface are not available through the API; Entity exports return only active records by default; The Claude destination replaces data on each run; append mode is not supported; Row counts in Claude can differ from the Coupler.io preview when an identifier repeats, so the count should be checked in Claude; On individual Claude Free and Pro plans the official connector may connect but fail to load its tools; a custom connector URL is documented as a workaround |
| Listed in Claude directory | https://claude.com/connectors/coupler-io (The entry is marked Anthropic verified, credited to Coupler.io, added in November 2025, and records sign-in as required. It lists four tools: get-data, get-schema, list-dataflows, and get-dataflow) |

Links: [Overview](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks) · [Setup instructions](https://docs.coupler.io/destinations/categories/ai/claude) · [Claude directory entry](https://claude.com/connectors/coupler-io)

**Setup**

1. In Coupler.io, create a data flow and add QuickBooks as the source, choosing either an entity or a pre-built report.
2. Choose Claude as the destination in the data flow's destination step.
3. Give the data flow a clear name, because Claude refers to the dataset by that name.
4. Run the data flow manually once and wait for it to finish successfully.
5. Set a refresh schedule once that first run has succeeded.

**Claude configuration**

- Install the Coupler.io connector in Claude and click Connect, then connect again from the Connectors menu to authenticate.
- For Claude Code, start a session, paste the connection command shown in the destination step, restart the session, then run /mcp and authorise in the browser.
- Approve the tool request the first time Claude fetches data in a session.
- On a Claude Team or Enterprise plan, ask a workspace admin to add the connector if the option is unavailable.

**Sample question**

> Which vendors did we spend the most with last quarter, and how does that compare with the quarter before?

**Check it worked:** Open a new Claude chat and ask it to list the datasets it can see; the QuickBooks data flow should appear under the name you gave it. Then compare the row count Claude reports with the run in Coupler.io, because the preview alone does not confirm what Claude received.

### Intuit AI Pilot hosted MCP server
_Source-vendor maintained · Limited_
Intuit's hosted MCP endpoint for partners building their own agents. It is open by invitation only, so it is a route to know about rather than one you can set up today.

| Field | Value |
| --- | --- |
| Provider | Intuit |
| Connection method | Remote MCP server |
| Maintainer | Source-vendor maintained |
| Availability | Limited (Described as a pilot, by invitation only, for AI pilot partners under the Intuit App Partner Program, and provided as is for testing) |
| Claude web | Unknown (the overview does not name Claude on the web) |
| Claude desktop | Supported (Claude Desktop is named as an example of an MCP-compatible client that can use the server) |
| Claude Code | Unknown (the overview names Claude Desktop, Cursor, and custom agents without naming Claude Code) |
| Cowork | Unknown (the overview does not name Cowork) |
| Access | Read and write (Each tool is gated by its own OAuth scope, so read and write can be separated per object; for example sales.tools.invoice.read covers reading invoices while sales.tools.invoice covers creating, updating, deleting, duplicating, and sending them) |
| Data available | Customers: search and create; Products: catalogue search and create; Sales orders: read, create through a workflow, and close; Invoices: read, create, update, delete, duplicate, and send; Estimates: read, create, update, delete, duplicate, and send; Sales settings: read and update (a curated set of QuickBooks Online capabilities rather than the full API) |
| Historical data | Unknown (the overview does not state how far back the server can reach) |
| Refresh | Not applicable: There is no import to schedule. The overview describes stateless mode with no session id requirement, so each request stands alone |
| Cross-source analysis | Not applicable: An access token is tied to one QuickBooks company realm |
| Prerequisites | Membership of the Intuit App Partner Program and an invitation to the pilot; An AppID from the Intuit Developer Portal, onboarded with MCP scopes by your assigned Intuit solution engineer; Your agent's IP range whitelisted by Intuit; The com.intuit.quickbooks.accounting scope plus restricted MCP scopes granted case by case; A User-Agent header of the form partner\_app\_\[AppName\] on every request |
| Price note | No charge is associated with participation in the pilot programme (Intuit reserves the right to change functionality or to charge for MCP server functionality in future) |
| Data path | Requests go to Intuit's hosted endpoint at https://mcp.quickbooks.intuit.com/mcp over MCP Streamable HTTP, which is JSON-RPC 2.0 over POST, at protocol version 2025-11-25 in stateless mode. Authorisation uses the same OAuth 2.0 flow as the QuickBooks Online REST API, with a token tied to one company realm. |
| Limits | By invitation only, and provided as is for testing purposes; Access requires Intuit to whitelist your agent's IP range; Intuit directs deterministic, code-driven integrations to the QuickBooks Online REST API instead, and positions this server for agentic use where the model chooses the action; Restricted MCP scopes are granted case by case by an Intuit solution engineer |
| Listed in Claude directory | Not applicable: Access is arranged with an assigned Intuit solution engineer, not through Claude's directory |

Links: [Overview](https://intuitdeveloper.github.io/intuit-3p-ai-pilot/)

**Setup**

1. Share your agent's IP range, primary agentic use case, LLM model, and Intuit Developer Portal AppID with your assigned Intuit solution engineer.
2. Have the solution engineer onboard that AppID with the MCP scopes your use case needs.
3. Complete the OAuth 2.0 authorisation code flow with your existing client ID and secret to obtain a token for the company realm.

**Claude configuration**

- Point your MCP client at the hosted endpoint and set the User-Agent header to partner\_app\_\[AppName\].

**Sample question**

> List the open sales orders from this month and the invoices they produced.

**Check it worked:** Once connected, the client calls tools/list on its own. Seeing tools such as qbo\_sales\_get\_invoices confirms your AppID carries the MCP scopes.

## Which route suits which job

### Analysing QuickBooks figures alongside other systems

**Coupler.io.** One data flow can join or append several sources before Claude sees them, and queries run against the stored dataset rather than the QuickBooks API, so a large report does not have to fit into the conversation.

### Asking about your finances in Claude with the least setup

**Intuit QuickBooks connector.** It is added from Claude's directory in one step, sign-in is recorded as not required, and it is Intuit's own connector rather than an intermediary.

### Keeping QuickBooks credentials on hardware you control

**QuickBooks Online MCP Server (local).** The server runs as a subprocess on your own machine against your own Intuit app under the MIT licence, and the write, update, and delete tool groups can each be switched off while read tools stay available.

### Building your own agent product on QuickBooks data

**Intuit AI Pilot hosted MCP server.** Intuit offers this hosted endpoint to App Partner Program members specifically for agentic use, with per-object OAuth scopes, while directing code-driven integrations to the REST API.

## Questions

### Does this work with QuickBooks Desktop?

No. Coupler.io connects to the QuickBooks Online API only, and the documentation states that Desktop, including Desktop Enterprise and Desktop Pro, is not supported. Moving to QuickBooks Online would be a prerequisite.

### Can Claude create or send an invoice, or only read my books?

It depends on the route. Intuit's directory connector describes creating, updating, sending, duplicating, and scheduling invoices and estimates, with a preview and your confirmation before anything is sent, and Intuit's local server and hosted pilot both expose write tools too. Coupler.io is read-only against QuickBooks: Claude queries an imported dataset, and nothing in its documentation describes writing back to your books.

### Which route gets me the most QuickBooks data?

Measured by API coverage, Intuit's local MCP server is the widest: 145 tools across 29 entity types and 11 reports, with full create, read, update, delete, and search on most entities. Its directory connector lists 74 tools. Coupler.io covers more than 30 entities and over 30 pre-built reports, but with a different shape, because it imports one entity or report per data flow into a dataset Claude then queries.

### Which Claude apps can read the data once it is connected?

Coupler.io's documentation names Claude web, Claude desktop, mobile, Cowork, and Claude Code, and says a single web connector covers them; Claude Code is connected with the /mcp command instead. The connector only needs to be installed once.

### Can Claude change my accounting data?

Queries against the imported data are documented as read-only, so the model cannot edit, delete, or overwrite imported rows. The same connection does expose tools that can change your Coupler.io workspace, such as creating a data flow or triggering a run, and the documentation says the model is instructed to confirm before making a change you did not ask for.

### Why can my reports get cut off?

The QuickBooks Reports API truncates a report once it exceeds 400,000 cells, counting rows times columns. This is Intuit's limit, and the documentation says there is no way to raise it, so a long date range on a wide report has to be split up.

### The connector shows as connected but Claude cannot see my data. Why?

On individual Claude Free and Pro plans there is a documented defect where the official connector connects but its tools never load, so Claude cannot query the datasets. Coupler.io documents a custom connector URL as a workaround and reports that it works on all plans.

## Sources and corrections

Researched on 2026-10-04. Four routes were researched on 4 October 2026: the Coupler.io data platform, Intuit's connector in Claude's directory, Intuit's open-source local MCP server, and Intuit's invitation-only hosted MCP pilot. Each route's own documentation was read in full, covering the data available, prerequisites, access, and limits. Manual export of QuickBooks reports is a fifth route that is missing here: every Intuit help-centre page for it returned a server error on the day of research, so no export facts are recorded rather than guessed.

Evidence:

- [Use connectors to extend Claude's capabilities](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities) — Anthropic, checked 2026-10-04
- [Claude destination](https://docs.coupler.io/destinations/categories/ai/claude) — Coupler.io, checked 2026-10-04
- [Claude destination FAQ](https://docs.coupler.io/destinations/categories/ai/claude/faq) — Coupler.io, checked 2026-10-04
- [Claude connector tools do not load on Free and Pro plans](https://docs.coupler.io/troubleshooting/claude-connector-tools-dont-load-on-free-and-pro-plans) — Coupler.io, checked 2026-10-04
- [Claude destination common issues](https://docs.coupler.io/destinations/categories/ai/claude/common-issues) — Coupler.io, checked 2026-10-04
- [What the Coupler.io MCP server can and cannot do](https://docs.coupler.io/ai/mcp) — Coupler.io, checked 2026-10-04
- [Connect QuickBooks to Claude](https://www.coupler.io/claude-integrations/quickbooks-to-claude) — Coupler.io, checked 2026-10-04
- [QuickBooks data overview](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks/data-overview) — Coupler.io, checked 2026-10-04
- [QuickBooks source FAQ](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks/faq) — Coupler.io, checked 2026-10-04
- [QuickBooks source common issues](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks/common-issues) — Coupler.io, checked 2026-10-04
- [QuickBooks source overview](https://docs.coupler.io/sources/category/finance-and-accounting/quickbooks) — Coupler.io, checked 2026-10-04
- [How to set up automatic data refresh](https://docs.coupler.io/functionality/flow-settings/how-to-set-up-automatic-data-refresh) — Coupler.io, checked 2026-10-04
- [Coupler.io in the Claude connectors directory](https://claude.com/connectors/coupler-io) — Anthropic, checked 2026-10-04
- [Intuit QuickBooks in the Claude connectors directory](https://claude.com/connectors/quickbooks) — Anthropic, checked 2026-10-04
- [Intuit AI Pilot — Hosted MCP Server](https://intuitdeveloper.github.io/intuit-3p-ai-pilot/) — Intuit, checked 2026-10-04
- [QuickBooks Online MCP Server](https://github.com/intuit/quickbooks-online-mcp-server) — Intuit, checked 2026-10-04

---

_Generated from the records in `data/`. Edit those records and run `npm run generate`; do not edit this file by hand._
