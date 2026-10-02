export const WHITE_NOTES = [60, 62, 64, 65, 67, 69, 71];
export const DEFAULT_PIANO_FROM = 60;
export const DEFAULT_PIANO_TO = 84;
export const BLACK_NOTES = [
  { note: 61, className: 'black-1', group: 'two-4' },
  { note: 63, className: 'black-2', group: 'two-4' },
  { note: 66, className: 'black-3', group: 'three-4' },
  { note: 68, className: 'black-4', group: 'three-4' },
  { note: 70, className: 'black-5', group: 'three-4' }
];

export const COMPUTER_KEYS = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71
};

const LEFT_ROW = { z: 48, x: 50, c: 52, v: 53, b: 55, n: 57, m: 59 };
const UPPER_WHITES = { z: 72, x: 74, c: 76, v: 77, b: 79, n: 81, m: 83 };
const TOP_C_KEY = ',';

export function computerKeysFor(focus = 'right') {
  if (focus === 'left') {
    return Object.fromEntries(Object.entries(COMPUTER_KEYS).map(([key, note]) => [key, note - 12]));
  }
  if (focus === 'both') return { ...COMPUTER_KEYS, ...LEFT_ROW };
  return { ...COMPUTER_KEYS };
}

export function computerKeysForRange(from = DEFAULT_PIANO_FROM, to = DEFAULT_PIANO_TO, focus = 'both') {
  const map = {};
  const inRange = (note) => note >= from && note <= to;
  if (focus === 'left') {
    for (const [key, note] of Object.entries(computerKeysFor('left'))) {
      if (inRange(note)) map[key] = note;
    }
    return map;
  }
  for (const [key, note] of Object.entries(COMPUTER_KEYS)) {
    if (inRange(note)) map[key] = note;
  }
  if (focus === 'right') return map;
  const extra = from <= 48 ? LEFT_ROW : UPPER_WHITES;
  for (const [key, note] of Object.entries(extra)) {
    if (inRange(note)) map[key] = note;
  }
  const endIsC = ((to % 12) + 12) % 12 === 0;
  if (endIsC && !Object.values(map).includes(to)) map[TOP_C_KEY] = to;
  return map;
}

export function computerHelpFor(range = { from: DEFAULT_PIANO_FROM, to: DEFAULT_PIANO_TO, octaveSpan: 2 }) {
  if (range.from <= 48) {
    return 'or use Z X C V B N M for the left room, A S D F G H J for the right room, and comma for the top C';
  }
  if (range.octaveSpan === 3) {
    return 'or use A S D F G H J for the first octave and Z X C V B N M for the next. The third octave is on the screen. Comma plays the top C.';
  }
  return 'or use A S D F G H J for the first octave, Z X C V B N M for the next octave, and comma for the top C';
}

export function whiteNotesInRange(from = 60, to = 71) {
  const out = [];
  for (let note = from; note <= to; note += 1) {
    const pc = ((note % 12) + 12) % 12;
    if (![1, 3, 6, 8, 10].includes(pc)) out.push(note);
  }
  return out;
}

export function blackNotesInRange(from = 60, to = 71) {
  const out = [];
  const whites = whiteNotesInRange(from, to);
  for (let note = from; note <= to; note += 1) {
    const pc = ((note % 12) + 12) % 12;
    if (![1, 3, 6, 8, 10].includes(pc)) continue;
    const leftWhite = whites.findLast ? whites.findLast((white) => white < note) : [...whites].reverse().find((white) => white < note);
    const whiteIndex = whites.indexOf(leftWhite);
    out.push({
      note,
      className: `black-${pc}`,
      group: blackGroupId(note),
      whiteIndex: whiteIndex < 0 ? 0 : whiteIndex
    });
  }
  return out;
}

export function blackGroupId(note) {
  const pc = ((note % 12) + 12) % 12;
  const octave = Math.floor(note / 12) - 1;
  if (pc === 1 || pc === 3) return `two-${octave}`;
  if (pc === 6 || pc === 8 || pc === 10) return `three-${octave}`;
  return null;
}

export function groupKind(groupId) {
  if (!groupId) return null;
  return groupId.startsWith('two-') ? 'two' : groupId.startsWith('three-') ? 'three' : null;
}

export function renderPiano(root, options = {}) {
  const from = Number.isInteger(options.from) ? options.from : DEFAULT_PIANO_FROM;
  const to = Number.isInteger(options.to) ? options.to : DEFAULT_PIANO_TO;
  const whites = whiteNotesInRange(from, to);
  const blacks = blackNotesInRange(from, to);
  const wide = whites.length > 8;
  root.replaceChildren();
  root.classList.add('piano');
  root.classList.toggle('wide', wide);
  root.dataset.from = String(from);
  root.dataset.to = String(to);
  root.style.setProperty('--white-count', String(whites.length));
  const endC = ((to % 12) + 12) % 12 === 0;
  const startC = ((from % 12) + 12) % 12 === 0;
  root.setAttribute('aria-label', startC && endC
    ? 'On-screen piano stand-in, C to C'
    : 'On-screen piano stand-in');
  whites.forEach((note) => {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'piano-key white-key';
    key.dataset.note = String(note);
    key.dataset.region = note < 60 ? 'left' : 'right';
    key.setAttribute('aria-label', `${note < 60 ? 'Left room' : 'Right room'} white key, computer key ${computerLabel(note, from, to)}`);
    root.append(key);
  });
  blacks.forEach((item) => {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = `piano-key black-key ${item.className}`;
    key.dataset.note = String(item.note);
    key.dataset.group = item.group;
    key.dataset.groupKind = groupKind(item.group) || '';
    key.dataset.region = item.note < 60 ? 'left' : 'right';
    if (Number.isInteger(item.whiteIndex)) {
      key.style.left = `${((item.whiteIndex + 0.75) / whites.length) * 100}%`;
      key.style.width = `${(8.7 * 7) / whites.length}%`;
    }
    key.setAttribute('aria-label', `${item.note < 60 ? 'Left room' : 'Right room'} black key, computer key ${computerLabel(item.note, from, to)}`);
    root.append(key);
  });
}

export function setPianoRegion(root, focus = 'both') {
  if (!root) return;
  root.classList.remove('region-left', 'region-right', 'region-both');
  root.classList.add(`region-${focus}`);
}

function computerLabel(note, from, to) {
  const map = computerKeysForRange(from, to, 'both');
  const found = Object.entries(map).find(([, value]) => value === note);
  return found ? found[0].toUpperCase() : '';
}

export function keyElement(root, note) {
  return root.querySelector(`[data-note="${note}"]`);
}

export function setPressed(root, note, on) {
  keyElement(root, note)?.classList.toggle('pressed', on);
}

export function clearPressed(root) {
  root.querySelectorAll('.piano-key.pressed').forEach((key) => key.classList.remove('pressed'));
}

export function setHints(root, notes) {
  root.querySelectorAll('.piano-key.hint').forEach((key) => key.classList.remove('hint'));
  notes.forEach((note) => keyElement(root, note)?.classList.add('hint'));
}

export function setGroupOutlines(root, kinds) {
  root.classList.toggle('outline-two', kinds.includes('two'));
  root.classList.toggle('outline-three', kinds.includes('three'));
}

export function setSweep(root, note) {
  root.querySelectorAll('.piano-key.sweep').forEach((key) => key.classList.remove('sweep'));
  if (note != null) keyElement(root, note)?.classList.add('sweep');
}

export function setKeyCaptions(root, captions = {}) {
  root.querySelectorAll('.piano-key').forEach((key) => {
    key.querySelectorAll('.key-caption, .finger-mark').forEach((node) => node.remove());
    const note = Number(key.dataset.note);
    const cap = captions[note];
    if (!cap) return;
    if (cap.letter) {
      const letter = document.createElement('span');
      letter.className = cap.fade ? 'key-caption fade' : 'key-caption';
      letter.textContent = cap.letter;
      key.append(letter);
    }
    if (cap.finger) {
      const finger = document.createElement('span');
      finger.className = 'finger-mark';
      finger.textContent = String(cap.finger);
      key.append(finger);
    }
  });
}

export function cLeftOfTwoGroup(note) {
  const pc = ((note % 12) + 12) % 12;
  if (pc === 1 || pc === 3) return note - (pc === 1 ? 1 : 3);
  return null;
}

export function fLeftOfThreeGroup(note) {
  const pc = ((note % 12) + 12) % 12;
  if (pc === 6) return note - 1;
  if (pc === 8) return note - 3;
  if (pc === 10) return note - 5;
  return null;
}

export function gRightOfF(note) {
  if (!Number.isFinite(note)) return null;
  const pc = ((note % 12) + 12) % 12;
  if (pc !== 5) return null;
  return note + 2;
}
