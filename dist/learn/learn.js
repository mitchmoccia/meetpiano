import { createAudio } from '../js/audio.js';
import { bindInputs } from '../js/input.js';
import { createPlayer } from '../js/player.js';
import { createProgress } from '../js/progress.js';
import { createRhythmClock } from '../js/rhythm-clock.js';
import { patternSpanSec } from '../js/rhythm-score.js';
import {
  clearPressed,
  computerKeysFor,
  renderPiano,
  setGroupOutlines,
  setHints,
  setKeyCaptions,
  setPianoRegion,
  setSweep
} from '../js/piano.js';
import { pianoRangeFor, usesWidePiano } from '../js/hands.js';
import {
  el,
  evidenceLabel,
  lessonHref,
  nextHref,
  parseGrownupView,
  phaseCopy,
  renderGrownupView,
  renderKidTarget,
  renderParagraphs,
  renderPhraseTiles,
  renderSteps,
  renderResultCard,
  renderUnitHub
} from '../js/learn-view.js';
import { isExpressionLesson, isLessonUnlocked, isLeftLesson, isTogetherLesson, parseLessonId, parseUnitId, unitTitleFor, usesClockTake, usesExpressionTake, usesRhythmTake, usesTogetherTake } from '../js/unit.js';
import { durationMs, renderStaff } from '../js/staff.js';
import { exportProgress, importProgress, resetProgress } from '../js/portability.js';
import { recommendAfterLesson } from '../js/recommend.js';
import { createNarrator, NARRATION_FAIL_COPY, NARRATION_UNAVAILABLE_COPY } from '../js/narrate.js';
import { kidSpoken } from '../js/kid-copy.js';
import { clearPause, readPause, resumeHref, writePause } from '../js/session-pause.js';

const progress = createProgress();
progress.touchSession();
const audio = createAudio();
const params = new URLSearchParams(window.location.search);
const requested = parseLessonId(params.get('lesson'));
const requestedUnit = parseUnitId(params.get('unit'));
const store = progress.read().store;
const unlocked = requested ? isLessonUnlocked(store, requested) : true;
const lessonId = requested && unlocked ? requested : null;

const pianoRoot = document.querySelector('#piano');
const hub = document.querySelector('#unit-hub');
const shell = document.querySelector('#lesson-shell');
const helpButton = document.querySelector('#help-button');
const restartButton = document.querySelector('#restart-button');
const hubLink = document.querySelector('#hub-link');
const pauseButton = document.querySelector('#pause-button');
const exitButton = document.querySelector('#exit-button');
const resumeButton = document.querySelector('#resume-button');
const grownupShell = document.querySelector('#grownup-shell');
const pauseOverlay = document.querySelector('#pause-overlay');
const showGrownup = parseGrownupView(params.get('view'));
const pauseState = readPause();

if (pianoRoot) renderPiano(pianoRoot);

const midiStatus = document.querySelector('#midi-status');
const midiButton = document.querySelector('#midi-button');
const midiButtonLabel = document.querySelector('#midi-button-label');
const midiDevices = document.querySelector('#midi-devices');

function paintMidi(view) {
  if (!view) return;
  if (midiStatus) midiStatus.textContent = view.status;
  if (midiButtonLabel) midiButtonLabel.textContent = view.buttonLabel;
  else if (midiButton) midiButton.textContent = view.buttonLabel;
  if (midiButton) midiButton.disabled = view.kind === 'requesting' || view.kind === 'unsupported';
  if (midiDevices) {
    midiDevices.replaceChildren();
    midiDevices.hidden = !view.devices.length;
    view.devices.forEach((device) => {
      const item = document.createElement('li');
      item.textContent = device.manufacturer ? `${device.name} · ${device.manufacturer}` : device.name;
      midiDevices.append(item);
    });
  }
}

function openLesson(id, rec) {
  window.location.href = rec?.href || lessonHref(id);
}

if (!lessonId) {
  hub.hidden = showGrownup;
  if (grownupShell) grownupShell.hidden = !showGrownup;
  shell.hidden = true;
  helpButton.hidden = true;
  restartButton.hidden = true;
  hubLink.hidden = !showGrownup;
  if (pauseButton) pauseButton.hidden = true;
  if (exitButton) exitButton.hidden = true;
  if (resumeButton) {
    resumeButton.hidden = !pauseState;
    if (pauseState) {
      resumeButton.addEventListener('click', () => { window.location.href = resumeHref(pauseState); });
    }
  }
  if (requested && !unlocked) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = `${requested} is locked on this device until the earlier activity is ready.`;
  } else if (requestedUnit === 'rhythm-club' && !isLessonUnlocked(store, 'L05')) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = 'Rhythm Club is locked on this device until First little tune is Independent.';
  } else if (requestedUnit === 'read-and-play' && !isLessonUnlocked(store, 'L09')) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = 'Read and play is locked on this device until Notes with a beat is Independent.';
  } else if (requestedUnit === 'left-hand' && !isLessonUnlocked(store, 'L13')) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = 'Left hand is locked on this device until Read a little tune is Independent.';
  } else if (requestedUnit === 'together' && !isLessonUnlocked(store, 'L17')) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = 'Together is locked on this device until Two parts one pulse is Independent.';
  } else if (requestedUnit === 'expression' && !isLessonUnlocked(store, 'L21')) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = 'Expression is locked on this device until Complete little piece is Independent.';
  }
  const hubOpts = {
    onOpen: openLesson,
    onContinue: openLesson,
    focusUnit: requestedUnit,
    onExport: exportRecords,
    onImport: importRecords,
    onReset: resetRecords,
    pauseState
  };
  if (showGrownup && grownupShell) {
    document.title = 'Grown-up view · First Piano Journey · MeetPiano';
    renderGrownupView(grownupShell, store, hubOpts);
  } else {
    renderUnitHub(hub, store, hubOpts);
  }
} else {
  startLesson(lessonId);
}

function exportRecords() {
  const bundle = exportProgress(progress.read().store);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'meetpiano-beginner-v1.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importRecords(file) {
  const notice = document.querySelector('#storage-notice');
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch (_) {
    if (notice) {
      notice.hidden = false;
      notice.textContent = 'That file was not readable JSON. Nothing was imported.';
    }
    return;
  }
  const result = importProgress(payload, progress.read().store);
  if (!result.ok) {
    if (notice) {
      notice.hidden = false;
      notice.textContent = `Import stopped (${result.reason}). Versions must match, and Independent cannot be invented.`;
    }
    return;
  }
  progress.write(result.store);
  window.location.reload();
}

function resetRecords() {
  const ok = window.confirm('Clear First Piano Journey records on this device? Export first if you want a copy. This does not create an account or send anything anywhere.');
  if (!ok) return;
  progress.write(resetProgress());
  clearPause();
  const notice = document.querySelector('#storage-notice');
  if (notice) {
    notice.hidden = false;
    notice.textContent = 'This device is clear. Nothing was uploaded.';
  }
  window.location.href = '/learn/';
}

function startLesson(id) {
  if (pianoRoot) renderPiano(pianoRoot, pianoRangeFor(id));
  const clock = createRhythmClock({
    now: () => {
      const audioNow = audio.currentTime();
      return audioNow == null ? performance.now() / 1000 : audioNow;
    }
  });
  const player = createPlayer({ progress, lessonId: id, clock });
  if (params.get('check') === 'review' && player.beginSessionCheck) {
    player.beginSessionCheck();
  }
  const input = bindInputs({
    pianoRoot,
    audio,
    onUserNote: (note, source, extras) => applyNote(player.handleNote(note, source, extras)),
    onUserRelease: (note, source, extras) => {
      if (player.handleRelease) applyNote(player.handleRelease(note, source, extras));
    },
    isDemoPlaying: () => player.isDemoPlaying(),
    getComputerKeys: () => computerKeysFor(player.view()?.handFocus || (usesWidePiano(id) ? 'both' : 'right')),
    onMidiStatus: (view) => {
      paintMidi(view);
      if ((usesRhythmTake(id) || (usesExpressionTake(id) && player.view()?.useClock)) && view.change?.type === 'disconnect' && player.abortTake) {
        const result = player.abortTake('disconnect');
        lastFeedback = result?.message || player.lessonSpec.copy.feedback.disconnect;
        paint();
      }
    },
    shell,
    clockNow: () => clock.now()
  });

  const ui = {
    notice: document.querySelector('#storage-notice'),
    steps: document.querySelector('#phase-steps'),
    eyebrow: document.querySelector('#phase-eyebrow'),
    title: document.querySelector('#phase-title'),
    copy: document.querySelector('#phase-copy'),
    actions: document.querySelector('#phase-actions'),
    extras: document.querySelector('#phase-extras'),
    feedback: document.querySelector('#phase-feedback'),
    seating: document.querySelector('#seating-card'),
    groups: document.querySelector('#group-labels'),
    hand: document.querySelector('#hand-card'),
    leftHand: document.querySelector('#left-hand-card'),
    handFocus: document.querySelector('#hand-focus'),
    regionLabels: document.querySelector('#region-labels'),
    house: document.querySelector('#house-card'),
    wave: document.querySelector('#wave-card'),
    pulse: document.querySelector('#pulse-card'),
    pulseDot: document.querySelector('#pulse-dot'),
    countIn: document.querySelector('#count-in'),
    beatLane: document.querySelector('#beat-lane'),
    rest: document.querySelector('#rest-card'),
    restBoxes: document.querySelector('#rest-boxes'),
    tiles: document.querySelector('#phrase-tiles'),
    staff: document.querySelector('#staff-card'),
    threeHouse: document.querySelector('#three-house-card'),
    continueNote: document.querySelector('#continue-note'),
    evidence: document.querySelector('#evidence-pill'),
    label: document.querySelector('#lesson-label'),
    kidTarget: document.querySelector('#kid-target')
  };

  const narrator = createNarrator();
  let lessonPaused = false;
  if (params.get('resume') === '1') clearPause();
  let demoTimers = [];
  let lastFeedback = '';
  let showHouse = false;
  let showThreeHouse = false;
  let pulseRaf = 0;

  function wait(ms) {
    return new Promise((resolve) => {
      const timer = window.setTimeout(resolve, ms);
      demoTimers.push(timer);
    });
  }

  function stopDemo() {
    demoTimers.forEach((timer) => clearTimeout(timer));
    demoTimers = [];
    player.setDemoPlaying(false);
    input.silence();
    setSweep(pianoRoot, null);
    clock.cancelAll();
  }

  function playRhythmPattern(pattern, { rush = false } = {}) {
    stopDemo();
    player.setDemoPlaying(true);
    const ok = audio.ensure();
    player.setAudioUnlocked(ok);
    if (!ok) {
      player.setDemoPlaying(false);
      ui.feedback.textContent = player.lessonSpec.copy.feedback.audioMissing;
      return;
    }
    const start = audio.currentTime() ?? clock.now();
    const beat = 60 / pattern.bpm;
    const countIn = pattern.countInBeats || 0;
    for (let i = 0; i < countIn; i += 1) {
      audio.clickAt(start + i * beat, 'count');
    }
    pattern.events.forEach((event, index) => {
      if (event.kind !== 'note') return;
      const when = rush
        ? start + countIn * beat + index * 0.12
        : start + countIn * beat + event.onsetBeats * beat;
      audio.playAt(event.pitch, when);
      clock.scheduleAt(when, () => setSweep(pianoRoot, event.pitch));
    });
    const end = start + countIn * beat + patternSpanSec(pattern) + 0.25;
    clock.scheduleAt(end, () => {
      setSweep(pianoRoot, null);
      player.setDemoPlaying(false);
    });
  }

  function beginRhythmTake(kind) {
    const ok = audio.ensure();
    player.setAudioUnlocked(ok);
    clock.cancelAll();
    const live = player.startTake(kind);
    if (!live || live.blocked) {
      lastFeedback = live?.message || player.lessonSpec.copy.feedback.needHands;
      paint();
      return;
    }
    const beat = 60 / live.bpm;
    const countStart = live.origin - (live.countInBeats || 0) * beat;
    for (let i = 0; i < (live.countInBeats || 0); i += 1) {
      audio.clickAt(countStart + i * beat, 'count');
    }
    live.pattern.events.forEach((event) => {
      if (event.kind !== 'note') return;
      audio.clickAt(live.origin + event.onsetBeats * beat, 'beat');
    });
    const end = live.origin + patternSpanSec(live.pattern) + 0.3;
    clock.scheduleAt(end, () => {
      const result = player.completeIfReady();
      if (result?.message) lastFeedback = result.message;
      const view = player.view();
      if (view.phase === 'independent' && view.independentStep === 'done') go('independent');
      if (view.phase === 'transfer' && view.transferStep === 'done') go('transfer');
      paint();
    });
    lastFeedback = 'Count-in. Your taps during the clicks do not count as extras.';
  }

  async function playSequence(notes, gap = 400, velocity) {
    stopDemo();
    player.setDemoPlaying(true);
    const ok = audio.ensure();
    player.setAudioUnlocked(ok);
    if (!ok) {
      player.setDemoPlaying(false);
      ui.feedback.textContent = player.lessonSpec.copy.feedback.audioMissing;
      return;
    }
    for (const note of notes) {
      input.playDemoNote(note, velocity);
      setSweep(pianoRoot, note);
      await wait(gap);
      input.releaseDemoNote(note);
    }
    setSweep(pianoRoot, null);
    player.setDemoPlaying(false);
  }

  async function playCluster(notes, hold = 700) {
    stopDemo();
    player.setDemoPlaying(true);
    const ok = audio.ensure();
    player.setAudioUnlocked(ok);
    if (!ok) {
      player.setDemoPlaying(false);
      ui.feedback.textContent = player.lessonSpec.copy.feedback.audioMissing;
      return;
    }
    notes.forEach((note) => input.playDemoNote(note, 0.45));
    await wait(hold);
    notes.forEach((note) => input.releaseDemoNote(note));
    player.setDemoPlaying(false);
  }

  function go(phase) {
    stopDemo();
    player.advanceFrom(phase);
  }

  function applyNote(result) {
    if (!result) return;
    if (result.reason === 'demo-playback') {
      ui.feedback.textContent = player.lessonSpec.copy.feedback.demoOnly;
      return;
    }
    if (result.message) {
      lastFeedback = result.message;
      ui.feedback.textContent = result.message;
    }
    showHouse = Boolean(result.remediate && id === 'L02');
    showThreeHouse = Boolean(result.remediate && id === 'L09');
    const view = player.view();
    if (view.phase === 'independent' && view.independentStep === 'done') go('independent');
    if (view.phase === 'transfer' && view.transferStep === 'done' && id !== 'L01') go('transfer');
    paint();
  }

  function paint() {
    if (player.view().easierWork && player.startEasierWork) {
      const phase = player.view().phase;
      if (phase === 'independent' || phase === 'transfer' || phase === 'review') player.startEasierWork();
    }
    const view = player.view();
    const copy = phaseCopy(view);
    document.title = `${view.lessonSpec.title} · ${unitTitleFor(id)} · MeetPiano`;
    ui.label.innerHTML = `<span class="game-live-dot"></span> FIRST PIANO JOURNEY · ${id}`;
    renderSteps(ui.steps, view.phaseIndex);
    ui.eyebrow.textContent = copy.eyebrow;
    ui.title.textContent = copy.title;
    renderParagraphs(ui.copy, copy.paragraphs);
    ui.notice.hidden = !view.notice;
    ui.notice.textContent = view.notice || '';
    ui.continueNote.hidden = view.attempt.phase === 'explanation' && !view.attempt.events.length;
    ui.continueNote.textContent = view.attempt.phase === 'result'
      ? 'This device still has your last saved result.'
      : 'Picking up where you left off on this device.';
    ui.evidence.textContent = evidenceLabel(view.lesson.evidenceState);
    if (view.sourceHonesty && ui.evidence) ui.evidence.title = view.sourceHonesty;
    ui.seating.hidden = id !== 'L01' || (view.phase !== 'demo' && view.phase !== 'guided');
    ui.groups.hidden = id !== 'L01' || (view.phase !== 'demo' && !(view.phase === 'guided' && view.guidedStep === 'groups' && view.hintsOn));
    ui.hand.hidden = id !== 'L03' || (view.phase !== 'demo' && !(view.phase === 'guided' && view.guidedStep === 'row' && view.hintsOn));
    if (ui.leftHand) {
      ui.leftHand.hidden = id !== 'L13' || (view.phase !== 'demo' && !(view.phase === 'guided' && (view.guidedStep === 'neighbors' || view.guidedStep === 'fingering') && view.hintsOn));
    }
    paintHandFocus(view);
    if (pianoRoot) setPianoRegion(pianoRoot, view.handFocus || (usesWidePiano(id) ? 'both' : 'right'));
    ui.house.hidden = id !== 'L02' || !showHouse;
    if (ui.threeHouse) ui.threeHouse.hidden = id !== 'L09' || !showThreeHouse;
    ui.wave.hidden = id !== 'L04' || (view.phase !== 'demo' && view.phase !== 'guided');
    paintRhythmChrome(view);
    paintStaff(view);
    renderPhraseTiles(ui.tiles, view.phrase);
    ui.actions.replaceChildren();
    ui.extras.replaceChildren();
    setHints(pianoRoot, hintNotes(view));
    setGroupOutlines(pianoRoot, groupKinds(view));
    setKeyCaptions(pianoRoot, view.captions || {});
    if (view.phase === 'result') {
      clearPressed(pianoRoot);
      setSweep(pianoRoot, null);
    }
    renderActions(view, copy);
    paintKidTarget(view);
    paintPauseChrome(view);
    if (lastFeedback) ui.feedback.textContent = lastFeedback;
    else if (!ui.feedback.textContent) ui.feedback.textContent = 'Ready when you are.';
  }

  function paintKidTarget(view) {
    if (!ui.kidTarget) return;
    const hearLabel = narrator.available()
      ? (narrator.lastText() ? 'Hear the words again' : 'Hear the words')
      : 'Words stay on the screen';
    renderKidTarget(ui.kidTarget, view, {
      hearLabel,
      hearDisabled: !narrator.available(),
      onHear: () => {
        const result = narrator.replay(kidSpoken(view));
        if (!result.ok) {
          lastFeedback = result.reason === 'unavailable' ? NARRATION_UNAVAILABLE_COPY : NARRATION_FAIL_COPY;
        } else {
          lastFeedback = 'Hearing the words. Piano demos still have their own replay buttons.';
        }
        if (ui.feedback) ui.feedback.textContent = lastFeedback;
        paintKidTarget(player.view());
      }
    });
  }

  function paintPauseChrome(view) {
    if (pauseButton) pauseButton.hidden = lessonPaused;
    if (exitButton) exitButton.hidden = false;
    if (resumeButton) resumeButton.hidden = !lessonPaused;
    if (pauseOverlay) pauseOverlay.hidden = !lessonPaused;
    if (hubLink) hubLink.hidden = false;
    if (lessonPaused && ui.feedback && !lastFeedback) {
      ui.feedback.textContent = 'Paused. Your try is waiting.';
    }
    if (view) return view;
  }

  function pauseLesson() {
    const view = player.view();
    if (player.pauseTake && (usesClockTake(id) || view.useClock)) {
      const result = player.pauseTake();
      lastFeedback = result?.message || player.lessonSpec.copy.feedback.paused || 'Paused. Not a miss.';
    } else {
      lastFeedback = 'Paused. Your try is waiting.';
    }
    stopDemo();
    narrator.cancel();
    writePause({ lessonId: id, phase: view.phase, takeWasLive: Boolean(view.takeLive || view.takePaused) });
    lessonPaused = true;
    paint();
  }

  function resumeLesson() {
    const view = player.view();
    if (player.resumeTake && (usesClockTake(id) || view.useClock || view.takePaused)) {
      const result = player.resumeTake();
      lastFeedback = result?.message || 'Back. Your try is waiting.';
    } else {
      lastFeedback = 'Back. Your try is waiting.';
    }
    clearPause();
    lessonPaused = false;
    paint();
  }

  function exitLesson() {
    const view = player.view();
    writePause({ lessonId: id, phase: view.phase, takeWasLive: Boolean(view.takeLive || view.takePaused) });
    stopDemo();
    narrator.cancel();
    window.location.href = '/learn/';
  }

  function hintNotes(view) {
    if (view.recitalMode) return [];
    if (view.phase !== 'guided' || !view.hintsOn) return [];
    if (id === 'L01' && view.guidedStep === 'high-low') return view.lessonSpec.hintHighLow;
    if (id === 'L02' && view.guidedStep === 'find') return [view.lessonSpec.guidedC];
    if (id === 'L02' && view.guidedStep === 'other') return [view.lessonSpec.guidedC];
    if (id === 'L03' && view.guidedStep === 'find-c') return [60];
    if (id === 'L03' && view.guidedStep === 'neighbors') {
      return view.attempt.restore.sequence.length ? [64] : [62];
    }
    if (id === 'L04' || id === 'L08' || id === 'L10' || id === 'L11' || id === 'L12' || id === 'L13' || id === 'L14' || id === 'L15' || id === 'L16' || usesTogetherTake(id) || usesExpressionTake(id)) {
      const captions = view.captions || {};
      return Object.keys(captions).map(Number);
    }
    if (id === 'L09' && view.guidedStep === 'find') return [65];
    if (id === 'L09' && view.guidedStep === 'neighbor') return [67];
    if (id === 'L13' && (view.guidedStep === 'find' || view.guidedStep === 'name')) return [48];
    return [];
  }

  function paintHandFocus(view) {
    if (!ui.handFocus) return;
    const show = (isLeftLesson(id) || isTogetherLesson(id)) && view.phase !== 'explanation' && view.phase !== 'result';
    ui.handFocus.hidden = !show;
    if (ui.regionLabels) ui.regionLabels.hidden = !usesWidePiano(id) || view.phase === 'result';
    if (!show) return;
    const current = view.handFocus || 'both';
    ui.handFocus.querySelectorAll('[data-focus]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.focus === current));
    });
  }

  function paintStaff(view) {
    if (!ui.staff) return;
    if (!view.staff || view.phase === 'explanation' || view.phase === 'result') {
      ui.staff.hidden = true;
      ui.staff.replaceChildren();
      return;
    }
    renderStaff(ui.staff, view.staff);
  }

  function paintRhythmChrome(view) {
    if (!ui.pulse) return;
    const rhythm = usesClockTake(id) || view.useClock === true;
    const showPulse = rhythm && !view.recitalMode && view.phase !== 'explanation' && view.phase !== 'result';
    ui.pulse.hidden = !showPulse;
    ui.pulse.classList.toggle('live', Boolean(view.takeLive));
    ui.pulse.classList.toggle('performance', view.phase === 'independent' || view.phase === 'transfer' || view.phase === 'review');
    if (ui.countIn) {
      ui.countIn.hidden = !(view.takeLive && view.clock?.running);
      ui.countIn.textContent = view.takePaused ? 'Paused — not a miss' : (view.reducedTempo ? 'Slower heartbeat' : 'On the audio clock');
    }
    if (ui.rest) {
      ui.rest.hidden = id !== 'L07' || view.phase === 'explanation' || view.phase === 'result';
      if (id === 'L07' && ui.restBoxes) {
        const transfer = view.phase === 'transfer';
        ui.restBoxes.innerHTML = transfer
          ? '<span>C</span><span>C</span><span class="rest-hole">shh</span><span>C</span>'
          : '<span>C</span><span class="rest-hole">shh</span><span>C</span><span>C</span>';
      }
    }
    if (ui.beatLane) {
      const showLane = rhythm && (view.phase === 'demo' || (view.phase === 'guided' && view.hintsOn) || id === 'L06');
      ui.beatLane.hidden = !showLane || view.phase === 'independent' || view.phase === 'transfer';
      if (!ui.beatLane.hidden && view.pattern) {
        ui.beatLane.replaceChildren(...view.pattern.events.map((event) => {
          const item = document.createElement('li');
          item.className = event.kind === 'rest' ? 'rest' : (event.length || '');
          item.textContent = event.kind === 'rest' ? 'shh' : (event.length === 'long' ? 'long' : event.length === 'short' ? 'short' : 'tap');
          return item;
        }));
      }
    }
    stopPulseVisual();
    if (showPulse && view.phase === 'guided' && view.hintsOn) startPulseVisual(view);
  }

  function startPulseVisual(view) {
    const bpm = view.bpm || 80;
    const origin = view.clock?.origin || clock.now();
    const tick = () => {
      const elapsed = Math.max(0, clock.now() - origin);
      const beat = 60 / bpm;
      const phase = (elapsed % beat) / beat;
      if (ui.pulse) ui.pulse.style.setProperty('--pulse', String(phase));
      pulseRaf = window.requestAnimationFrame(tick);
    };
    tick();
  }

  function stopPulseVisual() {
    if (pulseRaf) window.cancelAnimationFrame(pulseRaf);
    pulseRaf = 0;
  }

  function groupKinds(view) {
    if (id === 'L01' && view.phase === 'demo') return ['two', 'three'];
    if (id === 'L01' && view.phase === 'guided' && view.hintsOn && view.guidedStep === 'groups') return ['two', 'three'];
    if (id === 'L02' && (view.phase === 'demo' || (view.phase === 'guided' && view.hintsOn))) return ['two'];
    if (id === 'L09' && (view.phase === 'demo' || (view.phase === 'guided' && view.hintsOn))) return ['three'];
    if (id === 'L13' && (view.phase === 'demo' || (view.phase === 'guided' && view.hintsOn))) return ['two'];
    return [];
  }

  function renderActions(view, copy) {
    if (view.phase === 'explanation') {
      ui.actions.append(button(copy.action, () => { go('explanation'); lastFeedback = ''; paint(); }, 'button-dark'));
    }
    if (view.phase === 'demo') renderDemo(view);
    if (view.phase === 'guided' || view.phase === 'remediation') renderGuided(view);
    if (view.phase === 'independent') renderIndependent(view);
    if (view.phase === 'transfer') renderTransfer(view);
    if (view.phase === 'review') renderReview(view);
    if (view.phase === 'result') renderResult(view);
  }

  function renderDemo(view) {
    const spec = view.lessonSpec;
    const copy = spec.copy.demo;
    if (id === 'L01') {
      ui.actions.append(
        button(copy.hearHighLow, () => playSequence(spec.demo.highLow, 520)),
        button(copy.hearSweep, () => playSweep(spec)),
        button(copy.hearClusters, () => playClusters(spec))
      );
    }
    if (id === 'L02') {
      ui.actions.append(
        button(copy.hearLandmark, () => playL02Landmark(spec)),
        button(copy.hearHigher, () => {
          lastFeedback = spec.copy.feedback.previewOneC;
          playSequence(spec.demo.higherC, 640);
          paint();
        }),
        button(copy.hearLower, () => {
          lastFeedback = spec.copy.feedback.previewOneC;
          playSequence(spec.demo.lowerC, 640);
          paint();
        })
      );
    }
    if (id === 'L03') {
      ui.actions.append(
        button(copy.hearUp, () => playSequence(spec.demo.up, 420)),
        button(copy.hearDown, () => {
          lastFeedback = spec.copy.feedback.listenOnly;
          playSequence(spec.demo.down, 420);
          paint();
        })
      );
    }
    if (id === 'L04') {
      ui.actions.append(
        button(copy.hearHome, () => playSequence(spec.demo.home, 480)),
        button(copy.hearTransfer, () => playSequence(spec.demo.transfer, 480)),
        button(copy.hearC, () => playSequence([spec.demo.singles.C], 420)),
        button(copy.hearD, () => playSequence([spec.demo.singles.D], 420)),
        button(copy.hearE, () => playSequence([spec.demo.singles.E], 420))
      );
    }
    if (usesClockTake(id)) {
      ui.actions.append(button(copy.hear, () => {
        player.markHeardDemo?.();
        playRhythmPattern(spec.patterns.guided);
        lastFeedback = spec.copy.feedback.heard;
        paint();
      }));
      if ((id === 'L08' || id === 'L16' || usesTogetherTake(id)) && copy.hearWrong) {
        ui.actions.append(button(copy.hearWrong, () => {
          playRhythmPattern(spec.patterns.guided, { rush: true });
          lastFeedback = 'Same letters, wrong time. That must not pass.';
          paint();
        }));
      }
    }
    if (id === 'L09') {
      ui.actions.append(
        button(copy.hearLandmark, () => playL09Landmark(spec)),
        button(copy.hearNeighbors, () => playSequence(spec.demo.neighbors, 480)),
        button(copy.hearG, () => playSequence(spec.demo.gAlone, 520)),
        button(copy.hearHigherF, () => {
          lastFeedback = spec.copy.feedback.previewOneRoom;
          playSequence(spec.demo.higherF, 640);
          paint();
        })
      );
    }
    if (id === 'L10') {
      ui.actions.append(
        button(copy.hearStep, () => playSequence(spec.demo.step, 480)),
        button(copy.hearRepeat, () => playSequence(spec.demo.repeat, 480)),
        button(copy.hearSkip, () => playSequence(spec.demo.skip, 480))
      );
    }
    if (id === 'L11') {
      ui.actions.append(
        button(copy.hearWalk, () => playStaffNotes(spec.walkNotes)),
        button(copy.hearNeighbors, () => playStaffNotes(spec.neighborNotes)),
        button(copy.hearG, () => playSequence([spec.demo.singles.G], 480))
      );
    }
    if (id === 'L12') {
      ui.actions.append(
        button(copy.hearHome, () => playStaffNotes(spec.homeNotes)),
        button(copy.hearTransfer, () => playStaffNotes(spec.transferNotes)),
        button(copy.hearLongShort, () => {
          lastFeedback = spec.copy.feedback.cousinListen;
          playLongShortContrast();
          paint();
        })
      );
    }
    if (id === 'L13') {
      ui.actions.append(
        button(copy.hearLandmark, () => playSequence(spec.demo.landmark, 360)),
        button(copy.hearWalk, () => playSequence(spec.demo.walk, 420)),
        button(copy.hearContrast, () => {
          lastFeedback = spec.copy.feedback.previewOneRoom;
          playSequence(spec.demo.contrast, 640);
          paint();
        })
      );
    }
    if (id === 'L14') {
      ui.actions.append(
        button(copy.hearWalk, () => playStaffNotes(spec.walkNotes)),
        button(copy.hearNeighbors, () => playStaffNotes(spec.neighborNotes)),
        button(copy.hearF, () => playSequence([spec.demo.singles.F], 480))
      );
    }
    if (id === 'L15') {
      ui.actions.append(
        button(copy.hearQuestion, () => playStaffNotes(spec.questionNotes)),
        button(copy.hearAnswer, () => playStaffNotes(spec.answerNotes)),
        button(copy.hearBoth, () => playStaffNotes(spec.homeNotes))
      );
    }
    if (id === 'L21') {
      ui.actions.append(
        button(copy.hearQuiet, () => {
          player.markHeardDemo?.();
          playSequence(spec.homePhrase.slice(0, 4), 480, spec.quietVelocity);
          lastFeedback = spec.copy.feedback.heard;
          paint();
        }),
        button(copy.hearStrong, () => {
          player.markHeardDemo?.();
          playSequence(spec.homePhrase.slice(0, 4), 480, spec.strongVelocity);
          lastFeedback = spec.copy.feedback.heard;
          paint();
        })
      );
    }
    if (id === 'L22') {
      ui.actions.append(
        button(copy.hearHome, () => playSequence(spec.choices ? [60, 62, 64, 60] : [60, 62, 64, 60], 420)),
        button(copy.hearOpen, () => playSequence([60, 62, 64, 67], 420)),
        button(copy.hearTurn, () => playSequence([60, 62, 64, 62, 60], 420))
      );
    }
    if (id === 'L23') {
      ui.actions.append(
        button(copy.hearNotes, () => playSequence(spec.homePhrase, 420)),
        button(copy.hearRhythm, () => {
          playRhythmPattern(spec.patterns.guided);
          lastFeedback = spec.copy.feedback.heard;
          paint();
        }),
        button(copy.hearSpot, () => playSequence(spec.spotPhrase, 420))
      );
    }
    if (id === 'L24') {
      ui.actions.append(
        button(copy.hearWave, () => playSequence(spec.pieces.wave, 420)),
        button(copy.hearWalk, () => playSequence(spec.pieces.walk, 420))
      );
    }
    ui.actions.append(button(copy.action, () => { go('demo'); lastFeedback = ''; paint(); }, 'button-dark'));
  }

  async function playSweep(spec) {
    await playSequence(spec.demo.rise, 280);
    await wait(220);
    await playSequence(spec.demo.fall, 280);
  }

  async function playClusters(spec) {
    await playCluster(spec.demo.twoCluster);
    await wait(260);
    await playCluster(spec.demo.threeCluster);
  }

  async function playL02Landmark(spec) {
    setGroupOutlines(pianoRoot, ['two']);
    await playSequence([spec.demo.landmark[0], spec.demo.landmark[1]], 320);
    await playSequence([spec.guidedC], 520);
  }

  async function playL09Landmark(spec) {
    setGroupOutlines(pianoRoot, ['three']);
    await playSequence(spec.demo.clusterThenF, 360);
  }

  async function playStaffNotes(notes) {
    stopDemo();
    player.setDemoPlaying(true);
    const ok = audio.ensure();
    player.setAudioUnlocked(ok);
    if (!ok) {
      player.setDemoPlaying(false);
      ui.feedback.textContent = player.lessonSpec.copy.feedback.audioMissing;
      return;
    }
    for (const note of notes) {
      input.playDemoNote(note.midi);
      setSweep(pianoRoot, note.midi);
      await wait(durationMs(note.duration));
      input.releaseDemoNote(note.midi);
    }
    setSweep(pianoRoot, null);
    player.setDemoPlaying(false);
  }

  async function playLongShortContrast() {
    stopDemo();
    player.setDemoPlaying(true);
    const ok = audio.ensure();
    player.setAudioUnlocked(ok);
    if (!ok) {
      player.setDemoPlaying(false);
      return;
    }
    input.playDemoNote(67);
    setSweep(pianoRoot, 67);
    await wait(durationMs('half'));
    input.releaseDemoNote(67);
    await wait(80);
    input.playDemoNote(67);
    setSweep(pianoRoot, 67);
    await wait(durationMs('quarter'));
    input.releaseDemoNote(67);
    setSweep(pianoRoot, null);
    player.setDemoPlaying(false);
  }

  function hintToggle(view) {
    const copy = view.lessonSpec.copy.guided;
    ui.actions.append(button(view.hintsOn ? copy.hintsOff : copy.hintsOn, () => {
      player.setHints(!view.hintsOn);
      lastFeedback = view.hintsOn ? 'Hints hidden.' : 'Hints back on. Independent still needs them off.';
      paint();
    }));
  }

  function renderGuided(view) {
    const spec = view.lessonSpec;
    const copy = spec.copy.guided;
    if (id === 'L01') {
      if (view.guidedStep === 'unlock') {
        ui.actions.append(button(copy.unlockAction, () => {
          const ok = audio.ensure();
          player.setAudioUnlocked(ok);
          lastFeedback = ok ? spec.copy.feedback.unlocked : spec.copy.feedback.audioMissing;
          paint();
        }, 'button-dark'));
      }
      if (view.guidedStep === 'posture') {
        ui.extras.append(checkbox(copy.postureLabel, view.attempt.adultObserved.posture, (checked) => {
          player.setPosture(checked);
          paint();
        }));
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'high-low' || view.guidedStep === 'groups') hintToggle(view);
      return;
    }
    if (id === 'L02') {
      if (view.guidedStep === 'name') {
        ui.actions.append(button('Hear C again', () => playSequence([spec.guidedC], 500)));
        ui.actions.append(button('I said C', () => { player.skipNamedGuided(); lastFeedback = spec.copy.feedback.named; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'other' || view.guidedStep === 'done') {
        ui.extras.append(checkbox(copy.adultOther, view.attempt.adultObserved.note === 'adult-confirmed-other-c', (checked) => {
          player.setAdultOtherC(checked);
          lastFeedback = spec.copy.feedback.otherC;
          paint();
        }));
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'find' || view.guidedStep === 'other') hintToggle(view);
      return;
    }
    if (id === 'L03') {
      if (view.guidedStep === 'fingering') {
        ui.extras.append(checkbox(copy.fingeringLabel, view.attempt.adultObserved.fingering, (checked) => {
          player.setFingering(checked);
          paint();
        }));
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep !== 'fingering') hintToggle(view);
      return;
    }
    if (id === 'L04') {
      if (view.guidedStep === 'hear') {
        ui.actions.append(button('Hear Little Wave', () => {
          player.startGuidedHear();
          playSequence(spec.demo.home, 480);
          paint();
        }, 'button-dark'));
      }
      if (view.guidedStep === 'cousin') {
        ui.actions.append(button('Hear the cousin once', () => {
          player.markHeardTransfer();
          lastFeedback = spec.copy.feedback.cousinListen;
          playSequence(spec.demo.transfer, 480);
          paint();
        }));
        if (view.heardTransfer) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      if (view.guidedStep === 'head' || view.guidedStep === 'tail' || view.guidedStep === 'all') hintToggle(view);
      return;
    }
    if (usesRhythmTake(id)) {
      if (view.guidedStep === 'hear') {
        ui.actions.append(button(copy.hear || 'Hear it', () => {
          player.markHeardDemo?.();
          playRhythmPattern(spec.patterns.guided);
          lastFeedback = spec.copy.feedback.heard;
          paint();
        }, 'button-dark'));
      }
      if (view.guidedStep === 'echo') {
        rhythmTakeButtons('guided');
        hintToggle(view);
      }
      if (view.guidedStep === 'cousin') {
        ui.actions.append(button('Hear the cousin once', () => {
          player.markHeardTransfer();
          lastFeedback = spec.copy.feedback.cousinListen;
          playRhythmPattern(spec.patterns.transfer);
          paint();
        }));
        if (view.heardTransfer) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      if (view.guidedStep === 'done') {
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (id === 'L16' && (view.guidedStep === 'echo' || view.guidedStep === 'done') && copy.handLabel) {
        ui.extras.append(checkbox(copy.handLabel, view.attempt.adultObserved.hand, (checked) => {
          player.setHandMark(checked);
          paint();
        }));
      }
    }
    if (usesTogetherTake(id)) {
      if (view.guidedStep === 'left' || view.guidedStep === 'right' || view.guidedStep === 'loop' || view.guidedStep === 'together') {
        if ((view.guidedStep === 'together' || view.guidedStep === 'loop') && !view.handsReady) {
          ui.actions.append(el('p', { className: 'unit-limit' }, spec.copy.feedback.needHands));
        } else {
          rhythmTakeButtons('guided');
        }
        hintToggle(view);
      }
      if (view.guidedStep === 'cousin') {
        ui.actions.append(button('Hear the cousin once', () => {
          player.markHeardTransfer();
          lastFeedback = spec.copy.feedback.cousinListen;
          playRhythmPattern(spec.patterns.transfer);
          paint();
        }));
        if (view.heardTransfer && view.homeDone && view.handsReady) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      if (view.guidedStep === 'done') {
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if ((view.guidedStep === 'together' || view.guidedStep === 'done' || view.guidedStep === 'cousin') && copy.handLabel) {
        ui.extras.append(checkbox(copy.handLabel, view.attempt.adultObserved.hand, (checked) => {
          player.setHandMark(checked);
          paint();
        }));
      }
      if (view.togetherStandIn) {
        ui.extras.append(el('p', { className: 'unit-limit' }, view.togetherStandIn));
      }
    }
    if (id === 'L09') {
      if (view.guidedStep === 'name') {
        ui.actions.append(button('Hear F again', () => playSequence([spec.register.F], 500)));
        ui.actions.append(button('I said F', () => { player.skipNamedGuided(); lastFeedback = spec.copy.feedback.named; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'fingering' || view.guidedStep === 'done') {
        ui.extras.append(checkbox(copy.fingeringLabel, view.attempt.adultObserved.fingering, (checked) => {
          player.setFingering(checked);
          paint();
        }));
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'find' || view.guidedStep === 'neighbor') hintToggle(view);
      return;
    }
    if (id === 'L10') {
      if (view.guidedStep === 'done') {
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep !== 'done') hintToggle(view);
      return;
    }
    if (id === 'L11') {
      if (view.guidedStep === 'done') {
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep !== 'done') hintToggle(view);
      return;
    }
    if (id === 'L12') {
      if (view.guidedStep === 'hear') {
        ui.actions.append(button('Hear Porch Steps', () => {
          player.startGuidedHear();
          playStaffNotes(spec.homeNotes);
          paint();
        }, 'button-dark'));
      }
      if (view.guidedStep === 'cousin') {
        ui.actions.append(button('Hear the cousin once', () => {
          player.markHeardTransfer();
          lastFeedback = spec.copy.feedback.cousinListen;
          playStaffNotes(spec.transferNotes);
          paint();
        }));
        if (view.heardTransfer) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      if (view.guidedStep === 'head' || view.guidedStep === 'tail' || view.guidedStep === 'all' || view.guidedStep === 'make') hintToggle(view);
      return;
    }
    if (id === 'L13') {
      if (view.guidedStep === 'name') {
        ui.actions.append(button('Hear C again', () => playSequence([spec.register.C], 500)));
        ui.actions.append(button('I said C', () => { player.skipNamedGuided(); lastFeedback = spec.copy.feedback.named; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'fingering' || view.guidedStep === 'done') {
        ui.extras.append(checkbox(copy.fingeringLabel, view.attempt.adultObserved.fingering, (checked) => {
          player.setFingering(checked);
          paint();
        }));
        ui.extras.append(checkbox(copy.handLabel, view.attempt.adultObserved.hand, (checked) => {
          player.setHandMark(checked);
          paint();
        }));
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'find' || view.guidedStep === 'neighbors') hintToggle(view);
      return;
    }
    if (id === 'L14') {
      if (view.guidedStep === 'done') {
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep !== 'done') hintToggle(view);
      return;
    }
    if (id === 'L15') {
      if (view.guidedStep === 'hands' || view.guidedStep === 'done') {
        ui.extras.append(checkbox(copy.handLabel, view.attempt.adultObserved.hand, (checked) => {
          player.setHandMark(checked);
          paint();
        }));
        ui.extras.append(checkbox(copy.fingeringLabel, view.attempt.adultObserved.fingering, (checked) => {
          player.setFingering(checked);
          paint();
        }));
        ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'question' || view.guidedStep === 'answer' || view.guidedStep === 'both') hintToggle(view);
    }
    if (usesExpressionTake(id)) renderExpressionGuided(view);
  }

  function renderExpressionGuided(view) {
    const spec = view.lessonSpec;
    const copy = spec.copy.guided;
    if (id === 'L21') {
      if (view.guidedStep === 'hear') {
        ui.actions.append(button(copy.hear, () => {
          player.markHeardDemo();
          playSequence(spec.homePhrase.slice(0, 4), 480, spec.quietVelocity).then(() => playSequence(spec.homePhrase.slice(0, 4), 480, spec.strongVelocity));
          lastFeedback = spec.copy.feedback.heard;
          paint();
        }, 'button-dark'));
      }
      if (view.guidedStep === 'notes') hintToggle(view);
      if (view.guidedStep === 'listen' || view.guidedStep === 'done') {
        ui.extras.append(checkbox(copy.listen, view.attempt.adultObserved.listened, (checked) => {
          player.setListened(checked);
          paint();
        }));
        ui.extras.append(checkbox(copy.self, view.attempt.adultObserved.selfHeard, (checked) => {
          player.setSelfHeard(checked);
          paint();
        }));
        ui.extras.append(el('p', { className: 'unit-limit' }, view.dynamicsHonesty || spec.copy.feedback.technique));
      }
      if (view.guidedStep === 'cousin') {
        ui.actions.append(button('Hear the cousin once', () => {
          player.markHeardTransfer();
          lastFeedback = spec.copy.feedback.cousinListen;
          playSequence(spec.transferPhrase.slice(0, 4), 480, spec.quietVelocity);
          paint();
        }));
        if (view.heardTransfer && view.homeDone) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      return;
    }
    if (id === 'L22') {
      if (view.guidedStep === 'pick' || view.guidedStep === 'play') {
        choiceButtons(view, spec.choices, player.setChoice);
        if (view.guidedStep === 'play') hintToggle(view);
      }
      if (view.guidedStep === 'cousin') {
        ui.actions.append(button('Hear the downward start once', () => {
          player.markHeardTransfer();
          lastFeedback = spec.copy.feedback.cousinListen;
          playSequence(spec.transferStem, 420);
          paint();
        }));
        if (view.heardTransfer && view.homeDone) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      return;
    }
    if (id === 'L23') {
      if (view.guidedStep === 'pick' || view.guidedStep === 'work' || view.guidedStep === 'whole') {
        purposeButtons(view);
        if (view.guidedStep === 'work' && view.useClock) rhythmTakeButtons('guided');
        if (view.guidedStep !== 'pick') hintToggle(view);
      }
      if (view.guidedStep === 'cousin') {
        ui.actions.append(button('Hear the cousin once', () => {
          player.markHeardTransfer();
          lastFeedback = spec.copy.feedback.cousinListen;
          playSequence(spec.transferPhrase, 420);
          paint();
        }));
        if (view.heardTransfer && view.homeDone) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      return;
    }
    if (id === 'L24') {
      if (view.guidedStep === 'pick' || view.guidedStep === 'remind' || view.guidedStep === 'play') {
        pieceButtons(view);
      }
      if (view.guidedStep === 'remind') {
        ui.actions.append(button(copy.remind, () => {
          player.markHeardDemo();
          const phrase = player.view().expectedPhrase;
          if (phrase) playSequence(phrase, 420);
          paint();
        }));
      }
      if (view.guidedStep === 'play') {
        hintToggle(view);
        ui.actions.append(button(spec.copy.independent.imFinished, () => {
          const result = player.finishShare();
          lastFeedback = result.message;
          paint();
        }, 'button-dark'));
      }
      if (view.guidedStep === 'listen' || view.guidedStep === 'done' || view.homeDone) {
        ui.extras.append(checkbox(copy.listen, view.attempt.adultObserved.listened, (checked) => {
          player.setListened(checked);
          paint();
        }));
        ui.extras.append(checkbox(copy.self, view.attempt.adultObserved.selfHeard, (checked) => {
          player.setSelfHeard(checked);
          paint();
        }));
        if (view.homeDone) {
          ui.actions.append(button(copy.action, () => { go('guided'); lastFeedback = spec.copy.feedback.hintsOff; paint(); }, 'button-dark'));
        }
      }
    }
  }

  function choiceButtons(view, choices, setter) {
    Object.values(choices || {}).forEach((choice) => {
      ui.actions.append(button(choice.label, () => {
        setter(choice.id);
        lastFeedback = `You picked ${choice.label}. That is one honest choice, not the only right song.`;
        paint();
      }, view.choiceId === choice.id ? 'button-dark' : 'button-outline'));
    });
  }

  function purposeButtons(view) {
    [
      ['notes', 'Notes first'],
      ['rhythm', 'Rhythm on the clock'],
      ['spot', 'The sticky last three']
    ].forEach(([idValue, label]) => {
      ui.actions.append(button(label, () => {
        player.setPurpose(idValue);
        lastFeedback = `Purpose: ${label}.`;
        paint();
      }, view.purpose === idValue ? 'button-dark' : 'button-outline'));
    });
  }

  function pieceButtons(view) {
    [
      ['wave', 'Little Wave'],
      ['walk', 'Soft Walk'],
      ['yours', 'Your ending']
    ].forEach(([idValue, label]) => {
      ui.actions.append(button(label, () => {
        const result = player.setRecitalPiece(idValue);
        lastFeedback = result?.blocked ? result.message : `Sharing ${label}.`;
        paint();
      }, view.recitalPiece === idValue ? 'button-dark' : 'button-outline'));
    });
  }

  function rhythmTakeButtons(kind) {
    ui.actions.append(button('Start the take', () => {
      beginRhythmTake(kind);
      paint();
    }, 'button-dark'));
    ui.actions.append(button('Pause', () => {
      const result = player.pauseTake();
      lastFeedback = result.message || player.lessonSpec.copy.feedback.paused;
      paint();
    }));
    ui.actions.append(button('Resume', () => {
      const result = player.resumeTake();
      lastFeedback = result.message || 'Back with the clock.';
      paint();
    }));
    ui.actions.append(button('Slower heartbeat', () => {
      player.reduceTempo();
      beginRhythmTake(kind);
      lastFeedback = player.lessonSpec.copy.feedback.slower;
      paint();
    }));
    ui.actions.append(button('Replay take', () => {
      player.replayTake();
      beginRhythmTake(kind);
      lastFeedback = 'New take. Earlier saved evidence stays.';
      paint();
    }));
  }

  function renderIndependent(view) {
    const spec = view.lessonSpec;
    const copy = spec.copy.independent;
    if (id === 'L01' && view.independentStep === 'high-low') {
      ui.actions.append(button(copy.hearWhite, () => playSequence(spec.demo.whiteHighLow, 520)));
    }
    if (id === 'L02') {
      ui.actions.append(button(copy.hearDoorstep, () => {
        showHouse = true;
        lastFeedback = copy.remediation;
        playSequence(spec.demo.doorstep, 520);
        paint();
      }));
      if (view.independentStep === 'register') {
        ui.extras.append(checkbox(copy.adultRegister, false, (checked) => {
          player.setAdultOtherC(checked);
          lastFeedback = spec.copy.feedback.otherC;
          if (player.view().independentStep === 'done') go('independent');
          paint();
        }));
      }
    }
    if (id === 'L03') {
      ui.actions.append(button(copy.hearNeighbors, () => playSequence([60, 62], 420)));
    }
    if (id === 'L04') {
      ui.actions.append(button(copy.clap, () => playSequence(spec.homeTail, 420)));
    }
    if (id === 'L09') {
      ui.actions.append(button(copy.hearDoorstep, () => {
        showThreeHouse = true;
        lastFeedback = copy.remediation;
        playSequence(spec.demo.neighbors, 520);
        paint();
      }));
    }
    if (id === 'L10') {
      ui.actions.append(button(copy.hearNeighbors, () => playSequence([60, 62, 60, 64], 420)));
    }
    if (id === 'L11') {
      ui.actions.append(button(copy.hearWalk, () => playStaffNotes(spec.neighborNotes)));
    }
    if (id === 'L12') {
      ui.actions.append(button(copy.clap, () => playSequence(spec.homeHead.slice(0, 2), 420)));
    }
    if (id === 'L13') {
      ui.actions.append(button(copy.hearDoorstep, () => {
        lastFeedback = copy.remediation;
        playSequence(spec.demo.contrast, 640);
        paint();
      }));
    }
    if (id === 'L14') {
      ui.actions.append(button(copy.hearWalk, () => playStaffNotes(spec.neighborNotes)));
    }
    if (id === 'L15') {
      ui.actions.append(button(copy.hearBoth, () => playStaffNotes(spec.homeNotes)));
    }
    if (usesClockTake(id)) rhythmTakeButtons('independent');
    if (usesTogetherTake(id) && view.togetherStandIn) {
      ui.extras.append(el('p', { className: 'unit-limit' }, view.togetherStandIn));
    }
    if (usesExpressionTake(id)) renderExpressionCheck(view, 'independent');
    ui.actions.append(button(copy.finishForNow, () => { player.finishForNow(); lastFeedback = ''; paint(); }));
  }

  function renderTransfer(view) {
    const spec = view.lessonSpec;
    const copy = spec.copy.transfer;
    if (id === 'L01') {
      if (view.transferStep === 'other-two') {
        ui.extras.append(checkbox(copy.adultTwo, false, (checked) => {
          if (!checked) return;
          player.setAdultTwo(true);
          lastFeedback = 'Saved the grown-up confirm for another group of two.';
          paint();
        }));
      }
      if (view.transferStep === 'three') {
        ui.extras.append(checkbox(copy.adultThree, false, (checked) => {
          if (!checked) return;
          player.setAdultThree(true);
          lastFeedback = '';
          paint();
        }));
      }
    }
    if (id === 'L02') {
      ui.extras.append(checkbox(copy.adultHouse, false, (checked) => {
        if (!checked) return;
        player.setAdultOtherHouse(true);
        lastFeedback = '';
        paint();
      }));
    }
    if (usesClockTake(id)) rhythmTakeButtons('transfer');
    if (usesExpressionTake(id)) renderExpressionCheck(view, 'transfer');
  }

  function renderExpressionCheck(view, phase) {
    const spec = view.lessonSpec;
    const copy = spec.copy[phase];
    if (id === 'L21') {
      ui.extras.append(el('p', { className: 'unit-limit' }, view.dynamicsHonesty));
      ui.extras.append(checkbox(spec.copy.guided.listen, view.attempt.adultObserved.listened, (checked) => {
        player.setListened(checked);
        paint();
      }));
      ui.extras.append(checkbox(spec.copy.guided.self, view.attempt.adultObserved.selfHeard, (checked) => {
        player.setSelfHeard(checked);
        paint();
      }));
    }
    if (id === 'L22') {
      choiceButtons(view, phase === 'transfer' ? spec.transferChoices : spec.choices, player.setChoice);
    }
    if (id === 'L23') {
      purposeButtons(view);
      if (view.useClock) rhythmTakeButtons(phase);
    }
    if (id === 'L24') {
      pieceButtons(view);
      ui.actions.append(button(spec.copy.independent.imFinished, () => {
        const result = player.finishShare();
        lastFeedback = result.message;
        if (player.view().independentStep === 'done' && phase === 'independent') go('independent');
        if (player.view().transferStep === 'done' && phase === 'transfer') go('transfer');
        paint();
      }, 'button-dark'));
      ui.extras.append(checkbox(spec.copy.guided.listen, view.attempt.adultObserved.listened, (checked) => {
        player.setListened(checked);
        paint();
      }));
      ui.extras.append(checkbox(spec.copy.guided.self, view.attempt.adultObserved.selfHeard, (checked) => {
        player.setSelfHeard(checked);
        paint();
      }));
    }
    if (copy?.pick) ui.extras.append(el('p', { className: 'unit-limit' }, copy.pick));
  }

  function renderReview(view) {
    const copy = view.lessonSpec.copy.review;
    if (!view.reviewPaused) {
      ui.actions.append(button(copy.pause, () => { player.pauseForReview(); lastFeedback = copy.pause; paint(); }));
    } else {
      ui.actions.append(button(copy.back, () => { lastFeedback = copy.play; paint(); }, 'button-dark'));
      if (usesClockTake(id) || view.useClock) rhythmTakeButtons('review');
      if (usesExpressionTake(id) && id !== 'L23') {
        ui.actions.append(button(view.lessonSpec.copy.independent?.imFinished || 'I finished', () => {
          const result = player.finishShare?.() || { message: copy.play };
          lastFeedback = result.message;
          paint();
        }));
      }
    }
  }

  function renderResult(view) {
    const copy = view.lessonSpec.copy.result;
    if (view.firstCompletionNow) {
      ui.extras.append(el('div', { className: 'reward-pill' }, copy.firstReward, el('span', {}, 'First finish on this device')));
    }
    if (view.resultCard) ui.extras.append(renderResultCard(view.resultCard));
    if (view.dynamicsHonesty) ui.extras.append(el('p', { className: 'unit-limit' }, view.dynamicsHonesty));
    const rec = recommendAfterLesson(progress.read().store, id, progress.read().store.session);
    if (rec && rec.kind !== 'rest') {
      ui.actions.append(el('a', { className: 'button button-dark', href: rec.href }, rec.action));
    } else {
      const next = nextHref(id);
      const nextReady = next !== '/learn/' && isLessonUnlocked(progress.read().store, next.replace('/learn/?lesson=', ''));
      if (nextReady) {
        ui.actions.append(el('a', { className: 'button button-dark', href: next }, 'Continue to the next activity'));
      }
    }
    if ((id === 'L04' || id === 'L12' || usesClockTake(id) || usesExpressionTake(id)) && (view.lesson.evidenceState === 'independent' || view.lesson.evidenceState === 'retained') && player.beginReview) {
      ui.actions.append(button(copy.pause, () => { player.beginReview(); lastFeedback = view.lessonSpec.copy.review.pause; paint(); }));
    }
    ui.actions.append(
      button(copy.restart, confirmRestart),
      el('a', { className: 'button button-outline', href: '/learn/' }, copy.home || `Back to ${unitTitleFor(id)}`)
    );
  }

  function confirmRestart() {
    const ok = window.confirm('Start this lesson over on this device? Earlier saved evidence stays. This does not erase Independent if you already earned it. A new try begins at the first step.');
    if (!ok) return;
    stopDemo();
    player.restart();
    lastFeedback = 'A new try. This one starts from the beginning.';
    paint();
  }

  function button(label, onClick, className = 'button-outline') {
    return el('button', { className: `button ${className}`, type: 'button', onClick }, label);
  }

  function checkbox(label, checked, onChange) {
    const inputEl = el('input', { type: 'checkbox' });
    inputEl.checked = checked;
    inputEl.addEventListener('change', () => onChange(inputEl.checked));
    return el('label', { className: 'grownup-check' }, inputEl, el('span', {}, label));
  }

  document.querySelector('#sound-toggle').addEventListener('click', () => {
    audio.setMuted(!audio.isMuted());
    const muted = audio.isMuted();
    document.querySelector('#sound-toggle').setAttribute('aria-pressed', String(muted));
    document.querySelector('#sound-toggle span').textContent = muted ? 'Sound off' : 'Sound on';
  });

  midiButton.addEventListener('click', () => {
    input.requestMidi(midiStatus, midiButtonLabel || midiButton, midiDevices).then(paintMidi);
  });

  restartButton.addEventListener('click', confirmRestart);
  if (pauseButton) pauseButton.addEventListener('click', pauseLesson);
  if (exitButton) exitButton.addEventListener('click', exitLesson);
  if (resumeButton) resumeButton.addEventListener('click', resumeLesson);
  document.querySelector('#pause-resume')?.addEventListener('click', resumeLesson);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
    event.preventDefault();
    if (lessonPaused) resumeLesson();
    else pauseLesson();
  });
  helpButton.addEventListener('click', () => {
    if (player.requestHelp) player.requestHelp();
    else player.setHints(true);
    lastFeedback = 'Help is on. Saved progress on this device stays. Hide hints for a quiet Independent check.';
    paint();
  });

  document.querySelector('#unlock-area').addEventListener('pointerdown', () => {
    if (audio.ensure()) player.setAudioUnlocked(true);
  }, { once: true });

  if (ui.handFocus) {
    ui.handFocus.addEventListener('click', (event) => {
      const button = event.target.closest('[data-focus]');
      if (!button || !player.setHandFocus) return;
      const previous = player.view();
      player.setHandFocus(button.dataset.focus);
      lastFeedback = `Practicing the ${button.dataset.focus === 'both' ? 'both-hands picture' : `${button.dataset.focus} hand`}. Same step. MIDI still only hears pitch and time.`;
      if (previous.phase === player.view().phase && previous.guidedStep === player.view().guidedStep) {
        paint();
      } else {
        paint();
      }
    });
  }

  paint();
}
