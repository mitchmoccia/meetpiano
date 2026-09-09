import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyStore } from '../dist/js/progress.js';
import { recommendNext } from '../dist/js/recommend.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const packDir = 'docs/pilots/first-piano-journey-v1';
const packFiles = [
  'README.md',
  'session-script.md',
  'observation-checklist.md',
  'grown-up-prompt.md',
  'recruiting-notes.md'
];
for (const file of packFiles) {
  const rel = `${packDir}/${file}`;
  assert(existsSync(join(root, rel)), `pilot pack includes ${rel}`);
}

const packReadme = read(`${packDir}/README.md`);
assert(packReadme.includes('3–5') || packReadme.includes('3-5'), 'pilot README caps families at 3–5');
assert(/usability/i.test(packReadme), 'pilot README frames usability');
assert(!/efficac/i.test(packReadme) || /not.*efficac|usability.*not.*efficac/i.test(packReadme), 'pilot README rejects efficacy as success');
assert(/Chrome/i.test(packReadme), 'pilot README names the Chrome evidence limit');
assert(/this device|device-local|this browser/i.test(packReadme), 'pilot README keeps device-local honesty');
assert(/Mitch must approve outreach|approval before outreach|Do not contact families/i.test(packReadme), 'pilot README requires outreach approval');

const script = read(`${packDir}/session-script.md`);
assert(/L01/.test(script) && /L04/.test(script), 'session script covers First Notes L01 toward L04');
assert(/grown-up view/i.test(script), 'session script includes grown-up view');
assert(/export/i.test(script), 'session script mentions optional export');
assert(/30–40|30-40/.test(script), 'session script is a 30–40 minute sitting');
assert(/about seven|about 7/i.test(script), 'session script is for about age seven');

const checklist = read(`${packDir}/observation-checklist.md`);
assert(/setup friction/i.test(checklist), 'checklist covers setup friction');
assert(/stall/i.test(checklist), 'checklist covers stalls');
assert(/Hear the words/i.test(checklist), 'checklist covers Hear the words');
assert(/Pause/i.test(checklist), 'checklist covers Pause');
assert(/grown-up view/i.test(checklist), 'checklist covers grown-up view');
assert(/input mode/i.test(checklist), 'checklist records input mode');
assert(/return interest/i.test(checklist), 'checklist asks about return interest');
assert(/separate from the app|separate from app/i.test(checklist), 'checklist keeps adult posture/fingers separate');

const grownup = read(`${packDir}/grown-up-prompt.md`);
assert(/not.*grade|no grade|not a report card/i.test(grownup), 'grown-up prompt avoids grading language');
assert(/off the screen|paper|real piano/i.test(grownup), 'grown-up prompt has one offline idea');

const recruiting = read(`${packDir}/recruiting-notes.md`);
assert(recruiting.includes('DO NOT SEND until Mitch authorizes outreach'), 'recruiting notes block send until Mitch says go');
assert(/consent|privacy/i.test(recruiting), 'recruiting notes cover consent/privacy');
assert(/no recording upload/i.test(recruiting), 'recruiting notes forbid recording upload');
assert(/minimize|minimal/i.test(recruiting), 'recruiting notes minimize child data');

const packet = read('docs/missions/first-piano-journey-release.md');
assert(packet.includes('docs/pilots/first-piano-journey-v1') || packet.includes('../pilots/first-piano-journey-v1'), 'release packet points at the v1 pilot pack');
assert(packet.includes('Do not contact'), 'release packet still blocks outreach');

const home = read('dist/index.html');
const appJs = read('dist/app.js');
assert(home.includes('Start First Piano Journey'), 'home hero primary CTA is Start First Piano Journey');
assert(/href="\/learn\/?" class="button button-dark hero-cta"/.test(home), 'hero primary points at /learn');
assert(home.includes('Play the mini adventure'), 'home keeps a secondary mini-adventure path');
assert(home.includes('Saved on this device · short jobs · grown-up nearby for setup.'), 'home CTA microcopy is honest');
assert(home.includes('Continue into First Piano Journey'), 'celebration continues into the journey');
assert(/id="explore-button"[^>]*href="\/learn\/?"/.test(home) || home.includes('href="/learn/" id="explore-button"'), 'celebration CTA points at /learn');
assert(!home.includes('See what’s next'), 'celebration no longer says See what’s next');
assert(home.includes('>Journey <'), 'header button is Journey');
assert(/href="\/learn\/?" class="button button-small button-dark"/.test(home), 'header Journey points at /learn');
assert(/href="\/learn">Learn</.test(home), 'nav Learn stays');
assert(home.includes('learn-entry-primary') && home.includes('Start First Piano Journey'), 'learn-entry leads with Start First Piano Journey');
assert(!/learn-entry">Want the real first lessons\? <a href="\/learn">Open First Notes</.test(home), 'learn-entry is not only Open First Notes');
assert(home.includes('/learn/?unit=left-hand'), 'home still deep-links Left hand');
assert(home.includes('/learn/?unit=together'), 'home still deep-links Together');
assert(home.includes('/learn/?unit=expression'), 'home still deep-links Expression');
assert(home.includes('data-copyright-year') && home.includes('Xpancom, LLC'), 'home copyright stays');

const worldBlock = appJs.slice(appJs.indexOf('const worlds'), appJs.indexOf('const names'));
assert(worldBlock.includes("learnHref:'/learn/?unit=first-notes'"), 'world 01 links the live First Notes unit');
assert(worldBlock.includes("learnHref:'/learn/?unit=rhythm-club'"), 'world 02 links the live Rhythm Club unit');
assert(!/WORLD 03[\s\S]*learnHref/.test(worldBlock), 'marketing world 03 has no playable /learn claim');
assert(!/WORLD 04[\s\S]*learnHref/.test(worldBlock), 'marketing world 04 has no playable /learn claim');
assert(!/WORLD 05[\s\S]*learnHref/.test(worldBlock), 'marketing world 05 has no playable /learn claim');

const bannedHome = ['limited time', 'only today', 'buy now', 'teacher approved', 'grade 1', 'midi-verified'];
const homeLower = home.toLowerCase();
for (const phrase of bannedHome) {
  assert(!homeLower.includes(phrase), `home must not say ${phrase}`);
}

const fresh = recommendNext(emptyStore(), { isNew: true, sessionId: 'fresh' });
assert(fresh.lessonId === 'L01' && fresh.action === 'Start Meet the keyboard', 'fresh hub recommends Start Meet the keyboard');

const hubJs = read('dist/js/learn-view.js');
assert(hubJs.includes("'Start Meet the keyboard'"), 'hub primary on a fresh device is Start Meet the keyboard');
assert(hubJs.includes('Continue ${continueCard.title}'), 'hub primary with progress continues the next unlocked lesson');
assert(hubJs.includes("hub-grownup"), 'hub shows Grown-up view beside the continue card');
assert(hubJs.includes('hub-continue'), 'hub continue is a strong button');
assert(hubJs.includes("href: '/learn/?view=grown-up'"), 'hub secondary is Grown-up view');

const learnHtml = read('dist/learn/index.html');
assert(learnHtml.includes('device-disclosure'), 'learn keeps the yellow disclosure');
assert(learnHtml.includes('id="kid-target"'), 'learn keeps yellow jobs');
assert(learnHtml.includes('Xpancom, LLC'), 'learn copyright stays');

console.log('pilot pack and CTA checks passed');
