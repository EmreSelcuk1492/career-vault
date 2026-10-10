---
title: Connectors
type: strategy
status: seed
created: {{date}}
updated: {{date}}
tags: [connectors, setup]
sources: []
---

# Connectors

Connectors let the agent read the tools you already use, so fewer things have to be pasted in by hand. The vault rules still apply: anything a connector brings in lands in `raw/` first, and the derived notes cite it.

Selected when this vault was scaffolded:

{{connectors_list}}

{{#if agent == claude}}
## How connecting works in Claude Code

Claude Code talks to outside tools through MCP servers. Two routes:

- **claude.ai connectors.** If you sign in to Claude Code with a claude.ai account, the connectors you enabled at claude.ai (Settings, then Connectors) are available in the terminal as tools. This is the simplest route for Gmail, Google Calendar, and Granola.
- **Local MCP servers.** `claude mcp add <name> <command>` registers any MCP server for this project. Run `claude mcp list` to see what is configured. Use this for servers that are not offered as claude.ai connectors.

Check what is connected at any time with `/mcp` inside a Claude Code session.
{{/if}}
{{#if agent != claude}}
## How connecting works

Your agent connects to outside tools through MCP servers or its own integrations. Check its documentation for how to add one. The sections below describe what each connector is for in this workflow, which is the same whatever the agent.
{{/if}}

{{#if connector:gmail}}
## Gmail

**Used for**: finding recruiter replies, ATS confirmations, OA invites, and rejections, then filing them.
**Lands in**: `raw/emails/YYYY-MM-DD-<slug>.md`, then a dated line under the application's `## Timeline` and a status change.
**Routine**: on Mondays, ask the agent to search for mail from the companies in `meta/mocs/pipeline.md` since the last check. If applications use a different inbox than the connected one, set up forwarding or connect that account; otherwise the search returns nothing and the pipeline goes stale.
{{/if}}
{{#if connector:calendar}}
## Google Calendar

**Used for**: putting interviews, OA windows, deadlines, and career fairs on the calendar, and reading them back for prep.
**Lands in**: `interviews/prep/<company>-<round>.md` gets the logistics; `applications/` deadlines come from the posting, the calendar mirrors them.
**Routine**: when an interview is scheduled, create the event and the prep note in the same turn. Before a round, the agent reads the event for the exact time and format.
{{/if}}
{{#if connector:granola}}
## Granola

**Used for**: pulling notes and transcripts from calls, coffee chats, and info sessions.
**Lands in**: `raw/context/<date>-<person>.md`, then `people/<slug>.md` (asks, favors, follow-ups) and, when relevant, a new story seed in `interviews/story-bank.md`.
**Routine**: after any recorded call, ask the agent to file the Granola note. Same-day thank-you message per [[strategy/outreach-playbook]].
{{/if}}
{{#if connector:linkedin}}
## LinkedIn

There is no official LinkedIn connector. Two practical routes:

- **Through a browser connector** (Chrome): log in to LinkedIn in your browser and let the agent read logged-in pages: alumni search for referral paths, a contact's recent posts before outreach, your own profile for consistency checks against `profile/`.
- **By export**: download your LinkedIn data (Settings, Data privacy, Get a copy of your data) and save the profile text to `raw/context/linkedin-<date>.md`.

**Lands in**: `profile/links.md`, `profile/experience/` (as `[R]` claims), `people/`.
**Rule**: the agent never sends connection requests or messages on your behalf. It drafts; you send.
{{/if}}
{{#if connector:chrome}}
## Chrome

**Used for**: reading pages that need a login (job portals, ATS dashboards, LinkedIn), checking application status, verifying that a submission went through.
**Lands in**: a dated line under the application's `## Timeline` for each status check; `raw/postings/` for postings fetched from a logged-in page.
**Rule**: the agent reads and drafts; you click submit. Keep it that way so every application has a human decision behind it.
{{/if}}

## Related
- [[README]]
- [[strategy/outreach-playbook]]

## Backlinks
- *(rebuilt by /pipeline)*
