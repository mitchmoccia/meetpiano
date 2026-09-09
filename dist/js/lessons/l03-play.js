import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { L03, isCdePitchClass } from './l03.js';
import { pitchClass, pitchesMatch, nextWhiteUp } from '../assess.js';

const GUIDED_STEPS = ['find-c', 'neighbors', 'row', 'fingering'];
const INDEPENDENT_STEPS = ['order'];
const TRANSFER_STEPS = ['order'];

function stepName(list, index, fallback) {
  return list[index] || fallback;
}

function takeExpected(runtime, note, expected, policy) {
  const heard = runtime.attempt.restore.sequence;
  const index = heard.length;
  const want = expected[index];
  const match = pitchesMatch(note, want, policy);
  if (!match) {
    runtime.attempt.restore.sequence = [];
    runtime.recordEvent('note-on', { heard: note, expected: want, match: false });
    runtime.persist();
    return { ok: false, reset: true, expected: want };
  }
  runtime.attempt.restore.sequence = [...heard, note];
  runtime.recordEvent('note-on', { heard: note, expected: want, match: true });
  const done = runtime.attempt.restore.sequence.length === expected.length;
  runtime.persist();
  return { ok: true, done };
}

function skipOrBlack(from, heard) {
  if (!Number.isFinite(from)) return !isCdePitchClass(heard);
  const next = nextWhiteUp(from);
  return pitchClass(heard) !== pitchClass(next);
}

export function createL03Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L03 });

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'find-c');
    if (step === 'find-c') {
      const scored = runtime.scorePitch(note, L03.register.C, { octavePolicy: 'pitch-class' });
      if (!scored.match) {
        runtime.persist();
        return { ok: false, message: L03.copy.feedback.needC };
      }
      attempt.restore.guidedC = note;
      attempt.restore.guidedStep = 1;
      attempt.restore.sequence = [];
      runtime.fadeHints();
      runtime.persist();
      return { ok: true, message: L03.copy.feedback.foundC };
    }
    if (step === 'neighbors') {
      const from = attempt.restore.sequence.length === 0
        ? (attempt.restore.guidedC ?? L03.register.C)
        : attempt.restore.sequence[attempt.restore.sequence.length - 1];
      const expected = [L03.register.D, L03.register.E];
      const result = takeExpected(runtime, note, expected, 'pitch-class');
      if (!result.ok) {
        return {
          ok: false,
          remediate: skipOrBlack(from, note),
          message: L03.copy.feedback.skip
        };
      }
      if (!result.done) return { ok: true, message: L03.copy.feedback.foundD };
      attempt.restore.guidedStep = 2;
      attempt.restore.sequence = [];
      runtime.fadeHints();
      runtime.persist();
      return { ok: true, message: L03.copy.feedback.foundE };
    }
    if (step === 'row') {
      const result = takeExpected(runtime, note, L03.demoOrder, 'pitch-class');
      if (!result.ok) {
        return { ok: false, remediate: true, message: L03.copy.feedback.skip };
      }
      if (!result.done) return { ok: true, message: 'Keep walking to the next neighbor.' };
      attempt.restore.guidedStep = 3;
      attempt.restore.sequence = [];
      runtime.markPracticed();
      runtime.persist();
      return { ok: true, message: L03.copy.feedback.rowYes };
    }
    runtime.persist();
    return { ignore: true };
  }

  function handleOrder(note, expected, doneMessage) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then play the new order. Saved progress stays on this device.' };
    }
    const policy = 'exact-pitch';
    const result = takeExpected(runtime, note, expected, policy);
    if (!result.ok) {
      return { ok: false, remediate: true, message: L03.copy.feedback.skip };
    }
    if (!result.done) return { ok: true, message: 'Next note in the new order.' };
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: doneMessage, done: true };
  }

  const player = bindStandardPlayer(runtime, {
    onNote(note) {
      if (runtime.attempt.phase === 'guided') return handleGuided(note);
      if (runtime.attempt.phase === 'independent') {
        const result = handleOrder(note, L03.independentOrder, L03.copy.feedback.orderYes);
        if (result.done) runtime.attempt.restore.independentStep = 1;
        return result;
      }
      if (runtime.attempt.phase === 'transfer') {
        const result = handleOrder(note, L03.transferOrder, L03.copy.feedback.transferYes);
        if (result.done) runtime.attempt.restore.transferStep = 1;
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
        if (attempt.restore.independentStep < 1) return;
        attempt.restore.hintsOn = false;
        attempt.restore.sequence = [];
        runtime.setPhase('transfer');
      } else if (phase === 'transfer') {
        if (attempt.restore.transferStep < 1) return;
        runtime.completeTransfer('independent');
      }
    }
  });

  player.setFingering = (checked) => {
    runtime.setAdult({ fingering: checked });
  };

  return player;
}

function captionsFor(attempt) {
  if (attempt.phase === 'demo') {
    return {
      60: { letter: 'C', finger: 1 },
      62: { letter: 'D', finger: 2 },
      64: { letter: 'E', finger: 3 }
    };
  }
  if (attempt.phase === 'guided' && attempt.restore.hintsOn) {
    if (attempt.restore.guidedStep === 0) return { 60: { letter: 'C' } };
    if (attempt.restore.guidedStep === 1) {
      const next = attempt.restore.sequence.length === 0 ? 62 : 64;
      return { [next]: { letter: next === 62 ? 'D' : 'E' } };
    }
    if (attempt.restore.guidedStep === 2) {
      return { 60: { finger: 1 }, 62: { finger: 2 }, 64: { finger: 3 } };
    }
  }
  return {};
}

export { PHASE_ORDER, GUIDED_STEPS };
