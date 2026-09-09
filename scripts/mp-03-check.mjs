import { STORAGE_KEY, createProgress, emptyStore } from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';
import { FIRST_NOTES_LESSONS, isLessonUnlocked, parseLessonId, unitView } from '../dist/js/unit.js';
import { L03 } from '../dist/js/lessons/l03.js';
import { HOME_PHRASE, TRANSFER_PHRASE } from '../dist/js/lessons/l04.js';

function memoryStorage(seed) {
  const data = seed ? { [STORAGE_KEY]: seed } : {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    firstCompletedAt: evidenceState === 'independent' ? '2026-09-08T00:00:00.000Z' : null,
    attempts: evidenceState ? [{
      attemptId: `seed-${lessonId}`,
      lessonId,
      curriculumVersion: 'beginner-v1',
      startedAt: '2026-09-08T00:00:00.000Z',
      completedAt: '2026-09-08T00:10:00.000Z',
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

assert(parseLessonId('l02') === 'L02', 'parse L02');
assert(parseLessonId('L05') === 'L05', 'L05 is Rhythm Club on the journey');
assert(parseLessonId('L21') === 'L21', 'L21 is Expression on the journey');
assert(FIRST_NOTES_LESSONS.every((card) => card.lessonId !== 'L21'), 'First Notes has no L21 card');
assert(FIRST_NOTES_LESSONS.length === 4 && FIRST_NOTES_LESSONS.every((card) => card.lessonId <= 'L04'), 'First Notes unit is L01–L04 only');

const emptyProgress = createProgress(memoryStorage());
assert(isLessonUnlocked(emptyProgress.read().store, 'L01') === true, 'L01 is open');
assert(isLessonUnlocked(emptyProgress.read().store, 'L02') === false, 'L02 locked until L01 practiced');
assert(isLessonUnlocked(emptyProgress.read().store, 'L03') === false, 'L03 locked');
assert(isLessonUnlocked(emptyProgress.read().store, 'L04') === false, 'L04 locked');
assert(isLessonUnlocked(emptyProgress.read().store, 'L05') === false, 'Rhythm Club locked until L04 Independent');

const practicedStore = memoryStorage();
seedLesson(practicedStore, 'L01', 'practiced');
assert(isLessonUnlocked(createProgress(practicedStore).read().store, 'L02') === true, 'L02 unlocks after L01 practiced');
assert(isLessonUnlocked(createProgress(practicedStore).read().store, 'L03') === false, 'L03 still locked');

const l02ready = memoryStorage();
seedLesson(l02ready, 'L01', 'practiced');
seedLesson(l02ready, 'L02', 'practiced');
assert(isLessonUnlocked(createProgress(l02ready).read().store, 'L03') === true, 'L03 unlocks after L02 practiced');
assert(isLessonUnlocked(createProgress(l02ready).read().store, 'L04') === false, 'L04 needs L03 Independent');

const l03ind = memoryStorage();
seedLesson(l03ind, 'L01', 'practiced');
seedLesson(l03ind, 'L02', 'practiced');
seedLesson(l03ind, 'L03', 'independent');
assert(isLessonUnlocked(createProgress(l03ind).read().store, 'L04') === true, 'L04 unlocks after L03 Independent');

const hub = unitView(createProgress(l03ind).read().store);
assert(hub.cards.length === 4 && hub.cards.every((card) => card.unlocked), 'hub shows four unlocked First Notes cards');
assert(!hub.cards.some((card) => card.lessonId === 'L05'), 'First Notes cards have no L05');
assert(isLessonUnlocked(createProgress(l03ind).read().store, 'L05') === false, 'L05 still locked without L04 Independent');

const l01 = createPlayer({ progress: createProgress(memoryStorage()) });
assert(l01.view().lessonSpec.lessonId === 'L01', 'default player is still L01');
l01.advanceFrom('explanation');
l01.advanceFrom('demo');
l01.handleNote(71, 'touch');
l01.handleNote(60, 'touch');
l01.requestHelp();
assert(l01.view().hintsOn === true, 'help turns hints on');
assert(l01.view().attempt.evidenceState === 'explored', 'help does not erase explored');
l01.handleNote(61, 'touch');
l01.handleNote(66, 'touch');
assert(l01.view().attempt.evidenceState === 'practiced', 'help does not block practiced');

const l02 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L02' });
l02.advanceFrom('explanation');
l02.advanceFrom('demo');
const missD = l02.handleNote(62, 'touch');
assert(missD.ok === false && missD.remediate === true, 'D is the middle room, not the doorstep');
const found = l02.handleNote(60, 'touch');
assert(found.ok === true, 'guided C from landmark');
assert(l02.view().hintsOn === false, 'hints fade after the first find');
l02.handleNote(60, 'touch');
l02.skipNamedGuided();
l02.setAdultOtherC(true);
assert(l02.view().guidedStep === 'done', 'adult other C finishes guided other-room');
l02.advanceFrom('guided');
assert(l02.view().phase === 'independent', 'L02 independent');
assert(l02.view().hintsOn === false, 'independent starts with hints off');
const quietC = l02.handleNote(60, 'touch');
assert(quietC.ok === true, 'independent accepts pitch-class C');
l02.setAdultOtherC(true);
assert(l02.view().independentStep === 'done', 'adult register completes independent');
l02.advanceFrom('independent');
l02.setAdultOtherHouse(true);
assert(l02.view().phase === 'result', 'L02 result after transfer confirm');
assert(l02.view().lesson.evidenceState === 'independent', 'L02 Independent');
l02.requestHelp();
assert(l02.view().lesson.evidenceState === 'independent', 'help after finish does not wipe Independent');
l02.restart();
assert(l02.view().phase === 'explanation', 'replay restarts');
assert(l02.view().lesson.evidenceState === 'independent', 'replay keeps Independent');

const l02midi = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L02' });
l02midi.advanceFrom('explanation');
l02midi.advanceFrom('demo');
l02midi.handleNote(60, 'touch');
l02midi.skipNamedGuided();
const other = l02midi.handleNote(72, 'midi');
assert(other.ok === true, 'another MIDI C is a new register');
l02midi.advanceFrom('guided');
const newReg = l02midi.handleNote(72, 'midi');
assert(newReg.ok === true && l02midi.view().independentStep === 'done', 'independent different C skips adult mark');

const l03 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L03' });
l03.advanceFrom('explanation');
l03.advanceFrom('demo');
assert(l03.handleNote(60, 'touch').ok, 'guided find C');
assert(l03.handleNote(62, 'touch').ok, 'next white D');
assert(l03.handleNote(64, 'touch').ok, 'next white E');
assert(l03.handleNote(60, 'touch').ok && l03.handleNote(62, 'touch').ok && l03.handleNote(64, 'touch').ok, 'CDE row');
l03.setFingering(true);
assert(l03.view().attempt.adultObserved.fingering === true, 'fingering is adult-observed');
l03.advanceFrom('guided');
assert(l03.view().phase === 'independent', 'L03 independent');
const banned = l03.handleNote(60, 'touch');
assert(banned.ok === false, 'C–D–E is not the independent order');
assert(JSON.stringify(L03.independentOrder) !== JSON.stringify([60, 62, 64]), 'independent is not CDE');
assert(JSON.stringify(L03.independentOrder) !== JSON.stringify([64, 62, 60]), 'independent is not EDC');
l03.handleNote(62, 'touch');
l03.handleNote(60, 'touch');
const dce = l03.handleNote(64, 'touch');
assert(dce.ok === true && dce.done === true, 'D–C–E is the changed independent order');
l03.advanceFrom('independent');
l03.handleNote(64, 'touch');
l03.handleNote(60, 'touch');
const ecd = l03.handleNote(62, 'touch');
assert(ecd.ok === true, 'transfer is E–C–D');
l03.advanceFrom('transfer');
assert(l03.view().lesson.evidenceState === 'independent', 'L03 Independent');

const l04 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L04' });
l04.advanceFrom('explanation');
l04.advanceFrom('demo');
assert(l04.view().guidedStep === 'head', 'demo skips to echo parts');
function play(player, notes) {
  let last = null;
  for (const note of notes) last = player.handleNote(note, 'touch');
  return last;
}
assert(play(l04, L04Head()).ok, 'echo head');
assert(play(l04, L04Tail()).ok, 'echo tail');
assert(play(l04, HOME_PHRASE).ok, 'echo all seven');
l04.markHeardTransfer();
l04.advanceFrom('guided');
assert(l04.view().phase === 'independent' && l04.view().hintsOn === false, 'L04 independent, hints off');
assert(play(l04, HOME_PHRASE).ok, 'independent Little Wave');
l04.advanceFrom('independent');
assert(play(l04, TRANSFER_PHRASE).ok, 'transfer cousin contour');
l04.advanceFrom('transfer');
assert(l04.view().lesson.evidenceState === 'independent', 'L04 Independent');
l04.beginReview();
assert(l04.view().phase === 'review', 'named pause / later review');
assert(play(l04, HOME_PHRASE).ok, 'later Little Wave');
assert(l04.view().lesson.evidenceState === 'retained', 'review after gap is Retained');

function L04Head() { return HOME_PHRASE.slice(0, 4); }
function L04Tail() { return HOME_PHRASE.slice(4); }

console.log('mp-03 checks passed');
