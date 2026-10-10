---
name: apply
description: Ingest a job posting (link, pasted text, or "company + role") into the career vault. Save raw, create the application note, create or update the company note, update the pipeline hubs. Use when the user drops a posting, says "apply to X", or "add X to the pipeline".
---
<!-- career-vault {{version}} · (c) 2026 Emre Selcuk · MIT · https://github.com/EmreSelcuk1492/career-vault -->

# /apply

Ingest a job posting end to end. Never discuss first. Route, then summarize in one line.

## Steps

1. **Capture raw.** If given a URL, fetch the posting. Save it verbatim to `raw/postings/YYYY-MM-DD-<company>-<role-slug>.md` with the URL at the top. Raw is immutable.
2. **Application note.** Create `applications/<company>-<role-slug>-{{season_tag}}.md` from `meta/templates/application.md`:
   - Fill the frontmatter: `company`, `role`, `season: {{season_slug}}`, `deadline` (from the posting; `rolling` if none), `url`, `status: watching` (or `drafting` if the user said they are applying now)
   - Fill **Requirements vs. profile** by matching the posting's requirements against [[profile/skills]] and the notes in `profile/experience/`. Flag gaps honestly. Never claim something `profile/` does not support.
   - Assign the track from [[strategy/target-roles]]
3. **Company note.** Create or update `companies/<company>.md` from the template. Set `tier` (reach, target, safety) with a one-line justification. Add this role to `roles_open`.
4. **Referral check.** Note in the application whether a referral path exists (search `people/`). If none, add a `- [ ] find referral` line.
5. **Update hubs**: a row in `meta/mocs/pipeline.md`, the entry in `meta/mocs/companies.md`, and the README **Pipeline** table (sorted by deadline).
6. **Commit** (hooks handle staging): `apply: <company> <role> {{season_tag}} <status>`.
7. **Reply in one line**: `Ingested: <Company> <Role> -> applications/<file> (deadline <date>, tier <tier>, referral: <yes/no/needed>)`.

## Eligibility guard

If the posting requires a graduation window, enrollment status, or work authorization, check it against [[profile/education]] and [[profile/links]]. If a fact needed for eligibility is missing or marked `[?]`, flag it loudly in the reply and add a `> [!question]` callout to the application note.
