export const TREBLE_CLEF = 'treble';
export const BASS_CLEF = 'bass';
export const QUARTER_MS = 480;
export const HALF_MS = 960;

export const STAFF_MIDI = {
  C3: 48,
  D3: 50,
  E3: 52,
  F3: 53,
  G3: 55,
  A3: 57,
  B3: 59,
  C4: 60,
  D4: 62,
  E4: 64,
  F4: 65,
  G4: 67,
  A4: 69,
  B4: 71,
  C5: 72
};

const DEGREE = {
  60: -2,
  62: -1,
  64: 0,
  65: 1,
  67: 2,
  69: 3,
  71: 4,
  72: 5,
  74: 6,
  76: 7,
  77: 8
};

const BASS_DEGREE = {
  43: 0,
  45: 1,
  47: 2,
  48: 3,
  50: 4,
  52: 5,
  53: 6,
  55: 7,
  57: 8,
  59: 9,
  60: 10,
  62: 11,
  64: 12
};

const LINE_GAP = 14;
const BOTTOM_LINE_Y = 86;
const LEFT = 16;
const NOTE_X0 = 92;
const NOTE_GAP = 34;
const GRAND_BASS_OFFSET = 92;

export function trebleDegree(midi) {
  if (DEGREE[midi] != null) return DEGREE[midi];
  const pc = ((Number(midi) % 12) + 12) % 12;
  const oct = Math.floor(Number(midi) / 12) - 1;
  const fromC4 = (oct - 4) * 7 + [0, null, 1, null, 2, 3, null, 4, null, 5, null, 6][pc];
  return fromC4 == null ? 0 : fromC4 - 2;
}

export function bassDegree(midi) {
  if (BASS_DEGREE[midi] != null) return BASS_DEGREE[midi];
  const pc = ((Number(midi) % 12) + 12) % 12;
  const oct = Math.floor(Number(midi) / 12) - 1;
  const fromG2 = (oct - 2) * 7 + [3, null, 4, null, 5, 6, null, 0, null, 1, null, 2][pc];
  return fromG2 == null ? 3 : fromG2;
}

export function staffY(midi, clef = TREBLE_CLEF, offset = 0) {
  const degree = clef === BASS_CLEF ? bassDegree(midi) : trebleDegree(midi);
  return offset + BOTTOM_LINE_Y - degree * (LINE_GAP / 2);
}

export function durationMs(kind) {
  return kind === 'half' ? HALF_MS : QUARTER_MS;
}

export function staffNote(midi, duration = 'quarter', letter = '', clef = TREBLE_CLEF, column = null) {
  return { midi, duration, letter, clef, column };
}

export function pitchesOf(notes) {
  return (notes || []).map((note) => note.midi);
}

export function staffAgrees(notes, { pitches, durations, clef = TREBLE_CLEF } = {}) {
  if (!Array.isArray(notes) || !notes.length) return false;
  if (pitches && notes.length !== pitches.length) return false;
  return notes.every((note, index) => {
    const pitchOk = pitches ? note.midi === pitches[index] : Number.isInteger(note.midi);
    const durationOk = durations ? note.duration === durations[index] : Boolean(note.duration);
    const wantClef = Array.isArray(clef) ? clef[index] : clef;
    return pitchOk && durationOk && note.clef === wantClef;
  });
}

export function letterForMidi(midi) {
  return ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][((midi % 12) + 12) % 12];
}

export function renderStaff(root, {
  notes = [],
  current = -1,
  showLetters = false,
  caption = '',
  landmarkG = false,
  landmarkF = false,
  clef = TREBLE_CLEF,
  grand = false
} = {}) {
  if (!root) return;
  const columns = notes.map((note, index) => (Number.isInteger(note.column) ? note.column : index));
  const columnCount = columns.length ? Math.max(...columns) + 1 : notes.length;
  const width = Math.max(280, NOTE_X0 + columnCount * NOTE_GAP + 24);
  const height = grand ? 230 : 132;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  const label = caption || (grand ? 'Grand staff' : clef === BASS_CLEF ? 'Bass staff' : 'Treble staff');
  svg.setAttribute('aria-label', label);
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = caption || `${label} with notes`;
  svg.append(title);

  if (grand) {
    drawStaffLines(svg, width, 0);
    drawStaffLines(svg, width, GRAND_BASS_OFFSET);
    svg.append(clefPath(0));
    svg.append(bassClef(GRAND_BASS_OFFSET));
    svg.append(line(10, BOTTOM_LINE_Y - 56, 10, GRAND_BASS_OFFSET + BOTTOM_LINE_Y, '#de4936', 3));
    if (landmarkG) markLandmark(svg, STAFF_MIDI.G4, TREBLE_CLEF, 0, 'G');
    if (landmarkF) markLandmark(svg, STAFF_MIDI.F3, BASS_CLEF, GRAND_BASS_OFFSET, 'F');
  } else {
    drawStaffLines(svg, width, 0);
    if (clef === BASS_CLEF) svg.append(bassClef(0));
    else svg.append(clefPath(0));
    if (landmarkG && clef === TREBLE_CLEF) markLandmark(svg, STAFF_MIDI.G4, TREBLE_CLEF, 0, 'G');
    if (landmarkF && clef === BASS_CLEF) markLandmark(svg, STAFF_MIDI.F3, BASS_CLEF, 0, 'F');
  }

  notes.forEach((note, index) => {
    const noteClef = grand ? (note.clef || clef) : clef;
    const offset = grand && noteClef === BASS_CLEF ? GRAND_BASS_OFFSET : 0;
    const x = NOTE_X0 + (Number.isInteger(note.column) ? note.column : index) * NOTE_GAP;
    const y = staffY(note.midi, noteClef, offset);
    drawLedgers(svg, note.midi, x, noteClef, offset);
    const state = current < 0 ? '' : index < current ? 'done' : index === current ? 'now' : '';
    const fill = state === 'now' ? '#ffdc63' : state === 'done' ? '#f1aec0' : '#29251f';
    const hollow = note.duration === 'half';
    svg.append(ellipse(x, y, 8, 6, hollow ? '#fffdf6' : fill, '#29251f'));
    const degree = noteClef === BASS_CLEF ? bassDegree(note.midi) : trebleDegree(note.midi);
    const stemUp = degree < 3;
    const stemX = stemUp ? x + 7 : x - 7;
    const stemY2 = stemUp ? y - 28 : y + 28;
    svg.append(line(stemX, y, stemX, stemY2, '#29251f', 2));
    if (showLetters && (note.letter || letterForMidi(note.midi))) {
      svg.append(textNode(x, grand ? 220 : 122, note.letter || letterForMidi(note.midi), 12));
    }
  });

  root.hidden = false;
  root.replaceChildren(svg);
  if (caption) {
    const cap = document.createElement('figcaption');
    cap.textContent = caption;
    root.append(cap);
  }
}

function drawStaffLines(svg, width, offset) {
  for (let i = 0; i < 5; i += 1) {
    const y = offset + BOTTOM_LINE_Y - i * LINE_GAP;
    svg.append(line(LEFT, y, width - 12, y, '#29251f', 1.6));
  }
}

function markLandmark(svg, midi, clef, offset, letter) {
  const y = staffY(midi, clef, offset);
  svg.append(circle(72, y, 7, '#ffdc63', '#29251f'));
  svg.append(textNode(72, y + 4, letter, 11));
}

function drawLedgers(svg, midi, x, clef = TREBLE_CLEF, offset = 0) {
  if (clef === BASS_CLEF) {
    if (midi >= STAFF_MIDI.C4) {
      svg.append(line(x - 12, staffY(STAFF_MIDI.C4, BASS_CLEF, offset), x + 12, staffY(STAFF_MIDI.C4, BASS_CLEF, offset), '#29251f', 1.6));
    }
    return;
  }
  if (midi === STAFF_MIDI.C4 || midi < STAFF_MIDI.D4) {
    svg.append(line(x - 12, staffY(STAFF_MIDI.C4, TREBLE_CLEF, offset), x + 12, staffY(STAFF_MIDI.C4, TREBLE_CLEF, offset), '#29251f', 1.6));
  }
  if (midi === STAFF_MIDI.D4) {
    svg.append(line(x - 12, staffY(STAFF_MIDI.C4, TREBLE_CLEF, offset), x + 12, staffY(STAFF_MIDI.C4, TREBLE_CLEF, offset), '#29251f', 1.6));
  }
}

function clefPath(offset = 0) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M40 ${98 + offset} C 28 ${88 + offset}, 28 ${64 + offset}, 42 ${58 + offset} C 58 ${52 + offset}, 62 ${72 + offset}, 48 ${78 + offset} C 36 ${84 + offset}, 40 ${54 + offset}, 52 ${36 + offset} C 58 ${26 + offset}, 56 ${16 + offset}, 50 ${14 + offset} C 46 ${22 + offset}, 52 ${34 + offset}, 44 ${48 + offset} C 34 ${64 + offset}, 38 ${92 + offset}, 50 ${100 + offset} C 56 ${104 + offset}, 54 ${110 + offset}, 48 ${110 + offset} C 42 ${110 + offset}, 40 ${104 + offset}, 44 ${100 + offset}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#de4936');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  return path;
}

function bassClef(offset = 0) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const fY = staffY(STAFF_MIDI.F3, BASS_CLEF, offset);
  path.setAttribute('d', `M28 ${fY + 18} C 28 ${fY - 8}, 54 ${fY - 16}, 54 ${fY + 2} C 54 ${fY + 16}, 36 ${fY + 20}, 32 ${fY + 8}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#de4936');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  group.append(path);
  group.append(circle(62, fY - 6, 2.6, '#de4936', '#de4936'));
  group.append(circle(62, fY + 6, 2.6, '#de4936', '#de4936'));
  return group;
}

function line(x1, y1, x2, y2, stroke, width) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  node.setAttribute('x1', x1);
  node.setAttribute('y1', y1);
  node.setAttribute('x2', x2);
  node.setAttribute('y2', y2);
  node.setAttribute('stroke', stroke);
  node.setAttribute('stroke-width', width);
  return node;
}

function ellipse(cx, cy, rx, ry, fill, stroke) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  node.setAttribute('cx', cx);
  node.setAttribute('cy', cy);
  node.setAttribute('rx', rx);
  node.setAttribute('ry', ry);
  node.setAttribute('fill', fill);
  node.setAttribute('stroke', stroke);
  node.setAttribute('stroke-width', '2');
  return node;
}

function circle(cx, cy, r, fill, stroke) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  node.setAttribute('cx', cx);
  node.setAttribute('cy', cy);
  node.setAttribute('r', r);
  node.setAttribute('fill', fill);
  node.setAttribute('stroke', stroke);
  node.setAttribute('stroke-width', '2');
  return node;
}

function textNode(x, y, value, size) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  node.setAttribute('x', x);
  node.setAttribute('y', y);
  node.setAttribute('text-anchor', 'middle');
  node.setAttribute('font-size', String(size));
  node.setAttribute('font-weight', '800');
  node.setAttribute('fill', '#29251f');
  node.textContent = value;
  return node;
}
