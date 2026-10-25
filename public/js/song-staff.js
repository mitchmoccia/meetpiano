import { bassDegree, letterForMidi, staffY, trebleDegree, BASS_CLEF, TREBLE_CLEF } from './staff.js';

const NS = 'http://www.w3.org/2000/svg';
const PLAYHEAD = 220;
const PIXELS_PER_BEAT = 54;
/* Halfway between beat centers, so the line sits in the gap instead of on the note. */
const BARLINE_INSET = PIXELS_PER_BEAT / 2;
const SPACE = 14;
const STAFF_PAD = 28;
/* Nine staff spaces from the treble's bottom line to the bass's top line. */
const BASS_OFFSET = 4 * SPACE + 9 * SPACE;
const STEM = 3.5 * SPACE;
const VOICE_NUDGE = 22;
const INK = '#29251f';
/* One em is four staff spaces, the SMuFL staff size. Glyphs are a subset of
   Bravura (Steinberg), renamed MeetPiano Music under the SIL Open Font License. */
const MUSIC_EM = SPACE * 4;
const G_CLEF = '\uE050';
const F_CLEF = '\uE062';
const BRACE = '\uE000';
const CLEF_X = 32;
const TIME_X = 84;
const SYSTEM_X = 16;
/* Covers the clef and time signature so scrolled notes never draw through them. */
const PRELUDE = 176;
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

function musicText(parent, char, x, y, fontSize = MUSIC_EM) {
  const node = svgEl('text', {
    x,
    y,
    class: 'music-glyph',
    'font-size': fontSize,
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
  let lastTransform = '';
  let lastPlayhead = '';
  let pixelsPerBeat = PIXELS_PER_BEAT;

  function staffLines(parent, offset, x1, x2, span) {
    for (let i = 0; i < 5; i += 1) {
      const y = offset + 86 - i * SPACE;
      const line = svgEl('line', { x1, y1: y, x2, y2: y, stroke: INK, 'stroke-width': 1.6 });
      if (span) line.setAttribute('data-span', span);
      parent.append(line);
    }
  }

  function fitWindow() {
    const svg = root.querySelector('svg');
    if (!svg || root.hidden) return true;
    const cssW = root.clientWidth;
    const cssH = root.clientHeight;
    if (cssW < 40 || cssH < 8) return false;
    const userH = Number(svg.dataset.userH);
    if (!userH) return false;
    /* Scale to the mount. A 0.78 floor made a short stage letterbox the
       engraving on the left, so the 30% playhead landed near 16%. */
    const scale = Math.min(1.2, cssH / userH);
    const next = Math.round(Math.min(16000, Math.max(320, cssW / scale)));
    if (svg.dataset.windowW === String(next)) return true;
    svg.dataset.windowW = String(next);
    svg.setAttribute('viewBox', `0 0 ${next} ${userH}`);
    root.querySelectorAll('[data-span="paper"]').forEach((line) => line.setAttribute('x2', String(next - 8)));
    lastPlayhead = '';
    lastTransform = '';
    return true;
  }

  function systemBrace(parent) {
    const top = STAFF_PAD + 30;
    const bottom = STAFF_PAD + BASS_OFFSET + 86;
    const brace = musicText(parent, BRACE, 1, bottom, bottom - top);
    brace.setAttribute('text-rendering', 'geometricPrecision');
    parent.append(svgEl('line', {
      x1: SYSTEM_X,
      y1: top,
      x2: SYSTEM_X,
      y2: bottom,
      stroke: INK,
      'stroke-width': 1.6
    }));
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
    const { notes, lyrics = [], beatsPerBar, grand, showLetters, label } = model;
    pixelsPerBeat = PIXELS_PER_BEAT;
    const layout = engrave(notes, { beatsPerBar, grand, pixelsPerBeat, lyrics });
    const height = layout.metrics.height;
    const width = 1100;
    root.replaceChildren();
    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img' });
    svg.dataset.userH = String(height);
    svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
    const clefLabel = grand ? 'Treble and bass clefs' : 'Treble clef';
    svg.setAttribute('aria-label', `${label || 'Sheet music'}. ${clefLabel}, ${beatsPerBar}/4.`);
    const title = svgEl('title');
    title.textContent = label || 'Sheet music with a moving cursor';
    svg.append(title);
    const paper = svgEl('g');
    const staffStart = grand ? SYSTEM_X : 18;
    const yTop = STAFF_PAD + 30;
    const yBot = grand ? STAFF_PAD + BASS_OFFSET + 86 : STAFF_PAD + 86;
    staffLines(paper, STAFF_PAD, staffStart, width - 8, 'paper');
    if (grand) staffLines(paper, STAFF_PAD + BASS_OFFSET, staffStart, width - 8, 'paper');
    svg.append(paper);

    scoreGroup = svgEl('g');
    for (const line of layout.barlines) {
      scoreGroup.append(svgEl('line', {
        x1: line.x,
        y1: yTop,
        x2: line.x,
        y2: yBot,
        stroke: INK,
        'stroke-width': line.final ? 3.2 : 1.6
      }));
    }
    const numbers = [
      { n: 1, x: PLAYHEAD - BARLINE_INSET },
      ...layout.barlines.slice(0, -1).map((line, index) => ({ n: index + 2, x: line.x }))
    ];
    for (const mark of numbers) {
      const num = svgEl('text', {
        x: mark.x,
        y: 18,
        'text-anchor': 'middle',
        'font-size': 11,
        'font-weight': 700,
        fill: '#71695f'
      });
      num.textContent = String(mark.n);
      scoreGroup.append(num);
    }
    heads = [];
    for (const chord of layout.chords) {
      for (const note of chord.notes) heads.push(drawNote(scoreGroup, note, showLetters, layout.metrics.lyricY));
      drawStem(scoreGroup, chord);
    }
    for (const beam of layout.beams) {
      scoreGroup.append(svgEl('line', {
        x1: beam.x1,
        y1: beam.y1,
        x2: beam.x2,
        y2: beam.y2,
        stroke: INK,
        'stroke-width': 4.5,
        'stroke-linecap': 'butt'
      }));
    }
    for (const line of layout.lyrics) {
      const text = svgEl('text', {
        x: line.x,
        y: line.y,
        'font-size': 13,
        'font-weight': 700,
        fill: '#29251f'
      });
      text.textContent = line.text;
      scoreGroup.append(text);
    }
    svg.append(scoreGroup);
    const mask = svgEl('g');
    mask.append(svgEl('rect', { x: 0, y: 0, width: PRELUDE, height: Math.max(40, height - 36), fill: '#fffdf8' }));
    staffLines(mask, STAFF_PAD, staffStart, PRELUDE);
    clef(mask, 'treble', STAFF_PAD);
    timeSig(mask, beatsPerBar, STAFF_PAD);
    if (grand) {
      staffLines(mask, STAFF_PAD + BASS_OFFSET, staffStart, PRELUDE);
      clef(mask, 'bass', STAFF_PAD + BASS_OFFSET);
      timeSig(mask, beatsPerBar, STAFF_PAD + BASS_OFFSET);
      systemBrace(mask);
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
    lastTransform = '';
    lastPlayhead = '';
    fitWindow();
  }

  function sync(cursor, notes) {
    if (!scoreGroup) return;
    const svg = root.querySelector('svg');
    const windowW = Number(svg?.dataset.windowW) || 1100;
    const playheadX = Math.max(PRELUDE + 72, Math.round(windowW * 0.3));
    const x = String(playheadX);
    if (playhead && x !== lastPlayhead) {
      lastPlayhead = x;
      playhead.setAttribute('x1', x);
      playhead.setAttribute('x2', x);
    }
    const transform = `translate(${playheadX - PLAYHEAD - cursor * pixelsPerBeat} 0)`;
    if (transform !== lastTransform) {
      lastTransform = transform;
      scoreGroup.setAttribute('transform', transform);
    }
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
    refit: fitWindow,
    playhead: PLAYHEAD,
    pixelsPerBeat: PIXELS_PER_BEAT
  };
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

/**
 * Staff positions for one take. Left hand uses the bass staff whenever the
 * grand staff is showing; pitch does not choose the clef. A single voice stems
 * up below the middle line and down on or above it. Two rhythms at once keep
 * opposite stems. Eighths that share a beat and a staff share one beam.
 * Barlines sit closer to the previous note so the next note has air.
 */
export function engrave(notes, { beatsPerBar = 4, grand = false, pixelsPerBeat = PIXELS_PER_BEAT, lyrics = [] } = {}) {
  const prepared = (notes || []).map((note) => {
    const clef = grand && note.hand === 'lh' ? BASS_CLEF : TREBLE_CLEF;
    const degree = clef === BASS_CLEF ? bassDegree(note.pitch) : trebleDegree(note.pitch);
    const kind = glyphFor(note.dur);
    return {
      ...note,
      clef,
      degree,
      kind,
      ledgerCount: ledgerDegrees(degree).length,
      half: (HEADS[kind].width * SPACE) / 2,
      shift: 0,
      voiceNudge: 0,
      beam: null
    };
  });
  const clusters = [];
  for (const note of prepared) {
    let cluster = clusters.find((item) => item.clef === note.clef && Math.abs(item.beat - note.beat) < 0.03);
    if (!cluster) {
      cluster = { clef: note.clef, beat: note.beat, notes: [] };
      clusters.push(cluster);
    }
    cluster.notes.push(note);
  }
  const chords = [];
  for (const cluster of clusters) {
    const byDur = new Map();
    for (const note of cluster.notes) {
      const key = Math.round(note.dur * 1000);
      if (!byDur.has(key)) byDur.set(key, []);
      byDur.get(key).push(note);
    }
    for (const group of byDur.values()) {
      const chord = {
        clef: cluster.clef,
        beat: cluster.beat,
        dur: group[0].dur,
        notes: group,
        stemUp: null,
        voice: 1,
        hasStem: group.some((note) => note.kind !== 'whole'),
        beam: null,
        beamY: null,
        stemX: 0,
        stemEnd: 0,
        stemLength: 0
      };
      chords.push(chord);
      for (const note of group) note.chord = chord;
    }
  }
  const beamBuckets = new Map();
  for (const chord of chords) {
    if (chord.dur >= 0.75) continue;
    const key = `${chord.clef}:${Math.floor(chord.beat + 1e-6)}`;
    if (!beamBuckets.has(key)) beamBuckets.set(key, []);
    beamBuckets.get(key).push(chord);
  }
  let beamSerial = 0;
  const beams = [];
  for (const group of beamBuckets.values()) {
    group.sort((a, b) => a.beat - b.beat);
    if (group.length < 2) continue;
    const id = `beam-${beamSerial}`;
    beamSerial += 1;
    const stemUp = stemUpFor(group.flatMap((chord) => chord.notes));
    for (const chord of group) {
      chord.beam = id;
      chord.stemUp = stemUp;
      chord.voice = 1;
      for (const note of chord.notes) {
        note.beam = id;
        note.stemUp = stemUp;
      }
    }
    beams.push({ id, chords: group, stemUp });
  }
  const beatGroups = new Map();
  for (const chord of chords) {
    const key = `${chord.clef}:${Math.round(chord.beat * 1000)}`;
    if (!beatGroups.has(key)) beatGroups.set(key, []);
    beatGroups.get(key).push(chord);
  }
  for (const group of beatGroups.values()) {
    const ranked = [...group].sort((a, b) => averageDegree(b.notes) - averageDegree(a.notes) || a.dur - b.dur);
    const multi = ranked.length > 1;
    ranked.forEach((chord, index) => {
      chord.voice = index + 1;
      if (chord.beam) return;
      chord.stemUp = multi ? index === 0 : stemUpFor(chord.notes);
      for (const note of chord.notes) note.stemUp = chord.stemUp;
      if (multi && index === 0) {
        for (const note of chord.notes) note.voiceNudge = VOICE_NUDGE;
      }
    });
  }
  for (const chord of chords) separateSeconds(chord.notes, chord.stemUp !== false);
  for (const note of prepared) {
    note.x = PLAYHEAD + note.beat * pixelsPerBeat + note.shift + note.voiceNudge;
    const offset = (note.clef === BASS_CLEF ? BASS_OFFSET : 0) + STAFF_PAD;
    note.y = staffY(note.pitch, note.clef, offset);
  }
  for (const chord of chords) {
    const voiced = chord.notes.filter((note) => note.kind !== 'whole');
    chord.hasStem = voiced.length > 0;
    if (!chord.hasStem) {
      chord.stemLength = 0;
      chord.stemEnd = 0;
      continue;
    }
    const anchor = voiced.find((note) => note.shift === 0) || voiced[0];
    chord.stemX = chord.stemUp ? anchor.x + anchor.half : anchor.x - anchor.half;
  }
  for (const beam of beams) {
    const { stemUp, chords: group } = beam;
    const ends = group.map((chord) => outerY(chord, stemUp));
    let y1 = stemUp ? ends[0] - STEM : ends[0] + STEM;
    let y2 = stemUp ? ends[ends.length - 1] - STEM : ends[ends.length - 1] + STEM;
    const maxSlant = SPACE * 1.25;
    if (y2 - y1 > maxSlant) y2 = y1 + maxSlant;
    if (y1 - y2 > maxSlant) y2 = y1 - maxSlant;
    for (let i = 0; i < group.length; i += 1) {
      const t = group.length === 1 ? 0 : i / (group.length - 1);
      const beamY = y1 + (y2 - y1) * t;
      const end = ends[i];
      if (stemUp && end - beamY < STEM) {
        const delta = STEM - (end - beamY);
        y1 -= delta;
        y2 -= delta;
      }
      if (!stemUp && beamY - end < STEM) {
        const delta = STEM - (beamY - end);
        y1 += delta;
        y2 += delta;
      }
    }
    beam.x1 = group[0].stemX;
    beam.x2 = group[group.length - 1].stemX;
    beam.y1 = y1;
    beam.y2 = y2;
    group.forEach((chord, index) => {
      const t = group.length === 1 ? 0 : index / (group.length - 1);
      chord.beamY = y1 + (y2 - y1) * t;
      chord.stemEnd = chord.beamY;
      chord.stemLength = Math.abs(chord.stemEnd - outerY(chord, chord.stemUp)) / SPACE;
    });
  }
  for (const chord of chords) {
    if (!chord.hasStem || chord.beamY != null) continue;
    const edge = outerY(chord, chord.stemUp);
    chord.stemEnd = chord.stemUp ? edge - STEM : edge + STEM;
    chord.stemLength = 3.5;
  }
  const trebleBottom = STAFF_PAD + 86;
  const trebleTop = trebleBottom - 4 * SPACE;
  const bassBottom = grand ? STAFF_PAD + BASS_OFFSET + 86 : null;
  const bassTop = grand ? bassBottom - 4 * SPACE : null;
  const staffBottom = grand ? bassBottom : trebleBottom;
  let lowest = staffBottom;
  for (const note of prepared) lowest = Math.max(lowest, note.y + 0.55 * SPACE);
  for (const chord of chords) {
    if (chord.hasStem && !chord.stemUp) lowest = Math.max(lowest, chord.stemEnd);
  }
  const lyricY = Math.ceil(lowest + 22);
  const lyricLayouts = (lyrics || []).map((line) => ({
    beat: line.beat,
    text: line.text,
    x: PLAYHEAD + line.beat * pixelsPerBeat,
    y: lyricY
  }));
  const length = prepared.reduce((max, note) => Math.max(max, note.beat + note.dur), 0);
  const bars = Math.max(1, Math.ceil(length / beatsPerBar));
  const barlines = [];
  for (let bar = 1; bar <= bars; bar += 1) {
    const boundary = bar * beatsPerBar;
    const before = prepared.filter((note) => note.beat < boundary - 1e-3);
    const after = prepared.filter((note) => note.beat >= boundary - 1e-3);
    let x = PLAYHEAD + boundary * pixelsPerBeat - BARLINE_INSET;
    if (before.length && after.length) {
      const right = Math.max(...before.map((note) => note.x + note.half));
      const left = Math.min(...after.map((note) => note.x - note.half));
      const gap = left - right;
      if (gap > 12) {
        const afterRoom = Math.max(6, Math.min(gap - 6, gap * 0.62));
        x = left - afterRoom;
      } else if (gap > 2) {
        x = (right + left) / 2;
      }
    }
    barlines.push({ beat: boundary, x, final: bar === bars });
  }
  return {
    notes: prepared,
    chords,
    barlines,
    beams,
    bars,
    lyrics: lyricLayouts,
    metrics: {
      space: SPACE,
      playhead: PLAYHEAD,
      gap: grand ? bassTop - trebleBottom : null,
      trebleTop,
      trebleBottom,
      bassTop,
      bassBottom,
      lyricY,
      height: lyricY + 18
    }
  };
}

function averageDegree(notes) {
  return notes.reduce((sum, note) => sum + note.degree, 0) / notes.length;
}

/** Below the middle line stems up. On or above it, and equidistant chords, stem down. */
function stemUpFor(notes) {
  let bestAbs = -1;
  let bestDist = 0;
  for (const note of notes) {
    const dist = note.degree - 4;
    const abs = Math.abs(dist);
    if (abs > bestAbs || (abs === bestAbs && dist > bestDist)) {
      bestAbs = abs;
      bestDist = dist;
    }
  }
  return bestDist < 0;
}

function outerY(chord, stemUp) {
  const voiced = chord.notes.filter((note) => note.kind !== 'whole');
  const values = voiced.map((note) => note.y);
  return stemUp ? Math.min(...values) : Math.max(...values);
}

function separateSeconds(notes, stemUp) {
  const ordered = [...notes].sort((a, b) => a.degree - b.degree);
  if (stemUp) {
    for (let i = 1; i < ordered.length; i += 1) {
      if (ordered[i].degree - ordered[i - 1].degree <= 1 && ordered[i - 1].shift === 0) ordered[i].shift = 12;
    }
  } else {
    for (let i = ordered.length - 2; i >= 0; i -= 1) {
      if (ordered[i + 1].degree - ordered[i].degree <= 1 && ordered[i + 1].shift === 0) ordered[i].shift = 12;
    }
  }
}

function drawNote(parent, note, showLetters, lyricY) {
  const offset = (note.clef === BASS_CLEF ? BASS_OFFSET : 0) + STAFF_PAD;
  const { x, y } = note;
  const spec = HEADS[note.kind];
  const ledgerExtend = note.half + 0.4 * SPACE;
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
  const head = musicText(parent, spec.char, x - note.half, y);
  if (Math.abs(note.dur - 3) < 0.05 || Math.abs(note.dur - 1.5) < 0.05) {
    const onLine = note.degree % 2 === 0;
    parent.append(svgEl('circle', {
      cx: x + note.half + 6,
      cy: onLine ? y - SPACE / 2 : y,
      r: 2.2,
      fill: INK
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
    label.setAttribute('y', String(Math.min(offset + 128, (lyricY || offset + 150) - 16)));
    parent.append(label);
  }
  return { id: note.id, node: head };
}

function drawStem(parent, chord) {
  if (!chord.hasStem) return;
  const voiced = chord.notes.filter((note) => note.kind !== 'whole');
  const stemUp = chord.stemUp;
  const low = Math.max(...voiced.map((note) => note.y));
  const high = Math.min(...voiced.map((note) => note.y));
  const yStart = stemUp ? low - 0.12 * SPACE : high + 0.12 * SPACE;
  const yEnd = chord.stemEnd;
  parent.append(svgEl('line', {
    x1: chord.stemX,
    y1: yStart,
    x2: chord.stemX,
    y2: yEnd,
    stroke: INK,
    'stroke-width': 1.7,
    'stroke-linecap': 'butt'
  }));
}
