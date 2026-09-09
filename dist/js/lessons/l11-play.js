import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { L11 } from './l11.js';
import { stepName, takePhrase } from './phrase-take.js';

const GUIDED_STEPS = ['walk', 'neighbors', 'ear'];
const INDEPENDENT_STEPS = ['walk'];
const TRANSFER_STEPS = ['order'];

export function createL11Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L11 });

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'walk');
    const expected = step === 'walk' ? L11.staffWalk : L11.staffNeighbors;
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, expected, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L11.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next head on the staff.' };
    attempt.restore.sequence = [];
    attempt.restore.guidedStep += 1;
    runtime.fadeHints();
    if (attempt.restore.guidedStep >= 3) runtime.markPracticed();
    runtime.persist();
    const message = step === 'walk' ? L11.copy.feedback.walkYes : step === 'neighbors' ? L11.copy.feedback.neighborsYes : L11.copy.feedback.earYes;
    return { ok: true, message };
  }

  function handleIndependent(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then play the staff walk. Saved progress stays.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L11.staffWalk, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L11.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Keep the picture going.' };
    attempt.restore.homeDone = true;
    attempt.restore.independentStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L11.copy.feedback.walkYes, done: true };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off. Help does not erase progress.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L11.transferOrder, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L11.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next head in the new order.' };
    attempt.restore.transferStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L11.copy.feedback.transferYes, done: true };
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
        staff: staffFor(attempt),
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

function staffFor(attempt) {
  const showLetters = attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn);
  if (attempt.phase === 'demo') {
    return { notes: L11.walkNotes, current: -1, showLetters: true, landmarkG: true, caption: 'Treble staff. G lives on the G-clef line.' };
  }
  if (attempt.phase === 'guided') {
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'walk');
    const notes = step === 'walk' ? L11.walkNotes : L11.neighborNotes;
    return {
      notes,
      current: attempt.restore.sequence.length,
      showLetters,
      landmarkG: step !== 'walk',
      caption: step === 'walk' ? 'Staff walk: three quarters.' : 'Staff neighbors: two quarters.'
    };
  }
  if (attempt.phase === 'independent') {
    return { notes: L11.walkNotes, current: -1, showLetters: false, landmarkG: false, caption: 'Letters off. The picture is the boss.' };
  }
  if (attempt.phase === 'transfer') {
    return { notes: L11.transferNotes, current: -1, showLetters: false, landmarkG: false, caption: 'New order. Same friends.' };
  }
  return null;
}

function captionsFor(attempt) {
  if (attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn)) {
    const staff = staffFor(attempt);
    const next = staff?.notes?.[attempt.restore.sequence.length];
    if (!next) return {};
    return { [next.midi]: { letter: next.letter } };
  }
  return {};
}

export { PHASE_ORDER, GUIDED_STEPS };
