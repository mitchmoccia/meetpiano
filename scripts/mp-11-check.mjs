import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOURNEY_LESSONS, unitView } from '../dist/js/unit.js';
import { emptyStore } from '../dist/js/progress.js';
import { exportProgress, importProgress } from '../dist/js/portability.js';
import { hasKidTarget } from '../dist/js/kid-copy.js';
import { GROWNUP_HONESTY } from '../dist/js/grownup.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const leftoverTitles = [
  'Meeting at middle C',
  'A longer C-neighborhood tune',
  'Smooth and separate',
  'Same tune, new fingers',
  'Left hand holds C',
  'Three-black-key landmark'
];

const bannedLearnCopy = [
  'teacher approved',
  'educator-approved',
  'grade 1 complete',
  'guaranteed improvement',
  'full beginner proficiency',
  'midi-verified release',
  'hardware midi verified'
];

assert(JOURNEY_LESSONS.length === 24, 'catalog stays L01–L24');
assert(JOURNEY_LESSONS[0].lessonId === 'L01' && JOURNEY_LESSONS[23].lessonId === 'L24', 'ids stay L01 then L24');
assert(!JOURNEY_LESSONS.some((card) => leftoverTitles.includes(card.title)), 'leftover outlines stay unbound');

const fresh = unitView(emptyStore());
assert(fresh.units.length === 6, 'six /learn worlds');
assert(fresh.units.map((unit) => unit.unitId).join() === 'first-notes,rhythm-club,read-and-play,left-hand,together,expression', 'world order');
assert(fresh.units[0].unlocked === true, 'First Notes is open');
assert(fresh.units.slice(1).every((unit) => unit.unlocked === false), 'later worlds stay locked on a fresh device');
assert(fresh.units.flatMap((unit) => unit.cards).length === 24, 'hub lists 24 cards');

for (const card of JOURNEY_LESSONS) {
  assert(hasKidTarget(card.lessonId), `${card.lessonId} still has a child job`);
}

const bundle = exportProgress(emptyStore());
assert(bundle.kind === 'meetpiano-progress', 'export kind stays MP-06');
const imported = importProgress(bundle, emptyStore());
assert(imported.ok, 'empty export still imports');
assert(!imported.store.lessons.L24, 'import cannot invent L24');

assert(GROWNUP_HONESTY.includes('not privacy protection'), 'grown-up honesty stays');
assert(GROWNUP_HONESTY.includes('not a login'), 'grown-up view is not an account');

const learnHtml = read('dist/learn/index.html');
const learnJs = read('dist/learn/learn.js');
const learnCss = read('dist/learn/learn.css');
const indexHtml = read('dist/index.html');
const readme = read('README.md');
const packet = read('docs/missions/first-piano-journey-release.md');
const evidence = read('docs/evidence/first-piano-journey/mp-11.md');
const slices = read('docs/missions/first-piano-journey-slices.md');
const status = read('docs/missions/first-piano-journey-status.md');
const runbook = read('docs/missions/first-piano-journey.md');

const learnSurface = `${learnHtml}\n${learnJs}\n${learnCss}`.toLowerCase();
for (const phrase of bannedLearnCopy) {
  assert(!learnSurface.includes(phrase), `/learn must not claim ${phrase}`);
}

assert(learnHtml.includes('Not a teacher. Not a grade.'), 'learn footer rejects teacher/grade claims');
assert(learnHtml.includes('Physical MIDI hardware is not claimed as verified'), 'learn MIDI honesty stays');
assert(learnHtml.includes('id="grownup-shell"'), 'grown-up view shell stays');
assert(learnHtml.includes('id="kid-target"'), 'kid job stays');
assert(learnHtml.includes('data-copyright-year') && learnHtml.includes('Xpancom, LLC'), 'copyright stays');
assert(indexHtml.includes('data-copyright-year') && indexHtml.includes('Xpancom, LLC'), 'home copyright stays');
assert(indexHtml.includes('/learn/?unit=left-hand'), 'home points at Left hand');
assert(indexHtml.includes('/learn/?unit=together'), 'home points at Together');
assert(indexHtml.includes('/learn/?unit=expression'), 'home points at Expression');
assert(/href="\/learn">Learn</.test(indexHtml), 'home nav names Learn, not only First Notes');

assert(readme.includes('scripts/mp-11-check.mjs'), 'README lists the MP-11 check');
assert(packet.includes('Merge order'), 'release packet has merge order');
assert(packet.includes('Post-merge verification'), 'release packet has post-merge checklist');
assert(packet.includes('Pilot packet'), 'release packet has educator/learner scripts');
assert(packet.includes('Do not contact'), 'pilot packet stays materials-only');
assert(/hardware MIDI/i.test(packet), 'packet records hardware MIDI as unverified');
assert(/engineering preview/i.test(packet), 'packet labels engineering-preview status');
assert(/learning validation pending/i.test(packet), 'packet does not claim learning validation');
assert(packet.includes('must not claim'), 'packet forbids overclaim copy');
assert(packet.includes('tests alone do not authorize a live release'), 'packet forbids releasing from tests alone');
assert(evidence.includes('Recovery'), 'evidence has a recovery plan');
assert(evidence.includes('public-copy'), 'evidence records public-copy constraints');
assert(slices.includes('Validate, correct, and release the journey'), 'slice card uses the closeout title');
assert(status.includes('MP-11'), 'status board is on MP-11');
assert(runbook.includes('Validate, correct, and release the journey'), 'runbook slice index matches the closeout title');
assert(runbook.includes('Mitch approval'), 'runbook still gates merge/deploy');

console.log('mp-11 release packet checks passed');
