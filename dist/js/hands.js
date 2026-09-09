export const LH_C = 48;
export const LH_D = 50;
export const LH_E = 52;
export const LH_F = 53;
export const LH_G = 55;
export const RH_C = 60;
export const RH_D = 62;
export const RH_E = 64;
export const RH_G = 67;

export const LEFT_FROM = 48;
export const LEFT_TO = 59;
export const RIGHT_FROM = 60;
export const RIGHT_TO = 71;
export const BOTH_FROM = 48;
export const BOTH_TO = 71;

export const HAND_FOCUSES = ['left', 'right', 'both'];

export function regionForMidi(midi) {
  return Number(midi) < RH_C ? 'left' : 'right';
}

export function defaultHandFocus(lessonId) {
  if (lessonId === 'L13' || lessonId === 'L14') return 'left';
  if (lessonId === 'L15' || lessonId === 'L16') return 'both';
  return 'right';
}

export function normalizeHandFocus(value, lessonId) {
  if (HAND_FOCUSES.includes(value)) return value;
  return defaultHandFocus(lessonId);
}

export function pianoRangeFor(lessonId) {
  if (['L13', 'L14', 'L15', 'L16'].includes(lessonId)) {
    return { from: BOTH_FROM, to: BOTH_TO, wide: true };
  }
  return { from: RIGHT_FROM, to: RIGHT_TO, wide: false };
}

export function usesWidePiano(lessonId) {
  return pianoRangeFor(lessonId).wide;
}
