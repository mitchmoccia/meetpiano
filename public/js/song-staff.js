import { bassDegree, letterForMidi, staffY, trebleDegree, BASS_CLEF, TREBLE_CLEF } from './staff.js';

const NS = 'http://www.w3.org/2000/svg';
const PLAYHEAD = 118;
const PIXELS_PER_BEAT = 54;
const BASS_OFFSET = 92;

function svgEl(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
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
      const y = offset + 86 - i * 14;
      parent.append(svgEl('line', { x1: 8, y1: y, x2: width - 8, y2: y, stroke: '#29251f', 'stroke-width': 1.6 }));
    }
  }

  function clef(parent, kind, offset) {
    if (kind === 'bass') {
      const group = svgEl('g');
      const fY = staffY(53, BASS_CLEF, offset);
      group.append(svgEl('path', {
        d: `M28 ${fY + 18} C 28 ${fY - 8}, 54 ${fY - 16}, 54 ${fY + 2} C 54 ${fY + 16}, 36 ${fY + 20}, 32 ${fY + 8}`,
        fill: 'none',
        stroke: '#de4936',
        'stroke-width': 3,
        'stroke-linecap': 'round'
      }));
      group.append(svgEl('circle', { cx: 62, cy: fY - 6, r: 2.6, fill: '#de4936' }));
      group.append(svgEl('circle', { cx: 62, cy: fY + 6, r: 2.6, fill: '#de4936' }));
      parent.append(group);
      return;
    }
    parent.append(svgEl('path', {
      d: `M40 ${98 + offset} C 28 ${88 + offset}, 28 ${64 + offset}, 42 ${58 + offset} C 58 ${52 + offset}, 62 ${72 + offset}, 48 ${78 + offset} C 36 ${84 + offset}, 40 ${54 + offset}, 52 ${36 + offset} C 58 ${26 + offset}, 56 ${16 + offset}, 50 ${14 + offset} C 46 ${22 + offset}, 52 ${34 + offset}, 44 ${48 + offset} C 34 ${64 + offset}, 38 ${92 + offset}, 50 ${100 + offset} C 56 ${104 + offset}, 54 ${110 + offset}, 48 ${110 + offset} C 42 ${110 + offset}, 40 ${104 + offset}, 44 ${100 + offset}`,
      fill: 'none',
      stroke: '#de4936',
      'stroke-width': 3,
      'stroke-linecap': 'round'
    }));
  }

  function timeSig(parent, beats, offset) {
    const top = svgEl('text', { x: 84, y: offset + 62, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: '#29251f' });
    top.textContent = String(beats);
    const bottom = svgEl('text', { x: 84, y: offset + 84, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: '#29251f' });
    bottom.textContent = '4';
    parent.append(top, bottom);
  }

  function render(model) {
    const { notes, lyrics = [], beatsPerBar, length, grand, showLetters, label } = model;
    pixelsPerBeat = PIXELS_PER_BEAT;
    const height = grand ? 250 : 160;
    const width = 900;
    root.replaceChildren();
    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img' });
    svg.setAttribute('aria-label', label || 'Sheet music');
    const title = svgEl('title');
    title.textContent = label || 'Sheet music with a moving cursor';
    svg.append(title);
    const paper = svgEl('g');
    staffLines(paper, 0, width);
    if (grand) staffLines(paper, BASS_OFFSET, width);
    svg.append(paper);

    scoreGroup = svgEl('g');
    const bars = Math.ceil(length / beatsPerBar);
    for (let bar = 0; bar <= bars; bar += 1) {
      const beat = bar * beatsPerBar;
      const x = PLAYHEAD + beat * pixelsPerBeat;
      const y2 = grand ? BASS_OFFSET + 86 : 86;
      scoreGroup.append(svgEl('line', {
        x1: x,
        y1: 30,
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
    staffLines(mask, 0, PLAYHEAD - 6);
    clef(mask, 'treble', 0);
    timeSig(mask, beatsPerBar, 0);
    if (grand) {
      staffLines(mask, BASS_OFFSET, PLAYHEAD - 6);
      clef(mask, 'bass', BASS_OFFSET);
      timeSig(mask, beatsPerBar, BASS_OFFSET);
      mask.append(svgEl('path', {
        d: `M14 30 C 2 58, 2 ${BASS_OFFSET + 30}, 14 ${BASS_OFFSET + 86}`,
        fill: 'none',
        stroke: '#29251f',
        'stroke-width': 2.4,
        'stroke-linecap': 'round'
      }));
    }
    svg.append(mask);
    playhead = svgEl('line', {
      x1: PLAYHEAD,
      y1: 24,
      x2: PLAYHEAD,
      y2: grand ? BASS_OFFSET + 96 : 96,
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
      const fill = on ? '#ffdc63' : note.status === 'hit' ? '#f1aec0' : head.hollow ? '#fffdf6' : '#29251f';
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
  const offset = note.clef === BASS_CLEF ? BASS_OFFSET : 0;
  const x = PLAYHEAD + note.beat * PIXELS_PER_BEAT + note.shift;
  const y = staffY(note.pitch, note.clef, offset);
  for (const degree of ledgerDegrees(note.degree)) {
    const ledgerY = y + (note.degree - degree) * 7;
    parent.append(svgEl('line', { x1: x - 12, y1: ledgerY, x2: x + 12, y2: ledgerY, stroke: '#29251f', 'stroke-width': 1.6 }));
  }
  const kind = glyphFor(note.dur);
  const hollow = kind !== 'quarter';
  const head = svgEl('ellipse', {
    cx: x,
    cy: y,
    rx: 8,
    ry: 6,
    fill: hollow ? '#fffdf6' : '#29251f',
    stroke: '#29251f',
    'stroke-width': 2
  });
  parent.append(head);
  if (kind !== 'whole') {
    const stemUp = note.degree < 4;
    const stemX = stemUp ? x + 7 : x - 7;
    parent.append(svgEl('line', {
      x1: stemX,
      y1: y,
      x2: stemX,
      y2: stemUp ? y - 32 : y + 32,
      stroke: '#29251f',
      'stroke-width': 2
    }));
  }
  if (showLetters) {
    const label = svgEl('text', {
      x,
      y: offset + 108,
      'text-anchor': 'middle',
      'font-size': 11,
      'font-weight': 800,
      fill: '#71695f'
    });
    label.textContent = letterForMidi(note.pitch);
    parent.append(label);
  }
  return { id: note.id, node: head, hollow };
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
