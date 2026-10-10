// Checks the built dist/kit.json: shape, every combination renders clean,
// conditional files behave, and no private or forbidden strings slipped in.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderKit } from '../src/render.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kit = JSON.parse(readFileSync(join(root, 'dist', 'kit.json'), 'utf8'));

// \u2014 and \u2013 are the em-dash and en-dash, written as escapes so the dashes never appear in this repo.
const FORBIDDEN = [/Emre/, /\u2014/, /\u2013/, /4100/, /Seattle/, /HardLaunch/, /Jenni/i, /AMPACC/, /Entegris/, /selcuk/i];
const ALLOWED = [/https:\/\/github\.com\/EmreSelcuk1492\/career-vault/, /www\.emrecanselcuk\.com/];

const base = { name: 'Alex', date: '2026-10-10' };

function allCombos() {
  const { seasons, roles, agents, connectors } = kit.options;
  const combos = [];
  for (const s of seasons)
    for (const r of [[roles[0].id], roles.map((x) => x.id), ['pm', 'tpm']])
      for (const ag of agents)
        for (const c of [[], ['gmail'], connectors.map((x) => x.id)])
          for (const push of [true, false]) combos.push({ ...base, season: s.id, roles: r, agent: ag.id, connectors: c, push });
  return combos;
}

test('kit.json has the contract shape', () => {
  assert.equal(kit.name, 'career-vault');
  assert.match(kit.version, /^\d+\.\d+\.\d+$/);
  assert.equal(kit.repo, 'https://github.com/EmreSelcuk1492/career-vault');
  for (const k of ['seasons', 'roles', 'agents', 'connectors']) assert.ok(Array.isArray(kit.options[k]) && kit.options[k].length > 0, k);
  assert.ok(kit.files.length > 30);
  for (const f of kit.files) {
    assert.equal(typeof f.path, 'string');
    assert.equal(typeof f.content, 'string');
    assert.ok(!f.path.startsWith('/'));
  }
  assert.ok(kit.files.some((f) => f.path === '.gitignore'));
  assert.ok(!kit.files.some((f) => f.path === '_gitignore'));
});

test('every combination renders without leftover braces or forbidden strings', () => {
  for (const a of allCombos()) {
    const files = renderKit(kit, a);
    for (const f of files) {
      const where = `${f.path} [${a.season} ${a.agent} push=${a.push} roles=${a.roles} conn=${a.connectors}]`;
      assert.doesNotMatch(f.content, /\{\{/, `leftover {{ in ${where}`);
      assert.doesNotMatch(f.path, /\{\{/, where);
      const scrubbed = ALLOWED.reduce((s, re) => s.replace(new RegExp(re.source, 'g'), ''), f.content);
      for (const re of FORBIDDEN) assert.doesNotMatch(scrubbed, re, `forbidden ${re} in ${where}`);
      if (a.season !== 'summer-2027') assert.doesNotMatch(f.content, /\bs27\b/, `s27 leaked into ${where}`);
    }
  }
});

test('conditional files', () => {
  const paths = (a) => new Set(renderKit(kit, { ...base, season: 'summer-2027', roles: ['swe'], connectors: [], ...a }).map((f) => f.path));
  const claude = paths({ agent: 'claude', push: true });
  assert.ok(claude.has('CLAUDE.md'));
  assert.ok(claude.has('AGENTS.md'));
  assert.ok(claude.has('.claude/settings.json'));
  assert.ok(claude.has('.claude/hooks/auto-stage.sh'));
  assert.ok(claude.has('.claude/hooks/auto-commit.sh'));
  assert.ok(claude.has('.claude/hooks/block-worktree.sh'));
  for (const s of ['apply', 'company', 'interview', 'pipeline']) assert.ok(claude.has(`.claude/skills/${s}/SKILL.md`));
  assert.ok(!claude.has('.cursor/rules/career-vault.mdc'));
  assert.ok(!claude.has('meta/connectors.md'));

  const claudeNoPush = paths({ agent: 'claude', push: false });
  assert.ok(!claudeNoPush.has('.claude/hooks/auto-commit.sh'));
  assert.ok(claudeNoPush.has('.claude/hooks/auto-stage.sh'));

  const cursor = paths({ agent: 'cursor', push: true });
  assert.ok(!cursor.has('CLAUDE.md'));
  assert.ok(cursor.has('AGENTS.md'));
  assert.ok(cursor.has('.cursor/rules/career-vault.mdc'));
  assert.ok(!cursor.has('.claude/settings.json'));

  const none = paths({ agent: 'none', push: false });
  assert.ok(!none.has('CLAUDE.md'));
  assert.ok(!none.has('AGENTS.md'));
  assert.ok(none.has('README.md'));
  assert.ok(none.has('meta/templates/application.md'));

  const withConn = paths({ agent: 'codex', push: true, connectors: ['granola'] });
  assert.ok(withConn.has('meta/connectors.md'));
});

test('season tags and labels land in the right places', () => {
  const files = renderKit(kit, { ...base, season: 'spring-2027', roles: ['swe'], agent: 'claude', connectors: [], push: true });
  const claude = files.find((f) => f.path === 'CLAUDE.md').content;
  assert.match(claude, /Spring 2027/);
  assert.match(claude, /-sp27\.md/);
  assert.match(claude, /season: spring-2027/);
  const app = files.find((f) => f.path === 'meta/templates/application.md').content;
  assert.match(app, /tags: \[sp27\]/);
  assert.match(app, /season: spring-2027/);
});

test('titles use whose: "Alex\'s" with a name, "Your" without, never "You\'s"', () => {
  const titles = (name) =>
    renderKit(kit, { ...base, name, season: 'summer-2027', roles: ['swe'], agent: 'cursor', connectors: [], push: true })
      .filter((f) => ['README.md', 'AGENTS.md', '.cursor/rules/career-vault.mdc'].includes(f.path))
      .map((f) => f.content.split('\n').slice(0, 3).join('\n'));
  for (const t of titles('Alex')) assert.match(t, /Alex's career vault/);
  for (const t of titles('')) assert.match(t, /Your career vault/);
  for (const t of titles('   ')) assert.match(t, /Your career vault/);
  for (const name of ['', '   ', 'You', 'Alex'])
    for (const f of renderKit(kit, { ...base, name, season: 'summer-2027', roles: ['swe'], agent: 'claude', connectors: [], push: true }))
      assert.doesNotMatch(f.content, /You's/, f.path);
});

test('settings.json is valid JSON with and without push', () => {
  for (const push of [true, false]) {
    const files = renderKit(kit, { ...base, season: 'summer-2027', roles: ['swe'], agent: 'claude', connectors: [], push });
    const s = JSON.parse(files.find((f) => f.path === '.claude/settings.json').content);
    assert.equal(Boolean(s.hooks.Stop), push);
    assert.ok(s.hooks.PostToolUse);
    assert.ok(s.hooks.PreToolUse);
  }
});

test('hooks carry mode 755', () => {
  const files = renderKit(kit, { ...base, season: 'summer-2027', roles: ['swe'], agent: 'claude', connectors: [], push: true });
  for (const f of files.filter((x) => x.path.endsWith('.sh'))) assert.equal(f.mode, '755', f.path);
});
