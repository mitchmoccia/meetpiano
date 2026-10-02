export const ATTEMPT_OCTAVE_POLICY = {
  PITCH_CLASS: 'pitch-class',
  EXACT_PITCH: 'exact-pitch'
};

export function pitchClass(note) {
  return ((Number(note) % 12) + 12) % 12;
}

export function resolveOctavePolicy(lessonPolicy, specified = null) {
  if (specified === ATTEMPT_OCTAVE_POLICY.EXACT_PITCH || specified === ATTEMPT_OCTAVE_POLICY.PITCH_CLASS) {
    return specified;
  }
  if (lessonPolicy === 'exact-pitch-when-specified') {
    return ATTEMPT_OCTAVE_POLICY.EXACT_PITCH;
  }
  return ATTEMPT_OCTAVE_POLICY.PITCH_CLASS;
}

export function pitchesMatch(heard, expected, octavePolicy) {
  if (!Number.isFinite(heard) || !Number.isFinite(expected)) return false;
  if (octavePolicy === ATTEMPT_OCTAVE_POLICY.EXACT_PITCH) return heard === expected;
  return pitchClass(heard) === pitchClass(expected);
}

export function assessHeardPitch({ heard, expected, octavePolicy }) {
  const policy = octavePolicy === ATTEMPT_OCTAVE_POLICY.EXACT_PITCH
    ? ATTEMPT_OCTAVE_POLICY.EXACT_PITCH
    : ATTEMPT_OCTAVE_POLICY.PITCH_CLASS;
  const match = pitchesMatch(heard, expected, policy);
  let reason = 'wrong-pitch';
  if (match) reason = 'match';
  else if (policy === ATTEMPT_OCTAVE_POLICY.EXACT_PITCH && pitchClass(heard) === pitchClass(expected)) {
    reason = 'wrong-octave';
  }
  return {
    heard,
    expected,
    octavePolicyUsed: policy,
    match,
    reason
  };
}

export function eventRole(source, isDemoPlaying) {
  if (source === 'demo' || isDemoPlaying) return 'demo';
  return 'learner';
}

export function shouldCountTowardProgress(source, isDemoPlaying) {
  return eventRole(source, isDemoPlaying) === 'learner';
}

export function pitchClasses(notes) {
  return notes.map((note) => pitchClass(note));
}

export function sequencesMatch(heard, expected, octavePolicy) {
  if (!Array.isArray(heard) || !Array.isArray(expected) || heard.length !== expected.length) return false;
  return expected.every((note, index) => pitchesMatch(heard[index], note, octavePolicy));
}

export function isWhitePitchClass(pc) {
  return ![1, 3, 6, 8, 10].includes(pitchClass(pc));
}

export function nextWhiteUp(note) {
  let cursor = Number(note) + 1;
  while (!isWhitePitchClass(cursor)) cursor += 1;
  return cursor;
}

export function isSkipOrBlackNeighbor(from, heard) {
  if (!Number.isFinite(from) || !Number.isFinite(heard)) return false;
  if (!isWhitePitchClass(heard)) return true;
  return pitchClass(heard) !== pitchClass(nextWhiteUp(from)) && heard !== nextWhiteUp(from);
}

const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];

export function whiteIndex(note) {
  const pc = pitchClass(note);
  const slot = WHITE_PC.indexOf(pc);
  if (slot < 0) return null;
  return Math.floor(Number(note) / 12) * 7 + slot;
}

export function whiteInterval(from, to) {
  const a = whiteIndex(from);
  const b = whiteIndex(to);
  if (a == null || b == null) return null;
  return b - a;
}

export function isWhiteStep(from, to) {
  return Math.abs(whiteInterval(from, to) ?? 0) === 1;
}

export function isWhiteSkip(from, to) {
  return Math.abs(whiteInterval(from, to) ?? 0) === 2;
}

export function isRepeatPitch(from, to, octavePolicy) {
  return pitchesMatch(from, to, octavePolicy);
}

export function isPitchClassF(note) {
  return pitchClass(note) === 5;
}

export function isPitchClassG(note) {
  return pitchClass(note) === 7;
}

export function takeExpectedSequence(heard, note, expected, octavePolicy) {
  const want = expected[heard.length];
  if (want == null) return { ok: false, extra: true, expected: null, next: [] };
  const match = pitchesMatch(note, want, octavePolicy);
  if (!match) {
    const extra = heard.length === expected.length - 1 && pitchesMatch(note, expected[0], 'pitch-class');
    return { ok: false, extra, expected: want, next: [] };
  }
  const next = [...heard, note];
  return { ok: true, done: next.length === expected.length, extra: false, expected: want, next };
}
