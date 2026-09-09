import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { isPitchClassF, isPitchClassG } from '../assess.js';
import { L12 } from './l12.js';
import { stepName, takePhrase } from './phrase-take.js';

const GUIDED_STEPS = ['hear', 'head', 'tail', 'all', 'make', 'cousin'];
const INDEPENDENT_STEPS = ['home'];
const TRANSFER_STEPS = ['cousin'];

function usesForG(notes) {
  return notes.some((note) => isPitchClassF(note) || isPitchClassG(note));
}

export function createL12Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L12 });

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'hear');
    if (step === 'hear' || step === 'cousin') {
      runtime.persist();
      return { ignore: true, message: L12.copy.feedback.cousinListen };
    }
    if (step === 'make') {
      attempt.restore.sequence = [...attempt.restore.sequence, note].slice(-3);
      runtime.markExplored();
      if (attempt.restore.sequence.length < 3) {
        runtime.persist();
        return { ok: true, message: 'One more sound in your goodbye.' };
      }
      if (!usesForG(attempt.restore.sequence)) {
        attempt.restore.sequence = [];
        runtime.persist();
        return { ok: false, message: 'Include F or G in the goodbye.' };
      }
      attempt.restore.guidedStep = 5;
      attempt.restore.sequence = [];
      runtime.persist();
      return { ok: true, message: L12.copy.feedback.makeYes };
    }
    const expected = step === 'head' ? L12.homeHead : step === 'tail' ? L12.homeTail : L12.homePhrase;
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, expected, 'exact-pitch');
    if (!result.ok) {
      return {
        ok: false,
        remediate: result.extra,
        message: result.extra ? L12.copy.feedback.extra : L12.copy.feedback.wrong
      };
    }
    if (!result.done) return { ok: true, message: 'Next head on the porch.' };
    attempt.restore.sequence = [];
    if (step === 'head') attempt.restore.guidedStep = 2;
    else if (step === 'tail') attempt.restore.guidedStep = 3;
    else attempt.restore.guidedStep = 4;
    runtime.fadeHints();
    if (step === 'all') runtime.markPracticed();
    runtime.persist();
    const message = step === 'head' ? L12.copy.feedback.headYes : step === 'tail' ? L12.copy.feedback.tailYes : L12.copy.feedback.allYes;
    return { ok: true, message };
  }

  function handleIndependent(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then play Porch Steps. Saved progress stays.' };
    }
    attempt.restore.independentStarted = true;
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L12.homePhrase, 'exact-pitch');
    if (!result.ok) {
      return {
        ok: false,
        remediate: true,
        message: result.extra ? L12.copy.feedback.extra : L12.copy.feedback.wrong
      };
    }
    if (!result.done) return { ok: true, message: 'Keep reading the porch.' };
    attempt.restore.homeDone = true;
    attempt.restore.independentStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L12.copy.feedback.homeYes, done: true };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off. Help does not erase progress.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L12.transferPhrase, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L12.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next note in the cousin porch.' };
    attempt.restore.transferStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L12.copy.feedback.transferYes, done: true };
  }

  function handleReview(note) {
    const attempt = runtime.attempt;
    if (!attempt.restore.reviewPausedAt) {
      runtime.persist();
      return { ignore: true, message: 'Take the named pause first, then play Porch Steps.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L12.homePhrase, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L12.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Keep the remembered porch going.' };
    return { ok: true, message: L12.copy.feedback.reviewYes, retained: true };
  }

  const player = bindStandardPlayer(runtime, {
    onNote(note) {
      if (runtime.attempt.phase === 'guided') return handleGuided(note);
      if (runtime.attempt.phase === 'independent') return handleIndependent(note);
      if (runtime.attempt.phase === 'transfer') return handleTransfer(note);
      if (runtime.attempt.phase === 'review') {
        const result = handleReview(note);
        if (result.retained) runtime.completeTransfer('retained');
        return result;
      }
      runtime.persist();
      return { ignore: true };
    },
    view() {
      const attempt = runtime.attempt;
      return runtime.viewBase({
        guidedStep: stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'done'),
        independentStep: stepName(INDEPENDENT_STEPS, attempt.restore.independentStep, 'done'),
        transferStep: stepName(TRANSFER_STEPS, attempt.restore.transferStep, 'done'),
        homeDone: attempt.restore.homeDone === true,
        heardTransfer: attempt.restore.heardTransfer === true,
        reviewPaused: Boolean(attempt.restore.reviewPausedAt),
        staff: staffFor(attempt),
        captions: captionsFor(attempt)
      });
    },
    advanceFrom(phase) {
      const attempt = runtime.attempt;
      if (phase === 'explanation') runtime.setPhase('demo');
      else if (phase === 'demo') {
        attempt.restore.guidedStep = 1;
        runtime.setPhase('guided');
      } else if (phase === 'guided') {
        if (!attempt.restore.heardTransfer) return;
        runtime.markPracticed();
        attempt.restore.hintsOn = false;
        attempt.restore.sequence = [];
        runtime.setPhase('independent');
      } else if (phase === 'independent') {
        if (!attempt.restore.homeDone) return;
        attempt.restore.hintsOn = false;
        attempt.restore.sequence = [];
        runtime.setPhase('transfer');
      } else if (phase === 'transfer') {
        if (attempt.restore.transferStep < 1) return;
        runtime.completeTransfer('independent');
      }
    }
  });

  player.markHeardTransfer = () => {
    runtime.attempt.restore.heardTransfer = true;
    runtime.recordEvent('demo-played');
    runtime.persist();
  };

  player.startGuidedHear = () => {
    if (runtime.attempt.restore.guidedStep === 0) {
      runtime.attempt.restore.guidedStep = 1;
      runtime.persist();
    }
  };

  player.pauseForReview = () => {
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

  return player;
}

function staffFor(attempt) {
  const showLetters = attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn && attempt.restore.guidedStep < 4);
  if (attempt.phase === 'demo') {
    return { notes: L12.homeNotes, current: -1, showLetters: true, landmarkG: true, caption: 'Porch Steps on the treble staff. All quarters.' };
  }
  if (attempt.phase === 'guided') {
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'hear');
    if (step === 'head') {
      return { notes: L12.homeNotes.slice(0, 4), current: attempt.restore.sequence.length, showLetters, caption: 'First four quarters.' };
    }
    if (step === 'tail') {
      return { notes: L12.homeNotes.slice(4), current: attempt.restore.sequence.length, showLetters, caption: 'Last three quarters.' };
    }
    if (step === 'cousin') {
      return { notes: L12.transferNotes, current: -1, showLetters: false, caption: 'A cousin — just listening.' };
    }
    return { notes: L12.homeNotes, current: step === 'all' ? attempt.restore.sequence.length : -1, showLetters, caption: 'Seven quarters. Skip, then home.' };
  }
  if (attempt.phase === 'independent' || attempt.phase === 'review') {
    return { notes: L12.homeNotes, current: -1, showLetters: false, caption: 'Letters off. Read the porch.' };
  }
  if (attempt.phase === 'transfer') {
    return { notes: L12.transferNotes, current: -1, showLetters: false, caption: 'Porch the other way. Letters off.' };
  }
  return null;
}

function captionsFor(attempt) {
  if (attempt.phase === 'guided' && attempt.restore.hintsOn) {
    const staff = staffFor(attempt);
    const next = staff?.notes?.[attempt.restore.sequence.length];
    if (next) return { [next.midi]: { letter: next.letter } };
  }
  return {};
}

export { PHASE_ORDER, GUIDED_STEPS };
