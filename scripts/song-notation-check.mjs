import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { engrave } from '../public/js/song-staff.js';
import { DIFFICULTY_IDS, handCaption, notesForDifficulty } from '../public/js/song-score.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(join(root, 'public/songs/catalog')).filter((name) => name.endsWith('.json')).sort();
let checked = 0;

for (const file of files) {
  const score = JSON.parse(readFileSync(join(root, 'public/songs/catalog', file), 'utf8'));
  const beatsPerBar = score.timeSignature[0];
  for (const difficulty of DIFFICULTY_IDS) {
    const notes = notesForDifficulty(score, difficulty);
    const grand = notes.some((note) => note.hand === 'lh');
    const layout = engrave(notes, { beatsPerBar, grand, lyrics: score.lyrics });
    checked += 1;
    if (grand) {
      const gap = layout.metrics.gap;
      const space = layout.metrics.space;
      assert(gap >= 8 * space - 0.01 && gap <= 10 * space + 0.01, `${score.id} ${difficulty} staff gap is ${gap}px`);
    }
    const beatGroups = new Map();
    for (const chord of layout.chords) {
      const key = `${chord.clef}:${Math.round(chord.beat * 1000)}`;
      if (!beatGroups.has(key)) beatGroups.set(key, []);
      beatGroups.get(key).push(chord);
    }
    for (const group of beatGroups.values()) {
      const ranked = [...group].sort((a, b) => averageDegree(b.notes) - averageDegree(a.notes) || a.dur - b.dur);
      const multi = ranked.length > 1;
      for (const chord of ranked) {
        const where = `${score.id} ${difficulty} ${chord.clef} beat ${chord.beat}`;
        const needsStem = chord.notes.some((note) => note.kind !== 'whole');
        assert(Boolean(chord.hasStem) === needsStem, `${where} stem missing on a half, quarter, or eighth`);
        if (!needsStem) {
          assert(!chord.stemLength, `${where} whole note has a stem`);
          continue;
        }
        assert(chord.stemLength >= 3.5 - 0.05, `${where} stem is ${chord.stemLength} spaces`);
        const side = chord.stemUp ? 1 : -1;
        const attached = chord.notes.some((note) => Math.abs(chord.stemX - (note.x + side * note.half)) < 1.5);
        assert(attached, `${where} stem is on the wrong side of the notehead`);
        if (chord.beam) {
          const mates = layout.chords.filter((other) => other.beam === chord.beam);
          const expected = stemUpFor(mates.flatMap((other) => other.notes));
          assert(chord.stemUp === expected, `${where} beam stems the wrong way`);
        } else if (multi) {
          const index = ranked.indexOf(chord);
          assert(chord.stemUp === (index === 0), `${where} voice ${index + 1} stem direction`);
        } else {
          assert(chord.stemUp === stemUpFor(chord.notes), `${where} stem direction`);
        }
      }
    }
    for (const lyric of layout.lyrics) {
      const width = Math.max(8, lyric.text.length * 7.4);
      const left = lyric.x;
      const right = lyric.x + width;
      const top = lyric.y - 13;
      const bottom = lyric.y + 3;
      for (const note of layout.notes) {
        const nx1 = note.x - note.half;
        const nx2 = note.x + note.half;
        const ny1 = note.y - 0.55 * layout.metrics.space;
        const ny2 = note.y + 0.4 * layout.metrics.space;
        const overlap = nx1 < right && nx2 > left && ny1 < bottom && ny2 > top;
        assert(!overlap, `${score.id} ${difficulty} lyric “${lyric.text}” hits a notehead`);
      }
    }
    for (const note of layout.notes) {
      const where = `${score.id} ${difficulty} beat ${note.beat} ${note.hand}`;
      if (note.hand === 'lh') assert(note.clef === 'bass', `${where} is not on the bass staff`);
      if (note.hand === 'rh') assert(note.clef === 'treble', `${where} is not on the treble staff`);
      assert(note.ledgerCount <= 2, `${where} needs ${note.ledgerCount} ledger lines`);
      for (const line of layout.barlines) {
        const left = note.x - note.half;
        const right = note.x + note.half;
        assert(right <= line.x - 0.5 || left >= line.x + 0.5, `${where} notehead overlaps a barline`);
      }
    }
    const eighths = layout.notes.filter((note) => note.dur < 0.75);
    for (const note of eighths) {
      const mates = eighths.filter((other) => other.beam && other.beam === note.beam);
      assert(note.beam && mates.length >= 2, `${score.id} ${difficulty} eighth at beat ${note.beat} is not beamed`);
    }
    if (difficulty === 'noob') {
      assert(notes.every((note) => note.hand === 'rh'), `${score.id} Noob is right hand only`);
      assert(layout.notes.every((note) => note.clef === 'treble'), `${score.id} Noob stays on the treble staff`);
    }
  }
}

const caption = handCaption([
  { hand: 'rh', pitch: 67 },
  { hand: 'lh', pitch: 67 },
  { hand: 'lh', pitch: 71 }
]);
assert(caption.join('  ') === 'Right hand · G  Left hand · G B', `hand labels group a chord, got ${caption.join(' | ')}`);

console.log(`song notation checks passed (${files.length} songs, ${checked} parts)`);

function averageDegree(notes) {
  return notes.reduce((sum, note) => sum + note.degree, 0) / notes.length;
}

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
