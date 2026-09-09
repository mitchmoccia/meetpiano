import { createRuntime, bindStandardPlayer } from '../player-core.js';
import { beatsToSeconds, createRhythmClock, wallClockNow } from '../rhythm-clock.js';
import { createRhythmTake, patternSpanSec } from '../rhythm-score.js';

function stepName(list, index, fallback) {
  return list[index] || fallback;
}

function policyFor(spec, phase) {
  if (spec.octavePolicy === 'mixed-by-phase') {
    return phase === 'guided' ? 'pitch-class' : 'exact-pitch';
  }
  return 'pitch-class';
}

function guidedSteps(spec) {
  return spec.copy.guided.cousin ? ['hear', 'echo', 'cousin'] : ['hear', 'echo'];
}

export function createRhythmLessonPlayer({ progress, lessonSpec, clock, now }) {
  const runtime = createRuntime({ progress, lessonSpec });
  const steps = guidedSteps(lessonSpec);
  const localClock = clock || createRhythmClock({ now: now || wallClockNow });
  let take = null;
  let lastTake = null;
  let takeKind = null;

  function bpmNow() {
    return runtime.attempt.restore.reducedTempo ? lessonSpec.reducedBpm : lessonSpec.defaultBpm;
  }

  function patternFor(kind, tempo) {
    const base = lessonSpec.patterns[kind] || lessonSpec.patterns.guided;
    return { ...base, bpm: tempo || base.bpm };
  }

  function currentKind() {
    const phase = runtime.attempt.phase;
    if (phase === 'guided') return 'guided';
    if (phase === 'independent') return 'independent';
    if (phase === 'transfer') return 'transfer';
    if (phase === 'review') return 'review';
    return 'guided';
  }

  function feedbackFor(result) {
    const copy = lessonSpec.copy.feedback;
    if (!result) return '';
    if (result.ignore) {
      if (result.reason === 'count-in') return 'Count-in. Wait for the real beats.';
      if (result.reason === 'paused') return copy.paused;
      if (result.reason === 'aborted') return copy.disconnect;
      return '';
    }
    if (result.result === 'hit') return copy.hit;
    if (result.result === 'early') return copy.early;
    if (result.result === 'late') return copy.late;
    if (result.result === 'miss') return copy.miss;
    if (result.result === 'rest') return copy.rest;
    if (result.result === 'extra') return copy.extra;
    if (result.result === 'wrong-pitch') return copy.wrongPitch;
    if (result.result === 'too-short') return copy.tooShort;
    if (result.result === 'too-long') return copy.tooLong;
    return result.message || '';
  }

  function closeTake(reason) {
    if (!take) return lastTake;
    const snap = reason ? take.abort(reason) : take.finalize();
    lastTake = snap;
    take = null;
    takeKind = null;
    localClock.stop();
    if (snap.aborted) {
      return { ...snap, message: lessonSpec.copy.feedback[reason] || lessonSpec.copy.feedback.paused };
    }
    if (snap.passed) markPassed();
    const miss = snap.misses?.length && !snap.extras.length;
    return {
      ...snap,
      ok: snap.passed,
      message: snap.passed
        ? passMessage()
        : miss
          ? lessonSpec.copy.feedback.miss
          : snap.extras[0]
            ? feedbackFor({ result: snap.extras[0].reason })
            : lessonSpec.copy.feedback.miss
    };
  }

  function passMessage() {
    const phase = runtime.attempt.phase;
    if (phase === 'transfer') return lessonSpec.copy.feedback.transferYes;
    if (phase === 'review') return lessonSpec.copy.feedback.reviewYes;
    return lessonSpec.copy.feedback.pass;
  }

  function markPassed() {
    const attempt = runtime.attempt;
    const phase = attempt.phase;
    if (phase === 'guided') {
      const step = stepName(steps, attempt.restore.guidedStep, 'echo');
      if (step === 'echo') {
        attempt.restore.guidedStep = 2;
        runtime.markPracticed();
      }
    }
    if (phase === 'independent') {
      attempt.restore.homeDone = true;
      attempt.restore.independentStep = 1;
    }
    if (phase === 'transfer') {
      attempt.restore.transferStep = 1;
    }
    runtime.persist();
  }

  function startTake(kind = currentKind(), extras = {}) {
    const tempo = extras.bpm || bpmNow();
    const pattern = patternFor(kind, tempo);
    const mode = extras.mode || (kind === 'guided' ? 'guided' : 'performance');
    takeKind = kind;
    lastTake = null;
    take = createRhythmTake({
      pattern,
      mode,
      now: () => localClock.now(),
      octavePolicy: extras.octavePolicy || policyFor(lessonSpec, runtime.attempt.phase),
      scoreReleases: Boolean(lessonSpec.scoreReleases)
    });
    const origin = extras.origin ?? localClock.now();
    if (extras.skipCountIn) {
      take.startAtOrigin(origin);
      localClock.start({ audioOrigin: origin, tempo });
    } else {
      take.start(origin);
      localClock.start({ audioOrigin: take.origin, tempo });
    }
    runtime.attempt.restore.reducedTempo = tempo === lessonSpec.reducedBpm;
    runtime.recordEvent('phase-change');
    runtime.persist();
    return {
      origin: take.origin,
      countInBeats: pattern.countInBeats,
      bpm: tempo,
      mode,
      pattern
    };
  }

  function handleTakeNote(note, extras) {
    if (!take) {
      runtime.persist();
      return { ignore: true, reason: 'no-take', message: 'Start the take first.' };
    }
    if (runtime.attempt.restore.hintsOn && runtime.attempt.phase !== 'guided') {
      runtime.persist();
      return { ok: false, message: lessonSpec.copy.feedback.hintsOff };
    }
    const result = take.noteOn(note, extras.t ?? localClock.now());
    runtime.recordEvent('note-on', {
      heard: note,
      expected: result.expected ?? null,
      match: result.ok === true
    });
    runtime.persist();
    return { ...result, message: feedbackFor(result), take: take.snapshot() };
  }

  function handleTakeRelease(note, extras) {
    if (!take || !lessonSpec.scoreReleases) return { ignore: true };
    const result = take.noteOff(note, extras.t ?? localClock.now());
    if (result.ignore) return result;
    runtime.recordEvent('note-off', {
      heard: note,
      match: result.ok === true
    });
    runtime.persist();
    return { ...result, message: feedbackFor(result), take: take.snapshot() };
  }

  const player = bindStandardPlayer(runtime, {
    onNote(note, extras) {
      if (runtime.attempt.phase === 'guided') {
        const step = stepName(steps, runtime.attempt.restore.guidedStep, 'hear');
        if (step === 'hear' || step === 'cousin') {
          runtime.persist();
          return { ignore: true, message: lessonSpec.copy.feedback.cousinListen || lessonSpec.copy.feedback.heard };
        }
      }
      if (runtime.attempt.phase === 'review' && !runtime.attempt.restore.reviewPausedAt) {
        runtime.persist();
        return { ignore: true, message: lessonSpec.copy.review.pause };
      }
      return handleTakeNote(note, extras);
    },
    view() {
      const attempt = runtime.attempt;
      const kind = currentKind();
      const pattern = patternFor(kind, bpmNow());
      return runtime.viewBase({
        guidedStep: stepName(steps, attempt.restore.guidedStep, 'done'),
        independentStep: attempt.restore.independentStep >= 1 ? 'done' : 'perform',
        transferStep: attempt.restore.transferStep >= 1 ? 'done' : 'perform',
        homeDone: attempt.restore.homeDone === true,
        heardTransfer: attempt.restore.heardTransfer === true,
        reviewPaused: Boolean(attempt.restore.reviewPausedAt),
        reducedTempo: attempt.restore.reducedTempo === true,
        bpm: bpmNow(),
        pattern,
        take: take ? take.snapshot() : lastTake,
        takeLive: Boolean(take),
        takePaused: Boolean(take?.paused),
        clock: {
          now: localClock.now(),
          origin: localClock.origin,
          paused: localClock.paused,
          running: localClock.running,
          bpm: localClock.bpm
        },
        phrase: phraseFor(attempt, lessonSpec, kind),
        captions: captionsFor(attempt, lessonSpec)
      });
    },
    advanceFrom(phase) {
      const attempt = runtime.attempt;
      if (phase === 'explanation') runtime.setPhase('demo');
      else if (phase === 'demo') {
        attempt.restore.guidedStep = 1;
        runtime.setPhase('guided');
      } else if (phase === 'guided') {
        if (steps.includes('cousin') && !attempt.restore.heardTransfer) return;
        if (attempt.restore.guidedStep < 2 && !attempt.restore.homeDone) return;
        runtime.markPracticed();
        attempt.restore.hintsOn = false;
        runtime.setPhase('independent');
      } else if (phase === 'independent') {
        if (!attempt.restore.homeDone) return;
        attempt.restore.hintsOn = false;
        runtime.setPhase('transfer');
      } else if (phase === 'transfer') {
        if (attempt.restore.transferStep < 1) return;
        runtime.completeTransfer('independent');
      }
    }
  });

  player.handleRelease = (note, source, extras = {}) => {
    if (!runtime.shouldCount(source)) {
      return { ignore: true, reason: 'demo-playback', counted: false };
    }
    return handleTakeRelease(note, extras);
  };

  player.startTake = startTake;
  player.finishTake = () => closeTake();
  player.pauseTake = () => {
    if (!take) return { ignore: true };
    take.pause();
    localClock.pause();
    return { ok: true, message: lessonSpec.copy.feedback.paused, unfairFailure: false };
  };
  player.resumeTake = () => {
    if (!take) return { ignore: true };
    take.resume();
    localClock.resume();
    return { ok: true, message: 'Back with the clock.' };
  };
  player.abortTake = (reason) => closeTake(reason);
  player.replayTake = () => {
    if (take) closeTake('replay');
    return startTake(currentKind());
  };
  player.reduceTempo = () => {
    runtime.attempt.restore.reducedTempo = true;
    runtime.persist();
    if (take) closeTake('replay');
    return startTake(currentKind(), { bpm: lessonSpec.reducedBpm });
  };
  player.markHeardDemo = () => {
    if (runtime.attempt.restore.guidedStep === 0) runtime.attempt.restore.guidedStep = 1;
    runtime.recordEvent('demo-played');
    runtime.persist();
  };
  player.markHeardTransfer = () => {
    runtime.attempt.restore.heardTransfer = true;
    runtime.recordEvent('demo-played');
    runtime.persist();
  };
  player.pauseForReview = () => {
    if (take) closeTake('replay');
    runtime.attempt.restore.reviewPausedAt = new Date().toISOString();
    runtime.attempt.completedAt = null;
    runtime.setPhase('review');
  };
  player.beginReview = () => {
    if (runtime.lesson.evidenceState !== 'independent' && runtime.lesson.evidenceState !== 'retained') return;
    if (runtime.attempt.completedAt) runtime.begin(null);
    runtime.attempt.restore.reviewPausedAt = runtime.attempt.restore.reviewPausedAt || new Date().toISOString();
    runtime.attempt.restore.hintsOn = false;
    runtime.setPhase('review');
  };
  player.clock = localClock;
  player.completeIfReady = (at) => {
    if (!take) return lastTake;
    const pattern = patternFor(takeKind || currentKind(), bpmNow());
    const end = (take.origin ?? 0) + patternSpanSec(pattern) + 0.25;
    if ((at ?? localClock.now()) >= end) {
      const snap = closeTake();
      if (snap.passed && runtime.attempt.phase === 'review') {
        runtime.completeTransfer('retained');
      }
      return snap;
    }
    return take.snapshot();
  };
  player.beatsToSeconds = beatsToSeconds;
  return player;
}

function phraseFor(attempt, spec, kind) {
  if (spec.lessonId !== 'L08') return null;
  const letters = kind === 'transfer' ? ['C', 'D', 'E'] : ['C', 'D', 'E', 'C'];
  if (attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn)) {
    return { letters, current: -1, kind: 'walk' };
  }
  if (attempt.phase === 'guided' && attempt.restore.guidedStep === 1) {
    return { letters, current: -1, kind: 'walk' };
  }
  return { letters, current: -1, kind: 'hidden' };
}

function captionsFor(attempt, spec) {
  if (spec.lessonId !== 'L08') return {};
  if (attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn)) {
    return { 60: { letter: 'C' }, 62: { letter: 'D' }, 64: { letter: 'E' } };
  }
  return {};
}
