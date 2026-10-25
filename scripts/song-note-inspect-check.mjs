import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chordMates,
  hitBox,
  keyboardWindow,
  miniKeyboard,
  moveNoteFocus,
  noteInspectLabel,
  plainName,
  playedWith,
  scientificName,
  createNotePopover
} from '../public/js/song-note.js';
import { engrave } from '../public/js/song-staff.js';
import { DIFFICULTY_IDS, SONG_CATALOG, notesForDifficulty, songTitle } from '../public/js/song-score.js';

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
assert(windowed.keys.find((key) => key.pitch === 60)?.cLabel === 'C4', 'middle C is labeled C4');
assert(windowed.keys.filter((key) => key.labelC).every((key) => key.cLabel === scientificName(key.pitch)), 'every C keeps its octave');
const g3 = keyboardWindow(55);
assert(g3.keys.find((key) => key.pitch === 48)?.cLabel === 'C3' && g3.keys.find((key) => key.pitch === 60)?.cLabel === 'C4', 'G3 sits between a labeled C3 and C4');
assert(Math.abs((g3.low + g3.high) / 2 - 55) <= 1, 'G3 is centered in the mini keyboard');
const chordKeys = miniKeyboard(55, [55, 59]);
const strong = chordKeys.keys.filter((key) => key.active);
assert(strong.length === 1 && strong[0].pitch === 55, 'only the clicked pitch is the strong key');
assert(chordKeys.keys.some((key) => key.pitch === 59 && key.chord && !key.active), 'the same-hand mate is secondary');
assert(chordKeys.keys.some((key) => key.pitch === 67) && !chordKeys.keys.find((key) => key.pitch === 67).active && !chordKeys.keys.find((key) => key.pitch === 67).chord, 'a pitch outside the mate list stays dark');
assert(playedWith(55, [55, 59]) === 'Played with B3', 'the popover names the chord mate');
assert(css.includes('inset 0 0 0 2px #f1aec0') && !css.includes('.note-mini-black.is-chord.is-lh { background: #f1aec0'), 'chord mates are an outline, not a second solid key');
assert(staff.includes("note.hand === 'lh' ? '#f1aec0' : '#ffdc63'"), 'the current note uses the hand color');
assert(page.includes('id="icon-click"') && page.includes('href="#icon-click"') && page.includes('id="click-mute"'), 'the click toggle has a metronome icon');
assert(css.includes('#sound-toggle,\n#click-mute {\n  padding: 0 14px;\n  background: transparent;\n  color: #fffdf8;'), 'the click toggle uses the sound pill');
assert(player.includes("clickIsMuted ? 'Click off' : 'Click on'") && player.includes("ui.clickMute.querySelector('span')") && !player.includes('Click muted'), 'the click toggle says on or off and keeps its icon');
assert(player.includes('chordMates'), 'the player lights same-hand mates only');

const files = readdirSync(join(root, 'public/songs/catalog')).filter((name) => name.endsWith('.json')).sort();
assert(files.length === 20, 'all twenty songs are checked');
assert(!page.includes('id="song-title">Mary Had a Little Lamb'), 'the page does not paint Mary before the requested song');
assert(page.includes('src="/js/song-title.js"'), 'a small script sets the title as the heading is parsed');
assert(player.includes('function applyInitialTitle()') && player.indexOf('applyInitialTitle();') < player.indexOf('async function loadSongs'), 'the requested title is set before the catalog fetch');
const titleJs = read('public/js/song-title.js');
for (const item of SONG_CATALOG) {
  const score = JSON.parse(read(`public/songs/catalog/${item.file}`));
  assert(songTitle(item.id) === score.title, `${item.id} title is ready before the file loads`);
  assert(titleJs.includes(score.title), `${item.id} title is in the early heading script`);
}
assert(songTitle('hot-cross-buns') === 'Hot Cross Buns' && songTitle('nope') === '', 'a deep link resolves only a known song');
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
      const mates = chordMates(layout.notes, note);
      const board = miniKeyboard(note.pitch, mates);
      const litStrong = board.keys.filter((key) => key.active);
      assert(litStrong.length === 1 && litStrong[0].pitch === note.pitch, `${score.id} ${label} strong key is that pitch`);
      const allowed = new Set(mates);
      for (const key of board.keys) {
        if (key.active || key.chord) assert(allowed.has(key.pitch), `${score.id} ${label} lights ${key.name}, which is not in the chord`);
      }
      for (const mate of mates) {
        const key = board.keys.find((item) => item.pitch === mate);
        if (!key) continue;
        assert(key.active || key.chord, `${score.id} ${label} leaves chord pitch ${mate} dark`);
      }
      const at = board.keys.findIndex((key) => key.pitch === note.pitch);
      assert(at >= 4 && at <= board.keys.length - 5, `${score.id} ${label} is centered, not on the rim`);
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
