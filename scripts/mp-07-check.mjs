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
  isLessonUnlocked,
  parseLessonId,
  parseUnitId,
  unitView
} from '../dist/js/unit.js';
import { BASS_CLEF, TREBLE_CLEF, staffAgrees } from '../dist/js/staff.js';
import { L13_C, L13_TRANSFER, L13_WALK } from '../dist/js/lessons/l13.js';
import { BASS_TRANSFER, BASS_WALK, L14 } from '../dist/js/lessons/l14.js';
import { ANSWER, CONVERSATION, L15, QUESTION, TRANSFER_CONVERSATION } from '../dist/js/lessons/l15.js';
import { HOME_NOTES, HOME_PATTERN, L16, TRANSFER_NOTES } from '../dist/js/lessons/l16.js';
import { createRhythmTake } from '../dist/js/rhythm-score.js';
import { HOME_PHRASE as PORCH } from '../dist/js/lessons/l12.js';

const fixtures = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/mp-07-left.json'), 'utf8'));

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

function play(player, notes) {
  let last = null;
  for (const note of notes) last = player.handleNote(note, 'touch');
  return last;
}

function seedThrough(storage, lastId, lastState = 'independent') {
  const order = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16'];
  for (const id of order) {
    const practicedGate = ['L01', 'L02', 'L05', 'L06', 'L09', 'L10', 'L13', 'L14'];
    const state = id === lastId ? lastState : (practicedGate.includes(id) ? 'practiced' : 'independent');
    seedLesson(storage, id, state);
    if (id === lastId) break;
  }
}

assert(parseLessonId('L13') === 'L13', 'parse L13');
assert(parseLessonId('L16') === 'L16', 'parse L16');
assert(parseLessonId('L17') == null, 'no L17');
assert(parseUnitId('left-hand') === 'left-hand', 'unit id');
assert(FIRST_NOTES_LESSONS.length === 4, 'First Notes stays L01–L04');
assert(RHYTHM_CLUB_LESSONS.map((item) => item.lessonId).join() === 'L05,L06,L07,L08', 'Rhythm Club stays L05–L08');
assert(READ_AND_PLAY_LESSONS.map((item) => item.lessonId).join() === 'L09,L10,L11,L12', 'Read and play stays L09–L12');
assert(LEFT_HAND_LESSONS.map((item) => item.lessonId).join() === 'L13,L14,L15,L16', 'Left hand is L13–L16');

assert(staffAgrees(L14.walkNotes, fixtures.bassWalk), 'bass walk pitch/duration/clef agree');
assert(staffAgrees(L14.neighborNotes, fixtures.bassNeighbors), 'bass neighbors agree');
assert(staffAgrees(L14.transferNotes, fixtures.bassTransfer), 'bass transfer agrees');
assert(staffAgrees(L15.questionNotes, fixtures.question), 'question is treble');
assert(staffAgrees(L15.answerNotes, fixtures.answer), 'answer is bass');
assert(staffAgrees(L15.homeNotes, fixtures.conversation), 'conversation uses both clefs');
assert(HOME_NOTES.some((note) => note.clef === BASS_CLEF) && HOME_NOTES.some((note) => note.clef === TREBLE_CLEF), 'L16 grand staff has both clefs');
assert(TRANSFER_NOTES.some((note) => note.clef === BASS_CLEF), 'L16 transfer keeps bass hold');
assert(JSON.stringify(CONVERSATION) !== JSON.stringify(PORCH), 'conversation is not Porch Steps');

const empty = createProgress(memoryStorage());
assert(!isLessonUnlocked(empty.read().store, 'L13'), 'L13 locked until L12 Independent');

const ready = memoryStorage();
seedThrough(ready, 'L11', 'independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L13'), 'still locked without L12');
seedLesson(ready, 'L12', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L13'), 'L13 unlocks after L12 Independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L14'), 'L14 locked until L13 practiced');
seedLesson(ready, 'L13', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L14'), 'L14 after L13 practiced');
seedLesson(ready, 'L14', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L15'), 'L15 after L14 practiced');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L16'), 'L16 needs L15 Independent');
seedLesson(ready, 'L15', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L16'), 'L16 after L15 Independent');

const hub = unitView(createProgress(ready).read().store);
assert(hub.units.length === 4, 'four worlds');
assert(hub.units[3].unlocked, 'Left hand unlocked after Read and play');
assert(hub.units[3].cards.every((card) => ['L13', 'L14', 'L15', 'L16'].includes(card.lessonId)), 'left cards');
assert(!hub.units.some((unit) => unit.cards.some((card) => card.lessonId === 'L17')), 'no L17 cards');

const l13 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L13' });
l13.advanceFrom('explanation');
l13.advanceFrom('demo');
const highC = l13.handleNote(60, 'touch');
assert(highC.ok === false && highC.remediate === true, 'higher C remediates');
assert(l13.handleNote(L13_C, 'touch').ok, 'guided lower C');
l13.skipNamedGuided();
assert(play(l13, L13_WALK).ok, 'guided C D E');
l13.setFingering(true);
l13.setHandMark(true);
assert(l13.view().attempt.adultObserved.fingering === true, 'fingering adult-observed');
assert(l13.view().attempt.adultObserved.hand === true, 'hand choice adult-observed');
l13.setHandFocus('right');
assert(l13.view().handFocus === 'right' && l13.view().phase === 'guided', 'hand focus does not leave the step');
l13.setHandFocus('left');
l13.advanceFrom('guided');
assert(l13.view().phase === 'independent' && l13.view().hintsOn === false, 'L13 independent hints off');
assert(l13.handleNote(60, 'touch').ok === false, 'C4 fails when this C is named');
assert(play(l13, L13_WALK).ok, 'independent C3 D3 E3');
l13.advanceFrom('independent');
assert(l13.handleNote(L13_C, 'touch').ok === false, 'copied CDE start fails transfer');
assert(play(l13, L13_TRANSFER).ok, 'transfer E D C');
l13.advanceFrom('transfer');
assert(l13.view().lesson.evidenceState === 'independent', 'L13 Independent');
l13.requestHelp();
assert(l13.view().lesson.evidenceState === 'independent', 'help does not wipe Independent');

const l14 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L14' });
l14.advanceFrom('explanation');
l14.advanceFrom('demo');
assert(play(l14, BASS_WALK).ok, 'guided bass walk');
assert(play(l14, [53, 55]).ok, 'guided neighbors');
assert(play(l14, [53, 55]).ok, 'ear F then G');
l14.advanceFrom('guided');
assert(l14.view().staff.showLetters === false, 'independent letters off');
assert(l14.view().staff.clef === 'bass', 'independent uses bass clef');
assert(play(l14, [60, 62, 64]).ok === false, 'higher CDE fails the bass walk');
assert(play(l14, BASS_WALK).ok, 'independent bass walk');
l14.advanceFrom('independent');
assert(l14.handleNote(48, 'touch').ok === false, 'copied CDE start fails transfer');
assert(play(l14, BASS_TRANSFER).ok, 'transfer E C F');
l14.advanceFrom('transfer');
assert(l14.view().lesson.evidenceState === 'independent', 'L14 Independent');

const l15 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L15' });
l15.advanceFrom('explanation');
l15.advanceFrom('demo');
assert(play(l15, QUESTION).ok, 'guided question');
const afterQuestion = l15.view();
l15.setHandFocus('left');
assert(l15.view().guidedStep === afterQuestion.guidedStep, 'left practice keeps the answer step');
assert(play(l15, ANSWER).ok, 'guided answer');
l15.setHandFocus('both');
assert(play(l15, CONVERSATION).ok, 'guided conversation');
l15.setHandMark(true);
l15.advanceFrom('guided');
assert(l15.view().phase === 'independent' && l15.view().staff.grand === true, 'independent grand staff');
assert(play(l15, CONVERSATION).ok, 'independent conversation');
l15.advanceFrom('independent');
assert(l15.handleNote(QUESTION[0], 'touch').ok === false, 'copied question start fails transfer');
assert(play(l15, TRANSFER_CONVERSATION).ok, 'transfer answer then question');
l15.advanceFrom('transfer');
assert(l15.view().lesson.evidenceState === 'independent', 'L15 Independent');

const dumped = createRhythmTake({
  pattern: { ...HOME_PATTERN, bpm: 80 },
  mode: 'performance',
  now: (() => { let t = 20; return () => t; })(),
  octavePolicy: 'exact-pitch',
  scoreReleases: false
});
dumped.startAtOrigin(20);
[48, 60, 62, 64, 60].forEach((pitch, index) => dumped.noteOn(pitch, 20 + index * 0.08));
const rush = dumped.finalize(21);
assert(rush.passed === false, 'dumped letters fail the two-part pulse');

const onTime = createRhythmTake({
  pattern: { ...HOME_PATTERN, bpm: 80 },
  mode: 'performance',
  now: (() => { let t = 40; return () => t; })(),
  octavePolicy: 'exact-pitch',
  scoreReleases: false
});
onTime.startAtOrigin(40);
const beat = 0.75;
onTime.noteOn(48, 40);
onTime.noteOn(60, 40.02);
onTime.noteOn(62, 40 + beat);
onTime.noteOn(64, 40 + 2 * beat);
onTime.noteOn(60, 40 + 3 * beat);
const held = onTime.finalize(40 + 4 * beat + 0.2);
assert(held.passed === true, 'hold plus walk on the clock passes');

const l16 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L16' });
l16.advanceFrom('explanation');
l16.advanceFrom('demo');
assert(l16.view().staff.grand === true, 'L16 shows both clefs');
assert(l16.view().handFocus === 'both', 'L16 starts on both hands');
l16.setHandFocus('left');
assert(l16.view().phase === 'guided' && l16.view().handFocus === 'left', 'L16 hand practice keeps context');
l16.setHandMark(true);
assert(l16.view().attempt.adultObserved.hand === true, 'L16 hand mark is adult-observed');
assert(l16.view().attempt.events.every((event) => event.heard == null || typeof event.heard === 'number'), 'events store pitch/time, not hand');

console.log('mp-07 checks passed');
