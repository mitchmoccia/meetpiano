import { createRuntime, bindStandardPlayer } from '../player-core.js';
import { beatsToSeconds, createRhythmClock, wallClockNow } from '../rhythm-clock.js';
import { createRhythmTake, patternSpanSec } from '../rhythm-score.js';
import { expressionHonesty } from '../evidence.js';
import { takePhrase, stepName } from './phrase-take.js';
import {
  CHOICES,
  TRANSFER_CHOICES,
  alignHeard,
  buildResultCard,
  compareDynamics,
  dynamicsHonesty,
  matchChosenPhrase,
  phraseForChoice,
  purposePhrase,
  recitalPhrase,
  rhythmFromOnsets,
  velocityCapable
} from '../expression-score.js';

function policyFor(spec, phase) {
  if (spec.octavePolicy === 'mixed-by-phase') {
    return phase === 'guided' ? 'pitch-class' : 'exact-pitch';
  }
  return 'exact-pitch';
}

function guidedSteps(id) {
  if (id === 'L21') return ['hear', 'notes', 'listen', 'cousin'];
  if (id === 'L22') return ['pick', 'play', 'cousin'];
  if (id === 'L23') return ['pick', 'work', 'whole', 'cousin'];
  return ['pick', 'remind', 'play', 'listen'];
}

export function createExpressionLessonPlayer({ progress, lessonSpec, clock, now }) {
  const runtime = createRuntime({ progress, lessonSpec });
  const id = lessonSpec.lessonId;
  const steps = guidedSteps(id);
  const localClock = clock || createRhythmClock({ now: now || wallClockNow });
  let take = null;
  let lastTake = null;

  function currentStep() {
    return stepName(steps, runtime.attempt.restore.guidedStep, steps[steps.length - 1]);
  }

  function choiceCatalog(phase) {
    return phase === 'transfer' || runtime.attempt.restore.sessionCheck ? (lessonSpec.transferChoices || TRANSFER_CHOICES) : (lessonSpec.choices || CHOICES);
  }

  function stemFor(phase) {
    return phase === 'transfer' || runtime.attempt.restore.sessionCheck ? lessonSpec.transferStem : lessonSpec.homeStem;
  }

  function expectedPhrase() {
    const phase = runtime.attempt.phase;
    const transfer = phase === 'transfer' || runtime.attempt.restore.sessionCheck === true;
    if (id === 'L21') return transfer ? lessonSpec.transferPhrase : lessonSpec.homePhrase;
    if (id === 'L22') {
      const choice = runtime.attempt.restore.choiceId;
      return phraseForChoice(stemFor(phase), choice, choiceCatalog(phase));
    }
    if (id === 'L23') {
      const step = phase === 'guided' ? currentStep() : (runtime.attempt.restore.workDone && !runtime.attempt.restore.wholeDone ? 'whole' : 'work');
      if (phase === 'guided' && step === 'whole') return lessonSpec.homePhrase;
      if (phase === 'independent' && runtime.attempt.restore.workDone && !runtime.attempt.restore.wholeDone) return lessonSpec.homePhrase;
      if (phase === 'transfer' && runtime.attempt.restore.purpose === 'notes') return lessonSpec.transferPhrase;
      return purposePhrase(runtime.attempt.restore.purpose, { transfer });
    }
    const yours = runtime.attempt.restore.yoursPhrase;
    return recitalPhrase(runtime.attempt.restore.recitalPiece, yours);
  }

  function stashSense(extras) {
    const attempt = runtime.attempt;
    if (velocityCapable(attempt.inputMode, extras)) {
      attempt.restore.velocityCapable = true;
      attempt.restore.velocities = [...(attempt.restore.velocities || []), extras.velocity];
    }
    if (Number.isFinite(extras.t)) {
      attempt.restore.onsets = [...(attempt.restore.onsets || []), extras.t];
    }
  }

  function refreshCard(extras = {}) {
    const attempt = runtime.attempt;
    attempt.restore.resultCard = buildResultCard({
      notes: extras.notes ?? (attempt.restore.notesPassed === true ? true : attempt.restore.notesPassed === false ? false : null),
      rhythm: extras.rhythm ?? (attempt.restore.purpose === 'notes' || attempt.restore.purpose === 'spot'
        ? 'not-asked'
        : (attempt.restore.rhythmPassed === true ? true : attempt.restore.rhythmPassed === false ? false : null)),
      assistance: Boolean(attempt.restore.helped || attempt.restore.hintsOn),
      selfObservation: Boolean(attempt.adultObserved?.selfHeard || attempt.restore.selfHeard),
      listened: Boolean(attempt.adultObserved?.listened),
      transferLater: extras.transferLater ?? (attempt.restore.sessionCheck || attempt.phase === 'review' ? (attempt.restore.transferStep >= 1) : 'later'),
      dynamics: extras.dynamics ?? (attempt.restore.velocityCapable
        ? attempt.restore.dynamicsPassed === true
        : (attempt.adultObserved?.listened ? 'unavailable' : 'unavailable')),
      finishedThrough: attempt.restore.finishedThrough === true
    });
  }

  function requestedEvidence(wanted) {
    const attempt = runtime.attempt;
    if (wanted !== 'independent' && wanted !== 'retained') return wanted;
    if (id === 'L21' && !attempt.restore.dynamicsPassed && !attempt.adultObserved.listened) return 'practiced';
    if (id === 'L24' && (!attempt.restore.finishedThrough || !attempt.adultObserved.listened)) return 'practiced';
    return wanted;
  }

  function clearPlay() {
    runtime.attempt.restore.sequence = [];
    runtime.attempt.restore.velocities = [];
    runtime.attempt.restore.onsets = [];
  }

  function finishPhrase(ok, extras = {}) {
    const attempt = runtime.attempt;
    const phase = attempt.phase;
    attempt.restore.notesPassed = ok === true;
    if (id === 'L21' && ok) scoreDynamics();
    if (id === 'L23' || id === 'L24') scoreRhythm();
    if (id === 'L24') {
      attempt.restore.finishedThrough = true;
    }
    if (ok || (id === 'L24' && attempt.restore.finishedThrough)) {
      if (phase === 'guided') advanceGuided();
      if (phase === 'independent') markIndependentProgress();
      if (phase === 'transfer' || phase === 'review') attempt.restore.transferStep = 1;
    } else if (id !== 'L24') {
      runtime.recordMiss(extras.reason || 'notes');
    }
    refreshCard({ notes: ok });
    runtime.persist();
    return ok;
  }

  function scoreDynamics() {
    const attempt = runtime.attempt;
    if (!attempt.restore.velocityCapable) {
      attempt.restore.dynamicsPassed = false;
      return { ok: false, reason: 'unavailable' };
    }
    const compared = compareDynamics(attempt.restore.velocities, { split: lessonSpec.split || 4 });
    attempt.restore.dynamicsPassed = compared.ok === true;
    return compared;
  }

  function scoreRhythm() {
    const attempt = runtime.attempt;
    if (id === 'L23' && (attempt.restore.purpose === 'notes' || attempt.restore.purpose === 'spot')) {
      attempt.restore.rhythmPassed = false;
      return { ok: null, reason: 'not-asked' };
    }
    const scored = rhythmFromOnsets(attempt.restore.onsets);
    attempt.restore.rhythmPassed = scored.ok === true;
    return scored;
  }

  function advanceGuided() {
    const attempt = runtime.attempt;
    const step = currentStep();
    if (id === 'L21' && step === 'notes') {
      attempt.restore.homeDone = true;
      runtime.markPracticed();
    }
    if (id === 'L22' && step === 'play') {
      attempt.restore.homeDone = true;
      attempt.restore.yoursPhrase = expectedPhrase();
      runtime.markPracticed();
    }
    if (id === 'L23' && step === 'work') attempt.restore.workDone = true;
    if (id === 'L23' && step === 'whole') {
      attempt.restore.wholeDone = true;
      attempt.restore.homeDone = true;
      runtime.markPracticed();
    }
    if (id === 'L24' && step === 'play') {
      attempt.restore.homeDone = true;
      runtime.markPracticed();
    }
    const index = steps.indexOf(step);
    if (index >= 0 && index < steps.length - 1) attempt.restore.guidedStep = index + 1;
  }

  function markIndependentProgress() {
    const attempt = runtime.attempt;
    if (id === 'L23' && !attempt.restore.workDone) {
      attempt.restore.workDone = true;
      clearPlay();
      return;
    }
    attempt.restore.homeDone = true;
    attempt.restore.wholeDone = true;
    attempt.restore.independentStep = 1;
    if (id === 'L22') attempt.restore.yoursPhrase = expectedPhrase();
    if (id === 'L24') attempt.restore.firstPiece = attempt.restore.recitalPiece;
  }

  function handlePhrase(note, extras) {
    const attempt = runtime.attempt;
    const phase = attempt.phase;
    const expected = expectedPhrase();
    if (id === 'L22' && !attempt.restore.choiceId) {
      return { ok: false, ignore: true, message: lessonSpec.copy.feedback.needPick };
    }
    if ((id === 'L23' || id === 'L24') && phase !== 'guided' && !needReady()) {
      return { ok: false, ignore: true, message: lessonSpec.copy.feedback.needPick };
    }
    if (id === 'L23' && phase === 'guided' && currentStep() === 'pick') {
      return { ok: false, ignore: true, message: lessonSpec.copy.feedback.needPick };
    }
    if (id === 'L24' && phase === 'guided' && currentStep() === 'pick') {
      return { ok: false, ignore: true, message: lessonSpec.copy.feedback.needPick };
    }
    if (!expected) {
      return { ok: false, ignore: true, message: lessonSpec.copy.feedback.needPick };
    }
    if (attempt.restore.hintsOn && phase !== 'guided' && id !== 'L24') {
      return { ok: false, message: lessonSpec.copy.feedback.hintsOff };
    }

    if (id === 'L24' || (phase !== 'guided' && lessonSpec.finishThroughMistakes && phase !== 'remediation')) {
      attempt.restore.sequence = [...attempt.restore.sequence, note];
      stashSense(extras);
      runtime.recordEvent('note-on', {
        heard: note,
        expected: expected[attempt.restore.sequence.length - 1] ?? null,
        match: note === expected[attempt.restore.sequence.length - 1],
        heardVelocity: attempt.restore.velocityCapable ? extras.velocity : null
      });
      const aligned = alignHeard(attempt.restore.sequence, expected);
      if (!aligned.finishedThrough) {
        runtime.persist();
        return { ok: true, message: lessonSpec.copy.feedback.keptGoing || 'Keep going.' };
      }
      finishPhrase(aligned.notesPassed, { reason: 'notes' });
      attempt.restore.finishedThrough = true;
      refreshCard({ notes: aligned.notesPassed });
      runtime.persist();
      return {
        ok: true,
        finished: true,
        notesPassed: aligned.notesPassed,
        message: aligned.notesPassed ? lessonSpec.copy.feedback.notesYes : lessonSpec.copy.feedback.finished
      };
    }

    if (id === 'L22') {
      attempt.restore.sequence = [...attempt.restore.sequence, note];
      stashSense(extras);
      if (attempt.restore.sequence.length < expected.length) {
        runtime.persist();
        return { ok: true, message: 'Next note in the ending you picked.' };
      }
      const matched = matchChosenPhrase(attempt.restore.sequence, stemFor(phase), attempt.restore.choiceId, choiceCatalog(phase));
      if (matched.ok) {
        finishPhrase(true);
        return { ok: true, message: phase === 'transfer' ? lessonSpec.copy.feedback.transferYes : lessonSpec.copy.feedback.match };
      }
      const message = matched.reason === 'other-valid'
        ? lessonSpec.copy.feedback.otherValid
        : (phase === 'transfer' ? lessonSpec.copy.feedback.transferWrong : lessonSpec.copy.feedback.wrong);
      attempt.restore.sequence = [];
      runtime.recordMiss(matched.reason);
      runtime.persist();
      return { ok: false, message };
    }

    const policy = policyFor(lessonSpec, phase);
    stashSense(extras);
    const result = takePhrase(runtime, note, expected, policy);
    if (!result.ok) {
      clearPlay();
      return { ok: false, message: lessonSpec.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next note in that walk.' };
    finishPhrase(true);
    if (id === 'L21') {
      const dynamics = scoreDynamics();
      refreshCard({ notes: true, dynamics: attempt.restore.velocityCapable ? dynamics.ok : 'unavailable' });
      runtime.persist();
      if (attempt.restore.velocityCapable && !dynamics.ok) {
        return { ok: true, notesPassed: true, dynamicsPassed: false, message: lessonSpec.copy.feedback.dynamicsNo };
      }
      if (!attempt.restore.velocityCapable) {
        return { ok: true, notesPassed: true, message: lessonSpec.copy.feedback.dynamicsUnavailable };
      }
      return { ok: true, message: lessonSpec.copy.feedback.dynamicsYes };
    }
    if (id === 'L23') {
      const step = phase === 'guided' ? currentStep() : (attempt.restore.independentStep >= 1 ? 'done' : 'work');
      if (attempt.restore.purpose === 'rhythm') {
        const rhythm = scoreRhythm();
        if (rhythm.ok === false) return { ok: false, message: lessonSpec.copy.feedback.dumped };
      }
      return { ok: true, message: step === 'whole' ? lessonSpec.copy.feedback.wholeYes : lessonSpec.copy.feedback.notesYes };
    }
    return { ok: true, message: lessonSpec.copy.feedback.notesYes };
  }

  function needReady() {
    if (id === 'L23') return Boolean(runtime.attempt.restore.purpose);
    if (id === 'L24') return Boolean(runtime.attempt.restore.recitalPiece);
    if (id === 'L22') return Boolean(runtime.attempt.restore.choiceId);
    return true;
  }

  function handleGuidedListen() {
    return { ignore: true, message: lessonSpec.copy.guided.listen };
  }

  const player = bindStandardPlayer(runtime, {
    onNote(note, extras) {
      const attempt = runtime.attempt;
      const phase = attempt.phase;
      const step = currentStep();
      if (phase === 'guided' && (step === 'hear' || step === 'cousin' || step === 'remind')) {
        return { ignore: true, message: lessonSpec.copy.feedback.cousinListen || lessonSpec.copy.feedback.heard };
      }
      if (phase === 'guided' && step === 'listen') return handleGuidedListen();
      if (phase === 'review' && !attempt.restore.reviewPausedAt) {
        return { ignore: true, message: lessonSpec.copy.review.pause };
      }
      if (id === 'L23' && attempt.restore.purpose === 'rhythm' && take) {
        return handleTakeNote(note, extras);
      }
      return handlePhrase(note, extras);
    },
    view() {
      const attempt = runtime.attempt;
      const step = currentStep();
      const expected = expectedPhrase();
      const recital = id === 'L24' && (attempt.phase === 'independent' || attempt.phase === 'transfer' || attempt.phase === 'review');
      refreshCard();
      return runtime.viewBase({
        guidedStep: stepName(steps, attempt.restore.guidedStep, 'done'),
        independentStep: attempt.restore.independentStep >= 1 ? 'done' : (id === 'L23' && !attempt.restore.workDone ? 'work' : 'play'),
        transferStep: attempt.restore.transferStep >= 1 ? 'done' : 'play',
        homeDone: attempt.restore.homeDone === true,
        heardTransfer: attempt.restore.heardTransfer === true,
        reviewPaused: Boolean(attempt.restore.reviewPausedAt),
        choiceId: attempt.restore.choiceId,
        purpose: attempt.restore.purpose,
        recitalPiece: attempt.restore.recitalPiece,
        firstPiece: attempt.restore.firstPiece || null,
        velocityCapable: attempt.restore.velocityCapable === true,
        dynamicsPassed: attempt.restore.dynamicsPassed === true,
        notesPassed: attempt.restore.notesPassed === true,
        rhythmPassed: attempt.restore.rhythmPassed === true,
        finishedThrough: attempt.restore.finishedThrough === true,
        workDone: attempt.restore.workDone === true,
        wholeDone: attempt.restore.wholeDone === true,
        resultCard: attempt.restore.resultCard || null,
        recitalMode: recital,
        useClock: id === 'L23' && attempt.restore.purpose === 'rhythm',
        bpm: attempt.restore.reducedTempo ? lessonSpec.reducedBpm : lessonSpec.defaultBpm,
        pattern: lessonSpec.patterns?.[attempt.phase === 'transfer' ? 'transfer' : 'guided'] || null,
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
        phrase: phraseView(attempt, expected, recital),
        captions: captionsFor(attempt, expected, recital),
        staff: staffFor(attempt, lessonSpec, expected, recital, step),
        sourceHonesty: expressionHonesty(attempt.inputMode),
        dynamicsHonesty: dynamicsHonesty(attempt.inputMode, attempt.restore.velocityCapable),
        expectedPhrase: expected
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
        if (id === 'L21' && !attempt.restore.homeDone) return;
        if (id === 'L22' && !attempt.restore.homeDone) return;
        if (id === 'L23' && !attempt.restore.homeDone) return;
        if (id === 'L24' && !attempt.restore.homeDone) return;
        runtime.markPracticed();
        attempt.restore.hintsOn = false;
        if (id === 'L24') attempt.restore.hintsOn = false;
        runtime.setPhase('independent');
        clearPlay();
        attempt.restore.workDone = false;
        attempt.restore.wholeDone = false;
        attempt.restore.independentStep = 0;
        attempt.restore.homeDone = false;
      } else if (phase === 'independent') {
        if (!attempt.restore.homeDone && !(id === 'L24' && attempt.restore.finishedThrough)) return;
        attempt.restore.homeDone = true;
        attempt.restore.hintsOn = false;
        runtime.setPhase('transfer');
        clearPlay();
      } else if (phase === 'transfer') {
        if (attempt.restore.transferStep < 1) return;
        runtime.completeTransfer(requestedEvidence('independent'));
      }
    }
  });

  function handleTakeNote(note, extras) {
    if (!take) return handlePhrase(note, extras);
    const result = take.noteOn(note, extras.t ?? localClock.now());
    stashSense(extras);
    runtime.persist();
    if (result.result === 'extra' || result.result === 'wrong-pitch') {
      return { ...result, message: lessonSpec.copy.feedback.wrong };
    }
    return { ...result, message: result.ok ? lessonSpec.copy.feedback.rhythmYes : lessonSpec.copy.feedback.dumped, take: take.snapshot() };
  }

  player.setChoice = (choiceId) => {
    if (!CHOICES[choiceId]) return null;
    runtime.attempt.restore.choiceId = choiceId;
    clearPlay();
    if (runtime.attempt.phase === 'guided') runtime.attempt.restore.guidedStep = steps.indexOf('play');
    runtime.persist();
    return choiceId;
  };
  player.setPurpose = (purpose) => {
    if (!['notes', 'rhythm', 'spot'].includes(purpose)) return null;
    runtime.attempt.restore.purpose = purpose;
    clearPlay();
    if (runtime.attempt.phase === 'guided' && currentStep() === 'pick') runtime.attempt.restore.guidedStep = steps.indexOf('work');
    runtime.persist();
    return purpose;
  };
  player.setRecitalPiece = (piece) => {
    if (!['wave', 'walk', 'yours'].includes(piece)) return null;
    if (runtime.attempt.phase === 'transfer' && runtime.attempt.restore.firstPiece && piece === runtime.attempt.restore.firstPiece) {
      return { blocked: true, message: lessonSpec.copy.feedback.needOther };
    }
    runtime.attempt.restore.recitalPiece = piece;
    clearPlay();
    if (runtime.attempt.phase === 'guided' && currentStep() === 'pick') runtime.attempt.restore.guidedStep = steps.indexOf('remind');
    runtime.persist();
    return piece;
  };
  player.setListened = (checked) => {
    runtime.setAdult({ listened: checked });
    if (checked && runtime.attempt.phase === 'guided' && currentStep() === 'listen') {
      const index = steps.indexOf('listen');
      if (index >= 0 && index < steps.length - 1) runtime.attempt.restore.guidedStep = index + 1;
    }
    refreshCard();
    runtime.persist();
  };
  player.setSelfHeard = (checked) => {
    runtime.setAdult({ selfHeard: checked });
    runtime.attempt.restore.selfHeard = Boolean(checked);
    refreshCard();
    runtime.persist();
  };
  player.finishShare = () => {
    const expected = expectedPhrase();
    const aligned = alignHeard(runtime.attempt.restore.sequence, expected || []);
    runtime.attempt.restore.finishedThrough = true;
    runtime.attempt.restore.notesPassed = aligned.notesPassed;
    scoreRhythm();
    if (runtime.attempt.phase === 'guided') advanceGuided();
    if (runtime.attempt.phase === 'independent') markIndependentProgress();
    if (runtime.attempt.phase === 'transfer' || runtime.attempt.phase === 'review') runtime.attempt.restore.transferStep = 1;
    refreshCard({ notes: aligned.notesPassed });
    runtime.persist();
    return { ok: true, finished: true, notesPassed: aligned.notesPassed, message: lessonSpec.copy.feedback.finished };
  };
  player.markHeardDemo = () => {
    runtime.recordEvent('demo-played');
    if (runtime.attempt.phase === 'guided' && currentStep() === 'hear') runtime.attempt.restore.guidedStep = steps.indexOf('notes');
    if (runtime.attempt.phase === 'guided' && currentStep() === 'remind') runtime.attempt.restore.guidedStep = steps.indexOf('play');
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
  player.beginSessionCheck = runtime.beginSessionCheck;
  player.startTake = (kind = 'guided', extras = {}) => {
    if (id !== 'L23' || runtime.attempt.restore.purpose !== 'rhythm') {
      return { blocked: true, reason: 'not-clock', message: lessonSpec.copy.feedback.needPick };
    }
    const tempo = extras.bpm || (runtime.attempt.restore.reducedTempo ? lessonSpec.reducedBpm : lessonSpec.defaultBpm);
    const pattern = {
      ...(lessonSpec.patterns[runtime.attempt.phase === 'transfer' ? 'transfer' : 'guided'] || lessonSpec.patterns.guided),
      bpm: tempo
    };
    take = createRhythmTake({
      pattern,
      mode: extras.mode || (runtime.attempt.phase === 'guided' ? 'guided' : 'performance'),
      now: () => localClock.now(),
      octavePolicy: policyFor(lessonSpec, runtime.attempt.phase),
      stickyAlign: true
    });
    const origin = extras.origin ?? localClock.now();
    take.start(origin);
    localClock.start({ audioOrigin: take.origin, tempo });
    runtime.attempt.tempoBpm = tempo;
    runtime.persist();
    return { origin: take.origin, countInBeats: pattern.countInBeats, bpm: tempo, pattern };
  };
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
    return { ok: true };
  };
  player.abortTake = (reason) => closeTake(reason);
  player.replayTake = () => {
    if (take) closeTake('replay');
    return player.startTake();
  };
  player.reduceTempo = () => {
    runtime.attempt.restore.reducedTempo = true;
    runtime.persist();
    if (take) closeTake('replay');
    return player.startTake('guided', { bpm: lessonSpec.reducedBpm });
  };
  player.completeIfReady = (at) => {
    if (!take) return lastTake;
    const pattern = lessonSpec.patterns[runtime.attempt.phase === 'transfer' ? 'transfer' : 'guided'];
    const end = (take.origin ?? 0) + patternSpanSec(pattern) + 0.25;
    if ((at ?? localClock.now()) >= end) return closeTake();
    return take.snapshot();
  };
  player.beatsToSeconds = beatsToSeconds;
  player.clock = localClock;

  function closeTake(reason) {
    if (!take) return lastTake;
    const snap = reason ? take.abort(reason) : take.finalize();
    lastTake = snap;
    take = null;
    localClock.stop();
    if (snap.aborted) return { ...snap, message: lessonSpec.copy.feedback.paused };
    runtime.attempt.restore.notesPassed = snap.passed === true;
    runtime.attempt.restore.rhythmPassed = snap.passed === true;
    if (snap.passed) finishPhrase(true);
    else runtime.recordMiss('rhythm');
    refreshCard({ notes: snap.passed, rhythm: snap.passed });
    runtime.persist();
    return { ...snap, ok: snap.passed, message: snap.passed ? lessonSpec.copy.feedback.rhythmYes : lessonSpec.copy.feedback.dumped };
  }

  return player;
}

function phraseView(attempt, expected, recital) {
  if (recital || attempt.phase === 'independent' || attempt.phase === 'transfer' || attempt.phase === 'review') {
    return { kind: 'hidden', letters: [], current: -1 };
  }
  if (!expected) return { kind: 'hidden', letters: [], current: -1 };
  const letters = expected.map((midi) => ({ 60: 'C', 62: 'D', 64: 'E', 67: 'G' }[midi] || ''));
  return {
    kind: attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn) ? 'tiles' : 'hidden',
    letters,
    current: attempt.restore.sequence.length
  };
}

function captionsFor(attempt, expected, recital) {
  if (recital || attempt.phase === 'independent' || attempt.phase === 'transfer' || attempt.phase === 'review') return {};
  if (attempt.phase !== 'demo' && !(attempt.phase === 'guided' && attempt.restore.hintsOn)) return {};
  const out = {};
  (expected || []).forEach((midi) => {
    out[midi] = { letter: ({ 60: 'C', 62: 'D', 64: 'E', 67: 'G' }[midi] || '') };
  });
  return out;
}

function staffFor(attempt, spec, expected, recital, step) {
  if (attempt.phase === 'explanation' || attempt.phase === 'result' || recital) return null;
  const showLetters = attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn);
  const notes = attempt.phase === 'transfer' ? spec.transferNotes : spec.homeNotes;
  return {
    notes: notes || [],
    current: -1,
    showLetters,
    grand: false,
    caption: step === 'cousin' ? spec.copy.guided.cousin : spec.title
  };
}
