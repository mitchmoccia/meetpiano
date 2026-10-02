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
export const OCTAVE_SPAN_KEY = 'meetpiano:octave-span';
export const DEFAULT_OCTAVE_SPAN = 2;
const LEFT_ROOM_LESSONS = ['L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19', 'L20'];

export const HAND_FOCUSES = ['left', 'right', 'both'];

export function regionForMidi(midi) {
  return Number(midi) < RH_C ? 'left' : 'right';
}

export function defaultHandFocus(lessonId) {
  if (lessonId === 'L13' || lessonId === 'L14') return 'left';
  if (lessonId === 'L15' || lessonId === 'L16' || ['L17', 'L18', 'L19', 'L20'].includes(lessonId)) return 'both';
  return 'right';
}

export function normalizeHandFocus(value, lessonId) {
  if (HAND_FOCUSES.includes(value)) return value;
  return defaultHandFocus(lessonId);
}

export function normalizeOctaveSpan(value) {
  const span = Number(value);
  return span === 1 || span === 2 || span === 3 ? span : DEFAULT_OCTAVE_SPAN;
}

export function readOctaveSpan(storage) {
  try {
    return normalizeOctaveSpan(storage?.getItem(OCTAVE_SPAN_KEY));
  } catch (_) {
    return DEFAULT_OCTAVE_SPAN;
  }
}

export function writeOctaveSpan(span, storage) {
  const next = normalizeOctaveSpan(span);
  try {
    storage?.setItem(OCTAVE_SPAN_KEY, String(next));
  } catch (_) {
    return next;
  }
  return next;
}

export function pianoRangeFor(lessonId, octaveSpan = DEFAULT_OCTAVE_SPAN) {
  const span = normalizeOctaveSpan(octaveSpan);
  const left = LEFT_ROOM_LESSONS.includes(lessonId);
  const from = left ? LEFT_FROM : RIGHT_FROM;
  const taughtSpan = left && span < 2 ? 2 : span;
  const to = from + taughtSpan * 12;
  return {
    from,
    to,
    wide: to - from > 12,
    octaveSpan: span,
    taughtSpan,
    startC: from,
    endC: to
  };
}

export function usesWidePiano(lessonId, octaveSpan = DEFAULT_OCTAVE_SPAN) {
  return pianoRangeFor(lessonId, octaveSpan).wide;
}

export function usesLeftRoom(lessonId) {
  return LEFT_ROOM_LESSONS.includes(lessonId);
}
