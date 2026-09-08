import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { L02, isDoorstepError, isPitchClassC } from './l02.js';
import { blackGroupId, groupKind } from '../piano.js';

const GUIDED_STEPS = ['find', 'name', 'other'];
const INDEPENDENT_STEPS = ['find', 'register'];
const TRANSFER_STEPS = ['other-house'];

function stepName(list, index, fallback) {
  return list[index] || fallback;
}

function guidedCOf(attempt) {
  return attempt.restore.guidedC ?? L02.guidedC;
}

function hasRegisterEvidence(attempt) {
  if (attempt.adultObserved.note === 'adult-confirmed-other-c') return true;
  return Number.isInteger(attempt.restore.lastC) && attempt.restore.lastC !== guidedCOf(attempt);
}

export function createL02Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L02 });

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'find');
    if (step === 'find') {
      if (!isPitchClassC(note)) {
        runtime.persist();
        return { ok: false, remediate: isDoorstepError(note), message: L02.copy.feedback.needC };
      }
      attempt.restore.guidedC = note;
      attempt.restore.lastC = note;
      attempt.restore.guidedStep = 1;
      runtime.fadeHints();
      runtime.persist();
      return { ok: true, message: L02.copy.feedback.foundC };
    }
    if (step === 'name') {
      if (!isPitchClassC(note)) {
        runtime.persist();
        return { ok: false, remediate: isDoorstepError(note), message: L02.copy.feedback.needC };
      }
      attempt.restore.guidedStep = 2;
      runtime.persist();
      return { ok: true, message: L02.copy.feedback.named };
    }
    if (isPitchClassC(note) && note !== guidedCOf(attempt)) {
      attempt.restore.lastC = note;
      attempt.restore.guidedStep = 3;
      runtime.markPracticed();
      runtime.persist();
      return { ok: true, message: L02.copy.feedback.otherC };
    }
    if (isPitchClassC(note)) {
      runtime.persist();
      return { ok: false, message: L02.copy.feedback.needDifferentC };
    }
    runtime.persist();
    return { ok: false, remediate: isDoorstepError(note), message: L02.copy.feedback.needC };
  }

  function handleIndependent(note) {
    const attempt = runtime.attempt;
    const step = stepName(INDEPENDENT_STEPS, attempt.restore.independentStep, 'find');
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then try the quiet check again. Progress on this device stays.' };
    }
    if (step === 'find') {
      if (!isPitchClassC(note)) {
        runtime.persist();
        return { ok: false, remediate: isDoorstepError(note), message: L02.copy.feedback.needC };
      }
      attempt.restore.lastC = note;
      attempt.restore.independentStep = note !== guidedCOf(attempt) ? 2 : 1;
      runtime.persist();
      return {
        ok: true,
        message: note !== guidedCOf(attempt) ? L02.copy.feedback.otherC : L02.copy.feedback.foundC
      };
    }
    if (isPitchClassC(note) && note !== guidedCOf(attempt)) {
      attempt.restore.lastC = note;
      attempt.restore.independentStep = 2;
      runtime.persist();
      return { ok: true, message: L02.copy.feedback.otherC };
    }
    if (isPitchClassC(note)) {
      runtime.persist();
      return { ok: false, message: L02.copy.feedback.needDifferentC };
    }
    runtime.persist();
    return { ok: false, remediate: isDoorstepError(note), message: L02.copy.feedback.needC };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off for this look. Help shows the picture without erasing progress.' };
    }
    const group = blackGroupId(note);
    if (groupKind(group) === 'two') runtime.pending.house = group;
    if (!isPitchClassC(note)) {
      runtime.persist();
      return { ok: false, remediate: isDoorstepError(note), message: 'What white key sits on the left of a two-black house?' };
    }
    const otherHouse = runtime.pending.house && runtime.pending.house !== L02.visibleTwoGroup;
    if (!otherHouse && note === L02.guidedC) {
      runtime.persist();
      return {
        ok: false,
        message: 'That is the same preview house. Try another octave, or ask a grown-up to confirm another house.'
      };
    }
    attempt.restore.transferStep = 1;
    runtime.persist();
    return { ok: true, message: L02.copy.feedback.houseYes, done: true };
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
        runtime.setPhase('independent');
      } else if (phase === 'independent') {
        if (attempt.restore.independentStep < 2 && !hasRegisterEvidence(attempt)) return;
        attempt.restore.hintsOn = false;
        runtime.setPhase('transfer');
      } else if (phase === 'transfer') {
        runtime.completeTransfer('independent');
      }
    }
  });

  player.setAdultOtherC = (checked) => {
    if (!checked) return;
    runtime.setAdult({ note: 'adult-confirmed-other-c' });
    if (runtime.attempt.phase === 'guided') {
      runtime.attempt.restore.guidedStep = 3;
      runtime.markPracticed();
    }
    if (runtime.attempt.phase === 'independent') {
      runtime.attempt.restore.independentStep = 2;
      runtime.persist();
    }
  };

  player.setAdultOtherHouse = (checked) => {
    if (!checked) return;
    runtime.setAdult({ note: 'adult-confirmed-other-two-c' });
    return runtime.completeTransfer('independent');
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
  if (attempt.phase === 'demo') return { [L02.guidedC]: { letter: 'C', fade: true } };
  if (attempt.phase === 'guided' && attempt.restore.hintsOn && attempt.restore.guidedStep === 0) {
    return { [L02.guidedC]: { letter: 'C' } };
  }
  return {};
}

export { PHASE_ORDER, GUIDED_STEPS };
