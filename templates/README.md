# {{whose}} career vault · {{season}}

A Markdown vault for the internship search. Drop postings, emails, and debriefs in. They get routed, linked, and committed.
{{#if agent == claude}}
The rules live in [[CLAUDE.md]].
{{/if}}
{{#if agent == cursor}}
The rules live in [[AGENTS.md]].
{{/if}}
{{#if agent == codex}}
The rules live in [[AGENTS.md]].
{{/if}}

- Season: **{{season}}**
- Roles: {{roles_csv}}
- Agent: {{agent}}
- Scaffolded {{date}} with [career-vault](https://github.com/EmreSelcuk1492/career-vault)

Connectors:

{{connectors_list}}

## Start here

1. Fill `profile/`. Read [[profile/README]] first: it explains how to build one honest profile from your resumes, LinkedIn, and what your AI assistants already know about you.
2. Set your tiers and volume goals in [[strategy/application-strategy]] and skim [[strategy/season-timeline]].
{{#if agent != none}}
3. Drop your first posting and type `/apply`.
{{/if}}
{{#if agent == none}}
3. Save your first posting to `raw/postings/` and create its application note from `meta/templates/application.md`.
{{/if}}

## Hubs

- [[profile/narrative]]: positioning and differentiators
- [[strategy/season-timeline]]: the recruiting calendar for {{season}}
- [[strategy/target-roles]] · [[strategy/application-strategy]]
- [[meta/mocs/pipeline]]: every application, by status
- [[meta/mocs/companies]] · [[meta/mocs/people]] · [[meta/mocs/open-questions]]
- [[interviews/story-bank]]: STAR stories ready to deploy
- [[profile/resume]]: resume versions

## Pipeline

<!-- Maintained by /apply and /pipeline. Sorted by next deadline or action. -->
| Deadline | Application | Status | Next action |
|---|---|---|---|
| | | | |

## Next actions

<!-- The 3 to 5 things that move the search forward this week. -->
- [ ] Fill [[profile/README]] step 1: export what your assistants know about you into `raw/context/`
- [ ] Write [[profile/narrative]]
- [ ] Pick 10 companies and tier them in [[meta/mocs/companies]]

## How to add material

{{#if agent != none}}
| You have | Do |
|---|---|
| A job posting | Paste it or the link, then `/apply` |
| A company you are curious about | `/company <name>` |
| An interview scheduled | `/interview <company>` |
| A recruiter email, rejection, or offer | Paste it. It gets routed to `raw/emails/` and the application timeline |
| A new resume version | Drop the PDF in `raw/resumes/` and say which roles it is for |
| A new contact | Say who, where, and how you met. It becomes `people/<slug>.md` |
| "Where do I stand?" | `/pipeline` |
{{/if}}
{{#if agent == none}}
| You have | Do |
|---|---|
| A job posting | Save it to `raw/postings/YYYY-MM-DD-<company>-<role>.md`, copy `meta/templates/application.md` to `applications/`, add a row to the Pipeline table |
| A company you are curious about | Copy `meta/templates/company.md` to `companies/<slug>.md`, tier it, list open roles |
| An interview scheduled | Copy `meta/templates/interview.md` to `interviews/prep/<company>-<round>.md`, set the application status to `interviewing` |
| A recruiter email, rejection, or offer | Save it to `raw/emails/`, add a dated line to the application's `## Timeline` |
| A new resume version | Drop the PDF in `raw/resumes/` and add a row to [[profile/resume]] |
| A new contact | Copy `meta/templates/person.md` to `people/<slug>.md` |
| "Where do I stand?" | Rebuild [[meta/mocs/pipeline]] from the frontmatter of `applications/`, every Monday |
{{/if}}
