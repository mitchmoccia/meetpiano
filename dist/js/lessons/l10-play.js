import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { isWhiteSkip, isWhiteStep } from '../assess.js';
import { L10 } from './l10.js';
import { stepName, takePhrase } from './phrase-take.js';

const GUIDED_STEPS = ['step', 'repeat', 'skip', 'make'];
const INDEPENDENT_STEPS = ['chain'];
const TRANSFER_STEPS = ['chain'];

function policyFor(phase) {
  return phase === 'guided' ? 'pitch-class' : 'exact-pitch';
}

function creativityOk(notes) {
  if (!Array.isArray(notes) || notes.length !== 3) return false;
  const pairs = [[notes[0], notes[1]], [notes[1], notes[2]]];
  const hasStep = pairs.some((pair) => isWhiteStep(pair[0], pair[1]));
  const hasSkip = pairs.some((pair) => isWhiteSkip(pair[0], pair[1]));
  return hasStep && hasSkip;
}

export function createL10Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L10 });

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'step');
    const policy = policyFor('guided');
    if (step === 'make') {
      attempt.restore.sequence = [...attempt.restore.sequence, note].slice(-3);
      runtime.markExplored();
      if (attempt.restore.sequence.length < 3) {
        runtime.persist();
        return { ok: true, message: 'One more sound in your goodbye.' };
      }
      if (!creativityOk(attempt.restore.sequence)) {
        attempt.restore.sequence = [];
        runtime.persist();
        return { ok: false, message: 'Use one step and one skip in the three notes.' };
      }
      attempt.restore.guidedStep = 4;
      attempt.restore.sequence = [];
      runtime.markPracticed();
      runtime.persist();
      return { ok: true, message: L10.copy.feedback.makeYes };
    }
    const expected = step === 'step' ? L10.stepUp : step === 'repeat' ? L10.repeatG : L10.skipUp;
    const result = takePhrase(runtime, note, expected, policy);
    if (!result.ok) {
      return {
        ok: false,
        remediate: true,
        message: step === 'skip' ? L10.copy.feedback.needSkip : step === 'repeat' ? L10.copy.feedback.needRepeat : L10.copy.feedback.needStep
      };
    }
    if (!result.done) return { ok: true, message: 'Next note in that jump.' };
    attempt.restore.sequence = [];
    attempt.restore.guidedStep += 1;
    runtime.fadeHints();
    if (attempt.restore.guidedStep >= 3) runtime.markPracticed();
    runtime.persist();
    const doneMessage = step === 'step' ? L10.copy.feedback.stepYes : step === 'repeat' ? L10.copy.feedback.repeatYes : L10.copy.feedback.skipYes;
    return { ok: true, message: doneMessage };
  }

  function handleIndependent(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then play the chain. Saved progress stays.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L10.homeChain, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L10.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Keep the chain going.' };
    attempt.restore.homeDone = true;
    attempt.restore.independentStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L10.copy.feedback.chainYes, done: true };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off. Help does not erase progress.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L10.transferChain, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L10.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next note down the path.' };
    attempt.restore.transferStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L10.copy.feedback.transferYes, done: true };
  }

  const player = bindStandardPlayer(runtime, {
    onNote(note) {
      if (runtime.attempt.phase === 'guided') return handleGuided(note);
      if (runtime.attempt.phase === 'independent') return handleIndependent(note);
      if (runtime.attempt.phase === 'transfer') return handleTransfer(note);
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
        phrase: phraseFor(attempt),
        captions: captionsFor(attempt)
      });
    },
    advanceFrom(phase) {
      const attempt = runtime.attempt;
      if (phase === 'explanation') runtime.setPhase('demo');
      else if (phase === 'demo') runtime.setPhase('guided');
      else if (phase === 'guided') {
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

  return player;
}

function phraseFor(attempt) {
  if (attempt.phase === 'demo') return { letters: ['step', 'repeat', 'skip'], current: -1, kind: 'labels' };
  if (attempt.phase === 'independent') return { letters: L10.homeLetters, current: -1, kind: 'hidden' };
  if (attempt.phase === 'transfer') return { letters: L10.transferLetters, current: -1, kind: 'hidden' };
  if (attempt.phase === 'guided' && attempt.restore.hintsOn) {
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'step');
    if (step === 'step') return { letters: ['C', 'D'], current: attempt.restore.sequence.length, kind: 'step' };
    if (step === 'repeat') return { letters: ['G', 'G'], current: attempt.restore.sequence.length, kind: 'repeat' };
    if (step === 'skip') return { letters: ['C', 'E'], current: attempt.restore.sequence.length, kind: 'skip' };
  }
  return null;
}

function captionsFor(attempt) {
  if (attempt.phase !== 'guided' || !attempt.restore.hintsOn) return {};
  const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'step');
  if (step === 'step') return { 62: { letter: 'D' } };
  if (step === 'repeat') return { 67: { letter: 'G' } };
  if (step === 'skip') return { 64: { letter: 'E' } };
  return {};
}

export { PHASE_ORDER, GUIDED_STEPS, creativityOk };
