# career-vault

Zero-dependency Node CLI (`npx career-vault`) that scaffolds a Markdown job-search vault for an AI agent. MIT, Node >= 18.
README.md documents flags, generated output and repo layout; this file only adds what an agent editing the kit needs.

Pushes go straight to `main`; there is no PR review. CI (`.github/workflows/ci.yml`) runs `npm test` after the push.
Not deployed anywhere itself; the site vendors its renderer (see below).

## Commands

```
npm run build       # templates/ + templates.manifest.json -> dist/kit.json
npm test            # build, then node --test test/render.test.mjs test/kit.test.mjs
npm run sync-site   # copy dist/kit.json + src/render.js into ../emrecanselcuk-com/src/kit/
node bin/career-vault.js --dir /tmp/x -y    # try the CLI locally
```

## Layout

- `templates/`: the vault's source files with `{{placeholders}}` and `{{#if}}` blocks. `templates/CLAUDE.md` and
  `templates/AGENTS.md` are the generated vault's manuals, not instructions for this repo
- `templates.manifest.json`: per-file `when` / `mode` / `as` (e.g. `_gitignore` publishes as `.gitignore`) + option lists
- `src/render.js`: pure ESM renderer, no Node APIs (runs in the browser wizard too)
- `scripts/build-kit.mjs`, `scripts/sync-site.mjs`; `bin/career-vault.js`: the CLI; `test/`: node --test

## Conventions and gotchas

- Zero dependencies is a product promise: no `dependencies` or `devDependencies`. Keep `src/render.js` free of Node APIs.
- `dist/kit.json` is committed (so `npx github:` works with no build). After changing `templates/` or the manifest, run
  `npm test` (it rebuilds) and commit `dist/kit.json` with the change.
- The site (emrecanselcuk-com, branch `master`) vendors `src/render.js` and `dist/kit.json` at `src/kit/` so its zip
  wizard and the CLI produce identical output. After a kit change, `npm run sync-site` and commit/push the site too.
- Adding a template dotfile that npm would rewrite: name it without the dot and map it with `as` in the manifest.
- No secrets, no env vars, nothing sent over the network.
- Commit messages: `kit: <plain prose>` for kit changes (version bumps named in the message, e.g. `kit: v0.2.0 ...`),
  `ci: ...` for workflow changes.
