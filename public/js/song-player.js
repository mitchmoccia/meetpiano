import { createAudio } from './audio.js';
import { bindInputs } from './input.js';
import { clearPressed, computerHelpFor, computerKeysForRange, renderPiano, setKeyCaptions, setPressed } from './piano.js';
import { createRollView, measureKeyCenters } from './song-roll.js';
import {
  DIFFICULTY_COPY,
  SONG_CATALOG,
  VIEW_COPY,
  armWait,
  autoOctaves,
  beatsPerBarOf,
  changeView,
  createTake,
  defaultsFor,
  gradeTake,
  judgePitch,
  lyricAt,
  loopFromBars,
  missCopy,
  missesByBar,
  notesForDifficulty,
  handCaption,
  pitchName,
  positionLabel,
  pitchesForKeyboard,
  rangeCovering,
  rampedBpm,
  rememberBest,
  rewindLoop,
  scoreLength,
  stepTake,
  validateScore,
  windowsFor
} from './song-score.js';
import { createStaffView } from './song-staff.js';

const PREFS = 'meetpiano:song-player';
const BESTS = 'meetpiano:song-bests';
const CLICK_AHEAD = 0.18;

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
  positionText: document.querySelector('#position-text'),
  streak: document.querySelector('#streak'),
  lyric: document.querySelector('#lyric'),
  now: document.querySelector('#now-card'),
  keyHelp: document.querySelector('#key-help'),
  sound: document.querySelector('#sound-toggle'),
  click: document.querySelector('#click-volume'),
  clickReadout: document.querySelector('#click-readout'),
  clickMute: document.querySelector('#click-mute'),
  midiButton: document.querySelector('#midi-button'),
  midiLabel: document.querySelector('#midi-button-label'),
  midiStatus: document.querySelector('#midi-status'),
  midiDevices: document.querySelector('#midi-devices'),
  results: document.querySelector('#results'),
  resultsLetter: document.querySelector('#results-letter'),
  resultsTitle: document.querySelector('#results-title'),
  resultsCopy: document.querySelector('#results-copy'),
  resultsStats: document.querySelector('#results-stats'),
  resultsBars: document.querySelector('#results-bars'),
  resultsAgain: document.querySelector('#results-again'),
  songChange: document.querySelector('#song-change'),
  drawer: document.querySelector('#song-drawer'),
  drawerClose: document.querySelector('#song-drawer-close'),
  search: document.querySelector('#song-search'),
  list: document.querySelector('#song-list')
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
let countBeats = 2;
let countReady = false;
let audition = null;
let raf = 0;
let lastTs = 0;
let keyCenters = { map: new Map(), black: new Set(), whiteWidth: 28 };
let lastAnnounce = '';
let lastCaption = '';
let computer = computerKeysForRange(60, 72, 'both');
let octaveChoice = null;
let layoutDirty = true;
let keyByPitch = new Map();
let litKeys = [];
let openingWait = false;
let lastSnapshot = null;
let recent = [];
let songFilter = 'all';
let levelFilter = 'all';
let clickVolume = 80;
let clickIsMuted = false;
let clickClock = null;
let wasWaiting = false;
let lastPosition = '';
let lastStreak = '';
let lastLyric = '';
let lastFollow = '';
let lastBpm = '';
let nowKey = '';
const scheduledClicks = new Set();

const inputs = bindInputs({
  pianoRoot: piano,
  audio,
  shell: stage,
  getComputerKeys: () => computer,
  isDemoPlaying: () => mode === 'audition',
  onUserNote(pitch) {
    if (mode !== 'play' || !take.running) return;
    const result = judgePitch(take, pitch, { difficulty, bpm: currentBpm(), waitMode: waitOn || openingWait });
    if (!result.judged) return;
    if (result.hit) {
      if (openingWait && !take.waiting) {
        openingWait = false;
        announce('Here we go.');
        resetClickClock(take.cursor);
      } else if (result.combo > 0 && result.combo % 5 === 0) announce(`${result.combo} in a row.`);
      else if (take.waiting) announce(waitMessage());
    } else {
      announce(missCopy(result.expected, pitch));
    }
    refreshFinish();
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
ui.click.addEventListener('input', () => {
  clickVolume = Number(ui.click.value);
  if (clickVolume === 0) clickIsMuted = true;
  else if (clickIsMuted) clickIsMuted = false;
  paintClick();
  savePrefs();
});
ui.clickMute.addEventListener('click', () => {
  clickIsMuted = !clickIsMuted;
  if (!clickIsMuted && clickVolume === 0) clickVolume = 80;
  paintClick();
  savePrefs();
});

bindChoice('[data-difficulty]', (button) => selectDifficulty(button.dataset.difficulty));
bindChoice('[data-octaves]', (button) => selectOctaves(Number(button.dataset.octaves)));
bindChoice('[data-tag]', (button) => {
  songFilter = button.dataset.tag;
  document.querySelectorAll('[data-tag]').forEach((item) => {
    item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
  });
  renderSongList();
});
bindChoice('[data-song-level]', (button) => {
  levelFilter = button.dataset.songLevel;
  document.querySelectorAll('[data-song-level]').forEach((item) => {
    item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
  });
  renderSongList();
});
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
ui.finish.addEventListener('click', () => {
  if (ui.finish.getAttribute('aria-disabled') === 'true') return;
  showResults();
});
ui.resultsAgain.addEventListener('click', () => {
  hideResults();
  restartTake();
});
ui.wait.addEventListener('click', () => {
  waitOn = !waitOn;
  ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
  openingWait = false;
  if (waitOn) armWait(take, true);
  else take.waiting = false;
  announce(waitOn ? 'Wait for me is on.' : 'Full tempo. Wait for me is off.');
  savePrefs();
  paintAt(displayCursor());
});
ui.tempo.addEventListener('input', () => {
  tempoPct = Number(ui.tempo.value);
  paintTempo();
  resetClickClock(displayCursor());
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

ui.songChange.addEventListener('click', () => openDrawer());
ui.drawerClose.addEventListener('click', () => closeDrawer());
ui.drawer.addEventListener('click', (event) => {
  if (event.target === ui.drawer) closeDrawer();
});
ui.search.addEventListener('input', () => renderSongList());
ui.list.addEventListener('keydown', (event) => {
  const options = [...ui.list.querySelectorAll('[role="option"]')];
  if (!options.length) return;
  const current = options.indexOf(document.activeElement);
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const next = event.key === 'ArrowDown'
      ? Math.min(options.length - 1, Math.max(0, current) + (current < 0 ? 0 : 1))
      : Math.max(0, current < 0 ? 0 : current - 1);
    options[next].focus();
  } else if (event.key === 'Home') {
    event.preventDefault();
    options[0].focus();
  } else if (event.key === 'End') {
    event.preventDefault();
    options[options.length - 1].focus();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && ui.drawer.hidden && document.querySelector('#practice-panel')?.open) {
    event.preventDefault();
    document.querySelector('#practice-panel').open = false;
    return;
  }
  if (ui.drawer.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeDrawer();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...ui.drawer.querySelectorAll('button, input')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('resize', () => {
  if (octaveChoice == null || octaveChoice === 0) applyRange();
  else layoutDirty = true;
  paintAt(displayCursor());
});

/* Legend and the practice panel change the staff height after the first
   paint. Refit once the mount has its real size, not on every frame. */
{
  let seenSheetSize = '';
  const sheetObserver = new ResizeObserver(() => {
    const next = `${sheetMount.clientWidth}x${sheetMount.clientHeight}`;
    if (next === seenSheetSize) return;
    seenSheetSize = next;
    layoutDirty = true;
    paintAt(displayCursor());
  });
  sheetObserver.observe(sheetMount);
}

applyRange();
paintClick();
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
    if (prefs && Object.prototype.hasOwnProperty.call(prefs, 'octaveChoice') && (prefs.octaveChoice === null || [0, 2, 3, 4, 5].includes(prefs.octaveChoice))) {
      octaveChoice = prefs.octaveChoice;
    }
    if (Number.isFinite(prefs?.clickVolume)) clickVolume = clamp(prefs.clickVolume, 0, 100);
    if (typeof prefs?.clickMuted === 'boolean') clickIsMuted = prefs.clickMuted;
    if (Array.isArray(prefs?.recent)) {
      recent = prefs.recent.filter((id) => songs.some((item) => item.id === id)).slice(0, 8);
    }
    ui.tempo.value = String(tempoPct);
    ui.ramp.checked = ramp;
    ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
    paintClick();
    const requested = new URLSearchParams(location.search).get('song');
    const initial = songs.some((item) => item.id === requested) ? requested : (prefs?.songId || songs[0].id);
    selectSong(initial, { keepPractice: true });
  } catch {
    announce('The songs could not load. First Piano Journey on Learn still works.');
  }
}

function selectSong(id, { keepPractice = false } = {}) {
  const next = songs.find((item) => item.id === id);
  if (!next) return;
  stopTransport();
  score = next;
  lastSnapshot = null;
  openingWait = false;
  touchRecent(score.id);
  if (!keepPractice) {
    waitOn = defaultsFor(difficulty).waitMode;
    ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
  }
  if (ui.title) ui.title.textContent = score.title;
  ui.meta.textContent = `${score.key} major · ${score.timeSignature[0]}/${score.timeSignature[1]} · ${score.level || 'Beginner'}`;
  const years = score.provenance.lyricPublicationYear
    ? `${score.provenance.publicationYear} (words ${score.provenance.lyricPublicationYear})`
    : String(score.provenance.publicationYear);
  ui.provenance.textContent = `${score.provenance.source} Publication year: ${years}. ${score.provenance.arrangement}`;
  document.title = `${score.title} · Songs · MeetPiano`;
  const bars = Math.ceil(scoreLength(score.notes) / beatsPerBarOf(score));
  ui.barFrom.max = String(bars);
  ui.barTo.max = String(bars);
  ui.barTo.value = String(Math.min(2, bars));
  try {
    const url = new URL(location.href);
    url.searchParams.set('song', score.id);
    history.replaceState(null, '', url);
  } catch {
    /* The address bar is a convenience. The song still changes. */
  }
  renderPhrases();
  applyDifficultyChrome();
  applyViewChrome();
  applyRange();
  setLoop(null, { silent: true });
  savePrefs();
  if (!ui.drawer.hidden) renderSongList();
  announce(`${score.title} is ready.`);
  paintAt(take.cursor);
}

function selectDifficulty(next) {
  if (!defaultsFor(next) || !score) return;
  const cursor = take.cursor;
  difficulty = next;
  waitOn = defaultsFor(next).waitMode;
  openingWait = false;
  ui.wait.setAttribute('aria-pressed', waitOn ? 'true' : 'false');
  stopTransport();
  applyDifficultyChrome();
  applyRange();
  rebuildTake(cursor);
  savePrefs();
  paintAt(take.cursor);
}

function selectOctaves(value) {
  if (![0, 2, 3, 4, 5].includes(value)) return;
  octaveChoice = value;
  applyRange();
  savePrefs();
  paintAt(displayCursor());
}

function selectView(view) {
  const next = changeView({ view: session.view, cursor: take.cursor }, view);
  session = { view: next.view, cursor: next.cursor };
  if (next.cursor !== take.cursor) take.cursor = next.cursor;
  applyViewChrome();
  layoutDirty = true;
  savePrefs();
  paintAt(displayCursor());
  requestAnimationFrame(() => {
    layoutDirty = true;
    paintAt(displayCursor());
  });
}

function applyDifficultyChrome() {
  document.querySelectorAll('[data-difficulty]').forEach((button) => {
    const on = button.dataset.difficulty === difficulty;
    button.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  ui.difficultyCopy.textContent = DIFFICULTY_COPY[difficulty];
}

function updateOctaveChrome() {
  const shown = octaveChoice == null ? autoOctaves(window.innerWidth) : octaveChoice;
  document.querySelectorAll('[data-octaves]').forEach((button) => {
    button.setAttribute('aria-checked', Number(button.dataset.octaves) === shown ? 'true' : 'false');
  });
}

function applyRange() {
  const choice = octaveChoice == null ? autoOctaves(window.innerWidth) : octaveChoice;
  const narrow = window.innerWidth < 720;
  const pitches = score
    ? pitchesForKeyboard(score.notes, { difficulty, narrow, fit: choice === 0 })
    : [60, 72];
  const range = rangeCovering(pitches.length ? pitches : [60, 72], choice);
  renderPiano(piano, range);
  const whiteCount = piano.querySelectorAll('.white-key').length;
  stage?.style.setProperty('--white-count', String(whiteCount));
  lastFollow = '';
  computer = computerKeysForRange(range.from, range.to, 'both');
  keyByPitch = new Map();
  piano.querySelectorAll('.piano-key').forEach((key) => {
    keyByPitch.set(Number(key.dataset.note), key);
  });
  litKeys = [];
  const span = Math.max(1, Math.round((range.to - range.from) / 12));
  ui.keyHelp.textContent = `On-screen keys are a stand-in. ${computerHelpFor({ from: range.from, to: range.to, octaveSpan: span })}.`;
  updateOctaveChrome();
  layoutDirty = true;
  requestAnimationFrame(parkKeyboard);
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
  layoutDirty = true;
  nowKey = '';
  refreshFinish();
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
    openingWait = false;
    armWait(take, true);
    setPlayState(true);
    lastTs = performance.now();
    wasWaiting = Boolean(take.waiting);
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
  audition = { from, to, cursor: from, fired: new Set(), anchorTime: null, anchorBeat: from };
  inputs.silence();
  if (waitOn) {
    mode = 'audition';
    setPlayState(true);
    setHearState(true);
    lastTs = performance.now();
    audio.resume().then(() => {
      if (mode === 'audition') armAuditionClock();
    });
    raf = requestAnimationFrame(frame);
    return;
  }
  beginCount('audition');
}

function beginCount(nextMode) {
  afterCount = nextMode;
  mode = 'countin';
  countBeats = Math.min(2, beatsPerBarOf(score));
  countReady = false;
  setPlayState(true);
  announce('Count in.');
  audio.resume().then(() => {
    if (mode !== 'countin') return;
    countReady = true;
    countStarted = performance.now();
    resetClickClock(0);
    lastTs = countStarted;
  });
  lastTs = performance.now();
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

function startRunning() {
  mode = 'play';
  take.running = true;
  const fresh = take.cursor < 0.05 && !judgedNotes();
  if (!waitOn && fresh) {
    openingWait = true;
    armWait(take, true);
    announce('Ready? Play the first note.');
  } else {
    openingWait = false;
    armWait(take, waitOn);
    announce(waitOn ? waitMessage() : 'Here we go.');
  }
  resetClickClock(take.cursor);
  setPlayState(true);
  lastTs = performance.now();
  wasWaiting = Boolean(take.waiting);
}

function pauseTransport() {
  mode = 'idle';
  take.running = false;
  openingWait = false;
  audition = null;
  clickClock = null;
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
    if (countReady) {
      pumpClicks(countBeats);
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
              fired: new Set(),
              anchorTime: null,
              anchorBeat: loop ? loop.start : 0
            };
          }
          armAuditionClock();
        } else startRunning();
      }
    } else {
      paintAt(take.cursor);
    }
    raf = requestAnimationFrame(frame);
    return;
  }
  if (mode === 'audition' && audition) {
    pumpAudition();
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
    waitMode: waitOn || openingWait,
    loop,
    lateBeats: windowsFor(difficulty, currentBpm()).late
  });
  if (step.wrapped && loop) {
    rememberBest(take, gradeTake(take, difficulty, loop));
    rewindLoop(take, loop);
    if (waitOn) armWait(take, true);
    announce(`Looping ${loop.label}.`);
    resetClickClock(take.cursor);
  }
  const waitingNow = Boolean(take.waiting);
  if (wasWaiting && !waitingNow) resetClickClock(take.cursor);
  wasWaiting = waitingNow;
  if (!waitingNow) pumpClicks(loop ? loop.end : take.length);
  if (step.waiting) announce(waitMessage());
  paintAt(take.cursor);
  refreshFinish();
  const pending = take.notes.some((note) => note.status === 'pending');
  if (step.ended || (!loop && !pending && take.cursor > 0)) {
    take.ended = true;
    showResults();
    return;
  }
  raf = requestAnimationFrame(frame);
}

function paintAt(cursor) {
  if (layoutDirty) {
    if (piano.offsetWidth) roll.style.width = `${piano.offsetWidth}px`;
    keyCenters = measureKeyCenters(piano);
    if (staffView.refit()) layoutDirty = false;
  }
  staffView.sync(cursor, take.notes);
  rollView.sync(cursor, take.notes, keyCenters);
  lightKeyboard(cursor, take.notes);
  followActiveKey(cursor, take.notes);
  renderReadout(cursor);
}

function parkKeyboard() {
  const scroller = piano.closest('.kb-scroll');
  if (!scroller) return;
  if (scroller.scrollWidth <= scroller.clientWidth + 1) {
    scroller.scrollLeft = 0;
    return;
  }
  const home = piano.querySelector('[data-note="60"]') || piano.querySelector('.white-key');
  if (!home) return;
  scroller.scrollLeft = Math.max(0, home.offsetLeft - 12);
}

function followActiveKey(cursor, notes) {
  if (window.innerWidth >= 720) return;
  const scroller = piano.closest('.kb-scroll');
  if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 1) return;
  const active = notes.find((note) => cursor + 0.03 >= note.beat && cursor < note.beat + note.dur)
    || notes.find((note) => note.beat >= cursor - 0.06 && note.status !== 'hit' && note.status !== 'missed');
  if (!active) return;
  const key = keyByPitch.get(active.pitch);
  if (!key || String(active.pitch) === lastFollow) return;
  lastFollow = String(active.pitch);
  const viewLeft = scroller.scrollLeft;
  const viewRight = viewLeft + scroller.clientWidth;
  const keyLeft = key.offsetLeft;
  const keyRight = keyLeft + key.offsetWidth;
  if (keyLeft >= viewLeft + 4 && keyRight <= viewRight - 4) return;
  scroller.scrollLeft = Math.max(0, keyLeft - (scroller.clientWidth - key.offsetWidth) / 2);
}

function lightKeyboard(cursor, notes) {
  for (const key of litKeys) key.classList.remove('song-now', 'song-next', 'song-rh', 'song-lh');
  litKeys = [];
  const sounding = [];
  for (const note of notes) {
    if (cursor + 0.03 >= note.beat && cursor < note.beat + note.dur) sounding.push(note);
  }
  const upcoming = nextChord(notes, cursor);
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
  const key = keyByPitch.get(note.pitch);
  if (!key) return;
  key.classList.add(cls, note.hand === 'lh' ? 'song-lh' : 'song-rh');
  if (!litKeys.includes(key)) litKeys.push(key);
}

function renderReadout(cursor) {
  if (!score) return;
  const label = positionLabel(cursor, beatsPerBarOf(score));
  if (label !== lastPosition && ui.positionText) {
    lastPosition = label;
    ui.positionText.textContent = label;
  }
  const streak = `Streak ${take.combo}`;
  if (streak !== lastStreak) {
    lastStreak = streak;
    ui.streak.textContent = streak;
  }
  const lyric = lyricAt(score.lyrics, cursor);
  if (lyric !== lastLyric) {
    lastLyric = lyric;
    ui.lyric.textContent = lyric;
  }
  const waiting = mode === 'play' && Boolean(take.waiting);
  stage.classList.toggle('is-waiting', waiting);
  if (ui.waitBanner) {
    const show = waiting;
    ui.waitBanner.hidden = !show;
    ui.waitBanner.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (show) {
      const names = nextChord(take.notes, cursor).map((note) => pitchName(note.pitch)).join(' and ');
      const text = openingWait
        ? 'Ready? Play the first note.'
        : (names ? `Waiting for your key · ${names}` : 'Waiting for your key');
      if (ui.waitBanner.textContent !== text) ui.waitBanner.textContent = text;
    }
  }
  const chord = nextChord(take.notes, cursor).slice(0, 4);
  const chordKey = `${waiting ? 1 : 0}:${chord.map((note) => note.id).join(',')}`;
  if (chordKey !== nowKey) {
    nowKey = chordKey;
    ui.now.replaceChildren(...(chord.length ? handCaption(chord).map(handSpan) : [textNode('Listen, then play the lit keys.')]));
  }
  paintTempo();
}

function handSpan(text) {
  const span = document.createElement('span');
  span.textContent = text;
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
  const label = `${Math.round(currentBpm())} BPM`;
  if (label === lastBpm) return;
  lastBpm = label;
  ui.tempoReadout.textContent = label;
}

function displayCursor() {
  if (mode === 'audition' && audition) return audition.cursor;
  return take.cursor;
}

function judgedNotes() {
  return take.notes.some((note) => note.status === 'hit' || note.status === 'missed');
}

function refreshFinish() {
  const ready = Boolean(lastSnapshot) || take.ended || judgedNotes();
  ui.finish.setAttribute('aria-disabled', ready ? 'false' : 'true');
  ui.finish.classList.toggle('is-disabled', !ready);
  ui.finish.title = ready ? 'See my results' : 'Play the song first. Results appear after a run.';
}

function showResults() {
  if (!score) return;
  const live = take.ended || judgedNotes();
  if (!live && !lastSnapshot) return;
  if (live) {
    const grade = gradeTake(take, difficulty, loop);
    rememberBest(take, grade);
    rememberDeviceBest(score.id, grade);
    lastSnapshot = { grade, bars: missesByBar(take.notes, beatsPerBarOf(score)) };
  }
  pauseTransport();
  const grade = lastSnapshot.grade;
  ui.resultsLetter.textContent = grade.letter;
  ui.resultsTitle.textContent = `${grade.letter} rank`;
  ui.resultsCopy.textContent = grade.copy;
  const accuracy = Math.round(grade.accuracy * 100);
  const found = `${grade.hits} ${grade.hits === 1 ? 'note' : 'notes'} found`;
  ui.resultsStats.textContent = `${accuracy}% landed. Streak ${grade.maxCombo}. ${found}. Extra tries: ${grade.wrong}.`;
  const bars = lastSnapshot.bars || [];
  ui.resultsBars.replaceChildren(...(bars.length ? bars.map((row) => {
    const item = document.createElement('li');
    item.textContent = `Bar ${row.bar}: ${row.count} ${row.count === 1 ? 'miss' : 'misses'}`;
    return item;
  }) : [Object.assign(document.createElement('li'), { textContent: 'No missed notes in this run.' })]));
  stage.hidden = true;
  ui.results.hidden = false;
  ui.resultsTitle.focus();
  if (!ui.drawer.hidden) renderSongList();
}

function hideResults() {
  ui.results.hidden = true;
  stage.hidden = false;
}

function openDrawer() {
  ui.drawer.hidden = false;
  ui.songChange.setAttribute('aria-expanded', 'true');
  renderSongList();
  ui.search.focus();
}

function closeDrawer() {
  ui.drawer.hidden = true;
  ui.songChange.setAttribute('aria-expanded', 'false');
  ui.songChange.focus();
}

function renderSongList() {
  const query = ui.search.value.trim().toLowerCase();
  const matches = songs.filter((item) => {
    if (query && !item.title.toLowerCase().includes(query)) return false;
    if (songFilter !== 'all' && !(item.tags || []).includes(songFilter)) return false;
    if (levelFilter !== 'all' && (item.level || 'Beginner') !== levelFilter) return false;
    return true;
  });
  const bests = readBests();
  ui.list.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'song-list-empty';
    empty.textContent = 'No songs match that search.';
    ui.list.append(empty);
    return;
  }
  const recentIds = new Set(recent);
  const recentRows = query ? [] : recent.map((id) => matches.find((item) => item.id === id)).filter(Boolean);
  const rest = query ? matches : matches.filter((item) => !recentIds.has(item.id));
  if (recentRows.length) {
    ui.list.append(listLabel('Recent'));
    for (const item of recentRows) ui.list.append(songOption(item, bests));
  }
  if (rest.length) {
    if (recentRows.length) ui.list.append(listLabel('All songs'));
    for (const item of rest) ui.list.append(songOption(item, bests));
  }
}

function listLabel(text) {
  const label = document.createElement('p');
  label.className = 'song-list-label';
  label.textContent = text;
  return label;
}

function songOption(item, bests) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'song-option';
  button.setAttribute('role', 'option');
  button.dataset.song = item.id;
  button.setAttribute('aria-selected', score && score.id === item.id ? 'true' : 'false');
  const title = document.createElement('span');
  title.className = 'song-option-title';
  title.textContent = item.title;
  const meta = document.createElement('span');
  meta.className = 'song-option-meta';
  const best = bests[item.id]?.letter;
  const tags = (item.tags || []).join(' · ');
  meta.textContent = `${item.key} major · ${item.level || 'Beginner'}${tags ? ` · ${tags}` : ''}${best ? ` · Best ${best}` : ''}`;
  button.append(title, meta);
  button.addEventListener('click', () => {
    selectSong(item.id);
    closeDrawer();
  });
  return button;
}

function touchRecent(id) {
  recent = [id, ...recent.filter((item) => item !== id)].slice(0, 8);
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

function paintClick() {
  ui.click.value = String(clickVolume);
  ui.clickReadout.textContent = String(clickVolume);
  ui.clickMute.setAttribute('aria-pressed', clickIsMuted ? 'true' : 'false');
  ui.clickMute.textContent = clickIsMuted ? 'Click muted' : 'Click on';
  audio.setClickLevel(clickVolume / 100);
  audio.setClickMuted(clickIsMuted);
}

function resetClickClock(beat) {
  scheduledClicks.clear();
  const time = audio.currentTime();
  clickClock = time == null ? null : { audioTime: time, beat, bpm: currentBpm() };
}

function pumpClicks(limitBeat) {
  if (clickIsMuted || !clickClock || !score) return;
  const time = audio.currentTime();
  if (time == null) return;
  if (Math.abs(currentBpm() - clickClock.bpm) > 0.4) {
    const beatNow = clickClock.beat + (time - clickClock.audioTime) * (clickClock.bpm / 60);
    clickClock = { audioTime: time, beat: beatNow, bpm: currentBpm() };
  }
  const beatSec = 60 / clickClock.bpm;
  const horizon = time + CLICK_AHEAD;
  const beatNow = clickClock.beat + (time - clickClock.audioTime) / beatSec;
  let beat = Math.ceil(beatNow - 1e-4);
  const perBar = beatsPerBarOf(score);
  while (beat < limitBeat) {
    const when = clickClock.audioTime + (beat - clickClock.beat) * beatSec;
    if (when > horizon) break;
    if (!scheduledClicks.has(beat)) {
      scheduledClicks.add(beat);
      const place = ((beat % perBar) + perBar) % perBar;
      const kind = mode === 'countin' ? (beat === 0 ? 'downbeat' : 'count') : (place === 0 ? 'downbeat' : 'beat');
      audio.clickAt(when, kind);
    }
    beat += 1;
  }
}

function armAuditionClock() {
  if (!audition) return;
  const time = audio.currentTime();
  audition.anchorTime = time;
  audition.anchorBeat = audition.cursor;
  audition.fired = new Set();
}

function pumpAudition() {
  if (!audition) return;
  const time = audio.currentTime();
  if (time == null || audition.anchorTime == null) {
    audition.cursor += 0.016 * (currentBpm() / 60);
    return;
  }
  const beatSec = 60 / currentBpm();
  audition.cursor = audition.anchorBeat + (time - audition.anchorTime) / beatSec;
  const horizon = audition.cursor + CLICK_AHEAD / beatSec;
  for (const note of take.notes) {
    if (note.beat < audition.from || note.beat >= audition.to || note.beat > horizon) continue;
    if (audition.fired.has(note.id)) continue;
    audition.fired.add(note.id);
    const when = audition.anchorTime + (note.beat - audition.anchorBeat) * beatSec;
    audio.playAt(note.pitch, Math.max(when, time), note.hand === 'lh' ? 0.42 : 0.66);
  }
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
      ramp,
      octaveChoice,
      clickVolume,
      clickMuted: clickIsMuted,
      recent
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

function readBests() {
  try {
    const raw = localStorage.getItem(BESTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function rememberDeviceBest(id, grade) {
  try {
    const all = readBests();
    const prev = all[id];
    if (!prev || grade.score > prev.score) {
      all[id] = { letter: grade.letter, score: grade.score };
      localStorage.setItem(BESTS, JSON.stringify(all));
    }
  } catch {
    /* A missing best grade still leaves the run on screen. */
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
