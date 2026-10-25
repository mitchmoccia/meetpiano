import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIFFICULTY_IDS,
  RESULT_COPY,
  SONG_CATALOG,
  VIEW_IDS,
  VIEW_LABELS,
  armWait,
  changeView,
  createTake,
  defaultsFor,
  gradeTake,
  judgePitch,
  autoOctaves,
  pitchesForKeyboard,
  loopFromBars,
  missesByBar,
  notesForDifficulty,
  rangeCovering,
  rampedBpm,
  rememberBest,
  rewindLoop,
  rollLandingY,
  scoreLength,
  sheetCursorX,
  stepTake,
  validateScore
} from '../public/js/song-score.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const catalogDir = join(root, 'public/songs/catalog');
const files = readdirSync(catalogDir).filter((name) => name.endsWith('.json')).sort();
assert(files.join() === SONG_CATALOG.map((item) => item.file).sort().join(), 'catalog files match SONG_CATALOG');

const scores = files.map((file) => {
  const score = JSON.parse(read(`public/songs/catalog/${file}`));
  const errors = validateScore(score);
  assert(errors.length === 0, `${file} invalid: ${errors.join(' ')}`);
  assert(score.id === file.replace(/\.json$/, ''), `${file} id matches filename`);
  assert(SONG_CATALOG.some((item) => item.id === score.id), `${score.id} is in the catalog`);
  for (const difficulty of DIFFICULTY_IDS) {
    const notes = notesForDifficulty(score, difficulty);
    assert(notes.length > 0, `${score.id} ${difficulty} has notes`);
    for (const note of notes) {
      assert(note.beat >= 0 && note.dur > 0, `${score.id} timing stays positive`);
      assert(note.beat + note.dur <= scoreLength(score.notes) + 1e-6, `${score.id} note stays inside the song`);
    }
  }
  const noob = notesForDifficulty(score, 'noob');
  const pro = notesForDifficulty(score, 'pro');
  const expert = notesForDifficulty(score, 'expert');
  assert(pro.length > noob.length && expert.length > pro.length, `${score.id} difficulties build on each other`);
  for (const note of noob) {
    assert(pro.some((item) => item.pitch === note.pitch && item.beat === note.beat), `${score.id} Pro keeps the Noob melody`);
  }
  return score;
});

assert(scores.length === 20, 'twenty public-domain songs are in the catalog');
const titles = new Set(scores.map((score) => score.title));
assert(titles.has('Mary Had a Little Lamb') && titles.has('Ode to Joy') && titles.has('Twinkle Twinkle Little Star'), 'the three prototype tunes are present');
for (const score of scores) {
  assert(Array.isArray(score.tags) && score.tags.length > 0, `${score.id} has a style tag`);
  assert(score.provenance.publicDomain === true, `${score.id} is marked public domain`);
}

const session = changeView({ view: 'keys', cursor: 3.5 }, 'legend');
assert(session.view === 'legend' && session.cursor === 3.5, 'changing view keeps the beat');
assert(changeView(session, 'nope').cursor === 3.5, 'unknown view does not move the beat');
assert(VIEW_LABELS.legend === 'Legend mode', 'the fourth view is named Legend mode');
assert(VIEW_IDS.join() === 'keys,drop,sheet,legend', 'four views');

assert(defaultsFor('noob').waitMode === true && defaultsFor('noob').timingScored === false, 'Noob waits and does not score timing');
assert(defaultsFor('pro').waitMode === false && defaultsFor('expert').timingScored === true, 'Pro keeps tempo and Expert scores timing');

const melody = [
  { id: 'a', pitch: 64, beat: 0, dur: 1, hand: 'rh', part: 'melody' },
  { id: 'b', pitch: 62, beat: 1, dur: 1, hand: 'rh', part: 'melody' }
];
const waiting = createTake(melody, 2);
waiting.running = true;
const held = stepTake(waiting, 1, { waitMode: true, lateBeats: 0.5 });
assert(held.waiting && waiting.cursor === 0, 'wait mode pauses on the note');
const wrong = judgePitch(waiting, 60, { difficulty: 'noob', bpm: 96, waitMode: true });
assert(wrong.judged && wrong.hit === false && waiting.waiting === true, 'a wrong pitch does not release wait mode');
const right = judgePitch(waiting, 64, { difficulty: 'noob', bpm: 96, waitMode: true });
assert(right.hit && waiting.waiting === false, 'the correct pitch releases wait mode');
const next = stepTake(waiting, 1, { waitMode: true, lateBeats: 0.5 });
assert(next.waiting && waiting.cursor === 1, 'wait mode stops on the following note');

const flowing = createTake(melody, 2);
flowing.running = true;
stepTake(flowing, 1.2, { waitMode: false, lateBeats: 0.4 });
assert(flowing.notes[0].status === 'missed', 'a missed window is marked missed');
assert(flowing.notes[1].status === 'pending', 'a future note is still waiting');

const perfect = createTake(melody, 2);
perfect.notes.forEach((note) => { note.status = 'hit'; });
perfect.maxCombo = 2;
perfect.ended = true;
perfect.timingSum = 2;
perfect.timingCount = 2;
assert(gradeTake(perfect, 'noob').letter === 'S', 'a clean Noob run is S');
perfect.notes.forEach((note) => { note.status = 'missed'; });
perfect.misses = 3;
assert(gradeTake(perfect, 'noob').letter === 'C', 'misses land on C');

const expert = createTake(melody, 2);
expert.notes.forEach((note) => { note.status = 'hit'; });
expert.maxCombo = 2;
expert.ended = true;
expert.timingSum = 1.4;
expert.timingCount = 2;
assert(gradeTake(expert, 'expert').letter === 'A', 'solid timing on Expert is A, not a free S');

const looped = createTake(melody, 8);
looped.running = true;
looped.notes[0].status = 'hit';
looped.maxCombo = 1;
const wrap = stepTake(looped, 4, { waitMode: false, loop: { start: 0, end: 4, label: 'Phrase' }, lateBeats: 0.2 });
assert(wrap.wrapped && looped.cursor === 4, 'a loop reports the end of the range');
rememberBest(looped, gradeTake(looped, 'pro', { start: 0, end: 4 }));
rewindLoop(looped, { start: 0, end: 4 });
armWait(looped, true);
assert(looped.cursor === 0 && looped.notes[0].status === 'pending', 'loop rewind keeps the phrase playable');
assert(looped.best?.hits === 1, 'the finished pass is remembered');

const bars = loopFromBars(1, 2, 4, 16);
assert(bars.loop.start === 0 && bars.loop.end === 8, 'bar numbers become beats');
assert(loopFromBars(3, 1, 4, 16).error, 'a backwards bar range is rejected');
assert(rampedBpm(100, 0, { ramp: true, rampBeats: 8 }) === 75, 'ease-in starts at 75%');
assert(rampedBpm(100, 8, { ramp: true, rampBeats: 8 }) === 100, 'ease-in reaches the chosen tempo');
assert(rollLandingY(4, 4, 200, 80) === 200, 'a note lands on the keyboard line at its beat');
assert(sheetCursorX(4, 4, 118, 54) === 118, 'the staff cursor meets the note at the same beat');
assert(autoOctaves(1440) === 4 && autoOctaves(1000) === 3 && autoOctaves(390) === 0, 'wide screens default to more octaves');
const phoneNotes = [{ pitch: 48, hand: 'lh', part: 'bass' }, { pitch: 60, hand: 'rh', part: 'melody' }, { pitch: 64, hand: 'rh', part: 'melody' }];
const phoneNoob = pitchesForKeyboard(phoneNotes, { difficulty: 'noob', narrow: true, fit: true });
assert(!phoneNoob.includes(48) && phoneNoob.includes(60), 'narrow Noob fit hides the low left-hand octave');
const phonePro = pitchesForKeyboard(phoneNotes, { difficulty: 'pro', narrow: true, fit: true });
assert(phonePro.includes(48) && phonePro.includes(60), 'narrow Pro fit keeps the left hand so the keyboard can scroll to it');
const deskNoob = pitchesForKeyboard(phoneNotes, { difficulty: 'noob', narrow: false, fit: true });
assert(deskNoob.includes(48), 'a wide Noob keyboard still includes the whole song');
const fitted = rangeCovering([64, 67, 60], 0);
assert(fitted.from <= 60 && fitted.to >= 67, 'fit covers the song');
const wide = rangeCovering([60, 64], 4);
assert(wide.to - wide.from >= 48 && wide.from <= 60 && wide.to >= 64, 'four octaves still cover the song');
const extended = rangeCovering([48, 84], 2);
assert(extended.from <= 48 && extended.to >= 84, 'the song range extends the window');
const missed = missesByBar([{ beat: 0, status: 'missed' }, { beat: 4, status: 'missed' }, { beat: 5, status: 'hit' }], 4);
assert(missed.length === 2 && missed[0].bar === 1 && missed[1].count === 1, 'misses group by bar');
assert(RESULT_COPY.S && RESULT_COPY.A && RESULT_COPY.B && RESULT_COPY.C, 'results have S A B C copy');

const page = read('public/songs/index.html');
const css = read('public/songs/songs.css');
const player = read('public/js/song-player.js');
const learn = read('public/learn/index.html');
const hub = read('public/js/learn-view.js');
const surface = [page, css, player, learn, hub, read('public/js/song-score.js'), read('public/js/song-staff.js'), read('public/js/song-roll.js')].join('\n');
assert(!/\bgod\s*mode\b/i.test(surface), 'the player never says God mode');
assert(page.includes('Legend mode'), 'the song page names Legend mode');
assert(page.includes('Connect a MIDI keyboard'), 'the song page offers a neutral MIDI connection');
assert(!page.includes('not claimed as verified') && !player.includes('not claimed as verified'), 'the song page does not deny a tested keyboard');
assert(page.includes('>Noob<') && page.includes('>Pro<') && page.includes('>Expert<'), 'all three difficulties are on the page');
assert(page.includes('role="radiogroup"') && page.includes('role="tablist"'), 'song and view controls are keyboard groups');
assert(page.includes('id="piano"') && page.includes('Wait for me'), 'keyboard and wait mode are present');
assert(css.includes('prefers-reduced-motion') && css.includes('max-width: 720px'), 'motion and narrow screens are covered');
const staff = read('public/js/song-staff.js');
assert(staff.includes('\\uE050') && staff.includes('MeetPiano Music'), 'the treble clef is the self-hosted SMuFL G clef');
assert(staff.includes('\\uE062'), 'the bass clef is the SMuFL F clef');
assert(staff.includes('BARLINE_INSET') && staff.includes('\\uE000'), 'barlines sit before the downbeat and the grand staff uses a brace');
assert(!staff.includes('M40 ${98'), 'the hand-drawn treble clef is gone');
assert(css.includes('U+E000'), 'the music font includes the system brace');
assert(css.includes('meetpiano-music.woff2') && css.includes('OFL'), 'the music font is self-hosted under the OFL');
assert(read('public/js/song-score.js').includes('Right hand') && read('public/js/song-score.js').includes('Left hand'), 'the note label names the hand and the pitch');
assert(player.includes('handCaption') && !player.includes('· key'), 'the player groups one label per hand');
assert(player.includes('function paintAt(cursor)'), 'one cursor paints the views');
const paint = player.slice(player.indexOf('function paintAt(cursor)'), player.indexOf('function paintAt(cursor)') + 400);
assert(paint.includes('staffView.sync(cursor') && paint.includes('rollView.sync(cursor') && paint.includes('lightKeyboard(cursor'), 'sheet, falling notes, and keys share that cursor');
assert(player.includes('meetpiano:song-player'), 'preferences stay on this device');
assert(!/analytics|gtag|sentry|mixpanel/i.test(player), 'the song player adds no tracker');
assert(learn.includes('href="/songs/"'), 'Learn links to the song player');
assert(hub.includes('id: \'song-player-entry\'') || hub.includes("id: 'song-player-entry'"), 'the journey hub has a song entry');
assert(hub.includes('L01–L24') || hub.includes('twenty-four'), 'the hub still describes the lesson journey');
assert(read('next.config.ts').includes("destination: '/songs/index.html'"), 'Next serves the song page');
assert(read('scripts/static-checks.mjs').includes('song-score-check.mjs'), 'static checks run this script');
assert(read('scripts/static-checks.mjs').includes('song-notation-check.mjs'), 'static checks run the notation audit');
assert(read('scripts/static-checks.mjs').includes('song-results-check.mjs'), 'static checks run the results dialog audit');
assert(read('scripts/static-checks.mjs').includes('song-note-inspect-check.mjs'), 'static checks run the note inspect audit');

const banned = ['skibidi', 'rizz', 'gyatt', 'brainrot', 'stupid', 'dumb', 'hate'];
for (const word of banned) assert(!surface.toLowerCase().includes(word), `copy avoids ${word}`);

console.log(`song score checks passed (${scores.length} songs)`);
