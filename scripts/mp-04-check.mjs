import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_KEY, createProgress, emptyStore } from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';
import {
  FIRST_NOTES_LESSONS,
  RHYTHM_CLUB_LESSONS,
  isLessonUnlocked,
  parseLessonId,
  parseUnitId,
  unitView
} from '../dist/js/unit.js';
import { beatsToSeconds, createFakeClock, createRhythmClock } from '../dist/js/rhythm-clock.js';
import { createRhythmTake } from '../dist/js/rhythm-score.js';
import { HEARTBEAT } from '../dist/js/lessons/l05.js';
import { LONG_SHORT, SHORT_SHORT_LONG } from '../dist/js/lessons/l06.js';
import { REST_HOME } from '../dist/js/lessons/l07.js';
import { WALK_EVEN, WALK_LONG_HEAD } from '../dist/js/lessons/l08.js';

const fixtures = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/mp-04-rhythm.json'), 'utf8'));

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
      octavePolicyUsed: 'pitch-class',
      exportable: true,
      restore: {}
    }] : []
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function playPattern(take, clock, pattern, { offsetMs = 0, pitches, skipFinalize = false } = {}) {
  const beat = beatsToSeconds(1, pattern.bpm);
  const notes = pattern.events.filter((event) => event.kind === 'note');
  notes.forEach((event, index) => {
    clock.set(take.origin + event.onsetBeats * beat + offsetMs / 1000);
    take.noteOn(pitches?.[index] ?? event.pitch, clock.now());
    if (event.length) {
      clock.set(clock.now() + beatsToSeconds(event.durationBeats, pattern.bpm));
      take.noteOff(event.pitch, clock.now());
    }
  });
  if (!skipFinalize) {
    clock.set(take.origin + beatsToSeconds(4.5, pattern.bpm));
    return take.finalize(clock.now());
  }
  return take.snapshot();
}

assert(parseLessonId('L05') === 'L05', 'parse L05');
assert(parseLessonId('L08') === 'L08', 'parse L08');
assert(parseLessonId('L09') == null, 'no L09');
assert(parseUnitId('rhythm-club') === 'rhythm-club', 'unit id');
assert(FIRST_NOTES_LESSONS.length === 4, 'First Notes stays L01–L04');
assert(RHYTHM_CLUB_LESSONS.map((item) => item.lessonId).join() === 'L05,L06,L07,L08', 'Rhythm Club is L05–L08');

const empty = createProgress(memoryStorage());
assert(!isLessonUnlocked(empty.read().store, 'L05'), 'L05 locked until L04 Independent');

const ready = memoryStorage();
['L01', 'L02', 'L03'].forEach((id, index) => seedLesson(ready, id, index === 2 ? 'independent' : 'practiced'));
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L05'), 'still locked without L04');
seedLesson(ready, 'L04', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L05'), 'L05 unlocks after L04 Independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L06'), 'L06 locked until L05 practiced');
seedLesson(ready, 'L05', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L06'), 'L06 after L05 practiced');
seedLesson(ready, 'L06', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L07'), 'L07 after L06 practiced');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L08'), 'L08 needs L07 Independent');
seedLesson(ready, 'L07', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L08'), 'L08 after L07 Independent');

const hub = unitView(createProgress(ready).read().store);
assert(hub.units.length === 2, 'two worlds');
assert(hub.units[0].cards.length === 4 && hub.units[1].cards.length === 4, 'four cards each');
assert(hub.units[1].unlocked, 'Rhythm Club unlocked after First Notes');
assert(!hub.cards.some((card) => card.lessonId === 'L09'), 'no later lesson cards');

const clock = createFakeClock(10);
const heartbeat = fixtures.heartbeat;
const correct = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0 },
  mode: 'performance',
  now: () => clock.now()
});
correct.startAtOrigin(10);
const correctSnap = playPattern(correct, clock, { ...heartbeat, bpm: 80 });
assert(correctSnap.passed, 'correct heartbeat passes');

const early = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0 },
  mode: 'performance',
  now: () => clock.now()
});
early.startAtOrigin(20);
clock.set(20);
const earlySnap = playPattern(early, clock, heartbeat, { offsetMs: -200 });
assert(!earlySnap.passed && earlySnap.extras.some((item) => item.reason === 'early'), 'early taps fail');

const late = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0 },
  mode: 'performance',
  now: () => clock.now()
});
late.startAtOrigin(40);
const lateSnap = playPattern(late, clock, heartbeat, { offsetMs: 180 });
assert(!lateSnap.passed, 'late taps fail');

const missed = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0 },
  mode: 'performance',
  now: () => clock.now()
});
missed.startAtOrigin(60);
clock.set(60);
missed.noteOn(60, 60);
clock.set(60 + beatsToSeconds(5, 80));
const missSnap = missed.finalize(clock.now());
assert(!missSnap.passed && missSnap.misses.length >= 3, 'missed later beats fail');

const extra = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0 },
  mode: 'performance',
  now: () => clock.now()
});
extra.startAtOrigin(80);
clock.set(80);
extra.noteOn(60, 80);
extra.noteOn(60, 80.05);
const extraSnap = extra.finalize(80 + beatsToSeconds(5, 80));
assert(!extraSnap.passed && extraSnap.extras.length >= 1, 'extra note fails');

const countIn = createRhythmTake({
  pattern: heartbeat,
  mode: 'performance',
  now: () => clock.now()
});
countIn.start(100);
clock.set(100.2);
const ignored = countIn.noteOn(60, 100.2);
assert(ignored.reason === 'count-in', 'count-in notes are ignored');
clock.set(countIn.origin);
[0, 1, 2, 3].forEach((beat) => {
  clock.set(countIn.origin + beatsToSeconds(beat, 80));
  countIn.noteOn(60, clock.now());
});
const afterCount = countIn.finalize(countIn.origin + beatsToSeconds(5, 80));
assert(afterCount.passed, 'count-in ignore does not fail a later correct take');

const longTake = createRhythmTake({
  pattern: LONG_SHORT,
  mode: 'performance',
  now: () => clock.now(),
  scoreReleases: true
});
longTake.startAtOrigin(200);
const longOk = playPattern(longTake, clock, LONG_SHORT);
assert(longOk.passed, 'correct long-short-short passes');

const chopped = createRhythmTake({
  pattern: LONG_SHORT,
  mode: 'performance',
  now: () => clock.now(),
  scoreReleases: true
});
chopped.startAtOrigin(220);
clock.set(220);
chopped.noteOn(60, 220);
clock.set(220.2);
const choppedOff = chopped.noteOff(60, 220.2);
assert(choppedOff.result === 'too-short', 'early release on long note fails');

const restTake = createRhythmTake({
  pattern: REST_HOME,
  mode: 'performance',
  now: () => clock.now()
});
restTake.startAtOrigin(240);
clock.set(240);
restTake.noteOn(60, 240);
clock.set(240 + beatsToSeconds(1, 80));
const inRest = restTake.noteOn(60, clock.now());
assert(inRest.result === 'rest', 'note during rest is a rest extra');
const restSnap = restTake.finalize(240 + beatsToSeconds(5, 80));
assert(!restSnap.passed, 'filling the hole fails');

const restOk = createRhythmTake({
  pattern: REST_HOME,
  mode: 'performance',
  now: () => clock.now()
});
restOk.startAtOrigin(260);
const restPass = playPattern(restOk, clock, REST_HOME);
assert(restPass.passed, 'leaving the rest empty passes');

const walkOk = createRhythmTake({
  pattern: WALK_EVEN,
  mode: 'performance',
  now: () => clock.now(),
  octavePolicy: 'exact-pitch'
});
walkOk.startAtOrigin(280);
const walkPass = playPattern(walkOk, clock, WALK_EVEN);
assert(walkPass.passed, 'C-D-E-C on the beat passes');

const rushed = createRhythmTake({
  pattern: WALK_EVEN,
  mode: 'performance',
  now: () => clock.now(),
  octavePolicy: 'exact-pitch'
});
rushed.startAtOrigin(300);
clock.set(300);
rushed.noteOn(60, 300);
rushed.noteOn(62, 300.05);
rushed.noteOn(64, 300.1);
rushed.noteOn(60, 300.15);
const rushSnap = rushed.finalize(300 + beatsToSeconds(5, 80));
assert(!rushSnap.passed, 'correct pitches at arbitrary times fail');

const pauseClock = createFakeClock(400);
const pauseTake = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0 },
  mode: 'performance',
  now: () => pauseClock.now()
});
pauseTake.startAtOrigin(400);
pauseClock.set(400);
pauseTake.noteOn(60, 400);
pauseTake.pause();
pauseClock.advance(4);
assert(pauseTake.noteOn(60, pauseClock.now()).reason === 'paused', 'notes during pause ignored');
pauseTake.resume();
[1, 2, 3].forEach((beat) => {
  pauseClock.set(pauseTake.origin + beatsToSeconds(beat, 80));
  pauseTake.noteOn(60, pauseClock.now());
});
const pauseSnap = pauseTake.finalize(pauseTake.origin + beatsToSeconds(5, 80));
assert(pauseSnap.passed, 'pause/resume does not create an unfair fail');

const disconnect = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0 },
  mode: 'performance',
  now: () => clock.now()
});
disconnect.startAtOrigin(500);
clock.set(500);
disconnect.noteOn(60, 500);
const aborted = disconnect.abort('disconnect');
assert(aborted.aborted === 'disconnect' && aborted.unfairFailure && !aborted.passed, 'disconnect aborts without a scored miss');

const slow = createRhythmTake({
  pattern: { ...heartbeat, countInBeats: 0, bpm: 60 },
  mode: 'performance',
  now: () => clock.now()
});
slow.startAtOrigin(520);
const slowPass = playPattern(slow, clock, { ...heartbeat, bpm: 60 });
assert(slowPass.passed, 'tempo reduction still accepts on-beat taps');

const timerIds = [];
const scheduled = [];
const schedClock = createFakeClock(0);
const transport = createRhythmClock({
  now: () => schedClock.now(),
  setTimer: (fn) => {
    const id = timerIds.length + 1;
    timerIds.push({ id, fn });
    return id;
  },
  clearTimer: (id) => {
    const index = timerIds.findIndex((item) => item.id === id);
    if (index >= 0) timerIds.splice(index, 1);
  }
});
transport.start({ audioOrigin: 0, tempo: 80 });
transport.scheduleAt(0.5, () => scheduled.push('beat'));
assert(timerIds.length === 1, 'scheduler uses timers, not rAF');
transport.pause();
assert(timerIds.length === 0, 'pause cancels pending timers');
schedClock.advance(2);
transport.resume();
transport.scheduleAt(transport.audioTimeForBeat(1), () => scheduled.push('later'));
timerIds.forEach((item) => item.fn());
assert(scheduled.includes('later'), 'resume can reschedule on the audio clock');

function makePlayer(lessonId) {
  const fake = createFakeClock(0);
  const rhythmClock = createRhythmClock({ now: () => fake.now() });
  const player = createPlayer({
    progress: createProgress(memoryStorage()),
    lessonId,
    clock: rhythmClock,
    now: () => fake.now()
  });
  return { player, fake };
}

function runTake(player, fake, kind, pattern, pitches) {
  player.startTake(kind, { skipCountIn: true, origin: fake.now(), bpm: pattern.bpm });
  const beat = beatsToSeconds(1, pattern.bpm);
  const notes = pattern.events.filter((event) => event.kind === 'note');
  notes.forEach((event, index) => {
    fake.set(player.clock.origin + event.onsetBeats * beat);
    player.handleNote(pitches?.[index] ?? event.pitch, 'touch', { t: fake.now() });
    if (event.length) {
      fake.advance(beatsToSeconds(event.durationBeats, pattern.bpm));
      player.handleRelease(event.pitch, 'touch', { t: fake.now() });
    }
  });
  fake.set(player.clock.origin + beatsToSeconds(4.6, pattern.bpm));
  return player.completeIfReady(fake.now());
}

const l05 = makePlayer('L05');
l05.player.advanceFrom('explanation');
l05.player.advanceFrom('demo');
assert(l05.player.view().guidedStep === 'echo', 'L05 guided echo after demo');
const l05pass = runTake(l05.player, l05.fake, 'guided', HEARTBEAT);
assert(l05pass.passed, 'L05 guided take passes on the clock');
l05.player.advanceFrom('guided');
assert(l05.player.view().phase === 'independent', 'L05 independent');
assert(l05.player.view().hintsOn === false, 'independent hints off');
const l05ind = runTake(l05.player, l05.fake, 'independent', HEARTBEAT);
assert(l05ind.passed, 'L05 independent heartbeat');
l05.player.advanceFrom('independent');
const l05tr = runTake(l05.player, l05.fake, 'transfer', { ...HEARTBEAT, bpm: 96 });
assert(l05tr.passed, 'L05 quicker transfer');
l05.player.advanceFrom('transfer');
assert(l05.player.view().lesson.evidenceState === 'independent', 'L05 Independent');
l05.player.requestHelp();
assert(l05.player.view().lesson.evidenceState === 'independent', 'help does not erase Independent');

const l06 = makePlayer('L06');
l06.player.advanceFrom('explanation');
l06.player.advanceFrom('demo');
assert(runTake(l06.player, l06.fake, 'guided', LONG_SHORT).passed, 'L06 guided');
l06.player.advanceFrom('guided');
assert(runTake(l06.player, l06.fake, 'independent', LONG_SHORT).passed, 'L06 independent');
l06.player.advanceFrom('independent');
assert(runTake(l06.player, l06.fake, 'transfer', SHORT_SHORT_LONG).passed, 'L06 flipped transfer');
l06.player.advanceFrom('transfer');
assert(l06.player.view().lesson.evidenceState === 'independent', 'L06 Independent');

const l07 = makePlayer('L07');
l07.player.advanceFrom('explanation');
l07.player.advanceFrom('demo');
assert(runTake(l07.player, l07.fake, 'guided', REST_HOME).passed, 'L07 guided rest');
l07.player.advanceFrom('guided');
assert(runTake(l07.player, l07.fake, 'independent', REST_HOME).passed, 'L07 independent rest');
l07.player.advanceFrom('independent');
assert(runTake(l07.player, l07.fake, 'transfer', {
  bpm: 80,
  events: [
    { kind: 'note', pitch: 60, onsetBeats: 0, durationBeats: 0.5 },
    { kind: 'note', pitch: 60, onsetBeats: 1, durationBeats: 0.5 },
    { kind: 'rest', onsetBeats: 2, durationBeats: 1 },
    { kind: 'note', pitch: 60, onsetBeats: 3, durationBeats: 0.5 }
  ]
}).passed, 'L07 moved rest');
l07.player.advanceFrom('transfer');
assert(l07.player.view().lesson.evidenceState === 'independent', 'L07 Independent');

const l08 = makePlayer('L08');
l08.player.advanceFrom('explanation');
l08.player.advanceFrom('demo');
assert(runTake(l08.player, l08.fake, 'guided', WALK_EVEN).passed, 'L08 guided walk');
l08.player.markHeardTransfer();
l08.player.advanceFrom('guided');
assert(l08.player.view().phase === 'independent', 'L08 independent');
assert(runTake(l08.player, l08.fake, 'independent', WALK_EVEN).passed, 'L08 even walk');
l08.player.advanceFrom('independent');
assert(runTake(l08.player, l08.fake, 'transfer', WALK_LONG_HEAD).passed, 'L08 cousin rhythm');
l08.player.advanceFrom('transfer');
assert(l08.player.view().lesson.evidenceState === 'independent', 'L08 Independent');
l08.player.beginReview();
assert(l08.player.view().phase === 'review', 'L08 later review');
assert(runTake(l08.player, l08.fake, 'review', WALK_EVEN).passed, 'L08 review walk');
assert(l08.player.view().lesson.evidenceState === 'retained', 'review after gap is Retained');

const dump = makePlayer('L08');
dump.player.advanceFrom('explanation');
dump.player.advanceFrom('demo');
dump.player.startTake('guided', { skipCountIn: true, origin: 0 });
dump.player.handleNote(60, 'touch', { t: 0 });
dump.player.handleNote(62, 'touch', { t: 0.05 });
dump.player.handleNote(64, 'touch', { t: 0.1 });
dump.player.handleNote(60, 'touch', { t: 0.15 });
dump.fake.set(4);
const dumped = dump.player.completeIfReady(4);
assert(!dumped.passed, 'L08 does not pass a rushed C-D-E-C');

console.log('mp-04 checks passed');
