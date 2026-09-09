import { COMPUTER_KEYS, clearPressed, setPressed } from './piano.js';
import { applyMidiEvent, createHeldNotes, createMidiSession, describeMidiState, deviceIdentity } from './midi.js';

export function bindInputs({ pianoRoot, audio, onUserNote, onUserRelease, isDemoPlaying, shell, onMidiStatus, clockNow }) {
  const heldComputerKeys = new Set();
  const heldNotes = createHeldNotes();
  let lastMidiIds = [];

  function stamp(extras = {}) {
    const t = typeof clockNow === 'function' ? clockNow() : null;
    return t == null ? extras : { ...extras, t };
  }

  function emitUserNote(note, source, extras = {}) {
    if (source === 'demo' || isDemoPlaying()) return;
    onUserNote(note, source, extras);
  }

  function emitUserRelease(note, source, extras = {}) {
    if (!onUserRelease || source === 'demo' || isDemoPlaying()) return;
    onUserRelease(note, source, extras);
  }

  function noteOn(note, source, velocity = 0.75, extras = {}) {
    audio.play(note, velocity);
    setPressed(pianoRoot, note, true);
    emitUserNote(note, source, stamp({ ...extras, velocity }));
  }

  function noteOff(note, source = 'touch') {
    audio.release(note);
    setPressed(pianoRoot, note, false);
    emitUserRelease(note, source, stamp());
  }

  function onPointerDown(event) {
    const key = event.currentTarget;
    const note = Number(key.dataset.note);
    if (!Number.isFinite(note)) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    key.focus({ preventScroll: true });
    try { key.setPointerCapture(event.pointerId); } catch (_) {}
    const press = heldNotes.press('pointer', note);
    if (!press.accepted) return;
    noteOn(note, 'touch');
  }

  function onPointerEnd(event) {
    const note = Number(event.currentTarget.dataset.note);
    if (!Number.isFinite(note)) return;
    if (!heldNotes.release('pointer', note).accepted) return;
    noteOff(note, 'touch');
  }

  pianoRoot.querySelectorAll('.piano-key').forEach((key) => {
    const note = Number(key.dataset.note);
    key.addEventListener('pointerdown', onPointerDown);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
      key.addEventListener(type, onPointerEnd);
    });
    key.addEventListener('keydown', (event) => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault();
        const press = heldNotes.press('pointer', note);
        if (!press.accepted) return;
        noteOn(note, 'touch');
      }
    });
    key.addEventListener('keyup', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!heldNotes.release('pointer', note).accepted) return;
        noteOff(note, 'touch');
      }
    });
    key.addEventListener('click', (event) => {
      if (event.detail === 0) {
        const press = heldNotes.press('pointer', note);
        if (!press.accepted) return;
        noteOn(note, 'touch');
        window.setTimeout(() => {
          if (heldNotes.release('pointer', note).accepted) noteOff(note, 'touch');
        }, 300);
      }
    });
  });

  function onWindowKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    const key = event.key.toLowerCase();
    if (!(key in COMPUTER_KEYS)) return;
    if (shell) {
      const rect = shell.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    }
    event.preventDefault();
    if (!heldNotes.press('computer', COMPUTER_KEYS[key]).accepted) return;
    heldComputerKeys.add(key);
    noteOn(COMPUTER_KEYS[key], 'computer-keys');
  }

  function onWindowKeyUp(event) {
    const key = event.key.toLowerCase();
    if (!heldComputerKeys.has(key)) return;
    heldComputerKeys.delete(key);
    const note = COMPUTER_KEYS[key];
    if (heldNotes.release('computer', note).accepted) noteOff(note, 'computer-keys');
  }

  function silence({ keepMidiHolds = false } = {}) {
    heldComputerKeys.clear();
    heldNotes.clearComputer();
    heldNotes.clearPort('pointer');
    if (!keepMidiHolds) {
      heldNotes.snapshot().forEach((key) => {
        const note = Number(String(key).split('::')[1]);
        if (Number.isFinite(note)) audio.release(note);
      });
    }
    audio.releaseAll();
    clearPressed(pianoRoot);
  }

  function onBlur() {
    silence({ keepMidiHolds: true });
    midi.blur();
  }

  window.addEventListener('keydown', onWindowKeyDown);
  window.addEventListener('keyup', onWindowKeyUp);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onBlur();
  });

  const midi = createMidiSession({
    onNote(note, device, velocity) {
      noteOn(note, 'midi', (velocity || 96) / 127, { device });
    },
    onRelease(note) {
      noteOff(note, 'midi');
    },
    onStatus(view) {
      lastMidiIds = view.devices.map((item) => item.id);
      onMidiStatus?.(view);
    }
  });

  function publishIdle() {
    onMidiStatus?.(describeMidiState({
      supported: typeof navigator.requestMIDIAccess === 'function',
      devices: [],
      previousIds: lastMidiIds
    }));
  }

  function requestMidi(statusNode, button, listNode) {
    function paint(view) {
      if (statusNode) statusNode.textContent = view.status;
      if (button) {
        button.textContent = view.buttonLabel;
        button.disabled = view.kind === 'requesting' || view.kind === 'unsupported';
      }
      if (listNode) {
        listNode.replaceChildren();
        if (!view.devices.length) {
          listNode.hidden = true;
          return;
        }
        listNode.hidden = false;
        view.devices.forEach((device) => {
          const item = document.createElement('li');
          item.textContent = device.manufacturer
            ? `${device.name} · ${device.manufacturer}`
            : device.name;
          listNode.append(item);
        });
      }
      onMidiStatus?.(view);
    }

    return midi.request().then((view) => {
      paint(view);
      return view;
    });
  }

  function ingestMidi(data, input) {
    const result = applyMidiEvent(midi.held, data, input?.id || 'midi');
    if (result.scored) {
      noteOn(result.parsed.note, 'midi', result.parsed.velocity / 127, { device: deviceIdentity(input) });
    }
    if (result.released) noteOff(result.parsed.note, 'midi');
    return result;
  }

  function playDemoNote(note, velocity = 0.65) {
    audio.play(note, velocity);
    setPressed(pianoRoot, note, true);
  }

  function releaseDemoNote(note) {
    audio.release(note);
    setPressed(pianoRoot, note, false);
  }

  publishIdle();

  return {
    requestMidi,
    playDemoNote,
    releaseDemoNote,
    silence,
    noteOn,
    noteOff,
    ingestMidi,
    midi,
    heldNotes
  };
}
