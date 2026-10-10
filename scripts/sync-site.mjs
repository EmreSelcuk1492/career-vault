#!/usr/bin/env node
// Copies dist/kit.json and src/render.js into the site repo, which vendors
// them at src/kit/. The site repo is expected next to this one
// (../emrecanselcuk-com). Skips with a message when it is not there.
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteRepo = join(root, '..', 'emrecanselcuk-com');
const target = join(siteRepo, 'src', 'kit');

if (!existsSync(siteRepo)) {
  console.log(`sync-site: site repo not found at ${siteRepo}, skipping`);
  process.exit(0);
}
if (!existsSync(join(root, 'dist', 'kit.json'))) {
  console.error('sync-site: dist/kit.json missing, run `npm run build` first');
  process.exit(1);
}

mkdirSync(target, { recursive: true });
copyFileSync(join(root, 'dist', 'kit.json'), join(target, 'kit.json'));
copyFileSync(join(root, 'src', 'render.js'), join(target, 'render.js'));
console.log(`sync-site: copied kit.json and render.js -> ${target}`);
