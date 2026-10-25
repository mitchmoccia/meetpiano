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
    const layout = engrave(notes, { beatsPerBar, grand });
    checked += 1;
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
