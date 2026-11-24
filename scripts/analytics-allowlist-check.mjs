import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIFFICULTY_IDS, SONG_CATALOG, VIEW_IDS } from '../public/js/song-score.js';
import { JOURNEY_LESSONS } from '../public/js/unit.js';
import * as browser from '../public/js/analytics.js';
import * as source from '../src/lib/analytics/events.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const catalogs = ['INSIGHTS_SCRIPT', 'MAX_EVENT_PROPS', 'BLOCKED_HOSTS', 'LESSON_IDS', 'GRADES', 'VIEWS', 'LEVELS', 'PAGE_ROWS', 'EVENT_ROWS'];
for (const key of catalogs) {
  assert(JSON.stringify(browser[key]) === JSON.stringify(source[key]), `${key} matches in the browser file and the TypeScript module`);
}

const samples = [
  ['page_view', { page: 'songs' }],
  ['page_view', { page: 'home', email: 'a@b.c' }],
  ['lesson_start', { lesson: 'L12' }],
  ['lesson_start', { lesson: 'L25' }],
  ['lesson_complete', { lesson: 'L01', childId: 'abc' }],
  ['song_open', { song: 'skip-to-my-lou' }],
  ['song_play', { song: 'ode-to-joy', level: 'noob' }],
  ['song_complete', { song: 'ode-to-joy', grade: 'B', level: 'pro' }],
  ['view_change', { view: 'drop', song: 'london-bridge' }],
  ['note_inspect_open', { song: 'ode-to-joy', view: 'sheet', pitch: 'E4' }],
  ['see_results_open', { song: 'brahms-lullaby', grade: 'C' }],
  ['signup_start', { email: 'parent@example.com' }],
  ['signup_complete', undefined],
  ['midi_connect_success', { device: 'keyboard' }],
  ['free_text', { page: 'hello friend' }]
];

const songIds = SONG_CATALOG.map((item) => item.id);
for (const id of songIds) assert(source.SONG_SLUG_PATTERN.test(id), `${id} is a safe catalog slug`);
assert(browser.SONG_SLUG_PATTERN.source === source.SONG_SLUG_PATTERN.source, 'the song slug pattern matches');
assert(JSON.stringify(browser.songIdsFromCatalog()) === JSON.stringify(songIds), 'analytics uses the player catalog');
assert(JSON.stringify(source.songIdsFromCatalog(SONG_CATALOG)) === JSON.stringify(songIds), 'the catalog filter keeps every current song');

const fresh = 'fresh-daily-song';
const withFresh = [...songIds, fresh];
assert(browser.prepareEvent('song_open', { song: fresh }) === null, 'a song missing from the catalog is dropped');
const opened = source.prepareEvent('song_open', { song: fresh }, withFresh);
assert(opened && opened.props.song === fresh, 'a song added only to the catalog is accepted');
assert(
  JSON.stringify(browser.prepareEvent('song_open', { song: fresh }, withFresh)) === JSON.stringify(opened),
  'both copies accept the new catalog song without an analytics edit'
);
assert(source.prepareEvent('song_open', { song: 'ada@example.com' }, [...withFresh, 'ada@example.com']) === null, 'an email is not a song slug');
assert(browser.prepareEvent('song_open', { song: 'Child_123' }, [...withFresh, 'Child_123']) === null, 'an id is not a song slug');
assert(browser.prepareEvent('song_open', { song: 'my diary today' }, withFresh) === null, 'free text is not a song slug');
const mixed = [{ id: fresh }, { id: 'ada@example.com' }, { id: 'ok-tune' }, { id: 'No Spaces' }];
assert(
  JSON.stringify(browser.songIdsFromCatalog(mixed)) === JSON.stringify(source.songIdsFromCatalog(mixed)),
  'catalog filtering agrees'
);
assert(JSON.stringify(source.songIdsFromCatalog(mixed)) === JSON.stringify([fresh, 'ok-tune']), 'unsafe catalog ids are ignored');

for (const [name, props] of samples) {
  const left = browser.prepareEvent(name, props, songIds);
  const right = source.prepareEvent(name, props, songIds);
  assert(JSON.stringify(left) === JSON.stringify(right), `prepareEvent agrees for ${name}`);
  assert(JSON.stringify(browser.prepareEvent(name, props)) === JSON.stringify(left), `${name} uses the player catalog by default`);
}

const learnUrl = 'https://meetpiano.app/learn/?lesson=L03&token=secret';
const redactSamples = [
  [{ type: 'pageview', url: learnUrl }, learnUrl],
  [{ type: 'pageview', url: 'https://meetpiano.app/family/children/child_1' }, 'https://meetpiano.app/family/children/child_1'],
  [{ type: 'event', url: learnUrl, payload: { name: 'lesson_start', data: { lesson: 'L03' } } }, learnUrl],
  [{ type: 'event', url: 'https://meetpiano.app/signup', payload: { name: 'signup_start', data: { email: 'a@b.c' } } }, 'https://meetpiano.app/signup'],
  [{ type: 'identify', url: 'https://meetpiano.app/' }, 'https://meetpiano.app/'],
  [{ type: 'pageview', url: 'https://evil.example/songs' }, 'https://meetpiano.app/songs']
];

for (const [event, href] of redactSamples) {
  const left = browser.redactAnalyticsEvent(event, href, songIds);
  const right = source.redactAnalyticsEvent(event, href, songIds);
  assert(JSON.stringify(browser.redactAnalyticsEvent(event, href)) === JSON.stringify(left), 'redaction uses the player catalog by default');
  assert(JSON.stringify(left) === JSON.stringify(right), 'redactAnalyticsEvent agrees');
  assert(!JSON.stringify(left).includes('token'), 'a redacted event has no token');
  assert(!JSON.stringify(left).includes('child_1'), 'a redacted event has no child id');
  assert(!JSON.stringify(left).includes('@'), 'a redacted event has no email');
}

for (const signals of [
  { doNotTrack: '1' },
  { globalPrivacyControl: true },
  { doNotTrack: '0', globalPrivacyControl: false }
]) {
  assert(browser.trackingOptOut(signals) === source.trackingOptOut(signals), 'Do Not Track handling agrees');
}
assert(browser.insightsFetchPlan('/_vercel/insights/event', 'https://meetpiano.app') === 'omit', 'insights posts omit cookies');
assert(browser.insightsFetchPlan('https://va.vercel-scripts.com/v1/script.js', 'https://meetpiano.app') === 'block', 'the vendor script host is blocked');

assert(JSON.stringify([...VIEW_IDS]) === JSON.stringify(source.VIEWS), 'views match the song player');
assert(JSON.stringify([...DIFFICULTY_IDS]) === JSON.stringify(source.LEVELS), 'levels match Noob, Pro, and Expert');
const journeyIds = JOURNEY_LESSONS.map((item) => item.lessonId);
assert(JSON.stringify(journeyIds) === JSON.stringify(source.LESSON_IDS), 'lessons are L01 through L24');

const specs = new Map(source.EVENT_ROWS.map((row) => [row[0], { props: row[1], required: row[2] }]));
const callRe = /\b(emit|trackProductEvent)\(\s*(['"])([A-Za-z0-9_]+)\2(\s*,\s*\{([^}]*)\})?/g;

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const rel = join(dir, name);
    const info = statSync(rel);
    if (info.isDirectory()) walk(rel, acc);
    else if (/\.(js|html|ts|tsx)$/.test(name)) acc.push(rel);
  }
  return acc;
}

const files = [...walk(join(root, 'public')), ...walk(join(root, 'src'))];
let calls = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = file.slice(root.length + 1);
  for (const match of text.matchAll(callRe)) {
    calls += 1;
    const eventName = match[3];
    const spec = specs.get(eventName);
    assert(spec, `${rel} sends an unknown event ${eventName}`);
    const keys = match[5] ? [...match[5].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((item) => item[1]) : [];
    assert(new Set(keys).size === keys.length, `${rel} repeats a prop on ${eventName}`);
    for (const key of keys) assert(spec.props.includes(key), `${rel} sends ${eventName}.${key}, which is not allowlisted`);
    for (const key of spec.required) assert(keys.includes(key), `${rel} omits required ${eventName}.${key}`);
    assert(!match[5]?.includes('...'), `${rel} spreads props into ${eventName}`);
  }
  assert(!/https?:\/\/(?:va\.vercel-scripts|cdn\.vercel-insights|vitals\.vercel-insights)\./.test(text), `${rel} requests a third-party analytics host`);
  assert(!text.includes("va('identify'") && !text.includes('enableCookie'), `${rel} must not identify a visitor or enable analytics cookies`);
}

for (const rel of ['public/js/analytics.js', 'src/lib/analytics/events.ts']) {
  assert(!read(rel).includes('mary-had-a-little-lamb'), `${rel} does not hardcode song slugs`);
  assert(!read(rel).includes('SONG_SLUGS'), `${rel} has no copied slug list`);
}
assert(read('public/js/analytics.js').includes("from './song-catalog.js'"), 'analytics imports the player catalog');
assert(read('public/js/song-score.js').includes("from './song-catalog.js'"), 'the song player uses that catalog');
assert(calls >= 12, 'the funnel call sites are present');
const trackImports = files.filter((file) => readFileSync(file, 'utf8').includes("from '@vercel/analytics'"));
assert(trackImports.length === 1 && trackImports[0].endsWith('src/lib/analytics/track.ts'), 'only the signup helper imports @vercel/analytics');
assert(!files.some((file) => /from '@vercel\/analytics\/(react|next)'/.test(readFileSync(file, 'utf8'))), 'the React analytics component is not used');

for (const page of ['public/index.html', 'public/learn/index.html', 'public/songs/index.html']) {
  const html = read(page);
  assert(html.includes('<script type="module" src="/js/analytics.js"></script>'), `${page} loads the external analytics file`);
  assert(!html.includes('window.va'), `${page} has no inline analytics bootstrap`);
}

const layout = read('src/app/layout.tsx');
assert(layout.includes('src="/js/analytics.js"') && layout.includes('nonce={nonce}'), 'app routes load the external file with the CSP nonce');
assert(read('public/js/analytics.js').includes("script.src = INSIGHTS_SCRIPT"), 'the loader uses the same-origin insights path');
assert(read('next.config.ts').includes("script-src 'self'") && read('next.config.ts').includes("connect-src 'self'"), 'static CSP stays on self');
assert(!read('next.config.ts').includes('strict-dynamic'), 'static pages do not use strict-dynamic');
assert(read('src/proxy.ts').includes('_vercel/'), 'the insights route stays out of the nonce middleware');
assert(read('scripts/static-checks.mjs').includes('analytics-allowlist-check.mjs'), 'static checks run this allowlist');

const signup = read('src/features/auth/sign-up-form.tsx');
assert(signup.includes("trackProductEvent('signup_start')") && signup.includes("trackProductEvent('signup_complete')"), 'signup emits both funnel events');
assert(!signup.includes('trackProductEvent(') || !/trackProductEvent\([^)]*email/.test(signup), 'signup events do not take the email');

console.log(`analytics allowlist passed (${calls} call sites, ${source.EVENT_ROWS.length} events)`);
