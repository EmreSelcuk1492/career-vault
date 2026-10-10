---
name: interview
description: Build an interview prep note for a scheduled round (likely questions, matched STAR stories from the story bank, technical topics, questions to ask), or ingest a post-interview debrief. Use when the user says "I have an interview with X", "prep me for X", or "just finished the X interview".
---
<!-- career-vault {{version}} · (c) 2026 Emre Selcuk · MIT · https://github.com/EmreSelcuk1492/career-vault -->

# /interview

Two modes. Detect from phrasing.

## Mode 1: prep (interview upcoming)

1. Create `interviews/prep/<company>-<round>.md` from `meta/templates/interview.md`. Link the application and set its status to `interviewing`.
2. **Likely questions**: research the company's interview style for this round and format (search "<company> intern interview {{year}}"). List concrete questions, not categories.
3. **Match stories**: pull from [[interviews/story-bank]] by theme. If a likely question has no matching story, flag it and draft a seed into the story bank.
4. **Technical topics**: for technical rounds, list specific topics plus 3 to 5 practice problems. Cross-reference current coursework in [[profile/education]] so prep compounds.
5. **Questions to ask them**: 3 questions grounded in the company note's why-us angle.
6. **Reply in one line** with the prep note path and the single biggest gap to fix before the interview.

## Mode 2: debrief (interview just happened)

1. Fill the prep note's `## Debrief`: questions actually asked, self-assessed performance, follow-ups promised.
2. Update the application timeline and status. Log the actual questions as likely-questions data for future preps.
3. If a story landed badly or was missing, update [[interviews/story-bank]] immediately. That is the highest-value ten minutes after any interview.
4. **Reply in one line**: outcome recorded, plus the one thing to fix before the next round.
