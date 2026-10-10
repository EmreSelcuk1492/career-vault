import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderKit,
  toCommand,
  parseArgs,
  evalWhen,
  seasonTag,
  renderConditionals,
  normalizeAnswers,
} from '../src/render.js';

const miniKit = {
  name: 'career-vault',
  version: '0.0.0',
  repo: '',
  options: {
    seasons: [
      { id: 'summer-2027', label: 'Summer 2027' },
      { id: 'spring-2027', label: 'Spring 2027' },
      { id: 'fall-2027', label: 'Fall 2027' },
      { id: 'summer-2028', label: 'Summer 2028' },
    ],
    roles: [
      { id: 'swe', label: 'Software engineering' },
      { id: 'pm', label: 'Product' },
      { id: 'tpm', label: 'Technical program' },
    ],
    agents: [
      { id: 'claude', label: 'Claude Code' },
      { id: 'cursor', label: 'Cursor' },
      { id: 'codex', label: 'Codex' },
      { id: 'none', label: 'No agent, just Obsidian' },
    ],
    connectors: [
      { id: 'gmail', label: 'Gmail' },
      { id: 'granola', label: 'Granola' },
    ],
  },
  files: [
    { path: 'CLAUDE.md', when: 'agent == claude', content: '# {{name}} {{season}} {{season_slug}} {{season_tag}}' },
    { path: 'AGENTS.md', when: 'agent != none', content: '{{roles_csv}}\n{{roles_list}}\n{{agent}}\n{{connectors_list}}\n{{date}} {{year}}' },
    { path: '.claude/hooks/auto-commit.sh', when: 'agent == claude && push', mode: '755', content: '#!/bin/sh' },
    { path: 'meta/connectors.md', when: 'connector:gmail || connector:granola', content: 'a\n{{#if connector:gmail}}\ngmail\n{{/if}}\n{{#if connector:granola}}\ngranola\n{{/if}}\nz' },
    { path: 'always.md', content: 'x\n{{#if push}}\npush on\n{{/if}}\n{{#if !push}}\npush off\n{{/if}}\n{{#if role:pm}}\n  pm block\n{{/if}}\ny' },
    { path: 'whose.md', content: '# {{whose}} vault ({{name}})' },
  ],
};

test('whose: possessive name or "Your", never "You\'s"', () => {
  const whose = (name) => renderKit(miniKit, { ...A, name }).find((f) => f.path === 'whose.md').content;
  assert.equal(whose('Alex'), "# Alex's vault (Alex)");
  assert.equal(whose('  Alex  '), "# Alex's vault (Alex)");
  assert.equal(whose(''), '# Your vault (the user)');
  assert.equal(whose('   '), '# Your vault (the user)');
  assert.equal(whose(undefined), '# Your vault (the user)');
  assert.equal(whose('You'), '# Your vault (You)');
  for (const n of ['', '   ', undefined, 'You', 'Alex']) assert.doesNotMatch(whose(n), /You's/);
});

const A = { name: 'Alex', season: 'summer-2027', roles: ['pm', 'tpm'], agent: 'claude', connectors: ['gmail'], push: true, date: '2026-10-10' };

test('seasonTag', () => {
  assert.equal(seasonTag('summer-2027'), 's27');
  assert.equal(seasonTag('spring-2027'), 'sp27');
  assert.equal(seasonTag('fall-2027'), 'f27');
  assert.equal(seasonTag('summer-2028'), 's28');
});

test('when grammar', () => {
  assert.equal(evalWhen(undefined, A), true);
  assert.equal(evalWhen('agent == claude', A), true);
  assert.equal(evalWhen('agent != claude', A), false);
  assert.equal(evalWhen('push', A), true);
  assert.equal(evalWhen('!push', A), false);
  assert.equal(evalWhen('connector:gmail', A), true);
  assert.equal(evalWhen('connector:granola', A), false);
  assert.equal(evalWhen('role:pm', A), true);
  assert.equal(evalWhen('role:swe', A), false);
  assert.equal(evalWhen('agent == claude && push', A), true);
  assert.equal(evalWhen('agent == none || push', A), true);
  assert.equal(evalWhen('agent == none || !push', A), false);
  // && binds tighter than ||
  assert.equal(evalWhen('agent == none && push || role:pm', A), true);
  assert.throws(() => evalWhen('season == x', A));
});

test('conditional blocks consume whole lines and leave no blanks', () => {
  const src = 'a\n{{#if push}}\nb\n{{/if}}\n{{#if !push}}\nc\n{{/if}}\nd';
  assert.equal(renderConditionals(src, A), 'a\nb\nd');
  assert.equal(renderConditionals(src, { ...A, push: false }), 'a\nc\nd');
  assert.throws(() => renderConditionals('{{#if push}}\nx', A));
  assert.throws(() => renderConditionals('x\n{{/if}}', A));
});

test('placeholders', () => {
  const files = renderKit(miniKit, A);
  const byPath = Object.fromEntries(files.map((f) => [f.path, f]));
  assert.equal(byPath['CLAUDE.md'].content, '# Alex Summer 2027 summer-2027 s27');
  assert.equal(byPath['AGENTS.md'].content, 'Product, Technical program\n- Product\n- Technical program\nClaude Code\n- Gmail\n2026-10-10 2026');
  assert.equal(byPath['.claude/hooks/auto-commit.sh'].mode, '755');
  assert.equal(byPath['meta/connectors.md'].content, 'a\ngmail\nz');
  assert.equal(byPath['always.md'].content, 'x\npush on\n  pm block\ny');
});

test('connectors_list falls back to "none yet"', () => {
  const files = renderKit(miniKit, { ...A, connectors: [] });
  const agents = files.find((f) => f.path === 'AGENTS.md');
  assert.match(agents.content, /none yet/);
  assert.equal(files.some((f) => f.path === 'meta/connectors.md'), false);
});

test('conditional files appear and disappear', () => {
  const paths = (a) => renderKit(miniKit, a).map((f) => f.path);
  assert.ok(paths(A).includes('CLAUDE.md'));
  assert.ok(paths(A).includes('.claude/hooks/auto-commit.sh'));
  assert.ok(!paths({ ...A, push: false }).includes('.claude/hooks/auto-commit.sh'));
  assert.ok(!paths({ ...A, agent: 'cursor' }).includes('CLAUDE.md'));
  assert.ok(paths({ ...A, agent: 'cursor' }).includes('AGENTS.md'));
  assert.ok(!paths({ ...A, agent: 'none' }).includes('AGENTS.md'));
  assert.ok(paths({ ...A, agent: 'none' }).includes('always.md'));
});

test('every option combination renders with no leftover braces', () => {
  const { seasons, roles, agents, connectors } = miniKit.options;
  const roleSets = [[roles[0].id], roles.map((r) => r.id)];
  const connSets = [[], [connectors[0].id], connectors.map((c) => c.id)];
  let count = 0;
  for (const s of seasons)
    for (const r of roleSets)
      for (const ag of agents)
        for (const c of connSets)
          for (const push of [true, false]) {
            const files = renderKit(miniKit, { ...A, season: s.id, roles: r, agent: ag.id, connectors: c, push });
            for (const f of files) {
              assert.doesNotMatch(f.content, /\{\{/, `${f.path} for ${s.id}/${ag.id}/${push}`);
              assert.doesNotMatch(f.content, /\}\}/, `${f.path} for ${s.id}/${ag.id}/${push}`);
            }
            count++;
          }
  assert.ok(count > 100);
});

test('normalizeAnswers fills defaults and drops unknown ids', () => {
  const n = normalizeAnswers(miniKit, { roles: ['pm', 'bogus'], connectors: ['nope'], season: 'winter-1999', date: 'bad' });
  assert.deepEqual(n.roles, ['pm']);
  assert.deepEqual(n.connectors, []);
  assert.equal(n.season, 'summer-2027');
  assert.equal(n.agent, 'claude');
  assert.equal(n.push, true);
  assert.equal(n.name, 'the user');
  assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(normalizeAnswers(miniKit, { roles: [] }).roles, ['swe']);
});

test('toCommand format', () => {
  assert.equal(
    toCommand(A),
    'npx career-vault --name "Alex" --season summer-2027 --roles pm,tpm --agent claude --connectors gmail --push',
  );
  assert.equal(
    toCommand({ ...A, connectors: [], push: false }),
    'npx career-vault --name "Alex" --season summer-2027 --roles pm,tpm --agent claude --no-push',
  );
  assert.match(toCommand(A, 'npx github:EmreSelcuk1492/career-vault'), /^npx github:EmreSelcuk1492\/career-vault --name/);
});

test('parseArgs', () => {
  const p = parseArgs(['--name', 'Alex Smith', '--season=spring-2027', '--roles', 'pm, tpm', '--agent', 'cursor', '--no-push', '--dir', 'v', '-y', '--force']);
  assert.equal(p.name, 'Alex Smith');
  assert.equal(p.season, 'spring-2027');
  assert.deepEqual(p.roles, ['pm', 'tpm']);
  assert.equal(p.agent, 'cursor');
  assert.equal(p.push, false);
  assert.equal(p.dir, 'v');
  assert.equal(p.yes, true);
  assert.equal(p.force, true);
  assert.deepEqual(parseArgs(['--connectors', 'none']).connectors, []);
  assert.deepEqual(parseArgs(['--bogus']).unknown, ['--bogus']);
  assert.equal(parseArgs(['-h']).help, true);
  assert.equal(parseArgs(['--version']).version, true);
});

test('roundtrip parseArgs(toCommand(a)) for every combination', () => {
  const { seasons, roles, agents, connectors } = miniKit.options;
  for (const s of seasons)
    for (const r of [[roles[1].id], roles.map((x) => x.id)])
      for (const ag of agents)
        for (const c of [[], connectors.map((x) => x.id)])
          for (const push of [true, false])
            for (const name of ['Alex', 'Alex "A" O\'Neil', 'You']) {
              const a = normalizeAnswers(miniKit, { name, season: s.id, roles: r, agent: ag.id, connectors: c, push, date: '2026-10-10' });
              const back = normalizeAnswers(miniKit, { ...parseArgs(toCommand(a)), date: '2026-10-10' });
              assert.deepEqual(back, a);
            }
});
