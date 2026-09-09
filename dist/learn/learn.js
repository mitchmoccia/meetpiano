import { createAudio } from '../js/audio.js';
import { bindInputs } from '../js/input.js';
import { createPlayer } from '../js/player.js';
import { createProgress } from '../js/progress.js';
import { createRhythmClock } from '../js/rhythm-clock.js';
import { patternSpanSec } from '../js/rhythm-score.js';
import {
  clearPressed,
  renderPiano,
  setGroupOutlines,
  setHints,
  setKeyCaptions,
  setSweep
} from '../js/piano.js';
import {
  el,
  evidenceLabel,
  lessonHref,
  nextHref,
  phaseCopy,
  renderParagraphs,
  renderPhraseTiles,
  renderSteps,
  renderUnitHub
} from '../js/learn-view.js';
import { isLessonUnlocked, isReadLesson, isRhythmLesson, parseLessonId, parseUnitId, unitTitleFor } from '../js/unit.js';
import { durationMs, renderStaff } from '../js/staff.js';

const progress = createProgress();
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

function openLesson(id) {
  window.location.href = lessonHref(id);
}

if (!lessonId) {
  hub.hidden = false;
  shell.hidden = true;
  helpButton.hidden = true;
  restartButton.hidden = true;
  hubLink.hidden = true;
  if (requested && !unlocked) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = `${requested} is locked on this device until the earlier activity is ready.`;
  } else if (requestedUnit === 'rhythm-club' && !isLessonUnlocked(store, 'L05')) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = 'Rhythm Club is locked on this device until First little tune is Independent.';
  } else if (requestedUnit === 'read-and-play' && !isLessonUnlocked(store, 'L09')) {
    document.querySelector('#storage-notice').hidden = false;
    document.querySelector('#storage-notice').textContent = 'Read and play is locked on this device until Notes with a beat is Independent.';
  }
  renderUnitHub(hub, store, { onOpen: openLesson, onContinue: openLesson, focusUnit: requestedUnit });
} else {
  startLesson(lessonId);
}

function startLesson(id) {
  const clock = createRhythmClock({
    now: () => {
      const audioNow = audio.currentTime();
      return audioNow == null ? performance.now() / 1000 : audioNow;
    }
  });
  const player = createPlayer({ progress, lessonId: id, clock });
  const input = bindInputs({
    pianoRoot,
    audio,
    onUserNote: (note, source, extras) => applyNote(player.handleNote(note, source, extras)),
    onUserRelease: (note, source, extras) => {
      if (player.handleRelease) applyNote(player.handleRelease(note, source, extras));
    },
    isDemoPlaying: () => player.isDemoPlaying(),
    onMidiStatus: (view) => {
      paintMidi(view);
      if (isRhythmLesson(id) && view.change?.type === 'disconnect' && player.abortTake) {
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
    label: document.querySelector('#lesson-label')
  };

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

  async function playSequence(notes, gap = 400) {
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
      input.playDemoNote(note);
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
    ui.seating.hidden = id !== 'L01' || (view.phase !== 'demo' && view.phase !== 'guided');
    ui.groups.hidden = id !== 'L01' || (view.phase !== 'demo' && !(view.phase === 'guided' && view.guidedStep === 'groups' && view.hintsOn));
    ui.hand.hidden = id !== 'L03' || (view.phase !== 'demo' && !(view.phase === 'guided' && view.guidedStep === 'row' && view.hintsOn));
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
    if (lastFeedback) ui.feedback.textContent = lastFeedback;
    else if (!ui.feedback.textContent) ui.feedback.textContent = 'Ready when you are.';
  }

  function hintNotes(view) {
    if (view.phase !== 'guided' || !view.hintsOn) return [];
    if (id === 'L01' && view.guidedStep === 'high-low') return view.lessonSpec.hintHighLow;
    if (id === 'L02' && view.guidedStep === 'find') return [view.lessonSpec.guidedC];
    if (id === 'L02' && view.guidedStep === 'other') return [view.lessonSpec.guidedC];
    if (id === 'L03' && view.guidedStep === 'find-c') return [60];
    if (id === 'L03' && view.guidedStep === 'neighbors') {
      return view.attempt.restore.sequence.length ? [64] : [62];
    }
    if (id === 'L04' || id === 'L08' || id === 'L10' || id === 'L11' || id === 'L12') {
      const captions = view.captions || {};
      return Object.keys(captions).map(Number);
    }
    if (id === 'L09' && view.guidedStep === 'find') return [65];
    if (id === 'L09' && view.guidedStep === 'neighbor') return [67];
    return [];
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
    const rhythm = isRhythmLesson(id);
    const showPulse = rhythm && view.phase !== 'explanation' && view.phase !== 'result';
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
    return [];
  }

  function renderActions(view, copy) {
    if (view.phase === 'explanation') {
      ui.actions.append(button(copy.action, () => { go('explanation'); lastFeedback = ''; paint(); }, 'button-dark'));
    }
    if (view.phase === 'demo') renderDemo(view);
    if (view.phase === 'guided') renderGuided(view);
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
    if (isRhythmLesson(id)) {
      ui.actions.append(button(copy.hear, () => {
        player.markHeardDemo?.();
        playRhythmPattern(spec.patterns.guided);
        lastFeedback = spec.copy.feedback.heard;
        paint();
      }));
      if (id === 'L08' && copy.hearWrong) {
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
    if (isRhythmLesson(id)) {
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
    }
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
    if (isRhythmLesson(id)) rhythmTakeButtons('independent');
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
    if (isRhythmLesson(id)) rhythmTakeButtons('transfer');
  }

  function renderReview(view) {
    const copy = view.lessonSpec.copy.review;
    if (!view.reviewPaused) {
      ui.actions.append(button(copy.pause, () => { player.pauseForReview(); lastFeedback = copy.pause; paint(); }));
    } else {
      ui.actions.append(button(copy.back, () => { lastFeedback = copy.play; paint(); }, 'button-dark'));
      if (isRhythmLesson(id)) rhythmTakeButtons('review');
    }
  }

  function renderResult(view) {
    const copy = view.lessonSpec.copy.result;
    if (view.firstCompletionNow) {
      ui.extras.append(el('div', { className: 'reward-pill' }, copy.firstReward, el('span', {}, 'First finish on this device')));
    }
    const next = nextHref(id);
    const nextReady = next !== '/learn/' && isLessonUnlocked(progress.read().store, next.replace('/learn/?lesson=', ''));
    if (nextReady) {
      ui.actions.append(el('a', { className: 'button button-dark', href: next }, 'Continue to the next activity'));
    }
    if ((id === 'L04' || id === 'L12' || isRhythmLesson(id)) && (view.lesson.evidenceState === 'independent' || view.lesson.evidenceState === 'retained') && player.beginReview) {
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
  helpButton.addEventListener('click', () => {
    if (player.requestHelp) player.requestHelp();
    else player.setHints(true);
    lastFeedback = 'Help is on. Saved progress on this device stays. Hide hints for a quiet Independent check.';
    paint();
  });

  document.querySelector('#unlock-area').addEventListener('pointerdown', () => {
    if (audio.ensure()) player.setAudioUnlocked(true);
  }, { once: true });

  paint();
}
