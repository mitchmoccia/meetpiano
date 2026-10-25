import { createAudio } from './audio.js';
import { bindInputs } from './input.js';
import { clearPressed, computerHelpFor, computerKeysForRange, renderPiano, setKeyCaptions, setPressed } from './piano.js';
import { createRollView, measureKeyCenters } from './song-roll.js';
import {
  DIFFICULTY_COPY,
  SONG_CATALOG,
  VIEW_COPY,
  armWait,
  beatsPerBarOf,
  changeView,
  createTake,
  defaultsFor,
  gradeTake,
  judgePitch,
  lyricAt,
  loopFromBars,
  missCopy,
  notesForDifficulty,
  pitchName,
  positionLabel,
  rampedBpm,
  rememberBest,
  rewindLoop,
  scoreLength,
  stepTake,
  validateScore,
  windowsFor
} from './song-score.js';
import { createStaffView } from './song-staff.js';

const FROM = 48;
const TO = 72;
const PREFS = 'meetpiano:song-player';
const COMPUTER = computerKeysForRange(FROM, TO, 'both');

const audio = createAudio();
const piano = document.querySelector('#piano');
const sheetMount = document.querySelector('#sheet');
const roll = document.querySelector('#roll');
const stage = document.querySelector('#stage');
const feedback = document.querySelector('#feedback');
const staffView = createStaffView(sheetMount);
const rollView = createRollView(roll);

const ui = {
  play: document.querySelector('#play-button'),
  hear: document.querySelector('#hear-button'),
  restart: document.querySelector('#restart-button'),
  finish: document.querySelector('#finish-button'),
  wait: document.querySelector('#wait-button'),
  tempo: document.querySelector('#tempo'),
  tempoReadout: document.querySelector('#tempo-readout'),
  ramp: document.querySelector('#ramp'),
  phrases: document.querySelector('#phrase-row'),
  barFrom: document.querySelector('#bar-from'),
  barTo: document.querySelector('#bar-to'),
  title: document.querySelector('#song-title'),
  waitBanner: document.querySelector('#wait-banner'),
  meta: document.querySelector('#song-meta'),
  provenance: document.querySelector('#provenance-body'),
  difficultyCopy: document.querySelector('#difficulty-copy'),
  viewCopy: document.querySelector('#view-copy'),
  position: document.querySelector('#position'),
  streak: document.querySelector('#streak'),
  lyric: document.querySelector('#lyric'),
  now: document.querySelector('#now-card'),
  keyHelp: document.querySelector('#key-help'),
  sound: document.querySelector('#sound-toggle'),
  midiButton: document.querySelector('#midi-button'),
  midiLabel: document.querySelector('#midi-button-label'),
  midiStatus: document.querySelector('#midi-status'),
  midiDevices: document.querySelector('#midi-devices'),
  results: document.querySelector('#results'),
  resultsLetter: document.querySelector('#results-letter'),
  resultsTitle: document.querySelector('#results-title'),
  resultsCopy: document.querySelector('#results-copy'),
  resultsStats: document.querySelector('#results-stats'),
  resultsAgain: document.querySelector('#results-again')
};

let songs = [];
let score = null;
let difficulty = 'noob';
let waitOn = true;
let tempoPct = 100;
let ramp = false;
let loop = null;
let session = { view: 'keys', cursor: 0 };
let take = createTake([], 0);
let mode = 'idle';
let afterCount = 'play';
let countStarted = 0;
let countBeats = 4;
let audition = null;
let raf = 0;
let lastTs = 0;
let keyCenters = { map: new Map(), black: new Set(), whiteWidth: 28 };
let lastAnnounce = '';
let lastCaption = '';

renderPiano(piano, { from: FROM, to: TO });
ui.keyHelp.textContent = `On-screen keys are a stand-in. ${computerHelpFor({ from: FROM, to: TO, octaveSpan: 2 })}.`;

const inputs = bindInputs({
  pianoRoot: piano,
  audio,
  shell: stage,
  getComputerKeys: () => COMPUTER,
  isDemoPlaying: () => mode === 'audition',
  onUserNote(pitch) {
    if (mode !== 'play' || !take.running) return;
    const result = judgePitch(take, pitch, { difficulty, bpm: currentBpm(), waitMode: waitOn });
    if (!result.judged) return;
    if (result.hit) {
      if (result.combo > 0 && result.combo % 5 === 0) announce(`${result.combo} in a row.`);
      else if (take.waiting) announce(waitMessage());
    } else {
      announce(missCopy(result.expected, pitch));
    }
    ui.finish.disabled = !take.notes.some((note) => note.status === 'hit');
    paintAt(displayCursor());
  },
  onMidiStatus(view) {
    if (ui.midiStatus && view?.status) ui.midiStatus.textContent = view.status;
    if (ui.midiLabel && view?.buttonLabel) {
      ui.midiLabel.textContent = view.kind === 'idle' ? 'Connect a MIDI keyboard' : view.buttonLabel;
    }
    if (!ui.midiDevices || !view) return;
    ui.midiDevices.replaceChildren();
    ui.midiDevices.hidden = !view.devices?.length;
    for (const device of view.devices || []) {
      const item = document.createElement('li');
      item.textContent = device.manufacturer ? `${device.name} · ${device.manufacturer}` : device.name;
      ui.midiDevices.append(item);
    }
  }
});

ui.midiButton.addEventListener('click', () => {
  inputs.requestMidi(ui.midiStatus, ui.midiLabel, ui.midiDevices);
});
ui.sound.addEventListener('click', () => {
  const muted = !audio.isMuted();
  audio.setMuted(muted);
  ui.sound.setAttribute('aria-pressed', muted ? 'true' : 'false');
  ui.sound.querySelector('span').textContent = muted ? 'Sound off' : 'Sound on';
});

bindChoice('[data-song]', (button) => selectSong(button.dataset.song));
bindChoice('[data-difficulty]', (button) => selectDifficulty(button.dataset.difficulty));
document.querySelectorAll('[data-view]').forEach((button, index, list) => {
  button.addEventListener('click', () => selectView(button.dataset.view));
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = event.key === 'ArrowRight' ? (index + 1) % list.length : (index - 1 + list.length) % list.length;
    selectView(list[next].dataset.view);
    list[next].focus();
  });
});

ui.play.addEventListener('click', () => {
  if (mode === 'play' || mode === 'countin' || mode === 'audition') pauseTransport();
  else startPlay();
});
ui.hear.addEventListener('click', () => {
  if (mode === 'audition') pauseTransport();
  else startAudition();
});
ui.restart.addEventListener('click', () => restartTake());
ui.finish.addEventListener('click', () => showResults());
ui.resultsAgain.addEventListener('click', () => {
  hideResults();
  restartTake();
});
ui.wait.addEventListener('click', () => {
  waitOn = !waitOn;
  ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
  if (waitOn) armWait(take, true);
  else take.waiting = false;
  announce(waitOn ? 'Wait for me is on.' : 'Full tempo. Wait for me is off.');
  savePrefs();
  paintAt(displayCursor());
});
ui.tempo.addEventListener('input', () => {
  tempoPct = Number(ui.tempo.value);
  paintTempo();
  savePrefs();
});
ui.ramp.addEventListener('change', () => {
  ramp = ui.ramp.checked;
  savePrefs();
});
document.querySelector('#loop-bars').addEventListener('click', () => {
  if (!score) return;
  const result = loopFromBars(Number(ui.barFrom.value), Number(ui.barTo.value), beatsPerBarOf(score), scoreLength(score.notes));
  if (result.error) announce(result.error);
  else setLoop(result.loop);
});
document.querySelector('#loop-clear').addEventListener('click', () => setLoop(null));

window.addEventListener('resize', () => paintAt(displayCursor()));

loadSongs();

async function loadSongs() {
  try {
    const [loaded] = await Promise.all([
      Promise.all(SONG_CATALOG.map(async (item) => {
        const response = await fetch(`/songs/catalog/${item.file}`);
        if (!response.ok) throw new Error(item.id);
        return response.json();
      })),
      document.fonts.load('56px "MeetPiano Music"').catch(() => [])
    ]);
    const problems = loaded.flatMap((item) => validateScore(item).map((error) => `${item.title}: ${error}`));
    if (problems.length) {
      announce('A song file needs a fix before it can play.');
      return;
    }
    songs = loaded;
    const prefs = readPrefs();
    if (prefs?.view) session = changeView(session, prefs.view);
    if (prefs?.difficulty) difficulty = prefs.difficulty;
    if (Number.isFinite(prefs?.tempoPct)) tempoPct = clamp(prefs.tempoPct, 50, 120);
    if (typeof prefs?.waitMode === 'boolean') waitOn = prefs.waitMode;
    ramp = Boolean(prefs?.ramp);
    ui.tempo.value = String(tempoPct);
    ui.ramp.checked = ramp;
    ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
    selectSong(prefs?.songId || songs[0].id, { keepPractice: true });
  } catch {
    announce('The songs could not load. First Piano Journey on Learn still works.');
  }
}

function selectSong(id, { keepPractice = false } = {}) {
  const next = songs.find((item) => item.id === id);
  if (!next) return;
  stopTransport();
  score = next;
  if (!keepPractice) {
    waitOn = defaultsFor(difficulty).waitMode;
    ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
  }
  document.querySelectorAll('[data-song]').forEach((button) => {
    const on = button.dataset.song === id;
    button.setAttribute('aria-checked', on ? 'true' : 'false');
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (ui.title) ui.title.textContent = score.title;
  ui.meta.textContent = `${score.key} major · ${score.timeSignature[0]}/${score.timeSignature[1]}`;
  const years = score.provenance.lyricPublicationYear
    ? `${score.provenance.publicationYear} (words ${score.provenance.lyricPublicationYear})`
    : String(score.provenance.publicationYear);
  ui.provenance.textContent = `${score.provenance.source} Publication year: ${years}. ${score.provenance.arrangement}`;
  document.title = `${score.title} · Songs · MeetPiano`;
  const bars = Math.ceil(scoreLength(score.notes) / beatsPerBarOf(score));
  ui.barFrom.max = String(bars);
  ui.barTo.max = String(bars);
  ui.barTo.value = String(Math.min(2, bars));
  renderPhrases();
  applyDifficultyChrome();
  applyViewChrome();
  setLoop(null, { silent: true });
  savePrefs();
  announce(`${score.title} is ready.`);
  paintAt(take.cursor);
}

function selectDifficulty(next) {
  if (!defaultsFor(next) || !score) return;
  const cursor = take.cursor;
  difficulty = next;
  waitOn = defaultsFor(next).waitMode;
  ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
  stopTransport();
  applyDifficultyChrome();
  rebuildTake(cursor);
  savePrefs();
  announce(`${defaultsFor(next).label}. ${DIFFICULTY_COPY[next]}`);
  paintAt(take.cursor);
}

function selectView(view) {
  const next = changeView({ view: session.view, cursor: take.cursor }, view);
  session = { view: next.view, cursor: next.cursor };
  if (next.cursor !== take.cursor) take.cursor = next.cursor;
  applyViewChrome();
  savePrefs();
  paintAt(displayCursor());
  requestAnimationFrame(() => paintAt(displayCursor()));
}

function applyDifficultyChrome() {
  document.querySelectorAll('[data-difficulty]').forEach((button) => {
    const on = button.dataset.difficulty === difficulty;
    button.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  ui.difficultyCopy.textContent = DIFFICULTY_COPY[difficulty];
}

function rebuildTake(cursor) {
  take = createTake(notesForDifficulty(score, difficulty), scoreLength(score.notes), cursor);
  staffView.render({
    notes: take.notes,
    lyrics: score.lyrics || [],
    beatsPerBar: beatsPerBarOf(score),
    length: take.length,
    grand: take.notes.some((note) => note.hand === 'lh'),
    showLetters: difficulty === 'noob',
    label: `${score.title} sheet music`
  });
  ui.finish.disabled = true;
}

function applyViewChrome() {
  stage.dataset.view = session.view;
  stage.classList.remove('view-keys', 'view-drop', 'view-sheet', 'view-legend');
  stage.classList.add('song-stage', `view-${session.view}`);
  const showSheet = session.view === 'sheet' || session.view === 'legend';
  const showRoll = session.view === 'drop' || session.view === 'legend';
  sheetMount.hidden = !showSheet;
  roll.hidden = !showRoll;
  document.querySelectorAll('[data-view]').forEach((button) => {
    const on = button.dataset.view === session.view;
    button.setAttribute('aria-selected', on ? 'true' : 'false');
    button.tabIndex = on ? 0 : -1;
    if (on) stage.setAttribute('aria-labelledby', button.id);
  });
  ui.viewCopy.textContent = VIEW_COPY[session.view];
}

function renderPhrases() {
  ui.phrases.replaceChildren(...score.phrases.map((phrase) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-small button-outline';
    button.textContent = phrase.label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => setLoop({ start: phrase.start, end: phrase.end, label: phrase.label }));
    return button;
  }));
}

function setLoop(next, { silent = false } = {}) {
  loop = next;
  ui.phrases.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', loop && button.textContent === loop.label ? 'true' : 'false');
  });
  if (!score) return;
  stopTransport();
  hideResults();
  rebuildTake(loop ? loop.start : 0);
  if (!silent) announce(loop ? `Looping ${loop.label}.` : 'Whole song.');
  paintAt(take.cursor);
}

function startPlay() {
  if (!score) return;
  hideResults();
  inputs.silence();
  if (waitOn) {
    mode = 'play';
    take.running = true;
    armWait(take, true);
    setPlayState(true);
    lastTs = performance.now();
    announce(waitMessage());
    paintAt(take.cursor);
    raf = requestAnimationFrame(frame);
    return;
  }
  beginCount('play');
}

function startAudition() {
  if (!score) return;
  hideResults();
  stopTransport();
  const from = loop ? loop.start : 0;
  const to = loop ? loop.end : take.length;
  audition = { from, to, cursor: from, fired: new Set() };
  inputs.silence();
  if (waitOn) {
    mode = 'audition';
    setPlayState(true);
    setHearState(true);
    lastTs = performance.now();
    audio.resume();
    raf = requestAnimationFrame(frame);
    return;
  }
  beginCount('audition');
}

function beginCount(nextMode) {
  afterCount = nextMode;
  mode = 'countin';
  countBeats = beatsPerBarOf(score);
  countStarted = performance.now();
  setPlayState(true);
  audio.resume().then(() => {
    const t0 = audio.currentTime();
    const beatSec = 60 / currentBpm();
    if (t0 != null) {
      for (let i = 0; i < countBeats; i += 1) audio.clickAt(t0 + i * beatSec, 'count');
    }
  });
  lastTs = performance.now();
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

function startRunning() {
  mode = 'play';
  take.running = true;
  armWait(take, waitOn);
  setPlayState(true);
  announce(waitOn ? waitMessage() : 'Here we go.');
  lastTs = performance.now();
}

function pauseTransport() {
  mode = 'idle';
  take.running = false;
  audition = null;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  inputs.silence();
  clearPressed(piano);
  setPlayState(false);
  setHearState(false);
  paintAt(take.cursor);
}

function stopTransport() {
  pauseTransport();
}

function restartTake() {
  if (!score) return;
  stopTransport();
  hideResults();
  rebuildTake(loop ? loop.start : 0);
  announce('Back to the start.');
  paintAt(take.cursor);
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  if (mode === 'countin') {
    const elapsed = ((ts - countStarted) / 1000) * (currentBpm() / 60);
    announce(`Count ${Math.min(countBeats, Math.floor(elapsed) + 1)}`);
    paintAt(take.cursor);
    if (elapsed >= countBeats) {
      if (afterCount === 'audition') {
        mode = 'audition';
        setHearState(true);
        if (!audition) {
          audition = {
            from: loop ? loop.start : 0,
            to: loop ? loop.end : take.length,
            cursor: loop ? loop.start : 0,
            fired: new Set()
          };
        }
      } else startRunning();
    }
    raf = requestAnimationFrame(frame);
    return;
  }
  if (mode === 'audition' && audition) {
    audition.cursor += dt * (currentBpm() / 60);
    for (const note of take.notes) {
      if (note.beat < audition.from || note.beat >= audition.to) continue;
      if (audition.cursor >= note.beat && !audition.fired.has(note.id)) {
        audition.fired.add(note.id);
        audio.play(note.pitch, note.hand === 'lh' ? 0.42 : 0.66);
      }
    }
    paintAt(audition.cursor);
    if (audition.cursor >= audition.to) {
      pauseTransport();
      announce('That’s the tune.');
      return;
    }
    raf = requestAnimationFrame(frame);
    return;
  }
  if (mode !== 'play') return;
  const step = stepTake(take, dt * (currentBpm() / 60), {
    waitMode: waitOn,
    loop,
    lateBeats: windowsFor(difficulty, currentBpm()).late
  });
  if (step.wrapped && loop) {
    rememberBest(take, gradeTake(take, difficulty, loop));
    rewindLoop(take, loop);
    armWait(take, waitOn);
    announce(`Looping ${loop.label}.`);
  }
  if (step.waiting) announce(waitMessage());
  paintAt(take.cursor);
  ui.finish.disabled = !take.notes.some((note) => note.status === 'hit');
  const pending = take.notes.some((note) => note.status === 'pending');
  if (step.ended || (!loop && !pending && take.cursor > 0)) {
    take.ended = true;
    showResults();
    return;
  }
  raf = requestAnimationFrame(frame);
}

function paintAt(cursor) {
  if (piano.offsetWidth) roll.style.width = `${piano.offsetWidth}px`;
  if (!roll.hidden) keyCenters = measureKeyCenters(piano);
  staffView.sync(cursor, take.notes);
  rollView.sync(cursor, take.notes, keyCenters);
  lightKeyboard(cursor, take.notes);
  renderReadout(cursor);
}

function lightKeyboard(cursor, notes) {
  const sounding = notes.filter((note) => cursor + 0.03 >= note.beat && cursor < note.beat + note.dur);
  const upcoming = nextChord(notes, cursor);
  piano.querySelectorAll('.piano-key').forEach((key) => {
    key.classList.remove('song-now', 'song-next', 'song-rh', 'song-lh');
  });
  for (const note of upcoming) markKey(note, 'song-next');
  for (const note of sounding) markKey(note, 'song-now');
  const captionKey = upcoming.map((note) => note.id).join(',');
  if (captionKey !== lastCaption) {
    lastCaption = captionKey;
    const captions = {};
    for (const note of upcoming) captions[note.pitch] = { letter: pitchName(note.pitch) };
    setKeyCaptions(piano, captions);
  }
  if (mode === 'audition') {
    clearPressed(piano);
    for (const note of sounding) setPressed(piano, note.pitch, true);
  }
}

function markKey(note, cls) {
  const key = piano.querySelector(`[data-note="${note.pitch}"]`);
  if (!key) return;
  key.classList.add(cls, note.hand === 'lh' ? 'song-lh' : 'song-rh');
}

function renderReadout(cursor) {
  if (!score) return;
  ui.position.innerHTML = `<span class="game-live-dot"></span> ${positionLabel(cursor, beatsPerBarOf(score))}`;
  ui.streak.textContent = `Streak ${take.combo}`;
  ui.lyric.textContent = lyricAt(score.lyrics, cursor);
  const waiting = mode === 'play' && Boolean(take.waiting);
  stage.classList.toggle('is-waiting', waiting);
  if (ui.waitBanner) {
    ui.waitBanner.hidden = !waiting;
    if (waiting) {
      const names = nextChord(take.notes, cursor).map((note) => pitchName(note.pitch)).join(' and ');
      ui.waitBanner.textContent = names ? `Waiting for your key · ${names}` : 'Waiting for your key';
    }
  }
  const notes = (take.waiting ? nextChord(take.notes, cursor) : nextChord(take.notes, cursor)).slice(0, 4);
  ui.now.replaceChildren(...(notes.length ? notes.map(describeNote) : [textNode('Listen, then play the lit keys.')]));
  paintTempo();
}

function describeNote(note) {
  const span = document.createElement('span');
  const hand = note.hand === 'lh' ? 'Left hand' : 'Right hand';
  span.textContent = `${hand} · ${pitchName(note.pitch)}`;
  return span;
}

function textNode(value) {
  return document.createTextNode(value);
}

function nextChord(notes, cursor) {
  const ahead = notes.filter((note) => (
    note.status !== 'hit' && note.status !== 'missed' && note.status !== 'skipped' && note.beat >= cursor - 0.06
  ));
  if (!ahead.length) return [];
  const beat = Math.min(...ahead.map((note) => note.beat));
  return ahead.filter((note) => Math.abs(note.beat - beat) < 0.03);
}

function waitMessage() {
  const notes = nextChord(take.notes, take.cursor);
  if (!notes.length) return 'Your turn.';
  return `Your turn. Play ${notes.map((note) => pitchName(note.pitch)).join(' and ')}.`;
}

function currentBpm() {
  if (!score) return 96;
  return rampedBpm(score.tempo * (tempoPct / 100), displayCursor(), { ramp });
}

function paintTempo() {
  ui.tempoReadout.textContent = `${Math.round(currentBpm())} BPM`;
}

function displayCursor() {
  if (mode === 'audition' && audition) return audition.cursor;
  return take.cursor;
}

function showResults() {
  if (!score) return;
  const ended = take.ended;
  pauseTransport();
  const hits = take.notes.some((note) => note.status === 'hit');
  if (!ended && !hits && !take.best) return;
  const current = gradeTake(take, difficulty, loop);
  const grade = take.best && take.best.score > current.score ? take.best : current;
  ui.resultsLetter.textContent = grade.letter;
  ui.resultsTitle.textContent = `${grade.letter} rank`;
  ui.resultsCopy.textContent = grade.copy;
  const accuracy = Math.round(grade.accuracy * 100);
  ui.resultsStats.textContent = `${accuracy}% landed. ${grade.hits} notes found. Best streak: ${grade.maxCombo} in a row. Extra tries: ${grade.wrong}.`;
  stage.hidden = true;
  ui.results.hidden = false;
  ui.resultsTitle.focus();
}

function hideResults() {
  ui.results.hidden = true;
  stage.hidden = false;
}

function bindChoice(selector, onPick) {
  const list = [...document.querySelectorAll(selector)];
  list.forEach((button, index) => {
    button.addEventListener('click', () => onPick(button));
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = event.key === 'ArrowRight' ? (index + 1) % list.length : (index - 1 + list.length) % list.length;
      onPick(list[next]);
      list[next].focus();
    });
  });
}

function setPlayState(running) {
  ui.play.setAttribute('aria-pressed', running ? 'true' : 'false');
  ui.play.setAttribute('aria-label', running ? 'Pause' : 'Play');
  const label = ui.play.querySelector('.transport-label');
  if (label) label.textContent = running ? 'Pause' : 'Play';
}

function setHearState(hearing) {
  const name = hearing ? 'Stop hearing' : 'Hear the tune';
  ui.hear.setAttribute('aria-pressed', hearing ? 'true' : 'false');
  ui.hear.setAttribute('aria-label', name);
  ui.hear.title = name;
  const label = ui.hear.querySelector('.transport-label');
  if (label) label.textContent = name;
}

function announce(message) {
  if (!message || message === lastAnnounce) return;
  lastAnnounce = message;
  feedback.textContent = message;
}

function savePrefs() {
  if (!score) return;
  try {
    localStorage.setItem(PREFS, JSON.stringify({
      songId: score.id,
      view: session.view,
      difficulty,
      tempoPct,
      waitMode: waitOn,
      ramp
    }));
  } catch {
    /* Preferences stay for this visit if storage is blocked. */
  }
}

function readPrefs() {
  try {
    const raw = localStorage.getItem(PREFS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

