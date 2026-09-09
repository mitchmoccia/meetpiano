export const TREBLE_CLEF = 'treble';
export const QUARTER_MS = 480;
export const HALF_MS = 960;

export const STAFF_MIDI = {
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

const LINE_GAP = 14;
const BOTTOM_LINE_Y = 86;
const LEFT = 16;
const NOTE_X0 = 92;
const NOTE_GAP = 34;

export function trebleDegree(midi) {
  if (DEGREE[midi] != null) return DEGREE[midi];
  const pc = ((Number(midi) % 12) + 12) % 12;
  const oct = Math.floor(Number(midi) / 12) - 1;
  const fromC4 = (oct - 4) * 7 + [0, null, 1, null, 2, 3, null, 4, null, 5, null, 6][pc];
  return fromC4 == null ? 0 : fromC4 - 2;
}

export function staffY(midi) {
  return BOTTOM_LINE_Y - trebleDegree(midi) * (LINE_GAP / 2);
}

export function durationMs(kind) {
  return kind === 'half' ? HALF_MS : QUARTER_MS;
}

export function staffNote(midi, duration = 'quarter', letter = '') {
  return { midi, duration, letter, clef: TREBLE_CLEF };
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
    return pitchOk && durationOk && note.clef === clef;
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
  landmarkG = false
} = {}) {
  if (!root) return;
  const width = Math.max(280, NOTE_X0 + notes.length * NOTE_GAP + 24);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} 132`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', caption || 'Treble staff');
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = caption || 'Treble staff with notes';
  svg.append(title);

  for (let i = 0; i < 5; i += 1) {
    const y = BOTTOM_LINE_Y - i * LINE_GAP;
    svg.append(line(LEFT, y, width - 12, y, '#29251f', 1.6));
  }

  svg.append(clefPath());
  if (landmarkG) {
    const gY = staffY(STAFF_MIDI.G4);
    svg.append(circle(72, gY, 7, '#ffdc63', '#29251f'));
    svg.append(textNode(72, gY + 4, 'G', 11));
  }

  notes.forEach((note, index) => {
    const x = NOTE_X0 + index * NOTE_GAP;
    const y = staffY(note.midi);
    drawLedgers(svg, note.midi, x);
    const state = current < 0 ? '' : index < current ? 'done' : index === current ? 'now' : '';
    const fill = state === 'now' ? '#ffdc63' : state === 'done' ? '#f1aec0' : '#29251f';
    const hollow = note.duration === 'half';
    svg.append(ellipse(x, y, 8, 6, hollow ? '#fffdf6' : fill, '#29251f'));
    const stemUp = trebleDegree(note.midi) < 3;
    const stemX = stemUp ? x + 7 : x - 7;
    const stemY2 = stemUp ? y - 28 : y + 28;
    svg.append(line(stemX, y, stemX, stemY2, '#29251f', 2));
    if (showLetters && (note.letter || letterForMidi(note.midi))) {
      svg.append(textNode(x, 122, note.letter || letterForMidi(note.midi), 12));
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

function drawLedgers(svg, midi, x) {
  if (midi === STAFF_MIDI.C4 || midi < STAFF_MIDI.D4) {
    svg.append(line(x - 12, staffY(STAFF_MIDI.C4), x + 12, staffY(STAFF_MIDI.C4), '#29251f', 1.6));
  }
  if (midi === STAFF_MIDI.D4) {
    svg.append(line(x - 12, staffY(STAFF_MIDI.C4), x + 12, staffY(STAFF_MIDI.C4), '#29251f', 1.6));
  }
}

function clefPath() {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M40 98 C 28 88, 28 64, 42 58 C 58 52, 62 72, 48 78 C 36 84, 40 54, 52 36 C 58 26, 56 16, 50 14 C 46 22, 52 34, 44 48 C 34 64, 38 92, 50 100 C 56 104, 54 110, 48 110 C 42 110, 40 104, 44 100');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#de4936');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  return path;
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
