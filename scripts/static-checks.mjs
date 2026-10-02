import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const jsFiles = [
  'public/app.js',
  'public/learn/learn.js',
  ...readdirSync('public/js').filter((name) => name.endsWith('.js')).map((name) => `public/js/${name}`),
  ...readdirSync('public/js/lessons').filter((name) => name.endsWith('.js')).map((name) => `public/js/lessons/${name}`)
];

const checks = [
  ...readdirSync('scripts').filter((name) => /^mp-\d{2}-check\.mjs$/.test(name)).sort(),
  'copyright-check.mjs',
  'aeo-check.mjs',
  'pilot-cta-check.mjs'
];

for (const file of jsFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.info(`syntax ok: ${jsFiles.length} files`);

for (const check of checks) {
  execFileSync(process.execPath, [`scripts/${check}`], { stdio: 'inherit' });
  console.info(`passed: ${check}`);
}
