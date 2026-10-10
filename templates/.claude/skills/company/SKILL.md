---
name: company
description: Research a target company for the internship search (open intern roles for {{season}}, product, intern program facts, people angles) and write companies/<slug>.md. Use when the user says "look into X", "add X as a target", or names a company they are curious about.
---
<!-- career-vault {{version}} · (c) 2026 Emre Selcuk · MIT · https://github.com/EmreSelcuk1492/career-vault -->

# /company

Build or refresh a company note worth acting on.

## Steps

1. **Research** (web search and fetch): what they do, size, locations; open {{season}} intern roles (careers page plus an "internship {{year}}" search); intern program facts (deadlines, team matching, return-offer reputation); recent news that feeds a "why us" answer.
2. **Write** `companies/<slug>.md` from `meta/templates/company.md`:
   - `tier`: reach, target, or safety, justified against [[profile/narrative]]. Fit matters more than prestige.
   - **Why-us angle**: two honest sentences the user could say in an interview, drawn only from `profile/`
   - `roles_open`: each with deadline and link
3. **People scan**: note where referrals might come from (alumni of the user's school, past colleagues, people already in `people/`). Do not fabricate contacts. Add a `- [ ] find referral` task.
4. **If a live role fits**, say so and offer `/apply`. Do not auto-apply.
5. **Update** `meta/mocs/companies.md`.
6. **Reply in one line**: `Company: <name> -> companies/<slug>.md (tier <tier>, <N> open {{season_tag}} roles, best fit: <role>)`.
