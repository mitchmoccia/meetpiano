import { createRuntime, bindStandardPlayer } from '../player-core.js';
import { beatsToSeconds, createRhythmClock, wallClockNow } from '../rhythm-clock.js';
import { createRhythmTake, eventsForPart, eventsUntilBeat, patternSpanSec } from '../rhythm-score.js';
import { defaultHandFocus } from '../hands.js';
import { togetherHonesty } from '../evidence.js';

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
  const steps = ['left', 'right'];
  if (spec.copy.guided.loop) steps.push('loop');
  steps.push('together');
  if (spec.copy.guided.cousin) steps.push('cousin');
  return steps;
}

function partForStep(step) {
  if (step === 'left') return 'left';
  if (step === 'right') return 'right';
  return 'both';
}

export function createTogetherLessonPlayer({ progress, lessonSpec, clock, now }) {
  const runtime = createRuntime({ progress, lessonSpec });
  if (!runtime.attempt.restore.handFocus) {
    runtime.attempt.restore.handFocus = defaultHandFocus(lessonSpec.lessonId);
  }
  const steps = guidedSteps(lessonSpec);
  const localClock = clock || createRhythmClock({ now: now || wallClockNow });
  let take = null;
  let lastTake = null;
  let takeKind = null;

  function bpmNow() {
    return runtime.attempt.restore.reducedTempo ? lessonSpec.reducedBpm : lessonSpec.defaultBpm;
  }

  function currentKind() {
    const phase = runtime.attempt.phase;
    if (phase === 'guided') return 'guided';
    if (phase === 'independent') return 'independent';
    if (phase === 'transfer') return 'transfer';
    if (phase === 'review') return 'review';
    return 'guided';
  }

  function currentStep() {
    return stepName(steps, runtime.attempt.restore.guidedStep, 'together');
  }

  function patternFor(kind, tempo, extras = {}) {
    const base = lessonSpec.patterns[kind] || lessonSpec.patterns.guided;
    const step = extras.step || (runtime.attempt.phase === 'guided' ? currentStep() : 'together');
    let events = eventsForPart(base.events, extras.part || partForStep(step));
    const until = extras.untilBeat ?? (step === 'loop' ? lessonSpec.loopUntilBeat : null);
    if (Number.isFinite(until)) events = eventsUntilBeat(events, until);
    return { ...base, bpm: tempo || base.bpm, events };
  }

  function handsReady() {
    return runtime.attempt.restore.preparedLeft === true && runtime.attempt.restore.preparedRight === true;
  }

  function feedbackFor(result) {
    const copy = lessonSpec.copy.feedback;
    if (!result) return '';
    if (result.ignore) {
      if (result.reason === 'count-in') return 'Count-in. Wait for the real beats.';
      if (result.reason === 'paused') return copy.paused;
      if (result.reason === 'aborted') return copy.disconnect;
      if (result.reason === 'need-hands') return copy.needHands;
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
    else {
      const missInfo = runtime.recordMiss(snap.extras[0]?.reason || 'rhythm');
      if (missInfo.easier) {
        runtime.attempt.restore.reducedTempo = true;
        runtime.attempt.tempoBpm = lessonSpec.reducedBpm;
        if (runtime.attempt.phase !== 'guided' && runtime.attempt.phase !== 'remediation') {
          runtime.startEasierWork();
        }
      }
    }
    const miss = snap.misses?.length && !snap.extras.length;
    return {
      ...snap,
      ok: snap.passed,
      message: snap.passed
        ? passMessage()
        : runtime.attempt.restore.easierWork
          ? `${lessonSpec.copy.feedback.miss} Let's try an easier heartbeat — not the same hard take again.`
          : miss
            ? lessonSpec.copy.feedback.miss
            : snap.extras[0]
              ? feedbackFor({ result: snap.extras[0].reason })
              : lessonSpec.copy.feedback.miss,
      easier: runtime.attempt.restore.easierWork === true
    };
  }

  function passMessage() {
    const phase = runtime.attempt.phase;
    const step = currentStep();
    if (phase === 'guided' && step === 'left') return lessonSpec.copy.feedback.leftYes;
    if (phase === 'guided' && step === 'right') return lessonSpec.copy.feedback.rightYes;
    if (phase === 'guided' && step === 'loop') return lessonSpec.copy.feedback.loopYes;
    if (phase === 'transfer') return lessonSpec.copy.feedback.transferYes;
    if (phase === 'review') return lessonSpec.copy.feedback.reviewYes;
    return lessonSpec.copy.feedback.pass;
  }

  function markPassed() {
    const attempt = runtime.attempt;
    const phase = attempt.phase;
    if (phase === 'guided') {
      const step = currentStep();
      if (step === 'left') attempt.restore.preparedLeft = true;
      if (step === 'right') attempt.restore.preparedRight = true;
      if (step === 'loop') attempt.restore.passage = 'head';
      if (step === 'together') {
        attempt.restore.homeDone = true;
        runtime.markPracticed();
      }
      const index = steps.indexOf(step);
      if (index >= 0 && index < steps.length - 1) attempt.restore.guidedStep = index + 1;
      else if (step === 'together') attempt.restore.guidedStep = steps.indexOf('cousin') >= 0 ? steps.indexOf('cousin') : index + 1;
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
    const phase = runtime.attempt.phase;
    const step = extras.step || (phase === 'guided' ? currentStep() : 'together');
    if (phase === 'guided' && (step === 'together' || step === 'loop') && !handsReady()) {
      return { blocked: true, reason: 'need-hands', message: lessonSpec.copy.feedback.needHands };
    }
    if (phase !== 'guided' && phase !== 'remediation' && !handsReady() && phase !== 'review') {
      return { blocked: true, reason: 'need-hands', message: lessonSpec.copy.feedback.needHands };
    }
    const tempo = extras.bpm || bpmNow();
    const pattern = patternFor(kind, tempo, extras);
    takeKind = kind;
    lastTake = null;
    take = createRhythmTake({
      pattern,
      mode: extras.mode || (kind === 'guided' ? 'guided' : 'performance'),
      now: () => localClock.now(),
      octavePolicy: extras.octavePolicy || policyFor(lessonSpec, runtime.attempt.phase),
      scoreReleases: Boolean(lessonSpec.scoreReleases),
      stickyAlign: lessonSpec.stickyAlign !== false
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
    runtime.attempt.tempoBpm = tempo;
    if (step === 'loop') runtime.attempt.restore.patternId = 'passage';
    runtime.recordEvent('phase-change');
    runtime.persist();
    return {
      origin: take.origin,
      countInBeats: pattern.countInBeats,
      bpm: tempo,
      mode: extras.mode || (kind === 'guided' ? 'guided' : 'performance'),
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
        const step = currentStep();
        if (step === 'cousin') {
          runtime.persist();
          return { ignore: true, message: lessonSpec.copy.feedback.cousinListen };
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
      const step = currentStep();
      const pattern = patternFor(kind, bpmNow());
      return runtime.viewBase({
        guidedStep: stepName(steps, attempt.restore.guidedStep, 'done'),
        independentStep: attempt.restore.independentStep >= 1 ? 'done' : 'perform',
        transferStep: attempt.restore.transferStep >= 1 ? 'done' : 'perform',
        homeDone: attempt.restore.homeDone === true,
        heardTransfer: attempt.restore.heardTransfer === true,
        reviewPaused: Boolean(attempt.restore.reviewPausedAt),
        reducedTempo: attempt.restore.reducedTempo === true,
        preparedLeft: attempt.restore.preparedLeft === true,
        preparedRight: attempt.restore.preparedRight === true,
        handsReady: handsReady(),
        passage: attempt.restore.passage || 'all',
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
        phrase: null,
        captions: captionsFor(attempt, lessonSpec, kind, step),
        handFocus: attempt.restore.handFocus || defaultHandFocus(lessonSpec.lessonId),
        staff: staffFor(attempt, lessonSpec, kind, step),
        sourceHonesty: togetherHonesty(attempt.inputMode),
        togetherStandIn: lessonSpec.copy.feedback.screenStandIn
      });
    },
    advanceFrom(phase) {
      const attempt = runtime.attempt;
      if (phase === 'explanation') runtime.setPhase('demo');
      else if (phase === 'demo') {
        attempt.restore.guidedStep = 0;
        runtime.setPhase('guided');
      } else if (phase === 'guided') {
        if (steps.includes('cousin') && !attempt.restore.heardTransfer) return;
        if (!handsReady() || !attempt.restore.homeDone) return;
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
    runtime.attempt.restore.preparedLeft = true;
    runtime.attempt.restore.preparedRight = true;
    runtime.setPhase('review');
  };
  player.beginSessionCheck = runtime.beginSessionCheck;
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
  player.setHandFocus = (focus) => {
    runtime.attempt.restore.handFocus = focus;
    runtime.persist();
    return { current: focus, phase: runtime.attempt.phase, guidedStep: runtime.attempt.restore.guidedStep };
  };
  player.setHandMark = (checked) => {
    runtime.setAdult({ hand: checked });
  };
  player.setPassage = (passage) => {
    runtime.attempt.restore.passage = passage === 'head' ? 'head' : 'all';
    runtime.persist();
  };
  return player;
}

function captionsFor(attempt, spec, kind, step) {
  if (attempt.phase !== 'demo' && !(attempt.phase === 'guided' && attempt.restore.hintsOn)) return {};
  const notes = kind === 'transfer' ? spec.transferNotes : spec.homeNotes;
  const wantPart = partForStep(step);
  const out = {};
  notes.forEach((note) => {
    const part = note.clef === 'bass' ? 'left' : 'right';
    if (wantPart !== 'both' && part !== wantPart) return;
    out[note.midi] = { letter: note.letter };
  });
  return out;
}

function staffFor(attempt, spec, kind, step) {
  if (attempt.phase === 'explanation' || attempt.phase === 'result') return null;
  const showLetters = attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn);
  const notes = kind === 'transfer' ? spec.transferNotes : spec.homeNotes;
  const wantPart = attempt.phase === 'guided' ? partForStep(step) : 'both';
  const visible = wantPart === 'both'
    ? notes
    : notes.filter((note) => (note.clef === 'bass' ? 'left' : 'right') === wantPart);
  const caption = step === 'left'
    ? 'Just the left room.'
    : step === 'right'
      ? 'Just the right room.'
      : step === 'loop'
        ? 'Small loop. First two clicks.'
        : kind === 'transfer'
          ? spec.copy.transfer.title
          : 'Both rooms. Same click.';
  return {
    notes: visible,
    current: -1,
    showLetters,
    grand: true,
    caption
  };
}
