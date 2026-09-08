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
