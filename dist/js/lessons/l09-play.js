import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { isPitchClassF, isPitchClassG } from '../assess.js';
import { L09, L09_F, L09_G, isDoorstepFgError } from './l09.js';
import { stepName } from './phrase-take.js';

const GUIDED_STEPS = ['find', 'name', 'neighbor', 'fingering'];
const INDEPENDENT_STEPS = ['find'];
const TRANSFER_STEPS = ['neighbors'];

function policyFor(phase) {
  return phase === 'guided' ? 'pitch-class' : 'exact-pitch';
}

export function createL09Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L09 });

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'find');
    if (step === 'find') {
      if (!isPitchClassF(note)) {
        runtime.persist();
        return { ok: false, remediate: isDoorstepFgError(note), message: L09.copy.feedback.needF };
      }
      attempt.restore.guidedStep = 1;
      runtime.fadeHints();
      runtime.persist();
      return { ok: true, message: L09.copy.feedback.foundF };
    }
    if (step === 'name') {
      if (!isPitchClassF(note)) {
        runtime.persist();
        return { ok: false, remediate: isDoorstepFgError(note), message: L09.copy.feedback.needF };
      }
      attempt.restore.guidedStep = 2;
      runtime.persist();
      return { ok: true, message: L09.copy.feedback.named };
    }
    if (step === 'neighbor' || step === 'fingering') {
      if (!isPitchClassG(note)) {
        runtime.persist();
        return { ok: false, remediate: isDoorstepFgError(note), message: L09.copy.feedback.needG };
      }
      attempt.restore.guidedStep = 3;
      runtime.markPracticed();
      runtime.persist();
      return { ok: true, message: L09.copy.feedback.foundG };
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
    const heard = attempt.restore.sequence;
    if (heard.length === 0) {
      if (note === L09_F) {
        attempt.restore.sequence = [note];
        runtime.recordEvent('note-on', { heard: note, expected: L09_F, match: true });
        runtime.persist();
        return { ok: true, message: L09.copy.feedback.foundF };
      }
      const octave = isPitchClassF(note);
      runtime.recordEvent('note-on', { heard: note, expected: L09_F, match: false });
      runtime.persist();
      return {
        ok: false,
        remediate: isDoorstepFgError(note),
        message: octave ? L09.copy.feedback.needThisF : L09.copy.feedback.needF
      };
    }
    if (note === L09_G) {
      attempt.restore.sequence = [];
      attempt.restore.independentStep = 1;
      runtime.recordEvent('note-on', { heard: note, expected: L09_G, match: true });
      runtime.persist();
      return { ok: true, message: L09.copy.feedback.foundG, done: true };
    }
    const octave = isPitchClassG(note);
    attempt.restore.sequence = [];
    runtime.recordEvent('note-on', { heard: note, expected: L09_G, match: false });
    runtime.persist();
    return {
      ok: false,
      remediate: isDoorstepFgError(note),
      message: octave ? L09.copy.feedback.needThisG : L09.copy.feedback.needG
    };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off for this look. Help shows the picture without erasing progress.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const heard = attempt.restore.sequence;
    const want = heard.length === 0 ? L09_G : L09_F;
    if (note !== want) {
      attempt.restore.sequence = [];
      runtime.persist();
      return { ok: false, message: L09.copy.feedback.needG };
    }
    attempt.restore.sequence = [...heard, note];
    if (attempt.restore.sequence.length < 2) {
      runtime.persist();
      return { ok: true, message: 'Now F.' };
    }
    attempt.restore.transferStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L09.copy.feedback.transferYes, done: true };
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

  player.skipNamedGuided = () => {
    if (runtime.attempt.restore.guidedStep === 1) {
      runtime.attempt.restore.guidedStep = 2;
      runtime.persist();
    }
  };

  return player;
}

function captionsFor(attempt) {
  if (attempt.phase === 'demo') return { [L09_F]: { letter: 'F', fade: true }, [L09_G]: { letter: 'G', fade: true } };
  if (attempt.phase === 'guided' && attempt.restore.hintsOn) {
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'find');
    if (step === 'find' || step === 'name') return { [L09_F]: { letter: 'F' } };
    if (step === 'neighbor') return { [L09_G]: { letter: 'G' } };
  }
  return {};
}

export { PHASE_ORDER, GUIDED_STEPS };
