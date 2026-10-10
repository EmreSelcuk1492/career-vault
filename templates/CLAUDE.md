# {{whose}} career vault

Operating manual for this repo. Drop material in, it gets routed, linked, and committed. Current campaign: **{{season}} internships**. Target roles: {{roles_csv}}.

## 1. Prime directive

- **Default to ingest.** When {{name}} drops a job posting, recruiter email, interview debrief, or company note, route it first and discuss after.
- **Never ask the date.** It is in context.
- **Raw is immutable.** Job postings, emails, and resume PDFs land in `raw/` as-is and are never edited.
- **Update, don't duplicate.** One file per company, one per application, one per person. Extend existing notes.
- **Nothing is invented.** Every claim about {{name}} comes from `profile/`. Every claim in `profile/` carries a source tag (see section 7).
- **Reply with a one-line summary after every ingest.** For example: `Ingested: Northwind SWE intern posting -> applications/northwind-swe-intern-{{season_tag}}.md (deadline 11/15, status: drafting)`.
{{#if push}}
- **Everything pushes to main.** Hooks auto-stage, auto-commit, and push at Stop. No branches, no worktrees. Nothing is done until it is on the remote.
{{/if}}
{{#if !push}}
- **Commit when a batch of work is done.** Hooks auto-stage edits. Commit with the convention in section 8. No branches, no worktrees.
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
4. Hooks push everything to `origin/main` at Stop. Nothing is done until it is on the remote.
{{/if}}
{{#if !push}}
4. Commit the batch with the convention in section 8.
{{/if}}

## 6. Skills

- `/apply <posting link, pasted text, or company + role>`: ingest a posting into an application note, a company note, and the pipeline hubs
- `/company <name>`: research a company (open intern roles, product, culture, people, why-us angles) into `companies/<slug>.md`
- `/interview <company or application>`: build an interview prep note (likely questions, matched STAR stories, technical topics, questions to ask), or ingest a debrief
- `/pipeline`: rebuild MOCs and README tables, flag stale applications (no movement in 14 days), surface deadlines in the next 14 days

## 7. The profile: one source of truth, built from every source

`profile/` is the only place facts about {{name}} live. It is reconciled from resumes, LinkedIn, and exports of what AI assistants already know (saved untouched in `raw/context/`).

- **Tag every claim by where it came from.** `[E]` {{name}} said it directly. `[R]` it appeared on a resume or public profile. `[?]` it was inferred, or the sources disagree.
- **Corrections from {{name}} outrank anything an assistant drafted.** A goal is never recorded as a result.
- **Keep conflicts, don't guess.** When two sources disagree (a title on one resume version versus another), log the conflict in `meta/mocs/open-questions.md` until {{name}} settles it.

Everything downstream (resume tailoring, why-us angles, STAR stories) cites `profile/`, so nothing in an application is invented.

## 8. Commit convention

`<action>: <object> <detail>`. Examples: `apply: northwind swe intern {{season_tag}} submitted`, `company: helix labs tiered target, 2 contacts added`, `interview: northwind phone screen debrief`, `pipeline: rebuild, 3 deadlines this week`. Hook fallback: `auto: N file(s) updated`.

## 9. Style

Plain sentences. No em-dashes in resumes, outreach, or any copy that leaves the vault. No exclamation points in outreach. Numbers over adjectives.
