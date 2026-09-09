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
