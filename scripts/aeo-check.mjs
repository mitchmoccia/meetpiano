import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const banned = [
  'teacher-approved',
  'teacher approved',
  'educator-approved',
  'grade 1 complete',
  'grade 1',
  'aggregaterating',
  'ratingvalue'
];

const llms = read('dist/llms.txt');
assert(llms.startsWith('# MeetPiano\n'), 'llms.txt H1 is MeetPiano');
assert(/^> /m.test(llms), 'llms.txt has a blockquote summary');
assert(llms.includes('## Pages'), 'llms.txt has a Pages section');
assert(llms.includes('## Optional'), 'llms.txt has an Optional section');
assert(llms.includes('https://meetpiano.app/'), 'llms.txt links the home page');
assert(llms.includes('https://meetpiano.app/learn/'), 'llms.txt links the learn hub');
assert(llms.includes('https://meetpiano.app/learn/?unit=first-notes'), 'llms.txt links First Notes');
assert(llms.includes('not a certified teacher'), 'llms.txt says it is not a certified teacher');
assert(llms.includes('not a grade'), 'llms.txt says it is not a grade program');
assert(llms.includes('Physical MIDI hardware is not verified'), 'llms.txt keeps MIDI honesty');
assert(llms.includes('this device only'), 'llms.txt says progress is device-local');
assert(!/\d+(\.\d+)?%/.test(llms), 'llms.txt invents no percentage metrics');

const robots = read('dist/robots.txt');
assert(robots.includes('User-agent: *'), 'robots.txt allows the default crawler');
assert(robots.includes('Allow: /'), 'robots.txt allows the public site');
assert(robots.includes('User-agent: GPTBot'), 'robots.txt names GPTBot');
assert(robots.includes('User-agent: ClaudeBot'), 'robots.txt names ClaudeBot');
assert(robots.includes('User-agent: PerplexityBot'), 'robots.txt names PerplexityBot');
assert(robots.includes('User-agent: Google-Extended'), 'robots.txt names Google-Extended');
assert(!/^\s*Disallow:\s*\/\s*$/m.test(robots), 'robots.txt does not block the whole site');
assert(robots.includes('Sitemap: https://meetpiano.app/sitemap.xml'), 'robots.txt references the sitemap');
assert(robots.includes('llms.txt'), 'robots.txt notes llms.txt');

const sitemap = read('dist/sitemap.xml');
assert(sitemap.includes('https://meetpiano.app/'), 'sitemap lists the home URL');
assert(sitemap.includes('https://meetpiano.app/learn/'), 'sitemap lists the learn hub');
assert(!sitemap.includes('/learn/?'), 'sitemap does not list learn query URLs');
assert(!sitemap.includes('?unit='), 'sitemap does not invent unit query routes');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(locs.length === 2, 'sitemap lists only the two public indexable URLs');
assert(locs[0] === 'https://meetpiano.app/' && locs[1] === 'https://meetpiano.app/learn/', 'sitemap URL order is home then learn');

const home = read('dist/index.html');
const learn = read('dist/learn/index.html');
const hubJs = read('dist/js/learn-view.js');
const overview = read('dist/learn/index.md');

assert(home.includes('<title>MeetPiano · Little keys. Big possibilities.</title>'), 'home title is unique');
assert(learn.includes('<title>First Piano Journey · MeetPiano</title>'), 'learn title is unique');
assert(home.includes('name="description"'), 'home has a meta description');
assert(learn.includes('name="description"'), 'learn has a meta description');
assert(home.includes('<link rel="canonical" href="https://meetpiano.app/">'), 'home has a canonical URL');
assert(learn.includes('<link rel="canonical" href="https://meetpiano.app/learn/">'), 'learn has a canonical URL');
assert(home.includes('rel="describedby"'), 'home points at llms.txt');
assert(learn.includes('rel="describedby"'), 'learn points at llms.txt');
assert(learn.includes('rel="alternate" type="text/markdown" href="/learn/index.md"'), 'learn exposes a markdown alternate');
assert(home.includes('application/ld+json'), 'home has JSON-LD');
assert(learn.includes('application/ld+json'), 'learn has JSON-LD');
assert(home.includes('"@type": "Organization"'), 'home JSON-LD includes Organization');
assert(home.includes('"@type": "WebSite"'), 'home JSON-LD includes WebSite');
assert(home.includes('"@type": "SoftwareApplication"'), 'home JSON-LD includes SoftwareApplication');
assert((home.match(/<h1[\s>]/g) || []).length === 1, 'home has one H1');
assert(hubJs.includes("el('h1', {}, 'First Piano Journey')"), 'hub view H1 is First Piano Journey');
assert(learn.includes('<h1>First Piano Journey</h1>'), 'learn HTML source has a stable hub H1');
assert(overview.startsWith('# First Piano Journey\n'), 'learn markdown alternate starts with the journey name');
assert(overview.includes('device-local'), 'learn markdown keeps device-local honesty');

const surface = `${llms}\n${robots}\n${sitemap}\n${home}\n${learn}\n${hubJs}\n${overview}`.toLowerCase();
assert(surface.includes('does not claim learning effectiveness'), 'AEO copy denies learning-effectiveness claims');
assert(surface.includes('physical midi hardware is not verified'), 'AEO copy denies physical MIDI verification');
for (const phrase of banned) {
  assert(!surface.includes(phrase), `AEO files must not claim ${phrase}`);
}

const vercel = read('vercel.json');
assert(vercel.includes('"outputDirectory": "dist"'), 'Vercel still publishes dist/');

console.log('aeo llms.txt / robots / sitemap checks passed');
