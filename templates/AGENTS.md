# {{whose}} career vault: agent manual

{{#if agent == claude}}
Tool-neutral copy of `CLAUDE.md`. Claude Code reads `CLAUDE.md`; any other agent reads this file. Keep the two in step.
{{/if}}
{{#if agent != claude}}
Operating manual for this repo, written for {{agent}} or any coding agent that reads `AGENTS.md`. Drop material in, it gets routed, linked, and committed.
{{/if}}

Current campaign: **{{season}} internships**. Target roles: {{roles_csv}}.

## 1. Prime directive

- **Default to ingest.** When {{name}} drops a job posting, recruiter email, interview debrief, or company note, route it first and discuss after.
- **Never ask the date.** Use today's date from your environment.
- **Raw is immutable.** Job postings, emails, and resume PDFs land in `raw/` as-is and are never edited.
- **Update, don't duplicate.** One file per company, one per application, one per person. Extend existing notes.
- **Nothing is invented.** Every claim about {{name}} comes from `profile/`. Every claim in `profile/` carries a source tag (section 7).
- **Reply with a one-line summary after every ingest.** For example: `Ingested: Northwind SWE intern posting -> applications/northwind-swe-intern-{{season_tag}}.md (deadline 11/15, status: drafting)`.
{{#if push}}
- **Everything goes to main.** Stage, commit, and push at the end of every turn. No branches, no worktrees. Nothing is done until it is on the remote.
{{/if}}
{{#if !push}}
- **Commit when a batch of work is done.** No branches, no worktrees. Use the convention in section 8.
{{/if}}

## 2. Anatomy

```
profile/        Who {{name}} is: narrative, experience notes, skills, education, resume versions, links
strategy/       Target roles, season timeline, application strategy (tiers, volume, referral-first)
companies/      One note per target company (kebab-case.md)
applications/   One note per application: <company>-<role>-{{season_tag}}.md
interviews/     story-bank.md (STAR stories) + prep/ (one note per scheduled interview)
people/         Recruiters, referrals, alumni, network contacts
raw/            IMMUTABLE: postings/, emails/, resumes/, context/
meta/mocs/      Hubs: pipeline.md, companies.md, people.md, open-questions.md
meta/templates/ Skeletons for application, company, person, interview, story
```

## 3. Note format

Frontmatter on every note:

```yaml
---
title: <Title>
type: <application | company | person | interview | story | profile | strategy | moc>
status: <see status values below>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
sources: ["[[raw/postings/...]]"]
---
```

Type-specific fields:
- **application**: `company` (wikilink), `role`, `season: {{season_slug}}`, `deadline`, `applied`, `url`, `referral` (person wikilink or none), `resume_version`
- **company**: `tier: reach | target | safety`, `size`, `locations`, `roles_open`, `contacts` (people wikilinks)
- **person**: `relationship`, `company`, `last_contact`, `channel`
- **interview**: `application` (wikilink), `date`, `round`, `format: oa | phone | technical | behavioral | onsite`, `outcome`
- **story**: `situations` (which experiences it draws from), `themes` (leadership, conflict, failure, impact, ...)

Application `status` lifecycle: `watching -> drafting -> applied -> oa -> interviewing -> offer | rejected | ghosted | declined`.
Evergreen notes use `seed | growing | solid`.

Rules: kebab-case filenames; absolute wikilinks without `.md` (`[[companies/northwind]]`); every note ends with `## Related` and `## Backlinks`; seed wikilinks to notes that do not exist yet; mark uncertainty with `> [!question]` callouts (they get harvested into `meta/mocs/open-questions.md`).

## 4. Routing

| {{name}} drops | Goes to |
|---|---|
| A job posting (link or text) | `raw/postings/YYYY-MM-DD-<company>-<role>.md`, then create or update `applications/<company>-<role>-{{season_tag}}.md` and `companies/<company>.md` |
| A recruiter or referral email | `raw/emails/YYYY-MM-DD-<slug>.md`, then update the application's `## Timeline` and `people/<person>.md` |
| An interview invite | `interviews/prep/<company>-<round>.md`, application status to `interviewing` |
| An interview debrief ("just finished the Northwind phone screen") | Fill the prep note's `## Debrief`, log the outcome, extract new story-bank material |
| A new resume PDF | `raw/resumes/`, then log the version in `profile/resume.md` |
| "I'm interested in <company>" | `companies/<company>.md` (tier it, find open roles) |
| A new contact ("met A. Recruiter at a career fair") | `people/<slug>.md` |
| An export of what an AI assistant knows about {{name}} | `raw/context/<source>-YYYY-MM-DD.md`, then reconcile into `profile/` (section 7) |

## 5. Keeping nodes live

After every ingest:
1. Write or update the primary note.
2. Touch every related node: company, application, and people cross-links, plus a dated line under each `## Timeline`.
3. Update hubs: `meta/mocs/pipeline.md`, `meta/mocs/companies.md`, and the README **Pipeline** and **Next actions** tables.
{{#if push}}
4. Stage, commit, and push to `origin/main`.
{{/if}}
{{#if !push}}
4. Commit the batch with the convention in section 8.
{{/if}}

## 6. Commands

When {{name}} types one of these, run the procedure. The procedures are plain prose; no tooling is required beyond reading, writing, and searching the web.

### /apply <posting link, pasted text, or company + role>

1. Capture raw. Save the posting verbatim to `raw/postings/YYYY-MM-DD-<company>-<role-slug>.md` with the URL at the top.
2. Create `applications/<company>-<role-slug>-{{season_tag}}.md` from `meta/templates/application.md`. Fill `company`, `role`, `season`, `deadline` (`rolling` if none), `url`, `status: watching` (or `drafting` if {{name}} is applying now). Fill **Requirements vs. profile** against `profile/skills.md` and `profile/experience/`. Flag gaps honestly.
3. Create or update `companies/<company>.md` from the template. Set `tier` with a one-line justification. Add the role to `roles_open`.
4. Check `people/` for a referral path. If none, add `- [ ] find referral`.
5. Update `meta/mocs/pipeline.md`, `meta/mocs/companies.md`, and the README **Pipeline** table (sorted by deadline).
6. Reply in one line: `Ingested: <Company> <Role> -> applications/<file> (deadline <date>, tier <tier>, referral: <yes/no/needed>)`.

### /company <name>

1. Research: what they do, size, locations, open {{season}} intern roles, intern program facts (deadlines, team matching, return-offer reputation), recent news for a why-us answer.
2. Write `companies/<slug>.md` from `meta/templates/company.md`. Tier it against `profile/narrative.md`: fit matters more than prestige. Write a two-sentence why-us angle grounded in `profile/`. List `roles_open` with deadlines and links.
3. Note where referrals might come from (alumni, past colleagues). Never fabricate contacts. Add `- [ ] find referral`.
4. If a live role fits, say so and offer `/apply`. Do not auto-apply.
5. Update `meta/mocs/companies.md`.
6. Reply in one line: `Company: <name> -> companies/<slug>.md (tier <tier>, <N> open roles, best fit: <role>)`.

### /interview <company or application>

Prep mode (interview upcoming):
1. Create `interviews/prep/<company>-<round>.md` from `meta/templates/interview.md`. Link the application and set its status to `interviewing`.
2. List concrete likely questions for this round and format, not categories.
3. Match stories from `interviews/story-bank.md` by theme. If a likely question has no story, flag it and draft a seed.
4. For technical rounds, list specific topics and 3 to 5 practice problems.
5. Write 3 questions to ask them, grounded in the company note's why-us angle.
6. Reply in one line with the prep note path and the single biggest gap.

Debrief mode (interview just happened):
1. Fill the prep note's `## Debrief`: questions asked, self-assessment, follow-ups promised.
2. Update the application timeline and status.
3. If a story landed badly or was missing, update `interviews/story-bank.md` now.
4. Reply in one line: outcome recorded, plus the one thing to fix before the next round.

### /pipeline

1. Scan the frontmatter of every note in `applications/`, `companies/`, `people/`, `interviews/`.
2. Rebuild `meta/mocs/pipeline.md` (active table, closed table, funnel counts), `meta/mocs/companies.md` (by tier), `meta/mocs/people.md` (flag contacts untouched 30+ days), `meta/mocs/open-questions.md` (harvest every `> [!question]` callout).
3. Rebuild the README **Pipeline** table (top 10 by urgency) and **Next actions** (3 to 5 items).
4. Flag: deadline within 14 days while `watching` or `drafting`; no movement in 14 days while `applied` or `oa` (mark `ghosted` at 21 days); the worst funnel stage; volume against `strategy/application-strategy.md`.
5. Reply with a short triage. This is the one command where a few lines beat one line.

## 7. The profile: one source of truth, built from every source

`profile/` is the only place facts about {{name}} live. It is reconciled from resumes, LinkedIn, and exports of what AI assistants already know (saved untouched in `raw/context/`).

- **Tag every claim by where it came from.** `[E]` {{name}} said it directly. `[R]` it appeared on a resume or public profile. `[?]` it was inferred, or the sources disagree.
- **Corrections from {{name}} outrank anything an assistant drafted.** A goal is never recorded as a result.
- **Keep conflicts, don't guess.** When two sources disagree, log the conflict in `meta/mocs/open-questions.md` until {{name}} settles it.

## 8. Commit convention

`<action>: <object> <detail>`. Examples: `apply: northwind swe intern {{season_tag}} submitted`, `company: helix labs tiered target, 2 contacts added`, `interview: northwind phone screen debrief`, `pipeline: rebuild, 3 deadlines this week`. Fallback: `auto: N file(s) updated`.

## 9. Style

Plain sentences. No em-dashes in resumes, outreach, or any copy that leaves the vault. No exclamation points in outreach. Numbers over adjectives.
