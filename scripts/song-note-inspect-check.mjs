import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hitBox,
  keyboardWindow,
  miniKeyboard,
  moveNoteFocus,
  noteInspectLabel,
  plainName,
  scientificName,
  createNotePopover
} from '../public/js/song-note.js';
import { engrave } from '../public/js/song-staff.js';
import { DIFFICULTY_IDS, notesForDifficulty } from '../public/js/song-score.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const page = read('public/songs/index.html');
const css = read('public/songs/songs.css');
const player = read('public/js/song-player.js');
const staff = read('public/js/song-staff.js');

assert(page.includes('id="note-popover"') && page.includes('role="dialog"'), 'the note popover is a dialog');
assert(page.includes('id="note-popover-close"') && page.includes('aria-label="Close"'), 'the note popover has a close button');
assert(page.includes('id="note-play"'), 'the note popover can play the pitch again');
assert(!page.includes('onclick=') && !page.includes('onkeydown='), 'the song page has no inline handlers');
assert(css.includes('.note-hit') && css.includes('cursor: pointer'), 'noteheads show a pointer');
assert(css.includes('max-width: 720px') && css.includes('bottom: 0'), 'narrow screens keep the popover on screen');
assert(css.includes('#ffdc63') && css.includes('#f1aec0'), 'the highlighted key uses the hand colors');
assert(player.includes("sheetMount.addEventListener('click'"), 'staff clicks are delegated');
assert(player.includes('openNoteInspect') && player.includes('pauseTransport()'), 'opening a note can pause playback');
assert(player.includes("ui.noteClose.addEventListener('click'") && player.includes('notePopover.onPointer') && player.includes('notePopover.onKeydown'), 'close, outside click, and escape are wired');
assert(!staff.includes('addEventListener'), 'the staff does not attach a listener per note');
assert(staff.includes("class: 'note-hit'") && staff.includes('noteInspectLabel(note)') && staff.includes('tabindex'), 'each notehead is an interactive target');
const sync = staff.slice(staff.indexOf('function sync('), staff.indexOf('function sync(') + 900);
assert(!sync.includes('hitBox') && !sync.includes('getBoundingClientRect') && !sync.includes('sizeHits'), 'playback frames do not resize hit targets');
assert(read('scripts/static-checks.mjs').includes('song-note-inspect-check.mjs'), 'static checks run this audit');

assert(scientificName(60) === 'C4' && scientificName(64) === 'E4' && scientificName(55) === 'G3', 'scientific names include the octave');
assert(plainName(64) === 'E above middle C' && plainName(60) === 'middle C', 'plain language sits around middle C');
assert(noteInspectLabel({ pitch: 64, hand: 'rh', clef: 'treble' }) === 'E4, right hand, treble staff', 'the accessible name names pitch, hand, and staff');
assert(noteInspectLabel({ pitch: 55, hand: 'lh', clef: 'bass' }) === 'G3, left hand, bass staff', 'a bass note names the left hand');

const windowed = keyboardWindow(64);
assert(windowed.low <= 64 && windowed.high >= 64, 'the mini keyboard contains the note');
assert(windowed.high - windowed.low >= 12 && windowed.high - windowed.low <= 24, 'the mini keyboard is one to two octaves');
assert(windowed.keys.some((key) => key.labelC), 'the mini keyboard labels a C');
const chordKeys = miniKeyboard(64, [64, 67]);
assert(chordKeys.keys.some((key) => key.pitch === 64 && key.active), 'the clicked pitch is the active key');
assert(chordKeys.keys.some((key) => key.pitch === 67 && key.chord && !key.active), 'the rest of the chord is marked beside the clicked note');

const files = readdirSync(join(root, 'public/songs/catalog')).filter((name) => name.endsWith('.json')).sort();
assert(files.length === 20, 'all twenty songs are checked');
let targets = 0;
for (const file of files) {
  const score = JSON.parse(read(`public/songs/catalog/${file}`));
  for (const difficulty of DIFFICULTY_IDS) {
    const notes = notesForDifficulty(score, difficulty);
    const grand = notes.some((note) => note.hand === 'lh');
    const layout = engrave(notes, { beatsPerBar: score.timeSignature[0], grand, lyrics: score.lyrics });
    assert(layout.notes.length === notes.length, `${score.id} ${difficulty} engraves every note`);
    for (const note of layout.notes) {
      const expectedClef = grand && note.hand === 'lh' ? 'bass' : 'treble';
      assert(note.clef === expectedClef, `${score.id} ${note.id} keeps its staff`);
      const label = noteInspectLabel(note);
      assert(label === `${scientificName(note.pitch)}, ${note.hand === 'lh' ? 'left hand' : 'right hand'}, ${expectedClef} staff`, `${score.id} ${label} is the pitch label`);
      const box = hitBox(note, 1);
      const touch = hitBox(note, 1, { touch: true });
      assert(box.width >= 24 && box.height >= 24, `${score.id} hit target is at least 24px`);
      assert(touch.width >= 44 && touch.height >= 44, `${score.id} touch target is at least 44px`);
      const keys = keyboardWindow(note.pitch);
      assert(keys.keys.some((key) => key.pitch === note.pitch) && keys.keys.some((key) => key.labelC), `${score.id} ${label} has a keyboard with C`);
      targets += 1;
    }
  }
}

const a = { id: 'a' };
const b = { id: 'b' };
const c = { id: 'c' };
assert(moveNoteFocus([a, b, c], a, 'ArrowRight') === b, 'arrow moves to the next note');
assert(moveNoteFocus([a, b, c], b, 'ArrowLeft') === a, 'arrow moves to the previous note');
assert(moveNoteFocus([a, b, c], c, 'Home') === a, 'home returns to the first note');

let closed = 0;
let focused = null;
const back = { focus() { focused = back; } };
const pop = { hidden: false, contains(node) { return Boolean(node && node.inside); } };
const dialog = createNotePopover({
  root: pop,
  onClose() {
    closed += 1;
    pop.hidden = true;
  }
});
dialog.remember(back);
dialog.close();
assert(closed === 1 && focused === back && pop.hidden, 'the close button closes and returns focus');

pop.hidden = false;
dialog.remember(back);
let prevented = false;
const escaped = dialog.onKeydown({ key: 'Escape', preventDefault() { prevented = true; } });
assert(escaped && closed === 2 && prevented && focused === back, 'escape closes the popover');

pop.hidden = false;
dialog.onPointer({ target: { inside: true, closest() { return null; } } });
assert(closed === 2, 'a click inside the popover stays open');
dialog.onPointer({ target: { closest(sel) { return sel === '.note-hit' ? {} : null; } } });
assert(closed === 2, 'a click on another note does not close through the outside path');
const outside = dialog.onPointer({ target: { closest() { return null; } } });
assert(outside && closed === 3, 'a click outside closes the popover');
pop.hidden = true;
assert(dialog.onKeydown({ key: 'Escape', preventDefault() {} }) === false, 'escape does nothing once the popover is closed');

console.log(`song note inspect checks passed (${files.length} songs, ${targets} noteheads)`);
