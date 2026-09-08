import {
  STORAGE_KEY,
  createAttempt,
  createProgress,
  emptyStore,
  promoteEvidence,
  shouldGrantFirstCompletion,
  validateAttempt,
  validateStore
} from '../dist/js/progress.js';
import { createPlayer } from '../dist/js/player.js';
import { blackGroupId } from '../dist/js/piano.js';

function memoryStorage(seed) {
  const data = seed ? { [STORAGE_KEY]: seed } : {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: (key) => { delete data[key]; },
    _data: data
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function playHighLow(player) {
  assert(player.handleNote(71, 'touch').ok, 'high note should start high/low');
  const second = player.handleNote(60, 'touch');
  assert(second.ok, `low note should finish high/low: ${second.message}`);
}

function playGroups(player, order = ['two', 'three']) {
  const notes = { two: 61, three: 66 };
  for (const kind of order) {
    const result = player.handleNote(notes[kind], 'touch');
    assert(result.ok, `${kind} group should count: ${result.message}`);
  }
}

const missing = validateStore(null);
assert(!missing.ok, 'null store is invalid');

const corrupt = validateStore({ schemaVersion: 1, curriculumVersion: 'beginner-v1', lessons: 'nope' });
assert(!corrupt.ok, 'non-object lessons is invalid');

const bogusEvidence = validateStore({
  schemaVersion: 1,
  curriculumVersion: 'beginner-v1',
  lessons: {
    L01: {
      evidenceState: 'independent',
      firstCompletionRewarded: true,
      attempts: [{ attemptId: 'x', lessonId: 'L01', curriculumVersion: 'beginner-v1', startedAt: '2026-09-08T00:00:00.000Z', completedAt: null, inputMode: 'touch', audioUnlocked: true, phase: 'guided', evidenceState: 'explored', events: [], adultObserved: {}, octavePolicyUsed: 'pitch-class', exportable: true }]
    }
  }
});
assert(bogusEvidence.ok, 'readable store should sanitize');
assert(bogusEvidence.store.lessons.L01.evidenceState !== 'independent', 'must not keep unearned Independent');
assert(bogusEvidence.store.lessons.L01.firstCompletionRewarded === false, 'must not keep an unearned first-completion flag');

const brokenJson = createProgress(memoryStorage('{not json'));
const brokenRead = brokenJson.read();
assert(brokenRead.notice, 'corrupt JSON should disclose a notice');
assert(brokenRead.store.lessons.L01 == null || brokenRead.store.lessons.L01?.evidenceState == null, 'corrupt JSON must not invent success');

assert(promoteEvidence('explored', 'practiced') === 'practiced', 'promotion is one-way up');
assert(promoteEvidence('independent', 'explored') === 'independent', 'promotion does not go backward');
assert(shouldGrantFirstCompletion({ evidenceState: 'independent', firstCompletionRewarded: false }) === true, 'first independent grant');
assert(shouldGrantFirstCompletion({ evidenceState: 'independent', firstCompletionRewarded: true }) === false, 'no duplicate grant');

const storage = memoryStorage();
const progress = createProgress(storage);
const player = createPlayer({ progress });
assert(player.view().phase === 'explanation', 'new session starts on explanation');

player.setDemoPlaying(true);
const demoResult = player.handleNote(71, 'touch');
assert(demoResult.reason === 'demo-playback', 'demo notes are ignored');
assert(player.view().attempt.evidenceState == null, 'demo playback must not earn Explored');
player.setDemoPlaying(false);

player.advanceFrom('explanation');
assert(player.view().phase === 'demo', 'advance to demo');
player.advanceFrom('demo');
assert(player.view().phase === 'guided', 'advance to guided');
assert(player.view().guidedStep === 'high-low', 'demo gesture skips unlock');

playHighLow(player);
assert(player.view().guidedStep === 'groups', 'guided moves to black-key groups');
playGroups(player);
assert(player.view().guidedStep === 'posture', 'guided moves to posture');
assert(player.view().attempt.evidenceState === 'practiced', 'guided groups earn Practiced');

player.setPosture(true);
player.advanceFrom('guided');
assert(player.view().phase === 'independent', 'continue goes to independent');
assert(player.view().attempt.restore.hintsOn === true, 'hint preference persists until hidden');
player.setHints(false);

playHighLow(player);
playGroups(player, ['three', 'two']);
assert(player.view().independentStep === 'done' || player.view().phase === 'transfer', 'independent groups complete');
if (player.view().phase === 'independent') player.advanceFrom('independent');
assert(player.view().phase === 'transfer', 'independent leads to transfer');

player.setAdultTwo(true);
const finish = player.setAdultThree(true);
assert(player.view().phase === 'result', 'transfer complete shows result');
assert(player.view().lesson.evidenceState === 'independent', 'finished lesson is Independent');
assert(finish.firstCompletion === true, 'first completion reward granted once');

const saved = JSON.parse(storage.getItem(STORAGE_KEY));
const player2 = createPlayer({ progress: createProgress(memoryStorage(JSON.stringify(saved))) });
assert(player2.view().phase === 'result', 'reload restores result, not a new explanation');
assert(player2.view().lesson.firstCompletionRewarded === true, 'reward flag persists');
player2.restart();
assert(player2.view().phase === 'explanation', 'restart is an explicit new attempt');
assert(player2.view().lesson.evidenceState === 'independent', 'restart does not erase earned Independent');
assert(player2.view().lesson.firstCompletionRewarded === true, 'restart does not grant a second first-completion');

const restoredMid = createProgress(memoryStorage());
const mid = createPlayer({ progress: restoredMid });
mid.advanceFrom('explanation');
mid.advanceFrom('demo');
playHighLow(mid);
const midDump = restoredMid.memory.store;
const midAgain = createPlayer({ progress: createProgress(memoryStorage(JSON.stringify(midDump))) });
assert(midAgain.view().phase === 'guided', 'reload restores guided');
assert(midAgain.view().guidedStep === 'groups', 'reload restores the guided black-key step');

const rawAttempt = createAttempt('L01');
assert(validateAttempt(rawAttempt, 'L01'), 'fresh attempt matches the versioned shape');
assert(validateStore(emptyStore()).ok, 'empty store is valid');
assert(blackGroupId(61) === 'two-4' && blackGroupId(66) === 'three-4', 'black-key groups match L01 preview');

console.log('mp-01 checks passed');
