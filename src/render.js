// career-vault renderer. Pure ESM: no Node APIs, no dependencies.
// Runs in Node 18+ and in browsers. The CLI and the site wizard both use it,
// so the zip and the CLI output are byte-identical.

export const COMMAND_PREFIX = 'npx career-vault';

export const DEFAULT_ANSWERS = Object.freeze({
  name: 'the user',
  season: 'summer-2027',
  roles: ['swe'],
  agent: 'claude',
  connectors: [],
  push: true,
});

const SEASON_PREFIX = { summer: 's', spring: 'sp', fall: 'f', winter: 'w' };

/** "summer-2027" -> "s27", "spring-2027" -> "sp27", "fall-2027" -> "f27". */
export function seasonTag(slug) {
  const [word = '', year = ''] = String(slug).toLowerCase().split('-');
  const prefix = SEASON_PREFIX[word] ?? word.slice(0, 1);
  return prefix + year.slice(-2);
}

/** "summer-2027" -> "Summer 2027", using the kit's label when it has one. */
export function seasonLabel(kit, slug) {
  const found = kit?.options?.seasons?.find((s) => s.id === slug);
  if (found) return found.label;
  const [word = '', year = ''] = String(slug).split('-');
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} ${year}`.trim();
}

function labelFor(list, id) {
  return list?.find((x) => x.id === id)?.label ?? id;
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Fill in defaults, drop unknown ids, and make sure at least one role is set. */
export function normalizeAnswers(kit, partial = {}) {
  const opt = kit?.options ?? {};
  const ids = (list) => (list ?? []).map((x) => x.id);
  const pick = (value, allowed, fallback) =>
    allowed.length === 0 || allowed.includes(value) ? value : fallback;
  const subset = (values, allowed) =>
    (Array.isArray(values) ? values : [])
      .map((v) => String(v).trim())
      .filter((v, i, arr) => v && arr.indexOf(v) === i && (allowed.length === 0 || allowed.includes(v)));

  const seasonIds = ids(opt.seasons);
  const roleIds = ids(opt.roles);
  const agentIds = ids(opt.agents);
  const connectorIds = ids(opt.connectors);

  const name = String(partial.name ?? '').trim() || DEFAULT_ANSWERS.name;
  const season = pick(partial.season ?? DEFAULT_ANSWERS.season, seasonIds, seasonIds[0] ?? DEFAULT_ANSWERS.season);
  let roles = subset(partial.roles ?? DEFAULT_ANSWERS.roles, roleIds);
  if (roles.length === 0) roles = [roleIds[0] ?? DEFAULT_ANSWERS.roles[0]];
  const agent = pick(partial.agent ?? DEFAULT_ANSWERS.agent, agentIds, agentIds[0] ?? DEFAULT_ANSWERS.agent);
  const connectors = subset(partial.connectors ?? DEFAULT_ANSWERS.connectors, connectorIds);
  const push = partial.push === undefined ? DEFAULT_ANSWERS.push : Boolean(partial.push);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(partial.date ?? '')) ? partial.date : todayISO();

  return { name, season, roles, agent, connectors, push, date };
}

// ---------------------------------------------------------------------------
// `when` grammar. Terms joined by && and ||, && binds tighter, no parentheses.
// Terms: agent == x, agent != x, push, !push, connector:x, role:x

function evalTerm(term, a) {
  let m;
  if ((m = /^agent\s*(==|!=)\s*([\w-]+)$/.exec(term))) {
    return m[1] === '==' ? a.agent === m[2] : a.agent !== m[2];
  }
  if (term === 'push') return Boolean(a.push);
  if (term === '!push') return !a.push;
  if ((m = /^connector:([\w-]+)$/.exec(term))) return (a.connectors ?? []).includes(m[1]);
  if ((m = /^role:([\w-]+)$/.exec(term))) return (a.roles ?? []).includes(m[1]);
  throw new Error(`career-vault: unknown term in when-expression: "${term}"`);
}

export function evalWhen(expr, answers) {
  if (expr === undefined || expr === null || String(expr).trim() === '') return true;
  return String(expr)
    .split('||')
    .some((group) => group.split('&&').every((term) => evalTerm(term.trim(), answers)));
}

// ---------------------------------------------------------------------------
// Content rendering: {{#if expr}} ... {{/if}} blocks (whole lines), then placeholders.

const IF_OPEN = /^\s*\{\{#if\s+(.+?)\s*\}\}\s*$/;
const IF_CLOSE = /^\s*\{\{\/if\}\}\s*$/;
const PLACEHOLDER = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function renderConditionals(content, answers) {
  const out = [];
  const stack = [];
  for (const line of String(content).split('\n')) {
    let m;
    if ((m = IF_OPEN.exec(line))) {
      const parentOn = stack.every(Boolean);
      stack.push(parentOn && evalWhen(m[1], answers));
      continue;
    }
    if (IF_CLOSE.test(line)) {
      if (stack.length === 0) throw new Error('career-vault: {{/if}} without {{#if}}');
      stack.pop();
      continue;
    }
    if (stack.every(Boolean)) out.push(line);
  }
  if (stack.length) throw new Error('career-vault: unclosed {{#if}}');
  return out.join('\n');
}

export function buildVars(kit, answers) {
  const opt = kit?.options ?? {};
  const roleLabels = answers.roles.map((id) => labelFor(opt.roles, id));
  const connectorLabels = answers.connectors.map((id) => labelFor(opt.connectors, id));
  const named = Boolean(answers.name) && answers.name !== DEFAULT_ANSWERS.name && !/^(you|the user)$/i.test(answers.name.trim());
  return {
    name: answers.name,
    // "Alex's" when a name was given, "Your" when empty or the default. Never "You's".
    whose: named ? `${answers.name}'s` : 'Your',
    season: seasonLabel(kit, answers.season),
    season_slug: answers.season,
    season_tag: seasonTag(answers.season),
    date: answers.date,
    version: kit?.version ?? '',
    year: String(answers.date).slice(0, 4),
    roles_list: roleLabels.map((l) => `- ${l}`).join('\n'),
    roles_csv: roleLabels.join(', '),
    agent: labelFor(opt.agents, answers.agent),
    connectors_list: connectorLabels.length ? connectorLabels.map((l) => `- ${l}`).join('\n') : 'none yet',
  };
}

export function renderContent(content, vars, answers) {
  const withBlocks = renderConditionals(content, answers);
  return withBlocks.replace(PLACEHOLDER, (whole, key) => (key in vars ? vars[key] : whole));
}

/**
 * Render every file of the kit for the given answers.
 * Returns [{ path, content, mode? }] in manifest order.
 */
export function renderKit(kit, partialAnswers) {
  const answers = normalizeAnswers(kit, partialAnswers);
  const vars = buildVars(kit, answers);
  const files = [];
  for (const file of kit.files ?? []) {
    if (!evalWhen(file.when, answers)) continue;
    const entry = { path: file.path, content: renderContent(file.content, vars, answers) };
    if (file.mode) entry.mode = file.mode;
    files.push(entry);
  }
  return files;
}

// ---------------------------------------------------------------------------
// The npx one-liner and its inverse.

function quote(s) {
  return `"${String(s).replace(/(["\\$`])/g, '\\$1')}"`;
}

export function toCommand(answers, prefix = COMMAND_PREFIX) {
  const a = { ...DEFAULT_ANSWERS, ...answers };
  const parts = [prefix];
  const name = String(a.name ?? '').trim();
  if (name && name !== DEFAULT_ANSWERS.name) parts.push('--name', quote(name));
  parts.push('--season', a.season, '--roles', (a.roles ?? []).join(','), '--agent', a.agent);
  if (a.connectors && a.connectors.length) parts.push('--connectors', a.connectors.join(','));
  parts.push(a.push ? '--push' : '--no-push');
  return parts.join(' ');
}

/** Minimal shell-like tokenizer: handles double and single quotes and backslash escapes. */
export function tokenize(line) {
  const tokens = [];
  let cur = '';
  let inTok = false;
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === q) q = null;
      else if (c === '\\' && q === '"' && i + 1 < line.length) cur += line[++i];
      else cur += c;
    } else if (c === '"' || c === "'") {
      q = c;
      inTok = true;
    } else if (c === '\\' && i + 1 < line.length) {
      cur += line[++i];
      inTok = true;
    } else if (/\s/.test(c)) {
      if (inTok) tokens.push(cur);
      cur = '';
      inTok = false;
    } else {
      cur += c;
      inTok = true;
    }
  }
  if (inTok) tokens.push(cur);
  return tokens;
}

const LIST_FLAGS = new Set(['roles', 'connectors']);
const STRING_FLAGS = new Set(['name', 'season', 'agent', 'dir']);

/**
 * Parse CLI arguments into a partial answers object plus CLI-only fields
 * (dir, yes, force, help, version). Accepts an array or a command string;
 * leading non-flag tokens such as "npx career-vault" are skipped.
 */
export function parseArgs(argv) {
  let args = typeof argv === 'string' ? tokenize(argv) : [...(argv ?? [])];
  while (args.length && !args[0].startsWith('-')) args.shift();

  const out = {};
  const splitList = (v) =>
    String(v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'none');

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg === '--') break;
    let value;
    const eq = arg.indexOf('=');
    if (arg.startsWith('--') && eq > -1) {
      value = arg.slice(eq + 1);
      arg = arg.slice(0, eq);
    }
    const key = arg.replace(/^--?/, '');
    const next = () => (value !== undefined ? value : args[++i]);

    if (arg === '-y' || key === 'yes') out.yes = true;
    else if (arg === '-h' || key === 'help') out.help = true;
    else if (arg === '-v' || key === 'version') out.version = true;
    else if (key === 'force') out.force = true;
    else if (key === 'push') out.push = true;
    else if (key === 'no-push') out.push = false;
    else if (LIST_FLAGS.has(key)) out[key] = splitList(next());
    else if (STRING_FLAGS.has(key)) out[key] = String(next() ?? '');
    else if (arg.startsWith('-')) {
      out.unknown = out.unknown ?? [];
      out.unknown.push(arg);
    }
  }
  return out;
}
