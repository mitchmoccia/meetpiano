import { createAudio } from '../js/audio.js';
import { bindInputs } from '../js/input.js';
import { createPlayer } from '../js/player.js';
import { createProgress } from '../js/progress.js';
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
import { isLessonUnlocked, parseLessonId } from '../js/unit.js';

const progress = createProgress();
const audio = createAudio();
const params = new URLSearchParams(window.location.search);
const requested = parseLessonId(params.get('lesson'));
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
    document.querySelector('#storage-notice').textContent = `${requested} is locked on this device until the earlier First Notes activity is ready.`;
  }
  renderUnitHub(hub, store, { onOpen: openLesson, onContinue: openLesson });
} else {
  startLesson(lessonId);
}

function startLesson(id) {
  const player = createPlayer({ progress, lessonId: id });
  const input = bindInputs({
    pianoRoot,
    audio,
    onUserNote: (note, source, extras) => applyNote(player.handleNote(note, source, extras)),
    isDemoPlaying: () => player.isDemoPlaying(),
    onMidiStatus: paintMidi,
    shell
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
    tiles: document.querySelector('#phrase-tiles'),
    continueNote: document.querySelector('#continue-note'),
    evidence: document.querySelector('#evidence-pill'),
    label: document.querySelector('#lesson-label')
  };

  let demoTimers = [];
  let lastFeedback = '';
  let showHouse = false;

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
    const view = player.view();
    if (view.phase === 'independent' && view.independentStep === 'done') player.advanceFrom('independent');
    if (view.phase === 'transfer' && view.transferStep === 'done' && id !== 'L01') player.advanceFrom('transfer');
    paint();
  }

  function paint() {
    const view = player.view();
    const copy = phaseCopy(view);
    document.title = `${view.lessonSpec.title} · First Notes · MeetPiano`;
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
    ui.wave.hidden = id !== 'L04' || (view.phase !== 'demo' && view.phase !== 'guided');
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
    if (id === 'L04') {
      const captions = view.captions || {};
      return Object.keys(captions).map(Number);
    }
    return [];
  }

  function groupKinds(view) {
    if (id === 'L01' && view.phase === 'demo') return ['two', 'three'];
    if (id === 'L01' && view.phase === 'guided' && view.hintsOn && view.guidedStep === 'groups') return ['two', 'three'];
    if (id === 'L02' && (view.phase === 'demo' || (view.phase === 'guided' && view.hintsOn))) return ['two'];
    return [];
  }

  function renderActions(view, copy) {
    if (view.phase === 'explanation') {
      ui.actions.append(button(copy.action, () => { player.advanceFrom('explanation'); lastFeedback = ''; paint(); }, 'button-dark'));
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
    ui.actions.append(button(copy.action, () => { stopDemo(); player.advanceFrom('demo'); lastFeedback = ''; paint(); }, 'button-dark'));
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
        ui.actions.append(button(copy.action, () => { player.advanceFrom('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'high-low' || view.guidedStep === 'groups') hintToggle(view);
      return;
    }
    if (id === 'L02') {
      if (view.guidedStep === 'name') {
        ui.actions.append(button('Hear C again', () => playSequence([spec.guidedC], 500)));
        ui.actions.append(button('I said C', () => { player.skipNamedGuided(); lastFeedback = spec.copy.feedback.named; paint(); }, 'button-dark'));
      }
      if (view.guidedStep === 'other') {
        ui.extras.append(checkbox(copy.adultOther, view.attempt.adultObserved.note === 'adult-confirmed-other-c', (checked) => {
          player.setAdultOtherC(checked);
          lastFeedback = spec.copy.feedback.otherC;
          paint();
        }));
        ui.actions.append(button(copy.action, () => { player.advanceFrom('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
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
        ui.actions.append(button(copy.action, () => { player.advanceFrom('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
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
          ui.actions.append(button(copy.action, () => { player.advanceFrom('guided'); lastFeedback = 'Hints stay off for this check.'; paint(); }, 'button-dark'));
        }
      }
      if (view.guidedStep === 'head' || view.guidedStep === 'tail' || view.guidedStep === 'all') hintToggle(view);
    }
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
  }

  function renderReview(view) {
    const copy = view.lessonSpec.copy.review;
    if (!view.reviewPaused) {
      ui.actions.append(button(copy.pause, () => { player.pauseForReview(); lastFeedback = copy.pause; paint(); }));
    } else {
      ui.actions.append(button(copy.back, () => { lastFeedback = copy.play; paint(); }, 'button-dark'));
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
    if (id === 'L04' && (view.lesson.evidenceState === 'independent' || view.lesson.evidenceState === 'retained')) {
      ui.actions.append(button(copy.pause, () => { player.beginReview(); lastFeedback = view.lessonSpec.copy.review.pause; paint(); }));
    }
    ui.actions.append(
      button(copy.restart, confirmRestart),
      el('a', { className: 'button button-outline', href: '/learn/' }, copy.home || 'Back to First Notes')
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
