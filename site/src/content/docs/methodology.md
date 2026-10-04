---
title: How this directory works
description: Who maintains this directory, how routes are chosen and ordered, what verified means, and how to get something corrected.
---

## Who maintains this

This directory is maintained by Olexander Paladiy, who works at Coupler.io. Coupler.io is one of the
services listed here and is compared using the same fields and rules as every other option. The
directory is not affiliated with Anthropic.

Read the comparisons with that relationship in mind, and check the cited evidence rather than
taking a recommendation on trust.

## What is in scope

Each guide answers one question: how can the data in a given business source be analysed in Claude?
A route qualifies when it moves or exposes that source's data to Claude, whether through a native
connector, an MCP server, a data platform, an automation tool, or a manual file export.

This is an editorial directory, not a connector service. It does not authenticate you, read your
business data, or host an MCP server.

Coverage is deliberately not described as exhaustive. A route appears once it has been checked
against evidence that is recorded on the page. "Not found in the sources we checked" is recorded as
exactly that, and never as "does not exist".

## How options are chosen

Every credible route found during the documented search is included, including competitors. The
quality gate is useful verified coverage, not a number of alternatives. If only one alternative can
be verified for a source, the honest comparison of two options is published rather than a third
being invented. A page with no meaningful comparison stays unpublished until a reviewer establishes
that it is useful on its own.

Every option is shown with the same comparison fields, and no option is moved ahead of a
better-suited route in the recommendations.

## How options are ordered

The comparison orders routes this way:

1. Routes with a verified source-vendor or Anthropic maintainer.
2. Other managed routes, alphabetically by provider.
3. Community-maintained routes.
4. Manual export.

Table position is not a ranking. The recommendations section can point to any option regardless of
where it sits in the table, and it explains why that option suits that job.

Maintainer labels describe who maintains the connector: "Source-vendor maintained", "Anthropic
maintained", "Third-party", "Community", or "Manual export". Appearing in Claude's connector
directory is recorded separately, as "Listed in Claude directory", because listing and maintenance
are different facts.

## What verified means

Every capability is stored as a claim with one of three statuses.

- **Verified.** A human checked the claim against the evidence cited on the page, on a recorded
  date. The evidence list shows what was checked and when.
- **Not verified.** Nobody has checked it against evidence yet. This is displayed as "Not verified"
  and never converted into a "no". An absent claim is not a missing feature.
- **Not applicable.** The field does not apply to that route, with an explanation of why.

Documentation review and hands-on product testing are recorded separately, so a page states which
one happened. A claim checked only in a vendor's documentation is never described as tested.

A route may only appear in a page's opening answer, its setup instructions, or its recommendations
if its availability is verified, it has at least one verified supported or limited Claude surface,
and its access scope and prerequisites are sourced. Secondary details such as pricing may remain
visibly unverified.

Setup durations are shown only when they come from a recorded test, so most pages do not show one.
Phrases such as "fastest" or "best" are avoided because they are not evidence.

## Drafts and review

A record starts as a draft. Drafts are excluded from this website, the repository's source table,
site search, the sitemap, the Markdown exports, and the public dataset. A record becomes public only
when a named human reviewer approves its exact content; the approval is bound to a hash of that
content, so any later edit invalidates it and the record needs re-approval.

More than 90 days after a review, pages show a "Review overdue" label. That label is a warning that
the facts may have moved, not an automatic re-verification: the recorded review date is never
advanced without a human re-checking the page. Recommendations that are demonstrably broken are
withdrawn rather than left in place.

## The public dataset

The same reviewed records generate this website, the Markdown guides, and
[`/connectors.json`](/connectors.json), which is schema version 1. The dataset carries published
records only, with their public evidence, and it is serialized through an explicit allowlist, so
internal references and private research notes cannot appear in it.

## Corrections

If something here is wrong, out of date, or missing an important caveat, please report it. Every
guide links to a prefilled correction issue for that source, and the evidence list shows what was
checked so a correction can point at the specific claim.

Corrections are handled as maintenance work on the dataset: the record is updated, the evidence is
re-checked, and the page needs a fresh human approval before it is published again. The owner must
name a responsible maintainer and a target acknowledgement window before launch; the intention is to
acknowledge reports within seven days.
