import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_KEY, createProgress, emptyStore } from '../dist/js/progress.js';
import { JOURNEY_LESSONS, isLessonUnlocked } from '../dist/js/unit.js';
import { exportProgress, importProgress, resetProgress } from '../dist/js/portability.js';
import { hasKidTarget, kidLine, kidSpoken, kidTarget } from '../dist/js/kid-copy.js';
import { createNarrator, NARRATION_FAIL_COPY, NARRATION_UNAVAILABLE_COPY, narrationAvailable } from '../dist/js/narrate.js';
import { PAUSE_KEY, clearPause, readPause, resumeHref, validatePause, writePause } from '../dist/js/session-pause.js';
import { GROWNUP_HONESTY, grownupReport, observedLessons, suggestOfflinePractice } from '../dist/js/grownup.js';
import { parseGrownupView } from '../dist/js/learn-view.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function memoryStorage(seed) {
  const data = seed ? { ...seed } : {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; }
  };
}

function seedLesson(storage, lessonId, evidenceState, extras = {}) {
  let store = emptyStore();
  const raw = storage.getItem(STORAGE_KEY);
  if (raw) store = JSON.parse(raw);
  store.lessons[lessonId] = {
    lessonId,
    evidenceState,
    currentAttemptId: null,
    firstCompletionRewarded: evidenceState === 'independent' || evidenceState === 'retained',
    firstCompletedAt: evidenceState === 'independent' ? '2026-09-09T00:00:00.000Z' : null,
    attempts: evidenceState ? [{
      attemptId: extras.attemptId || `seed-${lessonId}`,
      lessonId,
      curriculumVersion: 'beginner-v1',
      startedAt: '2026-09-09T00:00:00.000Z',
      completedAt: '2026-09-09T00:10:00.000Z',
      inputMode: extras.inputMode || 'touch',
      inputDevice: null,
      audioUnlocked: true,
      phase: 'result',
      evidenceState,
      events: [],
      adultObserved: extras.adultObserved || {},
      octavePolicyUsed: 'exact-pitch',
      exportable: true,
      restore: {}
    }] : []
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function seedThrough(storage, lastId, lastState = 'independent') {
  const practicedGate = ['L01', 'L02', 'L05', 'L06', 'L09', 'L10', 'L13', 'L14', 'L17', 'L18', 'L21', 'L22'];
  for (const card of JOURNEY_LESSONS) {
    const state = card.lessonId === lastId ? lastState : (practicedGate.includes(card.lessonId) ? 'practiced' : 'independent');
    seedLesson(storage, card.lessonId, state);
    if (card.lessonId === lastId) break;
  }
}

for (const card of JOURNEY_LESSONS) {
  assert(hasKidTarget(card.lessonId), `${card.lessonId} has child-facing copy`);
  assert(kidTarget(card.lessonId, 'guided').length <= 48, `${card.lessonId} guided target stays short`);
}

const l01 = kidLine({ lessonSpec: { lessonId: 'L01', title: 'Meet the keyboard' }, phase: 'guided', guidedStep: 'high-low' });
assert(l01 === 'Play high. Then play low.', 'L01 high-low is a short job');
assert(kidSpoken({ lessonSpec: { lessonId: 'L04', title: 'First little tune' }, phase: 'independent', independentStep: 'home' }).includes('Little Wave'), 'spoken line names the job');
assert(kidTarget('L99', 'guided') === 'Your turn. Follow the yellow job.', 'unknown lesson falls back');

assert(narrationAvailable({}) === false, 'missing speech engine is unavailable');
const silent = createNarrator({});
const fail = silent.speak('Play high. Then play low.');
assert(fail.ok === false && fail.reason === 'unavailable', 'narration failure is honest');
assert(fail.text === 'Play high. Then play low.', 'failed speak still returns the words');
assert(NARRATION_FAIL_COPY.includes('Words stay on the screen'), 'fail copy keeps visual usable');
assert(NARRATION_UNAVAILABLE_COPY.includes('still read them'), 'unavailable copy keeps visual usable');

let spoke = '';
const fakeSynth = {
  cancel() {},
  speak(utterance) { spoke = utterance.text; }
};
class FakeUtterance {
  constructor(text) { this.text = text; }
}
const voice = createNarrator({ speechSynthesis: fakeSynth, SpeechSynthesisUtterance: FakeUtterance });
assert(voice.speak('Tap a clump of two.').ok, 'available engine speaks');
assert(spoke === 'Tap a clump of two.', 'spoken text matches');
assert(voice.replay().ok && spoke === 'Tap a clump of two.', 'replay uses last text');

assert(validatePause({ lessonId: 'nope' }) === null, 'bad pause rejected');
const pauseStore = memoryStorage();
assert(readPause(pauseStore) === null, 'empty pause');
const saved = writePause({ lessonId: 'L08', phase: 'guided', takeWasLive: true }, pauseStore);
assert(saved.lessonId === 'L08', 'pause stores lesson');
assert(pauseStore.getItem(PAUSE_KEY).includes('L08'), 'pause key written');
assert(resumeHref(saved) === '/learn/?lesson=L08&resume=1', 'resume href');
assert(clearPause(pauseStore) === true, 'pause clears');
assert(readPause(pauseStore) === null, 'cleared pause is empty');

assert(parseGrownupView('grown-up') === true, 'grown-up view query');
assert(parseGrownupView('child') === false, 'child is not grown-up view');
assert(GROWNUP_HONESTY.includes('not privacy protection'), 'honesty rejects privacy-product framing');
assert(GROWNUP_HONESTY.includes('not a login'), 'honesty rejects accounts');

const emptyReport = grownupReport(emptyStore());
assert(emptyReport.observed.length === 0, 'fresh device invents no skills');
assert(emptyReport.practice.activity.includes('black keys') || emptyReport.practice.lessonId === 'L01', 'empty device still suggests one offline job');
assert(emptyReport.notPrivacyProduct === true, 'report flags not-privacy-product');
assert(emptyReport.deviceOnly === true, 'report is device-local');

const seeded = memoryStorage();
seedLesson(seeded, 'L01', 'practiced', { adultObserved: { posture: true } });
seedLesson(seeded, 'L03', 'independent', { adultObserved: { fingering: true } });
const report = grownupReport(JSON.parse(seeded.getItem(STORAGE_KEY)));
assert(report.observed.map((row) => row.lessonId).join() === 'L01,L03', 'only attempted lessons appear');
assert(!report.observed.some((row) => row.lessonId === 'L24'), 'unattempted L24 is not listed');
const posture = report.observed[0].skills.find((skill) => skill.skillId === 'S-POSTURE');
assert(posture.adultObserved === true && posture.adultMarked === true, 'adult-observed sitting is reported');
assert(report.practice.activity && report.practice.activity.indexOf('.') > 0, 'one offline practice sentence');
assert(suggestOfflinePractice(JSON.parse(seeded.getItem(STORAGE_KEY))).activity === report.practice.activity, 'single practice helper');
assert(observedLessons(JSON.parse(seeded.getItem(STORAGE_KEY))).length === 2, 'observed lesson count');

const progress = createProgress(seeded);
const bundle = exportProgress(progress.read().store);
assert(bundle.kind === 'meetpiano-progress', 'export kind stays MP-06');
const resetStore = resetProgress();
assert(Object.keys(resetStore.lessons).length === 0, 'reset is empty');
progress.write(resetStore);
assert(!progress.read().store.lessons.L01, 'reset write clears L01');
const imported = importProgress(bundle, progress.read().store);
assert(imported.ok, 'import after reset restores');
assert(imported.store.lessons.L01.evidenceState === 'practiced', 'import cannot invent higher than exported');
assert(imported.store.lessons.L03.evidenceState === 'independent', 'import keeps Independent that was earned');

const allReady = memoryStorage();
seedThrough(allReady, 'L24', 'independent');
const full = createProgress(allReady).read().store;
for (const card of JOURNEY_LESSONS) {
  assert(isLessonUnlocked(full, card.lessonId), `${card.lessonId} reachable when prerequisites are met`);
}
assert(JOURNEY_LESSONS.length === 24, 'all 24 lessons remain authored');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const learnHtml = readFileSync(join(root, 'dist/learn/index.html'), 'utf8');
const learnJs = readFileSync(join(root, 'dist/learn/learn.js'), 'utf8');
const learnCss = readFileSync(join(root, 'dist/learn/learn.css'), 'utf8');
const grownupJs = readFileSync(join(root, 'dist/js/grownup.js'), 'utf8');
const scan = `${learnHtml}\n${learnJs}\n${learnCss}\n${grownupJs}`;
for (const banned of ['mailto:', 'type="email"', 'gtag(', 'googletagmanager', 'facebook.net', 'adsbygoogle', 'stripe', 'billing', 'upload recording', 'chat widget', 'public profile']) {
  assert(!scan.toLowerCase().includes(banned.toLowerCase()), `learn surface has no ${banned}`);
}
assert(learnHtml.includes('id="kid-target"'), 'kid target is in the lesson shell');
assert(learnHtml.includes('id="pause-button"'), 'pause control is present');
assert(learnHtml.includes('id="exit-button"'), 'exit control is present');
assert(learnHtml.includes('id="resume-button"'), 'resume control is present');
assert(learnHtml.includes('id="pause-overlay"'), 'pause overlay is present');
assert(learnHtml.includes('id="grownup-shell"'), 'grown-up shell is present');
assert(learnHtml.includes('view=grown-up'), 'grown-up view is linked');
assert(learnHtml.includes('data-copyright-year'), 'copyright hook stays');
assert(learnHtml.includes('Xpancom, LLC'), 'copyright entity stays');
assert(learnCss.includes('prefers-reduced-motion'), 'reduced motion is styled');
assert(learnCss.includes('min-height: 44px'), 'touch targets are at least 44px');
assert(!learnCss.includes('lime'), 'no lime green');
assert(!/#00f|#4f46|#6366|linear-gradient/i.test(learnCss), 'no blue/purple gradient restyle');
assert(learnCss.includes('#ffdc63') || learnHtml.includes('theme-color" content="#ffdc63"'), 'MeetPiano yellow stays');

console.log('mp-10 kid and grown-up UX checks passed');
