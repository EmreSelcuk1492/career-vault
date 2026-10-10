---
title: Profile: how to build it
type: profile
status: seed
created: {{date}}
updated: {{date}}
tags: [profile, method]
sources: []
---

# One profile, built from every source

Before the first posting, the vault needs to know who you are. That context is usually scattered: several resume versions, a LinkedIn profile, and months of conversations with ChatGPT, Claude, or other assistants. This folder collects it into one honest, cited profile. Everything downstream (resume tailoring, why-us answers, STAR stories) cites `profile/`, so nothing in an application is invented.

## Step 1: export what your assistants know

Ask each assistant you have used for a while to write down everything it knows about you: roles, dates, projects, numbers, skills, education, preferences. A prompt that works:

> Write a complete Markdown dossier of everything you know about me from our conversations: every job and internship with dates and what I did there, projects with outcomes and numbers, education, skills, and anything I have said about what I want next. Mark anything you are unsure about with "(unsure)". Do not flatter, do not fill gaps.

Save each export untouched in `raw/context/<source>-YYYY-MM-DD.md` (for example `raw/context/chatgpt-{{date}}.md`). Add your resume PDFs to `raw/resumes/` and a copy of your LinkedIn text to `raw/context/linkedin-{{date}}.md`. Raw is immutable: never edit these files.

## Step 2: reconcile into profile/

{{#if agent != none}}
Ask your agent to reconcile `raw/context/` and `raw/resumes/` into the notes in this folder. It must follow these rules; they are also in the manual.
{{/if}}
{{#if agent == none}}
Work through the sources and fill the notes in this folder. Follow these rules.
{{/if}}

- **Tag every claim by where it came from.** Append a tag to each bullet: `[E]` you said it directly, `[R]` it appeared on a resume or your public profile, `[?]` it was inferred or the sources disagree.
- **Your corrections outrank anything an assistant drafted.** When you fix a line, the fix wins, and the tag becomes `[E]`.
- **A goal is never recorded as a result.** "Planned to ship X" stays a plan unless a source says it shipped.
- **Keep conflicts, don't guess.** When two sources disagree (one resume says "Project Manager Intern", another says "Program Manager Intern"), write both, tag `[?]`, and add a `> [!question]` callout. `/pipeline` harvests these into [[meta/mocs/open-questions]] until you settle them.

## Step 3: fill the notes

| Note | What goes in it |
|---|---|
| [[profile/narrative]] | The arc in one paragraph, three differentiators, one-liner variants, watch-outs |
| `profile/experience/<role>.md` | One note per job, internship, or serious project (see [[profile/experience/README]]) |
| [[profile/skills]] | Skills by group, plus an honest read of what is strong and what is thin |
| [[profile/education]] | School, degree, expected graduation, relevant coursework, eligibility facts |
| [[profile/resume]] | A row per resume version: file, target roles, what changed |
| [[profile/links]] | Public links and the contact details you put on applications |

When every claim in these notes has a tag and the open questions are logged, the profile is `solid` and the search can start.

## Related
- [[meta/mocs/open-questions]]
- [[interviews/story-bank]] (stories must ladder up to the narrative)

## Backlinks
- *(rebuilt by /pipeline)*
