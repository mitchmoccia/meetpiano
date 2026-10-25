import { bassDegree, letterForMidi, staffY, trebleDegree, BASS_CLEF, TREBLE_CLEF } from './staff.js';

const NS = 'http://www.w3.org/2000/svg';
const PLAYHEAD = 118;
const PIXELS_PER_BEAT = 54;
const BASS_OFFSET = 92;
const STAFF_PAD = 16;
const SPACE = 14;
const INK = '#29251f';
/* One em is four staff spaces, the SMuFL staff size. Glyphs are a subset of
   Bravura (Steinberg), renamed MeetPiano Music under the SIL Open Font License. */
const MUSIC_EM = SPACE * 4;
const G_CLEF = '\uE050';
const F_CLEF = '\uE062';
const CLEF_X = 10;
const TIME_X = 58;
const HEADS = {
  whole: { char: '\uE0A2', width: 1.688 },
  half: { char: '\uE0A3', width: 1.18, stemUp: [1.18, 0.168], stemDown: [0, -0.168] },
  quarter: { char: '\uE0A4', width: 1.18, stemUp: [1.18, 0.168], stemDown: [0, -0.168] }
};

function svgEl(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function musicText(parent, char, x, y) {
  const node = svgEl('text', {
    x,
    y,
    class: 'music-glyph',
    'font-size': MUSIC_EM,
    fill: INK
  });
  node.setAttribute('aria-hidden', 'true');
  node.textContent = char;
  parent.append(node);
  return node;
}

function glyphFor(dur) {
  if (dur >= 3.5) return 'whole';
  if (dur >= 1.75) return 'half';
  return 'quarter';
}

export function createStaffView(root) {
  let scoreGroup = null;
  let playhead = null;
  let heads = [];
  let lastKey = '';
  let pixelsPerBeat = PIXELS_PER_BEAT;

  function staffLines(parent, offset, width) {
    for (let i = 0; i < 5; i += 1) {
      const y = offset + 86 - i * SPACE;
      parent.append(svgEl('line', { x1: 8, y1: y, x2: width - 8, y2: y, stroke: INK, 'stroke-width': 1.6 }));
    }
  }

  function clef(parent, kind, offset) {
    if (kind === 'bass') {
      musicText(parent, F_CLEF, CLEF_X, staffY(53, BASS_CLEF, offset));
      return;
    }
    musicText(parent, G_CLEF, CLEF_X, staffY(67, TREBLE_CLEF, offset));
  }

  function timeSig(parent, beats, offset) {
    const numeral = beats >= 0 && beats <= 9 ? String.fromCodePoint(0xE080 + beats) : String(beats);
    musicText(parent, numeral, TIME_X, offset + 44);
    musicText(parent, '\uE084', TIME_X, offset + 72);
  }

  function render(model) {
    const { notes, lyrics = [], beatsPerBar, length, grand, showLetters, label } = model;
    pixelsPerBeat = PIXELS_PER_BEAT;
    const height = grand ? 268 : 188;
    const width = 900;
    root.replaceChildren();
    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img' });
    const clefLabel = grand ? 'Treble and bass clefs' : 'Treble clef';
    svg.setAttribute('aria-label', `${label || 'Sheet music'}. ${clefLabel}, ${beatsPerBar}/4.`);
    const title = svgEl('title');
    title.textContent = label || 'Sheet music with a moving cursor';
    svg.append(title);
    const paper = svgEl('g');
    staffLines(paper, STAFF_PAD, width);
    if (grand) staffLines(paper, STAFF_PAD + BASS_OFFSET, width);
    svg.append(paper);

    scoreGroup = svgEl('g');
    const bars = Math.ceil(length / beatsPerBar);
    for (let bar = 0; bar <= bars; bar += 1) {
      const beat = bar * beatsPerBar;
      const x = PLAYHEAD + beat * pixelsPerBeat;
      const y2 = grand ? STAFF_PAD + BASS_OFFSET + 86 : STAFF_PAD + 86;
      scoreGroup.append(svgEl('line', {
        x1: x,
        y1: STAFF_PAD + 30,
        x2: x,
        y2,
        stroke: '#29251f',
        'stroke-width': bar === bars ? 3 : 1.4
      }));
      if (bar < bars) {
        const num = svgEl('text', { x, y: 18, 'font-size': 11, 'font-weight': 700, fill: '#71695f' });
        num.textContent = String(bar + 1);
        scoreGroup.append(num);
      }
    }
    heads = layoutNotes(notes, grand).map((note) => drawNote(scoreGroup, note, showLetters));
    for (const line of lyrics) {
      const text = svgEl('text', {
        x: PLAYHEAD + line.beat * pixelsPerBeat,
        y: height - 12,
        'font-size': 13,
        'font-weight': 700,
        fill: '#29251f'
      });
      text.textContent = line.text;
      scoreGroup.append(text);
    }
    svg.append(scoreGroup);
    const mask = svgEl('g');
    mask.append(svgEl('rect', { x: 0, y: 0, width: PLAYHEAD - 20, height, fill: '#fffdf8' }));
    staffLines(mask, STAFF_PAD, PLAYHEAD - 6);
    clef(mask, 'treble', STAFF_PAD);
    timeSig(mask, beatsPerBar, STAFF_PAD);
    if (grand) {
      staffLines(mask, STAFF_PAD + BASS_OFFSET, PLAYHEAD - 6);
      clef(mask, 'bass', STAFF_PAD + BASS_OFFSET);
      timeSig(mask, beatsPerBar, STAFF_PAD + BASS_OFFSET);
      mask.append(svgEl('path', {
        d: `M14 ${STAFF_PAD + 30} C 2 ${STAFF_PAD + 58}, 2 ${STAFF_PAD + BASS_OFFSET + 30}, 14 ${STAFF_PAD + BASS_OFFSET + 86}`,
        fill: 'none',
        stroke: '#29251f',
        'stroke-width': 2.4,
        'stroke-linecap': 'round'
      }));
    }
    svg.append(mask);
    playhead = svgEl('line', {
      x1: PLAYHEAD,
      y1: STAFF_PAD + 22,
      x2: PLAYHEAD,
      y2: grand ? STAFF_PAD + BASS_OFFSET + 96 : STAFF_PAD + 96,
      stroke: '#de4936',
      'stroke-width': 3
    });
    playhead.setAttribute('aria-hidden', 'true');
    svg.append(playhead);
    root.append(svg);
    lastKey = '';
  }

  function sync(cursor, notes) {
    if (!scoreGroup) return;
    scoreGroup.setAttribute('transform', `translate(${-cursor * pixelsPerBeat} 0)`);
    const key = notes.map((note) => {
      const on = cursor >= note.beat && cursor < note.beat + note.dur;
      return `${note.id}:${note.status}:${on ? 1 : 0}`;
    }).join('|');
    if (key === lastKey) return;
    lastKey = key;
    for (const head of heads) {
      const note = notes.find((item) => item.id === head.id);
      if (!note) continue;
      const on = cursor >= note.beat && cursor < note.beat + note.dur;
      const fill = on ? '#ffdc63' : note.status === 'hit' ? '#f1aec0' : INK;
      head.node.setAttribute('fill', fill);
    }
  }

  return {
    render,
    sync,
    playhead: PLAYHEAD,
    pixelsPerBeat: PIXELS_PER_BEAT
  };
}

function layoutNotes(notes, grand) {
  const placed = [];
  for (const note of notes) {
    const clef = grand && note.hand === 'lh' ? BASS_CLEF : TREBLE_CLEF;
    const degree = clef === BASS_CLEF ? bassDegree(note.pitch) : trebleDegree(note.pitch);
    const clash = placed.some((other) => (
      other.clef === clef
      && Math.abs(other.beat - note.beat) < 0.03
      && Math.abs(other.degree - degree) <= 1
    ));
    placed.push({ ...note, clef, degree, shift: clash ? 12 : 0 });
  }
  return placed;
}

function drawNote(parent, note, showLetters) {
  const offset = (note.clef === BASS_CLEF ? BASS_OFFSET : 0) + STAFF_PAD;
  const x = PLAYHEAD + note.beat * PIXELS_PER_BEAT + note.shift;
  const y = staffY(note.pitch, note.clef, offset);
  const kind = glyphFor(note.dur);
  const spec = HEADS[kind];
  const half = (spec.width * SPACE) / 2;
  const ledgerExtend = half + 0.4 * SPACE;
  for (const degree of ledgerDegrees(note.degree)) {
    const ledgerY = y + (note.degree - degree) * (SPACE / 2);
    parent.append(svgEl('line', {
      x1: x - ledgerExtend,
      y1: ledgerY,
      x2: x + ledgerExtend,
      y2: ledgerY,
      stroke: INK,
      'stroke-width': 1.6
    }));
  }
  const originX = x - half;
  const head = musicText(parent, spec.char, originX, y);
  if (kind !== 'whole') {
    const stemUp = note.degree < 4;
    const [ax, ay] = stemUp ? spec.stemUp : spec.stemDown;
    const sx = originX + ax * SPACE;
    const sy = y - ay * SPACE;
    const tip = stemUp ? y - 3.5 * SPACE : y + 3.5 * SPACE;
    parent.append(svgEl('line', {
      x1: sx,
      y1: sy,
      x2: sx,
      y2: tip,
      stroke: INK,
      'stroke-width': 1.7,
      'stroke-linecap': 'butt'
    }));
  }
  if (showLetters) {
    const label = svgEl('text', {
      x,
      y: offset + 128,
      'text-anchor': 'middle',
      'font-size': 11,
      'font-weight': 800,
      fill: '#71695f'
    });
    label.textContent = letterForMidi(note.pitch);
    parent.append(label);
  }
  return { id: note.id, node: head };
}

function ledgerDegrees(degree) {
  const lines = [];
  if (degree <= -1) {
    for (let line = -2; line >= degree; line -= 2) lines.push(line);
  }
  if (degree >= 9) {
    for (let line = 10; line <= degree; line += 2) lines.push(line);
  }
  return lines;
}
