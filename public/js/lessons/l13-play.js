import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { LH_C, LH_D, LH_E, RH_C, defaultHandFocus } from '../hands.js';
import { L13, L13_TRANSFER, L13_WALK, isHigherCError } from './l13.js';
import { stepName, takePhrase } from './phrase-take.js';

const GUIDED_STEPS = ['find', 'name', 'neighbors', 'fingering'];
const INDEPENDENT_STEPS = ['find'];
const TRANSFER_STEPS = ['neighbors'];

function policyFor(phase) {
  return phase === 'guided' ? 'pitch-class' : 'exact-pitch';
}

function isPitchClassC(note) {
  return ((Number(note) % 12) + 12) % 12 === 0;
}

export function createL13Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L13 });
  if (!runtime.attempt.restore.handFocus) {
    runtime.attempt.restore.handFocus = defaultHandFocus('L13');
  }

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'find');
    if (step === 'find' || step === 'name') {
      if (!isPitchClassC(note) || Number(note) >= RH_C) {
        runtime.persist();
        return {
          ok: false,
          remediate: isHigherCError(note),
          message: isHigherCError(note) ? L13.copy.feedback.needThisC : L13.copy.feedback.needC
        };
      }
      attempt.restore.guidedStep = step === 'find' ? 1 : 2;
      runtime.fadeHints();
      runtime.persist();
      return { ok: true, message: step === 'find' ? L13.copy.feedback.foundC : L13.copy.feedback.named };
    }
    if (step === 'neighbors' || step === 'fingering') {
      runtime.setOctavePolicyUsed('pitch-class');
      const result = takePhrase(runtime, note, L13_WALK, 'pitch-class');
      if (!result.ok) {
        return { ok: false, remediate: isHigherCError(note), message: L13.copy.feedback.needNeighbors };
      }
      if (!result.done) return { ok: true, message: 'Now E.' };
      attempt.restore.guidedStep = 3;
      runtime.markPracticed();
      runtime.persist();
      return { ok: true, message: L13.copy.feedback.neighborsYes };
    }
    runtime.persist();
    return { ignore: true };
  }

  function handleIndependent(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then try the quiet check again. Progress on this device stays.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L13_WALK, 'exact-pitch');
    if (!result.ok) {
      return {
        ok: false,
        remediate: isHigherCError(note) || isPitchClassC(note),
        message: isPitchClassC(note) && note !== LH_C ? L13.copy.feedback.needThisC : L13.copy.feedback.needC
      };
    }
    if (!result.done) return { ok: true, message: 'Keep the left-hand neighbors going.' };
    attempt.restore.independentStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L13.copy.feedback.neighborsYes, done: true };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off for this look. Help does not erase progress.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L13_TRANSFER, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, message: L13.copy.feedback.needNeighbors };
    }
    if (!result.done) return { ok: true, message: 'Keep walking home.' };
    attempt.restore.transferStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L13.copy.feedback.transferYes, done: true };
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
        handFocus: attempt.restore.handFocus || defaultHandFocus('L13'),
        captions: captionsFor(attempt),
        octavePolicy: policyFor(attempt.phase)
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
    if (checked && runtime.attempt.phase === 'guided' && runtime.attempt.restore.guidedStep >= 3) {
      runtime.attempt.restore.guidedStep = 4;
      runtime.markPracticed();
      runtime.persist();
    }
  };

  player.setHandMark = (checked) => {
    runtime.setAdult({ hand: checked });
  };

  player.setHandFocus = (focus) => {
    runtime.attempt.restore.handFocus = focus;
    runtime.persist();
  };

  player.skipNamedGuided = () => {
    if (runtime.attempt.restore.guidedStep === 1) {
      runtime.attempt.restore.guidedStep = 2;
      runtime.persist();
    }
  };

  return player;
}

function captionsFor(attempt) {
  if (attempt.phase === 'demo') {
    return {
      [LH_C]: { letter: 'C', finger: 5, fade: true },
      [LH_D]: { letter: 'D', finger: 4, fade: true },
      [LH_E]: { letter: 'E', finger: 3, fade: true }
    };
  }
  if (attempt.phase === 'guided' && attempt.restore.hintsOn) {
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'find');
    if (step === 'find' || step === 'name') return { [LH_C]: { letter: 'C', finger: 5 } };
    if (step === 'neighbors' || step === 'fingering') {
      return {
        [LH_C]: { letter: 'C', finger: 5 },
        [LH_D]: { letter: 'D', finger: 4 },
        [LH_E]: { letter: 'E', finger: 3 }
      };
    }
  }
  return {};
}

export { PHASE_ORDER, GUIDED_STEPS };
