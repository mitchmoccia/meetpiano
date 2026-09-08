import {
  createAttempt,
  mergeInputMode,
  promoteEvidence,
  shouldGrantFirstCompletion
} from './progress.js';
import { L01 } from './lessons/l01.js';
import { blackGroupId, groupKind } from './piano.js';

const PHASE_ORDER = ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'];
const GUIDED_STEPS = ['unlock', 'high-low', 'groups', 'posture'];
const INDEPENDENT_STEPS = ['high-low', 'groups'];
const TRANSFER_STEPS = ['other-two', 'three'];

export function createPlayer({ progress, lessonId = 'L01' }) {
  const lessonSpec = L01;
  let lesson = progress.lessonState(lessonId);
  let attempt = currentAttempt();
  let pending = { first: null, two: false, three: false };
  let playingDemo = false;
  let lastGrant = false;

  function currentAttempt() {
    const found = lesson.attempts.find((item) => item.attemptId === lesson.currentAttemptId);
    return found || null;
  }

  function persist() {
    const index = lesson.attempts.findIndex((item) => item.attemptId === attempt.attemptId);
    if (index >= 0) lesson.attempts[index] = attempt;
    else lesson.attempts.push(attempt);
    lesson.currentAttemptId = attempt.completedAt ? null : attempt.attemptId;
    lesson.evidenceState = promoteEvidence(lesson.evidenceState, attempt.evidenceState);
    if (shouldGrantFirstCompletion(lesson)) {
      lesson.firstCompletionRewarded = true;
      lesson.firstCompletedAt = attempt.completedAt || new Date().toISOString();
      lastGrant = true;
    }
    progress.saveLesson(lessonId, lesson);
  }

  function begin(existing) {
    attempt = existing || createAttempt(lessonId);
    if (!existing) {
      lesson.attempts.push(attempt);
      lesson.currentAttemptId = attempt.attemptId;
      progress.saveLesson(lessonId, lesson);
    }
    pending = { first: null, two: false, three: false };
    return attempt;
  }

  function recordEvent(type, extra = {}) {
    attempt.events.push({
      t: new Date().toISOString(),
      type,
      expected: extra.expected ?? null,
      heard: extra.heard ?? null,
      match: extra.match ?? null
    });
    if (attempt.events.length > 40) attempt.events = attempt.events.slice(-40);
  }

  function markExplored() {
    attempt.evidenceState = promoteEvidence(attempt.evidenceState, 'explored');
    lesson.evidenceState = promoteEvidence(lesson.evidenceState, 'explored');
  }

  function setPhase(phase) {
    attempt.phase = phase;
    recordEvent('phase-change');
    pending = { first: null, two: false, three: false };
    persist();
  }

  function addInput(source) {
    attempt.inputMode = mergeInputMode(attempt.inputMode, source);
  }

  function setDemoPlaying(value) {
    playingDemo = value;
    if (value) recordEvent('demo-played');
  }

  function isDemoPlaying() {
    return playingDemo;
  }

  function handleNote(note, source) {
    if (playingDemo) {
      return { ignore: true, reason: 'demo-playback' };
    }
    if (attempt.phase === 'demo' || attempt.phase === 'explanation' || attempt.phase === 'result') {
      addInput(source);
      markExplored();
      persist();
      return { ignore: true, reason: 'not-assessed' };
    }
    addInput(source);
    markExplored();
    if (attempt.phase === 'guided') return handleGuidedNote(note);
    if (attempt.phase === 'independent') return handleIndependentNote(note);
    if (attempt.phase === 'transfer') return handleTransferNote(note);
    persist();
    return { ignore: true };
  }

  function handleGuidedNote(note) {
    const step = GUIDED_STEPS[attempt.restore.guidedStep] || 'unlock';
    if (step === 'unlock') {
      persist();
      return { ok: true, message: lessonSpec.copy.feedback.unlocked };
    }
    if (step === 'high-low') return takeHighLow(note, 'guided');
    if (step === 'groups') return takeGroups(note, 'guided');
    persist();
    return { ignore: true };
  }

  function handleIndependentNote(note) {
    const step = INDEPENDENT_STEPS[attempt.restore.independentStep] || 'high-low';
    if (step === 'high-low') return takeHighLow(note, 'independent');
    if (step === 'groups') return takeGroups(note, 'independent');
    persist();
    return { ignore: true };
  }

  function handleTransferNote(note) {
    const step = TRANSFER_STEPS[attempt.restore.transferStep] || 'other-two';
    if (step !== 'other-two') {
      persist();
      return { ignore: true };
    }
    const group = blackGroupId(note);
    if (groupKind(group) !== 'two') {
      persist();
      return { ok: false, message: lessonSpec.copy.feedback.needTwo };
    }
    const sameAsGuided = group === attempt.restore.guidedTwoGroup && group === lessonSpec.visibleTwoGroup;
    if (sameAsGuided) {
      persist();
      return {
        ok: false,
        message: 'That is the same preview pair. Try another octave on a keyboard, or ask a grown-up to confirm another pair on a real piano.'
      };
    }
    attempt.restore.transferStep = 1;
    persist();
    return { ok: true, message: 'A different house of two. One last grown-up check.' };
  }

  function takeHighLow(note, mode) {
    if (pending.first == null) {
      if (note <= 64) {
        persist();
        return { ok: false, message: 'That sounds low. Start with a higher key (farther right), then a lower one.' };
      }
      pending.first = note;
      persist();
      return { ok: true, message: 'Now a lower sound than that one.' };
    }
    const first = pending.first;
    pending.first = null;
    if (!isLowerEnough(note, first)) {
      const close = note !== first && Math.abs(note - first) < lessonSpec.minHighLowInterval;
      const message = note >= first
        ? (close ? lessonSpec.copy.feedback.tooClose : lessonSpec.copy.feedback.needHigherFirst)
        : lessonSpec.copy.feedback.tooClose;
      recordEvent('note-on', { heard: note, expected: first, match: false });
      persist();
      return { ok: false, message, remediate: mode === 'independent' && note >= first };
    }
    recordEvent('note-on', { heard: note, expected: first, match: true });
    if (mode === 'guided') attempt.restore.guidedStep = 2;
    if (mode === 'independent') attempt.restore.independentStep = 1;
    persist();
    return { ok: true, message: lessonSpec.copy.feedback.highLowYes };
  }

  function isLowerEnough(second, first) {
    return second < first && Math.abs(second - first) >= lessonSpec.minHighLowInterval;
  }

  function takeGroups(note, mode) {
    const group = blackGroupId(note);
    const kind = groupKind(group);
    if (!kind) {
      persist();
      return { ok: false, message: lessonSpec.copy.feedback.whiteKey };
    }
    if (mode === 'guided') {
      if (!pending.two && kind !== 'two') {
        persist();
        return { ok: false, message: lessonSpec.copy.feedback.needTwo };
      }
      if (kind === 'two') {
        pending.two = true;
        attempt.restore.guidedTwoGroup = group;
        persist();
        return { ok: true, message: lessonSpec.copy.feedback.needThree };
      }
      pending.three = true;
      attempt.restore.guidedStep = 3;
      attempt.evidenceState = promoteEvidence(attempt.evidenceState, 'practiced');
      persist();
      return { ok: true, message: lessonSpec.copy.feedback.groupsYes };
    }
    if (kind === 'two') pending.two = true;
    if (kind === 'three') pending.three = true;
    if (pending.two && pending.three) {
      attempt.restore.independentStep = 2;
      persist();
      return { ok: true, message: lessonSpec.copy.feedback.independentGroupsYes };
    }
    persist();
    return { ok: true, message: pending.two ? lessonSpec.copy.feedback.needThree : 'Now the other clump.' };
  }

  function completeGuided() {
    attempt.restore.guidedStep = 4;
    attempt.evidenceState = promoteEvidence(attempt.evidenceState, 'practiced');
    setPhase('independent');
  }

  function completeIndependent() {
    setPhase('transfer');
  }

  function completeTransfer() {
    attempt.completedAt = new Date().toISOString();
    attempt.evidenceState = promoteEvidence(attempt.evidenceState, 'independent');
    const grantedBefore = lesson.firstCompletionRewarded;
    setPhase('result');
    return { firstCompletion: !grantedBefore && lesson.firstCompletionRewarded };
  }

  function finishForNow() {
    attempt.completedAt = new Date().toISOString();
    attempt.evidenceState = promoteEvidence(attempt.evidenceState, attempt.phase === 'independent' || attempt.phase === 'transfer' ? 'practiced' : attempt.evidenceState);
    setPhase('result');
  }

  function setHints(on) {
    attempt.restore.hintsOn = Boolean(on);
    recordEvent(on ? 'hint-shown' : 'hint-hidden');
    persist();
  }

  function setPosture(checked) {
    attempt.adultObserved.posture = Boolean(checked);
    if (checked) markExplored();
    persist();
  }

  function setAdultTwo(checked) {
    attempt.adultObserved.note = checked ? 'adult-confirmed-other-two-group' : attempt.adultObserved.note;
    if (checked) {
      markExplored();
      attempt.restore.transferStep = 1;
    }
    persist();
  }

  function setAdultThree(checked) {
    if (checked) {
      markExplored();
      return completeTransfer();
    }
    persist();
    return { firstCompletion: false };
  }

  function setAudioUnlocked(value) {
    attempt.audioUnlocked = Boolean(value);
    if (value && attempt.phase === 'guided' && GUIDED_STEPS[attempt.restore.guidedStep] === 'unlock') {
      attempt.restore.guidedStep = 1;
      markExplored();
    }
    persist();
  }

  function restart() {
    begin(null);
    lastGrant = false;
    persist();
  }

  function advanceFrom(phase) {
    if (phase === 'explanation') setPhase('demo');
    else if (phase === 'demo') {
      if (attempt.restore.guidedStep === 0) attempt.restore.guidedStep = 1;
      setPhase('guided');
    } else if (phase === 'guided') completeGuided();
    else if (phase === 'independent') completeIndependent();
    else if (phase === 'transfer') completeTransfer();
  }

  const inProgress = attempt && !attempt.completedAt;
  const finished = [...lesson.attempts].reverse().find((item) => item.completedAt);
  if (inProgress) begin(attempt);
  else if (finished && !lesson.currentAttemptId) attempt = finished;
  else begin(null);

  function view() {
    const phase = attempt.phase;
    const guidedStep = GUIDED_STEPS[attempt.restore.guidedStep] || 'posture';
    const independentStep = INDEPENDENT_STEPS[attempt.restore.independentStep] || 'done';
    const transferStep = TRANSFER_STEPS[attempt.restore.transferStep] || 'done';
    return {
      lessonSpec,
      lesson,
      attempt,
      phase,
      guidedStep,
      independentStep,
      transferStep,
      hintsOn: attempt.restore.hintsOn,
      notice: progress.memory.notice,
      firstCompletionNow: lastGrant,
      alreadyRewarded: lesson.firstCompletionRewarded && !lastGrant,
      phaseIndex: Math.max(0, PHASE_ORDER.indexOf(phase === 'transfer' ? 'independent' : phase))
    };
  }

  return {
    lessonSpec,
    begin,
    view,
    handleNote,
    setDemoPlaying,
    isDemoPlaying,
    setHints,
    setPosture,
    setAdultTwo,
    setAdultThree,
    setAudioUnlocked,
    restart,
    advanceFrom,
    finishForNow,
    persist,
    recordEvent,
    markExplored
  };
}

export { PHASE_ORDER, GUIDED_STEPS };
