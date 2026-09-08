import { createAudio } from '../js/audio.js';
import { bindInputs } from '../js/input.js';
import { createPlayer } from '../js/player.js';
import { createProgress } from '../js/progress.js';
import { renderPiano, setGroupOutlines, setHints, setSweep } from '../js/piano.js';
import { el, evidenceLabel, phaseCopy, renderParagraphs, renderSteps } from '../js/learn-view.js';

const progress = createProgress();
const audio = createAudio();
const player = createPlayer({ progress });
const pianoRoot = document.querySelector('#piano');
const shell = document.querySelector('.learn-shell');
renderPiano(pianoRoot);

const input = bindInputs({
  pianoRoot,
  audio,
  onUserNote: (note, source) => applyNote(player.handleNote(note, source)),
  isDemoPlaying: () => player.isDemoPlaying(),
  shell
});

const ui = {
  notice: document.querySelector('#storage-notice'),
  disclosure: document.querySelector('#device-disclosure'),
  steps: document.querySelector('#phase-steps'),
  eyebrow: document.querySelector('#phase-eyebrow'),
  title: document.querySelector('#phase-title'),
  copy: document.querySelector('#phase-copy'),
  actions: document.querySelector('#phase-actions'),
  extras: document.querySelector('#phase-extras'),
  feedback: document.querySelector('#phase-feedback'),
  seating: document.querySelector('#seating-card'),
  groups: document.querySelector('#group-labels'),
  continueNote: document.querySelector('#continue-note'),
  evidence: document.querySelector('#evidence-pill')
};

let demoTimers = [];
let lastFeedback = '';

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
  if (result.remediate) showRemediation();
  const view = player.view();
  if (view.phase === 'independent' && view.independentStep === 'done') {
    player.advanceFrom('independent');
  }
  paint();
}

function showRemediation() {
  ui.feedback.textContent = player.lessonSpec.copy.independent.remediation;
}

function paint() {
  const view = player.view();
  const copy = phaseCopy(view);
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
  ui.seating.hidden = view.phase !== 'demo' && view.phase !== 'guided';
  ui.groups.hidden = view.phase !== 'demo' && !(view.phase === 'guided' && view.guidedStep === 'groups' && view.hintsOn);
  ui.actions.replaceChildren();
  ui.extras.replaceChildren();
  setHints(pianoRoot, hintNotes(view));
  setGroupOutlines(pianoRoot, groupKinds(view));
  renderActions(view, copy);
  if (lastFeedback) ui.feedback.textContent = lastFeedback;
  else if (!ui.feedback.textContent) ui.feedback.textContent = 'Ready when you are.';
}

function hintNotes(view) {
  if (view.phase !== 'guided' || !view.hintsOn) return [];
  if (view.guidedStep === 'high-low') return view.lessonSpec.hintHighLow;
  return [];
}

function groupKinds(view) {
  if (view.phase === 'demo') return ['two', 'three'];
  if (view.phase === 'guided' && view.hintsOn && view.guidedStep === 'groups') return ['two', 'three'];
  return [];
}

function renderActions(view, copy) {
  const spec = view.lessonSpec;
  if (view.phase === 'explanation') {
    ui.actions.append(button(copy.action, () => { player.advanceFrom('explanation'); lastFeedback = ''; paint(); }, 'button-dark'));
  }
  if (view.phase === 'demo') {
    ui.actions.append(
      button(copy.hearHighLow, () => playSequence(spec.demo.highLow, 520)),
      button(copy.hearSweep, () => playSweep(spec)),
      button(copy.hearClusters, () => playClusters(spec)),
      button(copy.action, () => { stopDemo(); player.advanceFrom('demo'); lastFeedback = spec.copy.feedback.unlocked; paint(); }, 'button-dark')
    );
  }
  if (view.phase === 'guided') renderGuided(view);
  if (view.phase === 'independent') renderIndependent(view);
  if (view.phase === 'transfer') renderTransfer(view);
  if (view.phase === 'result') renderResult(view);
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

function renderGuided(view) {
  const copy = view.lessonSpec.copy.guided;
  if (view.guidedStep === 'unlock') {
    ui.actions.append(button(copy.unlockAction, () => {
      const ok = audio.ensure();
      player.setAudioUnlocked(ok);
      lastFeedback = ok ? view.lessonSpec.copy.feedback.unlocked : view.lessonSpec.copy.feedback.audioMissing;
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
  if (view.guidedStep === 'high-low' || view.guidedStep === 'groups') {
    ui.actions.append(button(view.hintsOn ? copy.hintsOff : copy.hintsOn, () => {
      player.setHints(!view.hintsOn);
      lastFeedback = view.hintsOn ? 'Hints hidden.' : 'Hints back on.';
      paint();
    }));
  }
}

function renderIndependent(view) {
  const copy = view.lessonSpec.copy.independent;
  if (view.independentStep === 'high-low') {
    ui.actions.append(button(copy.hearWhite, () => playSequence(view.lessonSpec.demo.whiteHighLow, 520)));
  }
  ui.actions.append(button(copy.finishForNow, () => { player.finishForNow(); lastFeedback = ''; paint(); }));
}

function renderTransfer(view) {
  const copy = view.lessonSpec.copy.transfer;
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

function renderResult(view) {
  const copy = view.lessonSpec.copy.result;
  if (view.firstCompletionNow) {
    ui.extras.append(el('div', { className: 'reward-pill' }, copy.firstReward, el('span', {}, 'First finish on this device')));
  }
  ui.actions.append(
    button(copy.restart, confirmRestart),
    el('a', { className: 'button button-outline', href: '/' }, copy.home)
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

document.querySelector('#midi-button').addEventListener('click', () => {
  input.requestMidi(document.querySelector('#midi-status'), document.querySelector('#midi-button'));
});

document.querySelector('#restart-button').addEventListener('click', confirmRestart);

document.querySelector('#unlock-area').addEventListener('pointerdown', () => {
  if (audio.ensure()) player.setAudioUnlocked(true);
}, { once: true });

paint();
