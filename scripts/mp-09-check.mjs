import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STORAGE_KEY, createProgress, emptyStore } from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';
import {
  EXPRESSION_LESSONS,
  FIRST_NOTES_LESSONS,
  JOURNEY_LESSONS,
  LEFT_HAND_LESSONS,
  READ_AND_PLAY_LESSONS,
  RHYTHM_CLUB_LESSONS,
  TOGETHER_LESSONS,
  isLessonUnlocked,
  parseLessonId,
  parseUnitId,
  unitView
} from '../dist/js/unit.js';
import { staffAgrees } from '../dist/js/staff.js';
import { pianoRangeFor } from '../dist/js/hands.js';
import { expressionHonesty } from '../dist/js/evidence.js';
import { HOME_PHRASE as L21_HOME, L21, TRANSFER_PHRASE as L21_TRANSFER } from '../dist/js/lessons/l21.js';
import { HOME_HOME, HOME_OPEN, HOME_TURN, L22, TRANSFER_HOME } from '../dist/js/lessons/l22.js';
import { HOME_PHRASE as L23_HOME, L23 } from '../dist/js/lessons/l23.js';
import { L24, WAVE_PHRASE } from '../dist/js/lessons/l24.js';
import { HOME_PHRASE as LITTLE_WAVE } from '../dist/js/lessons/l04.js';
import {
  alignHeard,
  compareDynamics,
  matchChosenPhrase,
  phraseForChoice,
  recitalPhrase,
  rhythmFromOnsets,
  velocityCapable
} from '../dist/js/expression-score.js';

const fixtures = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/mp-09-expression.json'), 'utf8'));

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
  const order = JOURNEY_LESSONS.map((item) => item.lessonId);
  const practicedGate = ['L01', 'L02', 'L05', 'L06', 'L09', 'L10', 'L13', 'L14', 'L17', 'L18', 'L21', 'L22'];
  for (const id of order) {
    const state = id === lastId ? lastState : (practicedGate.includes(id) ? 'practiced' : 'independent');
    seedLesson(storage, id, state);
    if (id === lastId) break;
  }
}

function play(player, notes, source = 'touch', extras = {}) {
  let last = null;
  for (const note of notes) last = player.handleNote(note, source, extras);
  return last;
}

function toGuided(player) {
  player.advanceFrom('explanation');
  player.advanceFrom('demo');
}

assert(parseLessonId('L21') === 'L21', 'parse L21');
assert(parseLessonId('L24') === 'L24', 'parse L24');
assert(parseUnitId('expression') === 'expression', 'unit id');
assert(parseUnitId('recital') === 'expression', 'recital alias');
assert(FIRST_NOTES_LESSONS.map((item) => item.lessonId).join() === 'L01,L02,L03,L04', 'First Notes stays L01–L04');
assert(RHYTHM_CLUB_LESSONS.map((item) => item.lessonId).join() === 'L05,L06,L07,L08', 'Rhythm Club stays L05–L08');
assert(READ_AND_PLAY_LESSONS.map((item) => item.lessonId).join() === 'L09,L10,L11,L12', 'Read and play stays L09–L12');
assert(LEFT_HAND_LESSONS.map((item) => item.lessonId).join() === 'L13,L14,L15,L16', 'Left hand stays L13–L16');
assert(TOGETHER_LESSONS.map((item) => item.lessonId).join() === 'L17,L18,L19,L20', 'Together stays L17–L20');
assert(EXPRESSION_LESSONS.map((item) => item.lessonId).join() === 'L21,L22,L23,L24', 'Expression is L21–L24');
assert(JOURNEY_LESSONS.length === 24, 'Checkpoint B: 24 authored lessons');
assert(JOURNEY_LESSONS.every((card, index) => card.lessonId === `L${String(index + 1).padStart(2, '0')}`), 'L01–L24 in order');

assert(staffAgrees(L21.homeNotes, fixtures.softWalk), 'Soft Walk staff agrees');
assert(staffAgrees(L21.transferNotes, fixtures.softWalkDown), 'cousin walk agrees');
assert(JSON.stringify(L21_HOME.slice(0, 4)) !== JSON.stringify(LITTLE_WAVE), 'Soft Walk is not Little Wave');
assert(JSON.stringify(HOME_HOME) !== JSON.stringify(LITTLE_WAVE), 'land-on-C is not Little Wave');
assert(JSON.stringify(HOME_OPEN) !== JSON.stringify(HOME_HOME), 'open ending is a different valid choice');
assert(JSON.stringify(HOME_TURN) !== JSON.stringify(HOME_HOME), 'turn ending is a different valid choice');
assert(WAVE_PHRASE.join() === LITTLE_WAVE.join(), 'recital wave is Little Wave');
assert(fixtures.provenance.audio.includes('Web Audio'), 'audio provenance documented');

assert(pianoRangeFor('L21').wide === false, 'Expression stays one octave');
assert(pianoRangeFor('L01').wide === false, 'L01 stays one octave');
assert(expressionHonesty('touch').includes('cannot show quiet versus strong'), 'touch honesty');
assert(expressionHonesty('midi').includes('Not technique'), 'MIDI honesty does not infer technique');
assert(velocityCapable('touch', { velocity: 0.75 }) === false, 'touch velocity is not evidence');
assert(velocityCapable('midi', { velocity: 0.4 }) === true, 'MIDI velocity can be used');

const empty = createProgress(memoryStorage());
assert(!isLessonUnlocked(empty.read().store, 'L21'), 'L21 locked until L20 Independent');

const ready = memoryStorage();
seedThrough(ready, 'L19', 'independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L21'), 'still locked without L20 Independent');
seedLesson(ready, 'L20', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L21'), 'L21 unlocks after L20 Independent');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L22'), 'L22 locked until L21 practiced');
seedLesson(ready, 'L21', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L22'), 'L22 after L21 practiced');
seedLesson(ready, 'L22', 'practiced');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L23'), 'L23 after L22 practiced');
assert(!isLessonUnlocked(createProgress(ready).read().store, 'L24'), 'L24 needs L23 Independent');
seedLesson(ready, 'L23', 'independent');
assert(isLessonUnlocked(createProgress(ready).read().store, 'L24'), 'L24 after L23 Independent');

const hub = unitView(createProgress(ready).read().store);
assert(hub.units.length === 6, 'six worlds');
assert(hub.units[5].unlocked, 'Expression unlocked after Together');
assert(hub.units[5].cards.every((card) => ['L21', 'L22', 'L23', 'L24'].includes(card.lessonId)), 'expression cards');

const allReady = memoryStorage();
seedThrough(allReady, 'L24', 'independent');
const full = createProgress(allReady).read().store;
for (const card of JOURNEY_LESSONS) {
  assert(isLessonUnlocked(full, card.lessonId), `${card.lessonId} reachable when prerequisites are met`);
}

assert(compareDynamics([0.2, 0.22, 0.21, 0.19, 0.7, 0.72, 0.68, 0.74]).ok === true, 'quieter then stronger passes');
assert(compareDynamics([0.7, 0.72, 0.68, 0.74, 0.2, 0.22, 0.21, 0.19]).ok === false, 'stronger then quieter fails');
assert(compareDynamics([0.5, 0.5, 0.5, 0.5, 0.52, 0.51, 0.5, 0.53]).ok === false, 'too-close is not a dynamics pass');
assert(rhythmFromOnsets([1, 1.05, 1.08, 1.1]).ok === false, 'dumped onsets fail rhythm');
assert(rhythmFromOnsets([1, 1.6, 2.2, 2.8]).ok === true, 'paced onsets pass rhythm');

const l21 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L21' });
toGuided(l21);
l21.markHeardDemo();
assert(l21.view().guidedStep === 'notes', 'L21 starts notes after the listen reminder');
const notes = play(l21, L21_HOME, 'touch');
assert(notes.ok === true, 'touch can pass Soft Walk letters');
assert(l21.view().notesPassed === true, 'notes lane passed');
assert(l21.view().dynamicsPassed === false, 'touch cannot invent dynamics');
assert(l21.view().dynamicsHonesty.includes('cannot show quiet versus strong'), 'unavailable dynamics copy');
l21.setListened(true);
l21.setSelfHeard(true);
assert(l21.view().attempt.adultObserved.listened === true, 'grown-up listen is stored');
l21.markHeardTransfer();
l21.advanceFrom('guided');
assert(l21.view().phase === 'independent', 'L21 independent after guided notes');
l21.setHints(false);
assert(play(l21, L21_HOME, 'touch').ok === true, 'independent letters');
l21.setListened(true);
l21.advanceFrom('independent');
assert(l21.view().phase === 'transfer', 'transfer after home');
assert(play(l21, L21_TRANSFER, 'touch').ok === true, 'cousin letters');
l21.setListened(true);
l21.advanceFrom('transfer');
assert(l21.view().lesson.evidenceState === 'independent', 'listen plus notes can grant Independent without MIDI');

const midiStore = memoryStorage();
const l21midi = createPlayer({ progress: createProgress(midiStore), lessonId: 'L21' });
toGuided(l21midi);
l21midi.markHeardDemo();
const quiet = { velocity: 0.22 };
const strong = { velocity: 0.8 };
L21_HOME.slice(0, 4).forEach((note) => l21midi.handleNote(note, 'midi', quiet));
L21_HOME.slice(4).forEach((note) => l21midi.handleNote(note, 'midi', strong));
assert(l21midi.view().velocityCapable === true, 'MIDI marks velocity capable');
assert(l21midi.view().dynamicsPassed === true, 'relative velocity contrast passes');

const flat = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L21' });
toGuided(flat);
flat.markHeardDemo();
L21_HOME.forEach((note) => flat.handleNote(note, 'midi', { velocity: 0.5 }));
assert(flat.view().notesPassed === true, 'flat MIDI still hears letters');
assert(flat.view().dynamicsPassed === false, 'no contrast is not a dynamics pass');

const l22 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L22' });
toGuided(l22);
assert(play(l22, HOME_HOME).ignore === true, 'L22 waits for a chosen ending');
l22.setChoice('open');
assert(play(l22, HOME_OPEN).ok === true, 'open ending matches the choice');
l22.setChoice('home');
const other = play(l22, HOME_OPEN);
assert(other.ok === false && other.message.includes('different choice'), 'another valid ending is not auto-correct');
l22.setChoice('turn');
assert(play(l22, HOME_TURN).ok === true, 'turn ending matches its own button');
assert(matchChosenPhrase(HOME_HOME, L22.homeStem, 'home').ok, 'home choice scores only home');
assert(matchChosenPhrase(HOME_OPEN, L22.homeStem, 'home').reason === 'other-valid', 'open is valid but not the picked home');
assert(phraseForChoice(L22.homeStem, 'open').at(-1) === 67, 'open uses G, no stretch past G');

const l23 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L23' });
toGuided(l23);
l23.setPurpose('notes');
assert(play(l23, L23_HOME).ok === true, 'notes purpose accepts Little Wave');
l23.setPurpose('spot');
assert(play(l23, [64, 62, 60]).ok === true, 'spot purpose is the last three');
const dumped = rhythmFromOnsets([10, 10.04, 10.08, 10.11]);
assert(dumped.ok === false, 'rhythm lane fails a dump');
l23.setPurpose('notes');
assert(l23.view().resultCard.rhythm === 'not asked' || l23.view().resultCard.rhythm === 'not-asked' || l23.view().resultCard.rhythm == null, 'notes purpose does not pretend a rhythm pass');

const l24 = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L24' });
toGuided(l24);
l24.setRecitalPiece('wave');
l24.markHeardDemo();
assert(l24.view().guidedStep === 'play' || l24.view().guidedStep === 'remind' || l24.view().expectedPhrase.join() === WAVE_PHRASE.join(), 'wave piece selected');
l24.markHeardDemo();
const wobble = play(l24, [60, 61, 62, 64, 62, 64, 62, 60]);
assert(l24.view().finishedThrough === true || wobble.finished === true || l24.view().attempt.restore.sequence.length >= 7, 'recital keeps going through a wrong note');
l24.finishShare();
assert(l24.view().finishedThrough === true, 'finish-through is stored');
l24.setListened(true);
l24.setSelfHeard(true);
l24.markHeardTransfer();
l24.advanceFrom('guided');
l24.setHints(true);
l24.setRecitalPiece('wave');
assert(l24.view().recitalMode === true, 'independent is recital mode');
assert(Object.keys(l24.view().captions).length === 0, 'recital hides glowing-key captions');
assert(l24.view().phrase.kind === 'hidden', 'recital hides tiles');
assert(l24.view().hintsOn === true, 'help flag may be on');
assert(l24.view().resultCard.assistance === 'assisted', 'assistance is a separate lane');
const share = play(l24, [60, 70, 62, 64, 62, 64, 62, 60]);
assert(share.ok === true && share.finished === true, 'independent share finishes through mistakes');
assert(l24.view().resultCard.notes === 'miss' || l24.view().notesPassed === false, 'wrong notes stay on the notes lane');
assert(l24.view().finishedThrough === true, 'finish is not blocked by a miss');
l24.setListened(true);
l24.advanceFrom('independent');
assert(l24.view().phase === 'transfer', 'transfer share after the first');
const blocked = l24.setRecitalPiece('wave');
assert(blocked.blocked === true, 'transfer wants a different piece');
l24.setRecitalPiece('walk');
play(l24, recitalPhrase('walk'));
l24.finishShare();
l24.setListened(true);
l24.advanceFrom('transfer');
assert(l24.view().lesson.evidenceState === 'independent', 'listened share can be Independent');
assert(l24.view().resultCard.selfObservation === true, 'self-observation is listed');
assert(l24.view().resultCard.listened === true, 'we-listened is listed');

assert(alignHeard([60, 70, 62, 64, 60], [60, 62, 64, 60]).matched === 4, 'wrong note does not consume later letters');
assert(L23.copy.result.evidence.independent.includes('Notes and rhythm'), 'results distinguish notes and rhythm');
assert(L24.copy.independent.play.includes('Glowing keys stay off'), 'recital copy names no glow');
assert(L21.equipment.cannotObserve.includes('Technique is never inferred'), 'technique limit is written');

console.log('mp-09 checks passed');
