import { createRuntime, bindStandardPlayer, PHASE_ORDER } from '../player-core.js';
import { L04 } from './l04.js';
import { pitchesMatch } from '../assess.js';

const GUIDED_STEPS = ['hear', 'head', 'tail', 'all', 'cousin'];
const INDEPENDENT_STEPS = ['home'];
const TRANSFER_STEPS = ['cousin'];

function stepName(list, index, fallback) {
  return list[index] || fallback;
}

function policyFor(phase) {
  return phase === 'guided' ? 'pitch-class' : 'exact-pitch';
}

function takePhrase(runtime, note, expected) {
  const attempt = runtime.attempt;
  const policy = policyFor(attempt.phase);
  const heard = attempt.restore.sequence;
  const want = expected[heard.length];
  if (want == null) {
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: false, extra: true };
  }
  const match = pitchesMatch(note, want, policy);
  if (!match) {
    const extra = heard.length === expected.length - 1 && pitchesMatch(note, expected[0], 'pitch-class');
    attempt.restore.sequence = [];
    runtime.recordEvent('note-on', { heard: note, expected: want, match: false });
    runtime.persist();
    return { ok: false, extra, expected: want };
  }
  attempt.restore.sequence = [...heard, note];
  runtime.recordEvent('note-on', { heard: note, expected: want, match: true });
  const done = attempt.restore.sequence.length === expected.length;
  runtime.persist();
  return { ok: true, done };
}

export function createL04Player({ progress }) {
  const runtime = createRuntime({ progress, lessonSpec: L04 });

  function handleGuided(note) {
    const attempt = runtime.attempt;
    const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'hear');
    if (step === 'hear' || step === 'cousin') {
      runtime.persist();
      return { ignore: true, message: L04.copy.feedback.cousinListen };
    }
    const expected = step === 'head' ? L04.homeHead : step === 'tail' ? L04.homeTail : L04.homePhrase;
    const result = takePhrase(runtime, note, expected);
    if (!result.ok) {
      return {
        ok: false,
        remediate: result.extra,
        message: result.extra ? L04.copy.feedback.extra : L04.copy.feedback.wrong
      };
    }
    if (!result.done) return { ok: true, message: 'Next note in the wave.' };
    attempt.restore.sequence = [];
    if (step === 'head') {
      attempt.restore.guidedStep = 2;
      runtime.fadeHints();
      runtime.persist();
      return { ok: true, message: L04.copy.feedback.headYes };
    }
    if (step === 'tail') {
      attempt.restore.guidedStep = 3;
      runtime.persist();
      return { ok: true, message: L04.copy.feedback.tailYes };
    }
    attempt.restore.guidedStep = 4;
    runtime.markPracticed();
    runtime.persist();
    return { ok: true, message: L04.copy.feedback.allYes };
  }

  function handleIndependent(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hide hints, then play Little Wave. Saved progress stays.' };
    }
    attempt.restore.independentStarted = true;
    const result = takePhrase(runtime, note, L04.homePhrase);
    if (!result.ok) {
      return {
        ok: false,
        remediate: true,
        message: result.extra ? L04.copy.feedback.extra : L04.copy.feedback.wrong
      };
    }
    if (!result.done) return { ok: true, message: 'Keep the wave going.' };
    attempt.restore.homeDone = true;
    attempt.restore.independentStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L04.copy.feedback.homeYes, done: true };
  }

  function handleTransfer(note) {
    const attempt = runtime.attempt;
    if (attempt.restore.hintsOn) {
      runtime.persist();
      return { ok: false, message: 'Hints stay off. Help does not erase progress.' };
    }
    const result = takePhrase(runtime, note, L04.transferPhrase);
    if (!result.ok) {
      return { ok: false, remediate: true, message: L04.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Next note in the cousin wave.' };
    attempt.restore.transferStep = 1;
    attempt.restore.sequence = [];
    runtime.persist();
    return { ok: true, message: L04.copy.feedback.transferYes, done: true };
  }

  function handleReview(note) {
    const attempt = runtime.attempt;
    if (!attempt.restore.reviewPausedAt) {
      runtime.persist();
      return { ignore: true, message: 'Take the named pause first, then play Little Wave.' };
    }
    const result = takePhrase(runtime, note, L04.homePhrase);
    if (!result.ok) {
      return { ok: false, remediate: true, message: L04.copy.feedback.wrong };
    }
    if (!result.done) return { ok: true, message: 'Keep the remembered wave going.' };
    return { ok: true, message: L04.copy.feedback.reviewYes, retained: true };
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
        phrase: phraseFor(attempt),
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

function phraseFor(attempt) {
  if (attempt.phase === 'demo') return { letters: L04.homeLetters, current: -1, kind: 'home' };
  if (attempt.phase === 'guided' && attempt.restore.guidedStep === 1) {
    return { letters: L04.homeLetters.slice(0, 4), current: attempt.restore.sequence.length, kind: 'head' };
  }
  if (attempt.phase === 'guided' && attempt.restore.guidedStep === 2) {
    return { letters: L04.homeLetters.slice(4), current: attempt.restore.sequence.length, kind: 'tail' };
  }
  if (attempt.phase === 'guided' && (attempt.restore.guidedStep === 3 || attempt.restore.guidedStep === 0)) {
    return { letters: L04.homeLetters, current: attempt.restore.sequence.length, kind: 'home' };
  }
  if (attempt.phase === 'guided' && attempt.restore.guidedStep === 4) {
    return { letters: L04.transferLetters, current: -1, kind: 'cousin' };
  }
  if (attempt.phase === 'independent') return { letters: L04.homeLetters, current: -1, kind: 'hidden' };
  if (attempt.phase === 'transfer') return { letters: L04.transferLetters, current: -1, kind: 'hidden' };
  if (attempt.phase === 'review') return { letters: L04.homeLetters, current: -1, kind: 'hidden' };
  return null;
}

function captionsFor(attempt) {
  if (attempt.phase === 'demo' || (attempt.phase === 'guided' && attempt.restore.hintsOn)) {
    const next = nextHint(attempt);
    if (next == null) return { 60: { letter: 'C' }, 62: { letter: 'D' }, 64: { letter: 'E' } };
    const letter = next === 60 ? 'C' : next === 62 ? 'D' : 'E';
    return { [next]: { letter } };
  }
  return {};
}

function nextHint(attempt) {
  const step = stepName(GUIDED_STEPS, attempt.restore.guidedStep, 'hear');
  const expected = step === 'head' ? L04.homeHead : step === 'tail' ? L04.homeTail : step === 'all' ? L04.homePhrase : null;
  if (!expected) return null;
  return expected[attempt.restore.sequence.length] ?? null;
}

export { PHASE_ORDER, GUIDED_STEPS };
