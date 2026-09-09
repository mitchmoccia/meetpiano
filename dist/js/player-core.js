import {
  createAttempt,
  mergeInputMode,
  promoteEvidence,
  sanitizeInputDevice,
  shouldGrantFirstCompletion
} from './progress.js';
import { assessHeardPitch, resolveOctavePolicy, shouldCountTowardProgress } from './assess.js';

export const PHASE_ORDER = ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'];

export function createRuntime({ progress, lessonSpec }) {
  const lessonId = lessonSpec.lessonId;
  let lesson = progress.lessonState(lessonId);
  let attempt = currentAttempt();
  let playingDemo = false;
  let lastGrant = false;
  const pending = {};

  function currentAttempt() {
    return lesson.attempts.find((item) => item.attemptId === lesson.currentAttemptId) || null;
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

  function clearPending() {
    Object.keys(pending).forEach((key) => { delete pending[key]; });
  }

  function begin(existing) {
    attempt = existing || createAttempt(lessonId, {
      octavePolicyUsed: resolveOctavePolicy(lessonSpec.octavePolicy)
    });
    if (!existing) {
      lesson.attempts.push(attempt);
      lesson.currentAttemptId = attempt.attemptId;
      progress.saveLesson(lessonId, lesson);
    }
    clearPending();
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
    attempt.restore.sequence = [];
    recordEvent('phase-change');
    clearPending();
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

  function setHints(on) {
    attempt.restore.hintsOn = Boolean(on);
    recordEvent(on ? 'hint-shown' : 'hint-hidden');
    persist();
  }

  function fadeHints() {
    if (!attempt.restore.hintsOn) return;
    attempt.restore.hintsOn = false;
    recordEvent('hint-hidden');
    persist();
  }

  function requestHelp() {
    attempt.restore.hintsOn = true;
    attempt.restore.helped = true;
    recordEvent('hint-shown');
    persist();
  }

  function setAudioUnlocked(value) {
    attempt.audioUnlocked = Boolean(value);
    persist();
  }

  function setAdult(fields = {}) {
    if (fields.posture != null) attempt.adultObserved.posture = Boolean(fields.posture);
    if (fields.fingering != null) attempt.adultObserved.fingering = Boolean(fields.fingering);
    if (typeof fields.note === 'string') attempt.adultObserved.note = fields.note.slice(0, 160);
    if (fields.posture || fields.fingering || fields.note) markExplored();
    persist();
  }

  function markPracticed() {
    attempt.evidenceState = promoteEvidence(attempt.evidenceState, 'practiced');
    persist();
  }

  function finishAttempt(evidence) {
    attempt.completedAt = new Date().toISOString();
    if (evidence) attempt.evidenceState = promoteEvidence(attempt.evidenceState, evidence);
    const grantedBefore = lesson.firstCompletionRewarded;
    setPhase('result');
    return { firstCompletion: !grantedBefore && lesson.firstCompletionRewarded };
  }

  function finishForNow() {
    const keep = attempt.phase === 'independent' || attempt.phase === 'transfer' || attempt.phase === 'review'
      ? 'practiced'
      : attempt.evidenceState;
    return finishAttempt(keep);
  }

  function completeIndependent() {
    setPhase('transfer');
  }

  function completeTransfer(evidence = 'independent') {
    return finishAttempt(evidence);
  }

  function restart() {
    begin(null);
    lastGrant = false;
    persist();
  }

  function hydrate() {
    const inProgress = attempt && !attempt.completedAt;
    const finished = [...lesson.attempts].reverse().find((item) => item.completedAt);
    if (inProgress) begin(attempt);
    else if (finished && !lesson.currentAttemptId) attempt = finished;
    else begin(null);
  }

  hydrate();

  return {
    lessonSpec,
    get lesson() { return lesson; },
    get attempt() { return attempt; },
    get lastGrant() { return lastGrant; },
    pending,
    persist,
    begin,
    recordEvent,
    markExplored,
    markPracticed,
    setPhase,
    addInput,
    setOctavePolicyUsed,
    scorePitch,
    setDemoPlaying,
    isDemoPlaying,
    setHints,
    fadeHints,
    requestHelp,
    setAudioUnlocked,
    setAdult,
    finishForNow,
    finishAttempt,
    completeIndependent,
    completeTransfer,
    restart,
    shouldCount(source) {
      return shouldCountTowardProgress(source, playingDemo);
    },
    viewBase(extra = {}) {
      const phase = attempt.phase;
      return {
        lessonSpec,
        lesson,
        attempt,
        phase,
        hintsOn: attempt.restore.hintsOn,
        helped: attempt.restore.helped === true,
        notice: progress.memory.notice,
        firstCompletionNow: lastGrant,
        alreadyRewarded: lesson.firstCompletionRewarded && !lastGrant,
        phaseIndex: Math.max(0, PHASE_ORDER.indexOf(phase === 'transfer' || phase === 'review' ? 'independent' : phase)),
        ...extra
      };
    }
  };
}

export function bindStandardPlayer(runtime, handlers) {
  function handleNote(note, source, extras = {}) {
    if (!runtime.shouldCount(source)) {
      return { ignore: true, reason: 'demo-playback', counted: false };
    }
    runtime.addInput(source, extras);
    if (extras.expected != null) {
      const scored = runtime.scorePitch(note, extras.expected, extras);
      runtime.attempt.octavePolicyUsed = scored.octavePolicyUsed;
      runtime.recordEvent('note-on', { heard: note, expected: extras.expected, match: scored.match });
      if (scored.match) runtime.markExplored();
      runtime.persist();
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
    if (runtime.attempt.phase === 'demo' || runtime.attempt.phase === 'explanation' || runtime.attempt.phase === 'result') {
      runtime.markExplored();
      runtime.persist();
      return { ignore: true, reason: 'not-assessed', counted: true };
    }
    runtime.markExplored();
    return handlers.onNote(note, extras);
  }

  return {
    lessonSpec: runtime.lessonSpec,
    begin: runtime.begin,
    view: handlers.view,
    handleNote,
    scorePitch: runtime.scorePitch,
    setOctavePolicyUsed: runtime.setOctavePolicyUsed,
    setDemoPlaying: runtime.setDemoPlaying,
    isDemoPlaying: runtime.isDemoPlaying,
    setHints: runtime.setHints,
    fadeHints: runtime.fadeHints,
    requestHelp: runtime.requestHelp,
    setAudioUnlocked: runtime.setAudioUnlocked,
    setAdult: runtime.setAdult,
    restart: runtime.restart,
    advanceFrom: handlers.advanceFrom,
    finishForNow: runtime.finishForNow,
    persist: runtime.persist,
    recordEvent: runtime.recordEvent,
    markExplored: runtime.markExplored,
    runtime
  };
}
