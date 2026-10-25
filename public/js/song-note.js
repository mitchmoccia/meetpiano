/** Names, mini-keyboard window, and popover behavior for a staff note. No DOM. */

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const LETTERS = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
const BLACK = new Set([1, 3, 6, 8, 10]);

export function scientificName(pitch) {
  const n = Math.round(Number(pitch));
  const pc = ((n % 12) + 12) % 12;
  const octave = Math.floor(n / 12) - 1;
  return `${NAMES[pc]}${octave}`;
}

/** A short phrase around middle C. Sharps stay in the name when the pitch needs one. */
export function plainName(pitch) {
  const n = Math.round(Number(pitch));
  const pc = ((n % 12) + 12) % 12;
  const letter = `${LETTERS[pc]}${BLACK.has(pc) ? ' sharp' : ''}`;
  if (n === 60) return 'middle C';
  const octave = Math.floor(n / 12) - 1;
  if (n > 60 && n < 72) return `${letter} above middle C`;
  if (n >= 48 && n < 60) return `${letter} below middle C`;
  if (n >= 72) {
    const steps = octave - 4;
    return `${letter}, ${steps} octave${steps === 1 ? '' : 's'} above middle C`;
  }
  const steps = 4 - octave;
  return `${letter}, ${steps} octave${steps === 1 ? '' : 's'} below middle C`;
}

export function handLabel(hand) {
  return hand === 'lh' ? 'left hand' : 'right hand';
}

export function staffLabel(clef) {
  return clef === 'bass' ? 'bass staff' : 'treble staff';
}

/** "E4, right hand, treble staff" */
export function noteInspectLabel({ pitch, hand, clef }) {
  return `${scientificName(pitch)}, ${handLabel(hand)}, ${staffLabel(clef)}`;
}

function cAtOrBelow(value) {
  const note = Math.floor(value);
  return note - ((note % 12) + 12) % 12;
}

/**
 * About two octaves centered on the pitch, always starting and ending on C
 * so the mini keyboard has a labeled C and the note sits in the middle.
 */
export function keyboardWindow(pitch) {
  const n = Math.round(Number(pitch));
  let low = cAtOrBelow(n - 6);
  let high = cAtOrBelow(n + 6) + 12;
  if (high < n) high += 12;
  if (low > n) low -= 12;
  while (high - low < 12) high += 12;
  while (high - low > 24) {
    if (n - low >= high - n) low += 12;
    else high -= 12;
  }
  low = Math.max(0, low);
  high = Math.min(127, high);
  if (low > n) low = cAtOrBelow(n);
  if (high < n) high = Math.min(127, cAtOrBelow(n) + 12);
  const keys = [];
  for (let value = low; value <= high; value += 1) {
    const pc = ((value % 12) + 12) % 12;
    keys.push({
      pitch: value,
      white: !BLACK.has(pc),
      name: scientificName(value),
      labelC: pc === 0
    });
  }
  return { low, high, keys };
}

export function miniKeyboard(pitch, chordPitches = []) {
  const windowed = keyboardWindow(pitch);
  const active = Math.round(Number(pitch));
  const chord = new Set((chordPitches || []).map((item) => Math.round(Number(item))));
  return {
    ...windowed,
    keys: windowed.keys.map((key) => ({
      ...key,
      active: key.pitch === active,
      chord: chord.has(key.pitch) && key.pitch !== active
    }))
  };
}

/** User-space hit rect. At least 24 CSS px, or 44 on a coarse pointer, after scale. */
export function hitBox(note, scale = 1, { touch = false } = {}) {
  const css = touch ? 44 : 24;
  const safe = scale > 0 ? scale : 1;
  const size = Math.max((Number(note.half) || 0) * 2, css / safe);
  return {
    x: Number(note.x) - size / 2,
    y: Number(note.y) - size / 2,
    width: size,
    height: size
  };
}

export function moveNoteFocus(hits, current, key) {
  const list = [...hits];
  if (!list.length) return null;
  if (key === 'Home') return list[0];
  if (key === 'End') return list[list.length - 1];
  const index = list.indexOf(current);
  if (index < 0) return null;
  if (key === 'ArrowRight' || key === 'ArrowDown') return list[Math.min(list.length - 1, index + 1)];
  if (key === 'ArrowLeft' || key === 'ArrowUp') return list[Math.max(0, index - 1)];
  return null;
}

/**
 * One note popover. Close, Escape, and a click outside share one path.
 * A click on another notehead does not close here; the staff moves the popover.
 * Focus goes back to the note that opened it. The page tab order stays put.
 */
export function createNotePopover({ root, onClose }) {
  let returnFocus = null;

  function remember(el) {
    returnFocus = el || null;
  }

  function close() {
    const back = returnFocus;
    returnFocus = null;
    onClose();
    if (back && typeof back.focus === 'function') back.focus();
  }

  function onKeydown(event) {
    if (!root || root.hidden) return false;
    if (event.key !== 'Escape') return false;
    event.preventDefault?.();
    close();
    return true;
  }

  function onPointer(event) {
    if (!root || root.hidden) return false;
    const target = event.target;
    if (!target || target === root || root.contains?.(target)) return false;
    if (typeof target.closest === 'function' && target.closest('.note-hit')) return false;
    close();
    return true;
  }

  return { remember, close, onKeydown, onPointer };
}
