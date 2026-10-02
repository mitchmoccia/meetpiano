import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { defaultHandFocus } from '../hands.js';
import { L15 } from './l15.js';
import { stepName, takePhrase } from './phrase-take.js';

const GUIDED_STEPS = ['question', 'answer', 'both', 'hands'];
const INDEPENDENT_STEPS = ['both'];
const TRANSFER_STEPS = ['both'];

export function createL15Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L15 });
  if (!runtime.attempt.restore.handFocus) {
    runtime.attempt.restore.handFocus = defaultHandFocus('L15');
  }

  function expectedFor(step) {
    if (step === 'question') return L15.question;
    if (step === 'answer') return L15.answer;
    return L15.conversation;
  }

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'question');
    if (step === 'hands') {
      runtime.persist();
      return { ignore: true };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, expectedFor(step), 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L15.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next pitch in this part.' };
    attempt.restore.sequence = [];
    attempt.restore.guidedStep += 1;
    runtime.fadeHints();
    if (attempt.restore.guidedStep >= 3) runtime.markPracticed();
    runtime.persist();
    const message = step === 'question' ? L15.copy.feedback.questionYes : step === 'answer' ? L15.copy.feedback.answerYes : L15.copy.feedback.bothYes;
    return { ok: true, message };
  }

  function handleIndependent(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then play the conversation. Saved progress stays.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L15.conversation, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L15.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Keep the turns going.' };
    attempt.restore.homeDone = true;
    attempt.restore.independentStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L15.copy.feedback.bothYes, done: true };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off. Help does not erase progress.' };
    }
    runtime.setOctavePolicyUsed('exact-pitch');
    const result = takePhrase(runtime, note, L15.transfer, 'exact-pitch');
    if (!result.ok) {
      return { ok: false, remediate: true, message: L15.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next pitch the other way.' };
    attempt.restore.transferStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L15.copy.feedback.transferYes, done: true };
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
        handFocus: attempt.restore.handFocus || defaultHandFocus('L15'),
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

  player.setHandFocus = (focus) => {
    const previous = runtime.attempt.restore.handFocus;
    runtime.attempt.restore.handFocus = focus;
    runtime.persist();
    return { previous, current: focus, phase: runtime.attempt.phase, guidedStep: runtime.attempt.restore.guidedStep };
  };

  player.setHandMark = (checked) => {
    runtime.setAdult({ hand: checked });
    if (checked && runtime.attempt.phase === 'guided' && runtime.attempt.restore.guidedStep >= 3) {
      runtime.attempt.restore.guidedStep = 4;
      runtime.markPracticed();
      runtime.persist();
    }
  };

  player.setFingering = (checked) => {
    runtime.setAdult({ fingering: checked });
  };

  return player;
}

function staffFor(attempt) {
  const showLetters = attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn);
  const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'question');
  if (attempt.phase === 'demo') {
    return { notes: L15.homeNotes, current: -1, showLetters: true, grand: true, caption: 'Question on treble. Answer on bass.' };
  }
  if (attempt.phase === 'guided') {
    if (step === 'question') {
      return { notes: L15.questionNotes, current: attempt.restore.sequence.length, showLetters, grand: true, caption: 'Just the question.' };
    }
    if (step === 'answer') {
      return { notes: L15.answerNotes, current: attempt.restore.sequence.length, showLetters, grand: true, caption: 'Just the answer.' };
    }
    return { notes: L15.homeNotes, current: attempt.restore.sequence.length, showLetters, grand: true, caption: 'Question, then answer.' };
  }
  if (attempt.phase === 'independent') {
    return { notes: L15.homeNotes, current: -1, showLetters: false, grand: true, caption: 'Both parts. Letters off.' };
  }
  if (attempt.phase === 'transfer') {
    return { notes: L15.transferNotes, current: -1, showLetters: false, grand: true, caption: 'Answer first, then the question.' };
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
