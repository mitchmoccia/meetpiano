export const SOFT_WALK = [60, 62, 64, 60];
export const SOFT_WALK_DOWN = [64, 62, 60, 60];
export const LITTLE_WAVE = [60, 62, 64, 62, 64, 62, 60];
export const LITTLE_WAVE_COUSIN = [64, 62, 60, 62, 60, 62, 64];
export const STEM_UP = [60, 62, 64];
export const STEM_DOWN = [64, 62, 60];
export const SPOT_TAIL = [64, 62, 60];

export const CHOICE_IDS = ['home', 'open', 'turn'];
export const PURPOSE_IDS = ['notes', 'rhythm', 'spot'];
export const RECITAL_PIECES = ['wave', 'walk', 'yours'];

export const CHOICES = {
  home: { id: 'home', label: 'Land on C', ending: [60] },
  open: { id: 'open', label: 'Open on G', ending: [67] },
  turn: { id: 'turn', label: 'Turn back D–C', ending: [62, 60] }
};

export const TRANSFER_CHOICES = {
  home: { id: 'home', label: 'Stay on C', ending: [60] },
  open: { id: 'open', label: 'Open on G', ending: [67] },
  turn: { id: 'turn', label: 'Turn up D–E', ending: [62, 64] }
};

export const DYNAMIC_GAP = 0.12;
export const DUMP_GAP_SEC = 0.12;

export function phraseForChoice(stem, choiceId, catalog = CHOICES) {
  const choice = catalog[choiceId];
  if (!choice) return null;
  return [...stem, ...choice.ending];
}

export function allChoicePhrases(stem, catalog = CHOICES) {
  return Object.fromEntries(CHOICE_IDS.map((id) => [id, phraseForChoice(stem, id, catalog)]));
}

export function matchChosenPhrase(heard, stem, choiceId, catalog = CHOICES) {
  const expected = phraseForChoice(stem, choiceId, catalog);
  if (!expected) return { ok: false, reason: 'no-choice', matchedOther: null };
  if (samePhrase(heard, expected)) return { ok: true, reason: 'chose', matchedOther: null };
  const other = CHOICE_IDS.find((id) => id !== choiceId && samePhrase(heard, phraseForChoice(stem, id, catalog)));
  if (other) return { ok: false, reason: 'other-valid', matchedOther: other };
  return { ok: false, reason: 'wrong-notes', matchedOther: null };
}

export function samePhrase(heard, expected) {
  if (!Array.isArray(heard) || !Array.isArray(expected) || heard.length !== expected.length) return false;
  return heard.every((note, index) => note === expected[index]);
}

export function velocityCapable(inputMode, extras = {}) {
  return inputMode === 'midi' && Number.isFinite(extras.velocity);
}

export function compareDynamics(velocities, { split = 4, minGap = DYNAMIC_GAP } = {}) {
  if (!Array.isArray(velocities) || velocities.length < split * 2) {
    return { ok: false, reason: 'incomplete', first: null, second: null, gap: null };
  }
  const first = mean(velocities.slice(0, split));
  const second = mean(velocities.slice(split, split * 2));
  const gap = second - first;
  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return { ok: false, reason: 'unavailable', first, second, gap };
  }
  if (gap >= minGap) return { ok: true, reason: 'quieter-then-stronger', first, second, gap };
  if (first - second >= minGap) return { ok: false, reason: 'stronger-then-quieter', first, second, gap };
  return { ok: false, reason: 'too-close', first, second, gap };
}

export function alignHeard(heard, expected) {
  const list = Array.isArray(heard) ? heard : [];
  const want = Array.isArray(expected) ? expected : [];
  let cursor = 0;
  const extras = [];
  for (const note of list) {
    if (cursor < want.length && note === want[cursor]) cursor += 1;
    else extras.push(note);
  }
  return {
    matched: cursor,
    expected: want.length,
    extras,
    notesPassed: cursor === want.length && extras.length === 0,
    finishedThrough: list.length >= want.length
  };
}

export function rhythmFromOnsets(times, { dumpGap = DUMP_GAP_SEC } = {}) {
  if (!Array.isArray(times) || times.length < 2) return { ok: null, reason: 'not-scored' };
  const gaps = [];
  for (let i = 1; i < times.length; i += 1) {
    const gap = times[i] - times[i - 1];
    if (Number.isFinite(gap)) gaps.push(gap);
  }
  if (!gaps.length) return { ok: null, reason: 'not-scored' };
  if (gaps.every((gap) => gap < dumpGap)) return { ok: false, reason: 'dumped' };
  return { ok: true, reason: 'paced' };
}

export function laneLabel(value) {
  if (value === true || value === 'pass') return 'pass';
  if (value === false || value === 'miss') return 'miss';
  if (value === 'assisted') return 'assisted';
  if (value === 'unavailable') return 'unavailable';
  if (value === 'not-asked') return 'not asked';
  if (value === 'later') return 'later check';
  if (value === 'done') return 'done';
  return 'not scored';
}

export function buildResultCard({
  notes = null,
  rhythm = null,
  assistance = 'none',
  selfObservation = false,
  listened = false,
  transferLater = null,
  dynamics = null,
  finishedThrough = null
} = {}) {
  return {
    notes: notes === true ? 'pass' : notes === false ? 'miss' : notes,
    rhythm: rhythm === true ? 'pass' : rhythm === false ? 'miss' : rhythm,
    assistance: assistance === true || assistance === 'hints' || assistance === 'help' ? 'assisted' : (assistance || 'none'),
    selfObservation: Boolean(selfObservation),
    listened: Boolean(listened),
    transferLater: transferLater === true ? 'done' : transferLater === false ? 'later' : transferLater,
    dynamics: dynamics === true ? 'pass' : dynamics === false ? 'miss' : dynamics,
    finishedThrough: finishedThrough == null ? null : Boolean(finishedThrough)
  };
}

export function expressionHonesty(inputMode) {
  if (inputMode === 'midi') {
    return 'Heard over MIDI. Pitch, time, and velocity if the keyboard sent it. Not technique, and not a hardware certification.';
  }
  return 'On-screen or computer keys can show which note and when. They cannot show quiet versus strong, and they are not a piano-action proof.';
}

export function dynamicsHonesty(inputMode, capable) {
  if (capable || inputMode === 'midi') {
    return 'Quiet versus strong is relative only when this input sent velocity. It is not studio-grade scoring, and it does not infer wrist, weight, or finger.';
  }
  return 'This input cannot show quiet versus strong. A grown-up can listen, or we save the notes without a dynamics score.';
}

export function purposePhrase(purpose, { transfer = false } = {}) {
  if (purpose === 'spot') return SPOT_TAIL;
  if (purpose === 'rhythm') return transfer ? SOFT_WALK_DOWN : SOFT_WALK;
  return transfer ? LITTLE_WAVE_COUSIN : LITTLE_WAVE;
}

export function recitalPhrase(piece, yours) {
  if (piece === 'wave') return LITTLE_WAVE;
  if (piece === 'yours' && Array.isArray(yours) && yours.length) return yours;
  return SOFT_WALK;
}

function mean(values) {
  const nums = values.filter((value) => Number.isFinite(value));
  if (!nums.length) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}
