# career-vault

Scaffold a Markdown internship and job-search vault that an AI coding agent runs for you. One command asks a few questions and writes an empty, personalized vault: the operating manual for the agent, four slash commands, note templates, hub pages, and git hooks that commit and push as you work. Open it in Claude Code, Cursor, Codex, or just Obsidian.

## The idea

Job searches usually live in a spreadsheet, an inbox, and someone's memory, so nothing links to anything and follow-ups go missing. This treats the search like a codebase instead. **Ingest first**: when a posting, email, or interview debrief lands, it gets routed before it gets discussed. **Raw is immutable**: postings, emails, and resume PDFs are saved as-is and never edited, and every derived note cites its source. **One note per entity**: one file per company, per application, per person, and status lives in frontmatter so the funnel is computed, not maintained. **Everything ships to main**: hooks stage, commit, and push, and nothing is done until it is on the remote. The agent does the busywork inside those rules. You do the parts that need a person.

## Quick start

```sh
npx career-vault
```

Until the package is on npm:

```sh
npx github:EmreSelcuk1492/career-vault
```

Node 18 or newer. No dependencies. Nothing is sent anywhere; the kit works offline.

## Flags

Every question can be answered with a flag. With `-y`, nothing is asked and missing values take defaults.

```
--name <text>          your name (default: the user)
--season <id>          summer-2027 | spring-2027 | fall-2027 | summer-2028
--roles <ids>          comma-separated: swe,pm,tpm,data,design,solutions,consulting,research
--agent <id>           claude | cursor | codex | none
--connectors <ids>     comma-separated: gmail,calendar,granola,linkedin,chrome (default: none)
--push | --no-push     auto-commit and push hooks (default: --push)
--dir <folder>         where to write (default: career)
--force                write into a non-empty folder
-y, --yes              skip prompts
-h, --help             help
-v, --version          version
```

Example:

```sh
npx career-vault --name "Alex" --season summer-2027 --roles pm,tpm --agent claude --connectors gmail --push
```

The CLI prints the equivalent one-liner at the end so you can reproduce or share your setup.

## What gets generated

```
career/
├── CLAUDE.md            Operating manual (Claude Code). AGENTS.md for other agents.
├── README.md            Hubs, Pipeline table, Next actions, how to add material
├── profile/             Who you are: README (the method), narrative, experience/, skills,
│                        education, resume versions, links
├── strategy/            Target roles, season timeline, application strategy, outreach playbook
├── companies/           One note per target company
├── applications/        One note per application: <company>-<role>-<season tag>.md
├── interviews/
│   ├── story-bank.md    STAR stories, tagged by theme
│   └── prep/            One note per scheduled round, with a Debrief section
├── people/              Recruiters, referrals, alumni, contacts
├── raw/                 IMMUTABLE: postings/, emails/, resumes/, context/
├── meta/
│   ├── mocs/            Hubs: pipeline, companies, people, open-questions
│   ├── templates/       Skeletons: application, company, person, interview, story
│   └── connectors.md    Only when you picked connectors
└── .claude/             Only for Claude Code
    ├── settings.json    Hook wiring
    ├── hooks/           auto-stage, auto-commit, block-worktree
    └── skills/          apply, company, interview, pipeline
```

With `--agent cursor` you also get `.cursor/rules/career-vault.mdc`, which points Cursor at `AGENTS.md`. With `--agent none` you get the vault without any agent files; open it in Obsidian and follow the manual tables in `README.md`.

### The profile method

`profile/README.md` explains how to build one honest profile before the first application: export what your AI assistants already know about you into `raw/context/`, add your resumes and LinkedIn, then reconcile everything into `profile/` with a source tag on every claim (`[E]` you said it, `[R]` it was on a resume, `[?]` inferred or disputed). Your corrections outrank drafts. Conflicts are logged in `meta/mocs/open-questions.md` instead of guessed. Everything downstream cites `profile/`, so nothing in an application is invented.

## The four commands

| Command | What it does |
|---|---|
| `/apply <link or text>` | Saves the posting to `raw/`, creates the application note, matches requirements against your profile and flags gaps, creates or updates the company note, checks for a referral path, updates the hubs. Replies in one line. |
| `/company <name>` | Researches open intern roles, product, and program facts. Tiers the company (reach, target, safety), drafts an honest why-us angle, notes where referrals might come from. Offers `/apply`, never auto-applies. |
| `/interview <company>` | Prep mode builds a note with concrete likely questions, matched STAR stories, technical topics, and questions to ask. Debrief mode logs what was asked and updates the story bank while it is fresh. |
| `/pipeline` | Rebuilds every hub from frontmatter, no invented content. Flags deadlines in the next 14 days, stale applications, cold contacts, and the leakiest funnel stage. |

For Claude Code they are skills in `.claude/skills/`. For other agents they are procedures in `AGENTS.md`, section 6.

## The hooks (Claude Code)

- **PostToolUse, auto-stage.** After every file write, `git add -A`. Silent, always exits 0, skips mid-merge.
- **Stop, auto-commit.** Only with `--push`. When a turn ends: commit anything outstanding, push, fetch, then verify the tree is clean, the branch is `main`, and nothing is ahead of the remote. If a check fails, the hook exits 2 and the agent has to fix it before finishing. A retry guard turns the second failure into a warning instead of a loop. With no remote yet, it commits locally and tells you how to add one.
- **PreToolUse, block-worktree.** Blocks worktree creation so all work stays on one branch.

The hooks need bash and git only.

## Repository layout

```
templates/               Vault source files with {{placeholders}} and {{#if}} blocks
templates.manifest.json  Per-file when / mode / published path, plus the option lists
src/render.js            Pure ESM renderer (no Node APIs), shared with the web wizard
scripts/build-kit.mjs    templates/ + manifest -> dist/kit.json
dist/kit.json            Committed, so npx github: works with no build step
bin/career-vault.js      The CLI
test/                    node --test
```

```sh
npm run build   # rebuild dist/kit.json
npm test        # build + unit tests
```

## License

MIT. Made by Emre Selcuk, https://www.emrecanselcuk.com
