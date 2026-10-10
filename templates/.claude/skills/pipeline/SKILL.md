---
name: pipeline
description: Rebuild the career vault's hubs and surface what needs attention (pipeline MOC, companies and people MOCs, README tables, open questions, stale applications, deadlines in the next 14 days). Use when the user asks "where do I stand", "what's due", "pipeline", or weekly on Mondays.
---
<!-- career-vault {{version}} · (c) 2026 Emre Selcuk · MIT · https://github.com/EmreSelcuk1492/career-vault -->

# /pipeline

Deterministic rebuild plus triage. No new content is invented; everything comes from scanning the vault.

## Steps

1. **Scan** the frontmatter of every note in `applications/`, `companies/`, `people/`, `interviews/`.
2. **Rebuild MOCs**:
   - `meta/mocs/pipeline.md`: active table (sorted by deadline or next action), closed table, funnel counts with stage conversions
   - `meta/mocs/companies.md`: grouped by tier
   - `meta/mocs/people.md`: with `last_contact`; flag contacts untouched 30+ days
   - `meta/mocs/open-questions.md`: harvest every `> [!question]` callout across the vault
3. **Rebuild README**: the Pipeline table (top 10 by urgency) and Next actions (3 to 5 items: deadlines first, then stale items, then strategy gaps).
4. **Triage flags**:
   - deadline within 14 days and status still `watching` or `drafting`: **urgent**
   - no movement in 14 days while `applied` or `oa`: nudge, or mark the path to `ghosted` (21 days)
   - funnel leak: name the worst stage conversion and the fix (resume, practice problems, story bank)
   - volume check against the goals in [[strategy/application-strategy]]
5. **Refresh backlinks** sections on touched notes.
6. **Reply** with a short triage: deadlines this week, stale items, funnel health, volume versus goal. This is the one skill where a few lines beat one line.
