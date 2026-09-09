import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_KEY, createProgress, emptyStore } from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';
import {
  FIRST_NOTES_LESSONS,
  LEFT_HAND_LESSONS,
  READ_AND_PLAY_LESSONS,
  RHYTHM_CLUB_LESSONS,
  TOGETHER_LESSONS,
  isLessonUnlocked,
  parseLessonId,
  parseUnitId,
  unitView
} from '../dist/js/unit.js';
import { BASS_CLEF, TREBLE_CLEF, staffAgrees } from '../dist/js/staff.js';
import { pianoRangeFor } from '../dist/js/hands.js';
import { togetherHonesty } from '../dist/js/evidence.js';
import { HOME_NOTES as L17_HOME, HOME_PATTERN as L17_HOME_PATTERN, L17, TRANSFER_NOTES as L17_TRANSFER } from '../dist/js/lessons/l17.js';
import { HEAD_UNTIL, HOME_NOTES as L18_HOME, HOME_PATTERN as L18_HOME_PATTERN, L18 } from '../dist/js/lessons/l18.js';
import { HOME_NOTES as L19_HOME, HOME_PATTERN as L19_HOME_PATTERN, L19 } from '../dist/js/lessons/l19.js';
import { HOME_EVENTS as L20_HOME_EVENTS, HOME_NOTES as L20_HOME, HOME_PATTERN as L20_HOME_PATTERN, L20 } from '../dist/js/lessons/l20.js';
import { createRhythmTake, eventsForPart, eventsUntilBeat } from '../dist/js/rhythm-score.js';
import { HOME_PATTERN as L16_HOME } from '../dist/js/lessons/l16.js';

const fixtures = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/mp-08-together.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function memoryStorage(seed) {
  const data = seed ? { [STORAGE_KEY]: seed } : {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; }
  };
}

function seedLesson(storage, lessonId, evidenceState) {
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
      attemptId: `seed-${lessonId}`,
      lessonId,
      curriculumVersion: 'beginner-v1',
      startedAt: '2026-09-09T00:00:00.000Z',
      completedAt: '2026-09-09T00:10:00.000Z',
      inputMode: 'touch',
      inputDevice: null,
      audioUnlocked: true,
      phase: 'result',
      evidenceState,
      events: [],
      adultObserved: {},
      octavePolicyUsed: 'exact-pitch',
      exportable: true,
      restore: {}
    }] : []
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function seedThrough(storage, lastId, lastState = 'independent') {
  const order = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20'];
  for (const id of order) {
    const practicedGate = ['L01', 'L02', 'L05', 'L06', 'L09', 'L10', 'L13', 'L14', 'L17', 'L18'];
    const state = id === lastId ? lastState : (practicedGate.includes(id) ? 'practiced' : 'independent');
    seedLesson(storage, id, state);
    if (id === lastId) break;
  }
}

function playTake(pattern, pitchesAt, { stickyAlign = true, scoreReleases = false, octavePolicy = 'exact-pitch', mode = 'performance' } = {}) {
  const take = createRhythmTake({
    pattern: { ...pattern, bpm: pattern.bpm || 72 },
    mode,
    now: (() => { let t = 80; return () => t; })(),
    octavePolicy,
    scoreReleases,
    stickyAlign
  });
  take.startAtOrigin(80);
  const beat = 60 / (pattern.bpm || 72);
  for (const event of pitchesAt) {
    take.noteOn(event.pitch, 80 + event.at * beat);
    if (event.off != null) take.noteOff(event.pitch, 80 + event.off * beat);
  }
  return take.finalize(80 + 12 * beat);
}

assert(parseLessonId('L17') === 'L17', 'parse L17');
assert(parseLessonId('L20') === 'L20', 'parse L20');
assert(parseLessonId('L21') == null, 'no L21');
assert(parseUnitId('together') === 'together', 'unit id');
assert(FIRST_NOTES_LESSONS.length === 4, 'First Notes stays L01–L04');
assert(RHYTHM_CLUB_LESSONS.map((item) => item.lessonId).join() === 'L05,L06,L07,L08', 'Rhythm Club stays L05–L08');
assert(READ_AND_PLAY_LESSONS.map((item) => item.lessonId).join() === 'L09,L10,L11,L12', 'Read and play stays L09–L12');
assert(LEFT_HAND_LESSONS.map((item) => item.lessonId).join() === 'L13,L14,L15,L16', 'Left hand stays L13–L16');
assert(TOGETHER_LESSONS.map((item) => item.lessonId).join() === 'L17,L18,L19,L20', 'Together is L17–L20');

assert(staffAgrees(L17_HOME, fixtures.firstTogether), 'L17 home pitch/duration/clef agree');
assert(staffAgrees(L17_TRANSFER, fixtures.neighborsTogether), 'L17 transfer agrees');
assert(staffAgrees(L18_HOME, fixtures.keepGoing), 'L18 walk agrees');
assert(staffAgrees(L19_HOME, fixtures.smallHarmony), 'L19 harmony agrees');
assert(staffAgrees(L20_HOME, fixtures.littlePiece), 'L20 piece agrees');
assert(L17_HOME.some((note) => note.clef === BASS_CLEF) && L17_HOME.some((note) => note.clef === TREBLE_CLEF), 'L17 grand staff');
assert(L19_HOME.some((note) => note.midi === 67), 'L19 uses G4 in five-finger place');
assert(L20_HOME_EVENTS.some((event) => event.length === 'long' && event.pitch === 48), 'L20 holds bass C');
assert(L20.scoreReleases === true, 'L20 scores releases');
assert(HEAD_UNTIL === 2, 'L18 loops the first two beats');

const range = pianoRangeFor('L17');
assert(range.from === 48 && range.to === 71 && range.wide === true, 'Together uses the two named rooms');
assert(pianoRangeFor('L01').wide === false, 'L01 stays one octave');
assert(togetherHonesty('touch').includes('exploration stand-in'), 'touch is a stand-in');
assert(togetherHonesty('midi').includes('not proof of hand coordination'), 'MIDI is not coordination proof');

const empty = createProgress(memoryStorage());
assert(!isLessonUnlocked(empty.read().store, 'L17'), 'L17 locked until L16 Independent');

const ready = memoryStorage();
seedThrough(ready, 'L15', 'independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L17'), 'still locked without L16 Independent');
seedLesson(ready, 'L16', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L17'), 'L17 unlocks after L16 Independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L18'), 'L18 locked until L17 practiced');
seedLesson(ready, 'L17', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L18'), 'L18 after L17 practiced');
seedLesson(ready, 'L18', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L19'), 'L19 after L18 practiced');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L20'), 'L20 needs L19 Independent');
seedLesson(ready, 'L19', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L20'), 'L20 after L19 Independent');

const hub = unitView(createProgress(ready).read().store);
assert(hub.units.length === 5, 'five worlds');
assert(hub.units[4].unlocked, 'Together unlocked after Left hand');
assert(hub.units[4].cards.every((card) => ['L17', 'L18', 'L19', 'L20'].includes(card.lessonId)), 'together cards');
assert(!hub.units.some((unit) => unit.cards.some((card) => card.lessonId === 'L21')), 'no L21 cards');

const rhFirst = playTake(L17_HOME_PATTERN, [
  { pitch: 60, at: 0.02 },
  { pitch: 48, at: 0.04 },
  { pitch: 64, at: 2.02 },
  { pitch: 48, at: 2.04 }
]);
assert(rhFirst.passed === true, 'simultaneous group accepts either hand first');

const sticky = playTake(L17_HOME_PATTERN, [
  { pitch: 62, at: 0.02 },
  { pitch: 48, at: 0.05 },
  { pitch: 60, at: 0.08 },
  { pitch: 48, at: 2.02 },
  { pitch: 64, at: 2.04 }
]);
assert(sticky.passed === false, 'wrong extra fails the take');
assert(sticky.hits.filter((hit) => hit?.result === 'hit').length === 4, 'wrong note does not consume later pairs');
assert(sticky.extras.some((item) => item.reason === 'wrong-pitch'), 'wrong note is recorded as extra');

const extraTap = playTake(L19_HOME_PATTERN, [
  { pitch: 48, at: 0.02 },
  { pitch: 64, at: 0.04 },
  { pitch: 62, at: 0.2 },
  { pitch: 48, at: 2.02 },
  { pitch: 67, at: 2.04 }
]);
assert(extraTap.passed === false, 'extra note fails the take');
assert(extraTap.hits.filter((hit) => hit?.result === 'hit').length === 4, 'extra does not skip the next harmony');

const loop = eventsUntilBeat(L18_HOME_PATTERN.events, 2);
assert(loop.length === 4 && loop.every((event) => event.onsetBeats < 2), 'small passage is the first two clicks');
assert(eventsForPart(L18_HOME_PATTERN.events, 'left').every((event) => event.part === 'left'), 'left prep keeps only the bass');

const held = playTake(L20_HOME_PATTERN, [
  { pitch: 48, at: 0, off: 4.1 },
  { pitch: 60, at: 0.02 },
  { pitch: 62, at: 1.02 },
  { pitch: 64, at: 2.02 },
  { pitch: 60, at: 3.02 },
  { pitch: 48, at: 4.02 },
  { pitch: 64, at: 4.04 },
  { pitch: 48, at: 6.02 },
  { pitch: 60, at: 6.04 }
], { scoreReleases: true });
assert(held.passed === true, 'held bass under melody plus landings passes');

const shortHold = playTake(L20_HOME_PATTERN, [
  { pitch: 48, at: 0, off: 0.4 },
  { pitch: 60, at: 0.02 },
  { pitch: 62, at: 1.02 },
  { pitch: 64, at: 2.02 },
  { pitch: 60, at: 3.02 },
  { pitch: 48, at: 4.02 },
  { pitch: 64, at: 4.04 },
  { pitch: 48, at: 6.02 },
  { pitch: 60, at: 6.04 }
], { scoreReleases: true });
assert(shortHold.passed === false, 'short hold fails');
assert(shortHold.hits.some((hit) => hit?.release?.result === 'too-short'), 'release event is scored');

const strayRelease = createRhythmTake({
  pattern: { ...L20_HOME_PATTERN, bpm: 72 },
  mode: 'performance',
  now: (() => { let t = 90; return () => t; })(),
  octavePolicy: 'exact-pitch',
  scoreReleases: true,
  stickyAlign: true
});
strayRelease.startAtOrigin(90);
assert(strayRelease.noteOff(67, 90.1).ignore === true, 'extra release of an unheld key is ignored');

const dumped = playTake(L16_HOME, [
  { pitch: 48, at: 0 },
  { pitch: 60, at: 0.1 },
  { pitch: 62, at: 0.2 },
  { pitch: 64, at: 0.3 },
  { pitch: 60, at: 0.4 }
], { stickyAlign: false, octavePolicy: 'exact-pitch' });
assert(dumped.passed === false, 'prior L16 dumped letters still fail');

const l17 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L17' });
l17.advanceFrom('explanation');
l17.advanceFrom('demo');
assert(l17.view().guidedStep === 'left', 'L17 starts with left preparation');
assert(l17.view().staff.grand === true, 'L17 shows both clefs');
assert(l17.view().togetherStandIn.includes('exploration stand-in'), 'on-screen labeled as stand-in');
const blocked = l17.startTake('guided', { step: 'together' });
assert(blocked.blocked === true, 'together try waits for per-hand prep');
const leftTake = createRhythmTake({
  pattern: { ...L17_HOME_PATTERN, events: eventsForPart(L17_HOME_PATTERN.events, 'left'), bpm: 72 },
  mode: 'guided',
  now: (() => { let t = 30; return () => t; })(),
  octavePolicy: 'pitch-class',
  stickyAlign: true
});
leftTake.startAtOrigin(30);
const beat = 60 / 72;
leftTake.noteOn(48, 30);
leftTake.noteOn(48, 30 + 2 * beat);
assert(leftTake.finalize(30 + 5 * beat).passed === true, 'left prep pattern passes');

l17.setHandFocus('left');
assert(l17.view().phase === 'guided' && l17.view().guidedStep === 'left', 'hand focus keeps the step');
l17.setHandMark(true);
assert(l17.view().attempt.adultObserved.hand === true, 'hand mark is adult-observed');
assert(l17.view().attempt.events.every((event) => event.heard == null || typeof event.heard === 'number'), 'events store pitch/time, not hand');
assert(l17.view().sourceHonesty.includes('exploration stand-in'), 'Together honesty is on-screen stand-in');

const l18 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L18' });
l18.advanceFrom('explanation');
l18.advanceFrom('demo');
assert(l18.view().lessonSpec.copy.guided.loop, 'L18 offers a small loop');
assert(l18.view().lessonSpec.reducedBpm < l18.view().lessonSpec.defaultBpm, 'slow practice exists');

const midis = [...L17.homeNotes, ...L18.homeNotes, ...L19.homeNotes, ...L20.homeNotes].map((note) => note.midi);
assert(midis.every((midi) => midi >= 48 && midi <= 67), 'declared range is C3–G4; no stretch past G4');

console.log('mp-08 checks passed');
