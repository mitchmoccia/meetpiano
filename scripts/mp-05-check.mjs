import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_KEY, createProgress, emptyStore } from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';
import {
  FIRST_NOTES_LESSONS,
  READ_AND_PLAY_LESSONS,
  RHYTHM_CLUB_LESSONS,
  isLessonUnlocked,
  parseLessonId,
  parseUnitId,
  unitView
} from '../dist/js/unit.js';
import { staffAgrees } from '../dist/js/staff.js';
import { L09_F, L09_G } from '../dist/js/lessons/l09.js';
import { HOME_CHAIN, TRANSFER_CHAIN } from '../dist/js/lessons/l10.js';
import { creativityOk } from '../dist/js/lessons/l10-play.js';
import { L11, STAFF_WALK, TRANSFER_ORDER } from '../dist/js/lessons/l11.js';
import { HOME_NOTES, HOME_PHRASE, TRANSFER_NOTES, TRANSFER_PHRASE } from '../dist/js/lessons/l12.js';
import { HOME_PHRASE as LITTLE_WAVE } from '../dist/js/lessons/l04.js';

const fixtures = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/mp-05-read.json'), 'utf8'));

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
  const order = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12'];
  for (const id of order) {
    const practicedGate = ['L01', 'L02', 'L05', 'L06', 'L09', 'L10'];
    const state = id === lastId ? lastState : (practicedGate.includes(id) ? 'practiced' : 'independent');
    seedLesson(storage, id, state);
    if (id === lastId) break;
  }
}

assert(parseLessonId('L09') === 'L09', 'parse L09');
assert(parseLessonId('L12') === 'L12', 'parse L12');
assert(parseLessonId('L13') === 'L13', 'L13 is Left hand');
assert(parseLessonId('L21') === 'L21', 'L21 is Expression');
assert(READ_AND_PLAY_LESSONS.every((card) => card.lessonId !== 'L21'), 'Read and play has no L21');
assert(parseUnitId('read-and-play') === 'read-and-play', 'unit id');
assert(FIRST_NOTES_LESSONS.length === 4, 'First Notes stays L01–L04');
assert(RHYTHM_CLUB_LESSONS.map((item) => item.lessonId).join() === 'L05,L06,L07,L08', 'Rhythm Club stays L05–L08');
assert(READ_AND_PLAY_LESSONS.map((item) => item.lessonId).join() === 'L09,L10,L11,L12', 'Read and play is L09–L12');

assert(staffAgrees(L11.walkNotes, fixtures.staffWalk), 'staff walk pitch/duration/clef agree');
assert(staffAgrees(L11.neighborNotes, fixtures.staffNeighbors), 'staff neighbors agree');
assert(staffAgrees(HOME_NOTES, fixtures.porchSteps), 'Porch Steps staff agrees');
assert(staffAgrees(TRANSFER_NOTES, fixtures.porchCousin), 'cousin staff agrees');
assert(JSON.stringify(HOME_PHRASE) !== JSON.stringify(LITTLE_WAVE), 'Porch Steps is not Little Wave');
assert(JSON.stringify(HOME_PHRASE) !== JSON.stringify([60, 62, 64, 60]), 'Porch Steps is not the L08 walk');

const empty = createProgress(memoryStorage());
assert(!isLessonUnlocked(empty.read().store, 'L09'), 'L09 locked until L08 Independent');

const ready = memoryStorage();
seedThrough(ready, 'L07', 'independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L09'), 'still locked without L08');
seedLesson(ready, 'L08', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L09'), 'L09 unlocks after L08 Independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L10'), 'L10 locked until L09 practiced');
seedLesson(ready, 'L09', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L10'), 'L10 after L09 practiced');
seedLesson(ready, 'L10', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L11'), 'L11 after L10 practiced');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L12'), 'L12 needs L11 Independent');
seedLesson(ready, 'L11', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L12'), 'L12 after L11 Independent');

const hub = unitView(createProgress(ready).read().store);
assert(hub.units.length === 6, 'six worlds');
assert(hub.units[2].unlocked, 'Read and play unlocked after Rhythm Club');
assert(hub.units[2].cards.every((card) => ['L09', 'L10', 'L11', 'L12'].includes(card.lessonId)), 'read cards');
assert(!hub.units[2].cards.some((card) => card.lessonId === 'L13'), 'Read and play has no L13 cards');
assert(!hub.units[3].unlocked, 'Left hand locked until L12 Independent');

const l09 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L09' });
l09.advanceFrom('explanation');
l09.advanceFrom('demo');
const missE = l09.handleNote(64, 'touch');
assert(missE.ok === false && missE.remediate === true, 'E remediates as the two-black neighbor');
assert(l09.handleNote(65, 'touch').ok, 'guided F');
l09.skipNamedGuided();
assert(l09.handleNote(67, 'touch').ok, 'guided G');
l09.setFingering(true);
assert(l09.view().attempt.adultObserved.fingering === true, 'fingering adult-observed');
l09.advanceFrom('guided');
assert(l09.view().phase === 'independent' && l09.view().hintsOn === false, 'L09 independent hints off');
const otherF = l09.handleNote(77, 'touch');
assert(otherF.ok === false, 'F5 is the wrong room when this F is named');
assert(l09.handleNote(L09_F, 'touch').ok, 'independent F4');
assert(l09.handleNote(L09_G, 'touch').ok, 'independent G4');
l09.advanceFrom('independent');
assert(l09.handleNote(L09_F, 'touch').ok === false, 'copied F-then-G fails transfer');
assert(play(l09, [L09_G, L09_F]).ok, 'transfer G then F');
l09.advanceFrom('transfer');
assert(l09.view().lesson.evidenceState === 'independent', 'L09 Independent');
l09.requestHelp();
assert(l09.view().lesson.evidenceState === 'independent', 'help does not wipe Independent');

const l10 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L10' });
l10.advanceFrom('explanation');
l10.advanceFrom('demo');
assert(play(l10, [60, 62]).ok, 'guided step');
assert(play(l10, [67, 67]).ok, 'guided repeat');
assert(play(l10, [60, 64]).ok, 'guided skip');
assert(creativityOk([60, 62, 65]) === true, 'C D F has step then skip');
assert(creativityOk([60, 62, 64]) === false, 'C D E is two steps, not a skip');
assert(creativityOk([60, 62, 62]) === false, 'step + repeat is not enough');
assert(play(l10, [60, 64, 65]).ok, 'goodbye with skip then step');
l10.advanceFrom('guided');
assert(l10.view().hintsOn === false, 'L10 independent hints off');
assert(play(l10, [72, 74, 74, 77]).ok === false, 'wrong octave chain fails');
assert(play(l10, HOME_CHAIN).ok, 'independent C D D F');
l10.advanceFrom('independent');
assert(play(l10, HOME_CHAIN).ok === false, 'copied home fails transfer');
assert(play(l10, TRANSFER_CHAIN).ok, 'transfer G F F D');
l10.advanceFrom('transfer');
assert(l10.view().lesson.evidenceState === 'independent', 'L10 Independent');

const l11 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L11' });
l11.advanceFrom('explanation');
l11.advanceFrom('demo');
assert(play(l11, STAFF_WALK).ok, 'guided staff walk');
assert(play(l11, [65, 67]).ok, 'guided neighbors');
assert(play(l11, [65, 67]).ok, 'ear F then G');
l11.advanceFrom('guided');
assert(l11.view().staff.showLetters === false, 'independent letters off');
assert(play(l11, [60, 62, 76]).ok === false, 'E5 is wrong octave on the staff walk');
assert(play(l11, STAFF_WALK).ok, 'independent staff walk');
l11.advanceFrom('independent');
assert(l11.handleNote(60, 'touch').ok === false, 'copied CDE start fails transfer');
assert(play(l11, TRANSFER_ORDER).ok, 'transfer E C F');
l11.advanceFrom('transfer');
assert(l11.view().lesson.evidenceState === 'independent', 'L11 Independent');

const l12 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L12' });
l12.advanceFrom('explanation');
l12.advanceFrom('demo');
assert(l12.view().guidedStep === 'head', 'demo skips to echo parts');
assert(play(l12, LITTLE_WAVE.slice(0, 2)).ok === false, 'Little Wave start is not Porch Steps');
assert(play(l12, L12Head()).ok, 'echo head');
assert(play(l12, L12Tail()).ok, 'echo tail');
assert(play(l12, HOME_PHRASE).ok, 'echo all seven');
assert(play(l12, [65, 67, 60]).ok, 'goodbye uses F or G');
l12.markHeardTransfer();
l12.advanceFrom('guided');
assert(l12.view().phase === 'independent' && l12.view().hintsOn === false, 'L12 independent, hints off');
assert(l12.view().staff.showLetters === false, 'reading check hides letters');
assert(play(l12, HOME_PHRASE).ok, 'independent Porch Steps');
l12.advanceFrom('independent');
assert(play(l12, HOME_PHRASE).ok === false, 'copied home fails transfer');
assert(play(l12, TRANSFER_PHRASE).ok, 'transfer cousin');
l12.advanceFrom('transfer');
assert(l12.view().lesson.evidenceState === 'independent', 'L12 Independent');
l12.beginReview();
assert(l12.view().phase === 'review', 'named pause / later review');
assert(play(l12, HOME_PHRASE).ok, 'later Porch Steps');
assert(l12.view().lesson.evidenceState === 'retained', 'review after gap is Retained');
l12.requestHelp();
assert(l12.view().lesson.evidenceState === 'retained', 'help after finish does not wipe Retained');

function L12Head() { return HOME_PHRASE.slice(0, 4); }
function L12Tail() { return HOME_PHRASE.slice(4); }

console.log('mp-05 checks passed');
