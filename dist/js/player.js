import {
  createAttempt,
  mergeInputMode,
  promoteEvidence,
  sanitizeInputDevice,
  shouldGrantFirstCompletion
} from './progress.js';
import { recordMissOn, sourceHonesty } from './evidence.js';
import { skillIdsFor } from './skills.js';
import { L01 } from './lessons/l01.js';
import { createL02Player } from './lessons/l02-play.js';
import { createL03Player } from './lessons/l03-play.js';
import { createL04Player } from './lessons/l04-play.js';
import { L05 } from './lessons/l05.js';
import { L06 } from './lessons/l06.js';
import { L07 } from './lessons/l07.js';
import { L08 } from './lessons/l08.js';
import { createRhythmLessonPlayer } from './lessons/rhythm-play.js';
import { createL09Player } from './lessons/l09-play.js';
import { createL10Player } from './lessons/l10-play.js';
import { createL11Player } from './lessons/l11-play.js';
import { createL12Player } from './lessons/l12-play.js';
import { createL13Player } from './lessons/l13-play.js';
import { createL14Player } from './lessons/l14-play.js';
import { createL15Player } from './lessons/l15-play.js';
import { L16 } from './lessons/l16.js';
import { blackGroupId, groupKind } from './piano.js';
import { assessHeardPitch, resolveOctavePolicy, shouldCountTowardProgress } from './assess.js';

const PHASE_ORDER = ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'];
const GUIDED_STEPS = ['unlock', 'high-low', 'groups', 'posture'];
const INDEPENDENT_STEPS = ['high-low', 'groups'];
const TRANSFER_STEPS = ['other-two', 'three'];

function createL01Player({ progress }) {
  const lessonId = 'L01';
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
    attempt.assistance = {
      hintsUsed: Boolean(attempt.restore.hintsOn || attempt.restore.helped),
      helpRequested: Boolean(attempt.restore.helped),
      reducedTempo: false
    };
    if (!attempt.skillIds?.length) attempt.skillIds = skillIdsFor(lessonId);
    if (!attempt.skillVersion) attempt.skillVersion = lessonSpec.curriculumVersion;
    if (!attempt.sessionId) attempt.sessionId = progress.memory?.store?.session?.sessionId || null;
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
    attempt = existing || createAttempt(lessonId, {
      octavePolicyUsed: resolveOctavePolicy(lessonSpec.octavePolicy),
      skillIds: skillIdsFor(lessonId),
      skillVersion: lessonSpec.curriculumVersion,
      sessionId: progress.memory?.store?.session?.sessionId || null
    });
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

  function addInput(source, extras = {}) {
    if (source === 'demo') return;
    const unused = !attempt.events.some((event) => event.type === 'note-on') && !attempt.inputDevice;
    attempt.inputMode = unused ? mergeInputMode(source, source) : mergeInputMode(attempt.inputMode, source);
    const device = sanitizeInputDevice(extras.device);
    if (device) attempt.inputDevice = device;
  }

  function setOctavePolicyUsed(policy) {
    attempt.octavePolicyUsed = resolveOctavePolicy(lessonSpec.octavePolicy, policy);
    persist();
    return attempt.octavePolicyUsed;
  }

  function scorePitch(heard, expected, extras = {}) {
    const policy = resolveOctavePolicy(lessonSpec.octavePolicy, extras.octavePolicy || attempt.octavePolicyUsed);
    return assessHeardPitch({ heard, expected, octavePolicy: policy });
  }

  function setDemoPlaying(value) {
    playingDemo = value;
    if (value) recordEvent('demo-played');
  }

  function isDemoPlaying() {
    return playingDemo;
  }

  function handleNote(note, source, extras = {}) {
    if (!shouldCountTowardProgress(source, playingDemo)) {
      return { ignore: true, reason: 'demo-playback', counted: false };
    }
    addInput(source, extras);
    if (extras.expected != null) {
      const scored = scorePitch(note, extras.expected, extras);
      attempt.octavePolicyUsed = scored.octavePolicyUsed;
      recordEvent('note-on', { heard: note, expected: extras.expected, match: scored.match });
      if (scored.match) markExplored();
      persist();
      return {
        ok: scored.match,
        counted: true,
        match: scored.match,
        reason: scored.reason,
        octavePolicyUsed: scored.octavePolicyUsed,
        message: extras.message || (scored.match
          ? null
          : scored.reason === 'wrong-octave'
            ? 'That is the same note name in a different octave. This check wants the named key.'
            : 'That was not the requested key.')
      };
    }
    if (attempt.phase === 'demo' || attempt.phase === 'explanation' || attempt.phase === 'result') {
      markExplored();
      persist();
      return { ignore: true, reason: 'not-assessed', counted: true };
    }
    markExplored();
    if (attempt.phase === 'guided' || attempt.phase === 'remediation') return handleGuidedNote(note);
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
      const miss = recordMiss('high-low');
      return {
        ok: false,
        message: miss.easier ? `${message} Let's try an easier version — not the same hard check again.` : message,
        remediate: mode === 'independent' && note >= first,
        easier: miss.easier
      };
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
      const miss = recordMiss('groups');
      return {
        ok: false,
        message: miss.easier
          ? `${lessonSpec.copy.feedback.whiteKey} Let's try an easier version — not the same hard check again.`
          : lessonSpec.copy.feedback.whiteKey,
        easier: miss.easier
      };
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

  function completeTransfer(evidence = 'independent') {
    attempt.completedAt = new Date().toISOString();
    attempt.restore.patternId = attempt.restore.sessionCheck || evidence === 'retained' ? 'transfer' : (attempt.restore.patternId || 'home');
    attempt.patternId = attempt.restore.patternId;
    const granted = progress.applyOutcome
      ? progress.applyOutcome(lesson, attempt, evidence)
      : evidence;
    if (granted) attempt.evidenceState = promoteEvidence(attempt.evidenceState, granted);
    const grantedBefore = lesson.firstCompletionRewarded;
    setPhase('result');
    return { firstCompletion: !grantedBefore && lesson.firstCompletionRewarded, granted };
  }

  function recordMiss(kind) {
    const miss = recordMissOn(attempt, kind);
    persist();
    return miss;
  }

  function startEasierWork() {
    attempt.restore.easierWork = true;
    attempt.restore.hintsOn = true;
    attempt.restore.patternId = 'easier';
    attempt.patternId = 'easier';
    if (attempt.phase === 'independent' || attempt.phase === 'transfer' || attempt.phase === 'review') {
      attempt.phase = 'remediation';
    }
    recordEvent('phase-change');
    persist();
    return { easier: true, phase: attempt.phase };
  }

  function beginSessionCheck() {
    if (lesson.evidenceState !== 'independent' && lesson.evidenceState !== 'retained') return false;
    if (attempt.completedAt || attempt.phase === 'result') begin(null);
    attempt.restore.hintsOn = false;
    attempt.restore.sessionCheck = true;
    attempt.restore.patternId = 'transfer';
    attempt.patternId = 'transfer';
    setPhase('transfer');
    return true;
  }

  function finishForNow() {
    attempt.completedAt = new Date().toISOString();
    const keep = attempt.phase === 'independent' || attempt.phase === 'transfer' || attempt.phase === 'review'
      ? 'practiced'
      : attempt.evidenceState;
    if (progress.applyOutcome) progress.applyOutcome(lesson, attempt, keep);
    else attempt.evidenceState = promoteEvidence(attempt.evidenceState, keep);
    setPhase('result');
  }

  function setHints(on) {
    attempt.restore.hintsOn = Boolean(on);
    recordEvent(on ? 'hint-shown' : 'hint-hidden');
    persist();
  }

  function requestHelp() {
    attempt.restore.hintsOn = true;
    attempt.restore.helped = true;
    recordEvent('hint-shown');
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
      easierWork: attempt.restore.easierWork === true,
      sessionCheck: attempt.restore.sessionCheck === true,
      sourceHonesty: sourceHonesty(attempt.inputMode),
      phaseIndex: Math.max(0, PHASE_ORDER.indexOf(phase === 'transfer' || phase === 'remediation' ? 'independent' : phase))
    };
  }

  return {
    lessonSpec,
    begin,
    view,
    handleNote,
    scorePitch,
    setOctavePolicyUsed,
    setDemoPlaying,
    isDemoPlaying,
    setHints,
    requestHelp,
    setPosture,
    setAdultTwo,
    setAdultThree,
    setAudioUnlocked,
    restart,
    advanceFrom,
    finishForNow,
    persist,
    recordEvent,
    markExplored,
    recordMiss,
    startEasierWork,
    beginSessionCheck
  };
}

export function createPlayer({ progress, lessonId = 'L01', clock, now } = {}) {
  if (lessonId === 'L02') return createL02Player({ progress });
  if (lessonId === 'L03') return createL03Player({ progress });
  if (lessonId === 'L04') return createL04Player({ progress });
  if (lessonId === 'L05') return createRhythmLessonPlayer({ progress, lessonSpec: L05, clock, now });
  if (lessonId === 'L06') return createRhythmLessonPlayer({ progress, lessonSpec: L06, clock, now });
  if (lessonId === 'L07') return createRhythmLessonPlayer({ progress, lessonSpec: L07, clock, now });
  if (lessonId === 'L08') return createRhythmLessonPlayer({ progress, lessonSpec: L08, clock, now });
  if (lessonId === 'L09') return createL09Player({ progress });
  if (lessonId === 'L10') return createL10Player({ progress });
  if (lessonId === 'L11') return createL11Player({ progress });
  if (lessonId === 'L12') return createL12Player({ progress });
  if (lessonId === 'L13') return createL13Player({ progress });
  if (lessonId === 'L14') return createL14Player({ progress });
  if (lessonId === 'L15') return createL15Player({ progress });
  if (lessonId === 'L16') return createRhythmLessonPlayer({ progress, lessonSpec: L16, clock, now });
  return createL01Player({ progress });
}

export { PHASE_ORDER, GUIDED_STEPS };

