#!/usr/bin/env node
// Walks templates/, applies templates.manifest.json, writes dist/kit.json.
//
// Manifest convention (templates.manifest.json at the repo root):
//   options: the choice lists the CLI and the site wizard present.
//   files:   { "<path relative to templates/>": { when?, mode?, as? } }
//            when  the tiny when-grammar from the contract (omit = always)
//            mode  file mode in the output, as a string ("755")
//            as    published path when it differs from the template path
//                  (used for `_gitignore` -> `.gitignore`, which tooling
//                  such as npm would otherwise rewrite)
//   Files not listed in the manifest are unconditional and keep their path.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evalWhen, renderConditionals } from '../src/render.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = join(root, 'templates');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'templates.manifest.json'), 'utf8'));

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name !== '.DS_Store') out.push(full);
  }
  return out;
}

const probe = { agent: 'claude', push: true, roles: [], connectors: [] };
const problems = [];
const seen = new Set();
const files = [];

for (const full of walk(templatesDir)) {
  const rel = relative(templatesDir, full).split('\\').join('/');
  seen.add(rel);
  const meta = manifest.files[rel] ?? {};
  const content = readFileSync(full, 'utf8');

  if (/[\u2014\u2013]/.test(content)) problems.push(`${rel}: contains an em-dash or en-dash`);
  for (const line of content.split('\n')) {
    if (/\{\{#if\b/.test(line) && !/^\s*\{\{#if\s+.+?\}\}\s*$/.test(line)) {
      problems.push(`${rel}: {{#if}} must be alone on its line: ${line.trim()}`);
    }
    if (/\{\{\/if\}\}/.test(line) && !/^\s*\{\{\/if\}\}\s*$/.test(line)) {
      problems.push(`${rel}: {{/if}} must be alone on its line: ${line.trim()}`);
    }
  }
  if (meta.when !== undefined) {
    try {
      evalWhen(meta.when, probe);
    } catch (e) {
      problems.push(`${rel}: bad when-expression: ${e.message}`);
    }
  }
  try {
    renderConditionals(content, probe);
  } catch (e) {
    problems.push(`${rel}: ${e.message}`);
  }

  const entry = { path: meta.as ?? rel };
  if (meta.when) entry.when = meta.when;
  if (meta.mode) entry.mode = String(meta.mode);
  entry.content = content;
  files.push(entry);
}

for (const key of Object.keys(manifest.files)) {
  if (!seen.has(key)) problems.push(`manifest lists ${key} but templates/${key} does not exist`);
}

if (problems.length) {
  console.error('build-kit: problems found');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}

const kit = {
  name: pkg.name,
  version: pkg.version,
  repo: (pkg.repository?.url ?? '').replace(/^git\+/, '').replace(/\.git$/, ''),
  options: manifest.options,
  files,
};

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'kit.json'), JSON.stringify(kit, null, 2) + '\n');
console.log(`build-kit: ${files.length} files -> dist/kit.json`);
