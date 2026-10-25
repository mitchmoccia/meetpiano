import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function staticRoutes() {
  const routes = [];
  const walk = (dir, prefix) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${name.name}` : name.name;
      if (name.isDirectory()) walk(join(dir, name.name), rel);
      else if (name.name === 'index.html') routes.push(rel);
    }
  };
  walk(join(root, 'public'), '');
  return routes.flatMap((rel) => {
    if (rel === 'index.html') return ['/', '/index.html'];
    const dir = rel.slice(0, -'/index.html'.length);
    return [`/${dir}`, `/${dir}/`, `/${dir}/index.html`];
  });
}

const config = read('next.config.ts');
const pagesMatch = config.match(/const staticPages = \[([^\]]+)\]/);
assert(pagesMatch, 'next.config.ts lists staticPages');
const staticPages = [...pagesMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
assert(config.includes("script-src 'self'") && !config.includes('strict-dynamic'), 'the static page policy is script-src self');

const proxy = read('src/proxy.ts');
assert(proxy.includes("'strict-dynamic'"), 'app routes keep the nonce strict-dynamic policy');
const sourceMatch = proxy.match(/source:\s*'([^']+)'/);
assert(sourceMatch, 'the proxy matcher source is a string literal');
const matcher = new RegExp(`^${sourceMatch[1].replace(/\\\\/g, '\\')}$`);

const pages = staticRoutes();
assert(pages.includes('/songs/') && pages.includes('/learn/') && pages.includes('/'), 'home, learn, and songs are static pages');
for (const route of pages) {
  assert(staticPages.includes(route), `${route} is missing from the static CSP header list`);
  assert(!matcher.test(route), `${route} falls into the nonce strict-dynamic policy`);
}

for (const route of ['/signin', '/family', '/play', '/admin']) {
  assert(!staticPages.includes(route), `${route} is not a static page`);
  assert(matcher.test(route), `${route} no longer receives the app CSP`);
}

assert(read('scripts/static-checks.mjs').includes('csp-static-check.mjs'), 'static checks run this script');
console.log(`static CSP checks passed (${pages.length} routes stay off strict-dynamic)`);
