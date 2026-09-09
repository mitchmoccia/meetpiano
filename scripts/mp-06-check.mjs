import { STORAGE_KEY, createAttempt, createProgress, emptyStore, validateStore } from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';
import { isLessonUnlocked } from '../dist/js/unit.js';
import { invalidateSkills, isMidiVerifiedSource, recordMissOn, sourceHonesty } from '../dist/js/evidence.js';
import { recommendNext } from '../dist/js/recommend.js';
import { exportProgress, importProgress } from '../dist/js/portability.js';
import { HOME_PHRASE, TRANSFER_PHRASE } from '../dist/js/lessons/l04.js';

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

function seedLesson(storage, lessonId, evidenceState, extras = {}) {
  let store = emptyStore();
  const raw = storage.getItem(STORAGE_KEY);
  if (raw) store = JSON.parse(raw);
  store.lessons[lessonId] = {
    lessonId,
    evidenceState,
    currentAttemptId: null,
    firstCompletionRewarded: evidenceState === 'independent' || evidenceState === 'retained',
    firstCompletedAt: evidenceState === 'independent' || evidenceState === 'retained' ? '2026-09-08T00:00:00.000Z' : null,
    attempts: evidenceState ? [{
      attemptId: extras.attemptId || `seed-${lessonId}`,
      lessonId,
      curriculumVersion: extras.curriculumVersion || 'beginner-v1',
      skillVersion: extras.skillVersion || 'beginner-v1',
      startedAt: '2026-09-08T00:00:00.000Z',
      completedAt: '2026-09-08T00:10:00.000Z',
      inputMode: extras.inputMode || 'touch',
      inputDevice: null,
      audioUnlocked: true,
      phase: 'result',
      evidenceState,
      events: [],
      adultObserved: extras.adultObserved || {},
      octavePolicyUsed: 'pitch-class',
      exportable: true,
      restore: {}
    }] : []
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function play(player, notes, source = 'touch') {
  let last = null;
  for (const note of notes) last = player.handleNote(note, source);
  return last;
}

const legacy = validateStore({
  schemaVersion: 1,
  curriculumVersion: 'beginner-v1',
  lessons: {
    L01: {
      evidenceState: 'practiced',
      attempts: [{
        attemptId: 'legacy-1',
        lessonId: 'L01',
        curriculumVersion: 'beginner-v1',
        startedAt: '2026-09-08T00:00:00.000Z',
        completedAt: '2026-09-08T00:10:00.000Z',
        inputMode: 'touch',
        audioUnlocked: true,
        phase: 'result',
        evidenceState: 'practiced',
        events: [],
        adultObserved: {},
        octavePolicyUsed: 'pitch-class',
        exportable: true
      }]
    }
  }
});
assert(legacy.ok, 'schema 1 still reads');
assert(legacy.store.schemaVersion === 2, 'schema 1 migrates to 2');
assert(legacy.store.lessons.L01.evidenceState === 'practiced', 'legacy practiced stays');
assert(legacy.store.lessons.L01.attempts[0].attemptId === 'legacy-1', 'historical attempt kept');

const historical = validateStore({
  schemaVersion: 2,
  curriculumVersion: 'beginner-v1',
  lessons: {
    L04: {
      evidenceState: 'independent',
      attempts: [{
        attemptId: 'old-curr',
        lessonId: 'L04',
        curriculumVersion: 'beginner-v0',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:10:00.000Z',
        inputMode: 'touch',
        audioUnlocked: true,
        phase: 'result',
        evidenceState: 'independent',
        events: [],
        adultObserved: {},
        octavePolicyUsed: 'pitch-class',
        exportable: true
      }]
    }
  }
});
assert(historical.ok, 'older curriculum attempts stay readable');
assert(historical.store.lessons.L04.attempts[0].historical === true, 'mismatched curriculum is historical');
assert(historical.store.lessons.L04.evidenceState !== 'independent', 'historical Independent does not stay live');

const storage = memoryStorage();
const progress = createProgress(storage);
const player = createPlayer({ progress, lessonId: 'L04' });
player.advanceFrom('explanation');
player.advanceFrom('demo');
player.startGuidedHear();
assert(play(player, HOME_PHRASE.slice(0, 4)).ok, 'echo head');
assert(play(player, HOME_PHRASE.slice(4)).ok, 'echo tail');
assert(play(player, HOME_PHRASE).ok, 'echo all');
player.markHeardTransfer();
player.advanceFrom('guided');
assert(play(player, HOME_PHRASE).ok, 'independent home');
player.advanceFrom('independent');
assert(play(player, TRANSFER_PHRASE).ok, 'transfer cousin');
player.advanceFrom('transfer');
const after = player.view();
assert(after.lesson.evidenceState === 'independent', 'L04 Independent');
assert(after.attempt.skillIds.includes('S-PHRASE'), 'skill ids persist');
assert(after.attempt.skillVersion === 'beginner-v1', 'skill version persists');
assert(after.attempt.curriculumVersion === 'beginner-v1', 'curriculum version persists');
assert(after.attempt.assistance, 'assistance record exists');
assert(after.lesson.evidenceLanes.practiced, 'practiced lane stored');
assert(after.lesson.evidenceLanes.independent, 'independent lane stored');
assert(after.lesson.evidenceLanes.retained == null, 'retained lane empty until a gap');
assert(after.lesson.evidenceLanes.independent.midiVerified === false, 'touch Independent is not MIDI verified');
assert(sourceHonesty('touch').includes('Not MIDI verified'), 'touch honesty');
assert(isMidiVerifiedSource('touch') === false, 'touch is not a MIDI-verified source');

player.restart();
player.advanceFrom('explanation');
player.advanceFrom('demo');
player.markHeardTransfer();
player.advanceFrom('guided');
assert(play(player, HOME_PHRASE).ok, 'replay independent home');
player.advanceFrom('independent');
assert(play(player, TRANSFER_PHRASE).ok, 'replay cousin');
player.advanceFrom('transfer');
assert(player.view().lesson.evidenceState === 'independent', 'same-session replay does not manufacture Retained');

const midiStore = memoryStorage();
seedLesson(midiStore, 'L01', 'independent', { inputMode: 'midi', attemptId: 'midi-1' });
const midiLesson = createProgress(midiStore).read().store.lessons.L01;
assert(midiLesson.evidenceLanes.independent.midiVerified === true, 'MIDI attempt may record heard-over-MIDI');
assert(sourceHonesty('midi').includes('Not a hardware certification'), 'MIDI is not a hardware claim');

const reviewStore = memoryStorage();
seedLesson(reviewStore, 'L01', 'practiced');
seedLesson(reviewStore, 'L02', 'practiced');
seedLesson(reviewStore, 'L03', 'independent');
seedLesson(reviewStore, 'L04', 'independent');
const reviewProgress = createProgress(reviewStore);
const session = reviewProgress.touchSession(Date.parse('2026-09-09T12:00:00.000Z'));
assert(session.isNew, 'first touch is a new session');
const rec = recommendNext(reviewProgress.read().store, session);
assert(rec.kind === 'review-transfer', `new session revisits earlier skill: ${rec.kind}`);
assert(rec.lessonId === 'L04', 'earliest Independent not-retained is L04');
assert(rec.href.includes('check=review'), 'review uses another-pattern check');
assert(rec.reason.includes('another pattern'), 'reason names the other pattern');

const later = reviewProgress.touchSession(Date.parse('2026-09-09T12:10:00.000Z'));
assert(later.isNew === false, 'same visit is not a new session');
const sameVisit = recommendNext(reviewProgress.read().store, later);
assert(sameVisit.kind !== 'review-transfer', 'same visit does not force a review');

const missPlayer = createPlayer({ progress: createProgress(memoryStorage()), lessonId: 'L04' });
missPlayer.advanceFrom('explanation');
missPlayer.advanceFrom('demo');
missPlayer.startGuidedHear();
play(missPlayer, HOME_PHRASE.slice(0, 4));
play(missPlayer, HOME_PHRASE.slice(4));
play(missPlayer, HOME_PHRASE);
missPlayer.markHeardTransfer();
missPlayer.advanceFrom('guided');
const firstMiss = missPlayer.handleNote(71, 'touch');
assert(firstMiss.ok === false, 'wrong start is a miss');
missPlayer.handleNote(71, 'touch');
const third = missPlayer.handleNote(71, 'touch');
assert(third.easier === true, 'third miss triggers easier work');
assert(missPlayer.view().attempt.restore.easierWork === true, 'easier flag stored');
missPlayer.startEasierWork();
assert(missPlayer.view().phase === 'remediation', 'easier work leaves the identical independent retry');

const emptyRec = recommendNext(createProgress(memoryStorage()).read().store, { isNew: true, sessionId: 's' });
assert(emptyRec.kind === 'forward' && emptyRec.lessonId === 'L01', 'fresh device recommends L01');

const bundle = exportProgress(reviewProgress.read().store);
assert(bundle.kind === 'meetpiano-progress', 'export kind');
assert(bundle.deviceLocal === true, 'export is device-local');
assert(bundle.store.lessons.L04.attempts[0].attemptId === 'seed-L04', 'export keeps attempt ids');

const badVersion = importProgress({ ...bundle, curriculumVersion: '' }, emptyStore());
assert(!badVersion.ok, 'import rejects missing curriculum version');

const invented = importProgress({
  ...bundle,
  store: {
    ...bundle.store,
    lessons: {
      ...bundle.store.lessons,
      L08: {
        lessonId: 'L08',
        evidenceState: 'independent',
        attempts: []
      }
    }
  }
}, emptyStore());
assert(invented.ok, 'import still reads');
assert(invented.store.lessons.L08.evidenceState !== 'independent', 'import does not invent Independent');

const firstImport = importProgress(bundle, emptyStore());
assert(firstImport.ok, 'clean import works');
const secondImport = importProgress(bundle, firstImport.store);
assert(secondImport.ok, 'repeat import works');
assert(secondImport.store.lessons.L04.attempts.filter((item) => item.attemptId === 'seed-L04').length === 1, 'attempt ids merge repeat-safe');

const changed = invalidateSkills(structuredClone(firstImport.store), ['S-PHRASE'], 'contract-changed');
assert(changed.lessons.L04.evidenceState !== 'independent', 'changed skill drops live Independent');
assert(changed.lessons.L04.attempts.length >= 1, 'attempts survive invalidation');
assert(changed.lessons.L03.evidenceState === 'independent', 'unrelated lesson evidence stays');

const unlockStore = memoryStorage();
seedLesson(unlockStore, 'L01', 'practiced');
assert(isLessonUnlocked(createProgress(unlockStore).read().store, 'L02'), 'L02 still unlocks after L01 practiced');
seedLesson(unlockStore, 'L02', 'practiced');
seedLesson(unlockStore, 'L03', 'independent');
assert(isLessonUnlocked(createProgress(unlockStore).read().store, 'L04'), 'L04 still unlocks after L03 Independent');
seedLesson(unlockStore, 'L04', 'independent');
assert(isLessonUnlocked(createProgress(unlockStore).read().store, 'L05'), 'L05 still unlocks after L04 Independent');
seedLesson(unlockStore, 'L05', 'practiced');
seedLesson(unlockStore, 'L06', 'practiced');
seedLesson(unlockStore, 'L07', 'independent');
seedLesson(unlockStore, 'L08', 'independent');
assert(isLessonUnlocked(createProgress(unlockStore).read().store, 'L09'), 'L09 still unlocks after L08 Independent');

const posture = createAttempt('L01');
posture.adultObserved = { posture: false };
posture.inputMode = 'touch';
posture.completedAt = '2026-09-09T00:00:00.000Z';
const miss = recordMissOn(createAttempt('L10'), 'skip');
assert(miss.easier === false, 'one miss is not easier work');

console.log('mp-06 checks passed');
