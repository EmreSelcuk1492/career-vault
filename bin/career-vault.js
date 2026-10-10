#!/usr/bin/env node
// career-vault CLI. Node 18+, zero runtime dependencies.
// Asks a few questions (or takes flags), renders the kit, writes the vault,
// git inits it, and prints the one-liner that reproduces the answers.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, chmodSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { renderKit, toCommand, parseArgs, normalizeAnswers, todayISO } from '../src/render.js';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));
const kit = JSON.parse(readFileSync(join(here, '..', 'dist', 'kit.json'), 'utf8'));

// A closed pipe on the reading side (for example `| head`) is not an error worth a stack trace.
process.stdout.on('error', (e) => {
  if (e?.code === 'EPIPE') process.exit(0);
  throw e;
});

const tty = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const bold = (s) => (tty ? `\x1b[1m${s}\x1b[22m` : s);
const dim = (s) => (tty ? `\x1b[2m${s}\x1b[22m` : s);
const out = (s = '') => process.stdout.write(s + '\n');
const fail = (msg) => {
  process.stderr.write(`career-vault: ${msg}\n`);
  process.exit(1);
};

const HELP = `
${bold('career-vault')} ${pkg.version}
Scaffold a Markdown job-search vault that an AI coding agent runs for you.

${bold('Usage')}
  npx career-vault [flags]

${bold('Flags')}
  --name <text>          your name (default: the user)
  --season <id>          ${kit.options.seasons.map((s) => s.id).join(' | ')}
  --roles <ids>          comma-separated: ${kit.options.roles.map((r) => r.id).join(',')}
  --agent <id>           ${kit.options.agents.map((a) => a.id).join(' | ')}
  --connectors <ids>     comma-separated: ${kit.options.connectors.map((c) => c.id).join(',')} (default: none)
  --push | --no-push     auto-commit and push hooks (default: --push)
  --dir <folder>         where to write (default: career)
  --force                write into a non-empty folder
  -y, --yes              skip prompts, use flags and defaults
  -h, --help             this text
  -v, --version          print the version

${bold('Example')}
  npx career-vault --name "Alex" --season summer-2027 --roles pm,tpm --agent claude --connectors gmail --push
`.trimStart();

// ---------------------------------------------------------------------------
// Prompts (numbered choices, readline only)

function makeAsker() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let pending = false;
  rl.on('close', () => {
    if (pending) {
      process.stdout.write('\n');
      fail('cancelled, nothing written');
    }
  });
  const ask = (q) =>
    new Promise((res) => {
      pending = true;
      rl.question(q, (a) => {
        pending = false;
        res(a.trim());
      });
    });
  return { ask, close: () => rl.close() };
}

async function askText(ask, label, def) {
  const a = await ask(`${bold(label)} ${dim(`(${def})`)} `);
  return a || def;
}

async function askOne(ask, label, list, defId) {
  out(bold(label));
  list.forEach((x, i) => out(`  ${i + 1}. ${x.label}${x.id === defId ? dim('  (default)') : ''}`));
  for (;;) {
    const a = await ask(`${dim('number')} `);
    if (!a) return defId;
    const n = Number(a);
    if (Number.isInteger(n) && n >= 1 && n <= list.length) return list[n - 1].id;
    const byId = list.find((x) => x.id === a);
    if (byId) return byId.id;
    out(dim(`  enter a number from 1 to ${list.length}`));
  }
}

async function askMany(ask, label, list, { min = 0, defIds = [] } = {}) {
  out(bold(label));
  list.forEach((x, i) => out(`  ${i + 1}. ${x.label}${defIds.includes(x.id) ? dim('  (default)') : ''}`));
  const hint = min === 0 ? 'numbers separated by commas, or enter for none' : 'numbers separated by commas';
  for (;;) {
    const a = await ask(`${dim(hint)} `);
    if (!a) {
      if (defIds.length >= min) return defIds;
      out(dim('  pick at least one'));
      continue;
    }
    const picks = a.split(/[,\s]+/).filter(Boolean);
    const ids = [];
    let ok = true;
    for (const p of picks) {
      const n = Number(p);
      const item = Number.isInteger(n) && n >= 1 && n <= list.length ? list[n - 1] : list.find((x) => x.id === p);
      if (!item) {
        ok = false;
        break;
      }
      if (!ids.includes(item.id)) ids.push(item.id);
    }
    if (ok && ids.length >= min) return ids;
    out(dim(`  enter numbers from 1 to ${list.length}${min ? ', at least one' : ''}`));
  }
}

async function askYesNo(ask, label, def) {
  const a = await ask(`${bold(label)} ${dim(def ? '(Y/n)' : '(y/N)')} `);
  if (!a) return def;
  return /^y/i.test(a);
}

// ---------------------------------------------------------------------------
// Validation of flag values against the kit's option lists

function validate(partial) {
  const ids = (list) => list.map((x) => x.id);
  const bad = [];
  if (partial.season !== undefined && !ids(kit.options.seasons).includes(partial.season)) bad.push(`--season ${partial.season}`);
  if (partial.agent !== undefined && !ids(kit.options.agents).includes(partial.agent)) bad.push(`--agent ${partial.agent}`);
  for (const r of partial.roles ?? []) if (!ids(kit.options.roles).includes(r)) bad.push(`--roles ${r}`);
  for (const c of partial.connectors ?? []) if (!ids(kit.options.connectors).includes(c)) bad.push(`--connectors ${c}`);
  if (bad.length) fail(`unknown value: ${bad.join(', ')}. Run with --help for the lists.`);
  if (partial.roles !== undefined && partial.roles.length === 0) fail('--roles needs at least one role');
}

// ---------------------------------------------------------------------------

function isEmptyDir(dir) {
  if (!existsSync(dir)) return true;
  return readdirSync(dir).filter((n) => n !== '.DS_Store' && n !== '.git').length === 0;
}

function git(args, cwd) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function gitAvailable() {
  const r = spawnSync('git', ['--version'], { encoding: 'utf8', stdio: 'ignore' });
  return r.status === 0;
}

function nextStepsFor(agent, dir, push) {
  const steps = [`cd ${dir}`];
  if (agent === 'claude') steps.push('claude', 'fill profile/ (start with profile/README.md), then drop your first posting and type /apply');
  else if (agent === 'cursor') steps.push('open the folder in Cursor', 'fill profile/ (start with profile/README.md), then drop your first posting and type /apply');
  else if (agent === 'codex') steps.push('codex', 'fill profile/ (start with profile/README.md), then drop your first posting and type /apply');
  else steps.push('open the folder as an Obsidian vault', 'fill profile/ (start with profile/README.md), then copy meta/templates/application.md for your first posting');
  if (push) steps.push('create an empty private repo on GitHub, then: git remote add origin <url> && git push -u origin main');
  return steps;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    out(HELP);
    return;
  }
  if (flags.version) {
    out(pkg.version);
    return;
  }
  if (flags.unknown?.length) fail(`unknown flag ${flags.unknown.join(', ')}. Run with --help.`);
  validate(flags);

  let partial = { ...flags };
  let dir = flags.dir;

  if (!flags.yes) {
    if (!process.stdin.isTTY) fail('no terminal for prompts. Pass -y with flags, or run in a terminal.');
    out(bold(`career-vault ${pkg.version}`));
    out(dim('A few questions. Enter accepts the default.'));
    out();
    const { ask, close } = makeAsker();
    try {
      if (partial.name === undefined) partial.name = await askText(ask, 'Your name', '');
      if (partial.season === undefined) partial.season = await askOne(ask, 'Which season are you recruiting for?', kit.options.seasons, kit.options.seasons[0].id);
      if (partial.roles === undefined) partial.roles = await askMany(ask, 'Which role families?', kit.options.roles, { min: 1, defIds: [kit.options.roles[0].id] });
      if (partial.agent === undefined) partial.agent = await askOne(ask, 'Which coding agent will run the vault?', kit.options.agents, kit.options.agents[0].id);
      if (partial.connectors === undefined) partial.connectors = await askMany(ask, 'Connectors you plan to use', kit.options.connectors, { min: 0 });
      if (partial.push === undefined) {
        partial.push = partial.agent === 'claude'
          ? await askYesNo(ask, 'Auto-commit and push to main at the end of every turn?', true)
          : await askYesNo(ask, 'Plan to push the vault to a git remote?', true);
      }
      if (dir === undefined) dir = await askText(ask, 'Folder to create', 'career');
    } finally {
      close();
    }
    out();
  }

  const answers = normalizeAnswers(kit, { ...partial, date: todayISO() });
  const target = resolve(process.cwd(), dir || 'career');

  if (!isEmptyDir(target) && !flags.force) {
    fail(`${target} is not empty. Pick another --dir or pass --force.`);
  }

  const files = renderKit(kit, answers);
  mkdirSync(target, { recursive: true });
  for (const f of files) {
    const p = join(target, f.path);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, f.content);
    if (f.mode) chmodSync(p, parseInt(f.mode, 8));
  }

  let gitNote = 'git not found, skipped git init';
  if (gitAvailable()) {
    const inside = git(['rev-parse', '--git-dir'], target);
    if (inside.status === 0) {
      gitNote = 'already inside a git repository, skipped git init';
    } else {
      let init = git(['init', '-q', '-b', 'main'], target);
      if (init.status !== 0) {
        init = git(['init', '-q'], target);
        if (init.status === 0) git(['symbolic-ref', 'HEAD', 'refs/heads/main'], target);
      }
      if (init.status === 0) {
        git(['add', '-A'], target);
        const commit = git(['commit', '-q', '-m', 'vault: scaffolded with career-vault'], target);
        gitNote = commit.status === 0
          ? 'git init on main, initial commit made'
          : 'git init on main; initial commit failed (set git user.name and user.email, then commit)';
      } else {
        gitNote = 'git init failed, skipped';
      }
    }
  }

  const agentLabel = kit.options.agents.find((a) => a.id === answers.agent)?.label ?? answers.agent;
  out(bold(`Vault ready: ${target}`));
  out(`${files.length} files for ${answers.name}, ${kit.options.seasons.find((s) => s.id === answers.season)?.label ?? answers.season}, ${agentLabel}`);
  out(dim(gitNote));
  out();
  out(bold('Next'));
  for (const s of nextStepsFor(answers.agent, dir || 'career', answers.push)) out(`  ${s}`);
  out();
  out(dim('Reproduce these answers with:'));
  out(`  ${toCommand(answers)}`);
}

main().catch((e) => fail(e?.message ?? String(e)));
