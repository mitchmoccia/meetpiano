import { COMPUTER_KEYS, clearPressed, setPressed } from './piano.js';

export function bindInputs({ pianoRoot, audio, onUserNote, isDemoPlaying, shell }) {
  const heldComputerKeys = new Set();
  let midiAccess = null;

  function sourceFromEvent(event) {
    if (event.pointerType === 'touch') return 'touch';
    return 'touch';
  }

  function noteOn(note, source, velocity = 0.75) {
    audio.play(note, velocity);
    setPressed(pianoRoot, note, true);
    if (source !== 'demo' && !isDemoPlaying()) onUserNote(note, source);
  }

  function noteOff(note) {
    audio.release(note);
    setPressed(pianoRoot, note, false);
  }

  function onPointerDown(event) {
    const key = event.currentTarget;
    const note = Number(key.dataset.note);
    if (!Number.isFinite(note)) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    key.focus({ preventScroll: true });
    try { key.setPointerCapture(event.pointerId); } catch (_) {}
    noteOn(note, sourceFromEvent(event));
  }

  function onPointerEnd(event) {
    const note = Number(event.currentTarget.dataset.note);
    if (Number.isFinite(note)) noteOff(note);
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
        noteOn(note, 'touch');
      }
    });
    key.addEventListener('keyup', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        noteOff(note);
      }
    });
    key.addEventListener('click', (event) => {
      if (event.detail === 0) {
        noteOn(note, 'touch');
        window.setTimeout(() => noteOff(note), 300);
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
    heldComputerKeys.add(key);
    noteOn(COMPUTER_KEYS[key], 'computer-keys');
  }

  function onWindowKeyUp(event) {
    const key = event.key.toLowerCase();
    if (!heldComputerKeys.has(key)) return;
    heldComputerKeys.delete(key);
    noteOff(COMPUTER_KEYS[key]);
  }

  function silence() {
    heldComputerKeys.clear();
    audio.releaseAll();
    clearPressed(pianoRoot);
  }

  window.addEventListener('keydown', onWindowKeyDown);
  window.addEventListener('keyup', onWindowKeyUp);
  window.addEventListener('blur', silence);

  function wireMidiInputs(statusNode, button) {
    const inputs = [...midiAccess.inputs.values()].filter((input) => input.state === 'connected');
    inputs.forEach((input) => {
      input.onmidimessage = ({ data }) => {
        if (!data || data.length < 3) return;
        const [status, note, velocity] = data;
        const command = status & 0xf0;
        if (command === 0x90 && velocity > 0) noteOn(note, 'midi', velocity / 127);
        if (command === 0x80 || (command === 0x90 && velocity === 0)) noteOff(note);
      };
    });
    if (statusNode) {
      statusNode.textContent = inputs.length
        ? `Connected: ${inputs.map((input) => input.name || 'MIDI keyboard').join(', ')}. Compatible keyboards only — this is not universal MIDI support.`
        : 'MIDI is ready. Connect a compatible keyboard by USB, then play a note. If nothing happens, keep using the on-screen keys.';
    }
    if (button) button.textContent = inputs.length ? 'Keyboard connected' : 'Listening for a keyboard…';
  }

  async function requestMidi(statusNode, button) {
    audio.ensure();
    if (!navigator.requestMIDIAccess) {
      if (statusNode) {
        statusNode.textContent = 'This browser does not offer MIDI. Use the on-screen keys or computer keys.';
      }
      return;
    }
    if (midiAccess) {
      wireMidiInputs(statusNode, button);
      return;
    }
    if (button) button.disabled = true;
    if (statusNode) statusNode.textContent = 'Allow access to a MIDI keyboard if your browser asks.';
    try {
      midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      wireMidiInputs(statusNode, button);
      midiAccess.onstatechange = () => wireMidiInputs(statusNode, button);
    } catch (_) {
      if (statusNode) {
        statusNode.textContent = 'Keyboard access was not available. The on-screen keys still work.';
      }
    } finally {
      if (button) button.disabled = false;
    }
  }

  function playDemoNote(note, velocity = 0.65) {
    audio.play(note, velocity);
    setPressed(pianoRoot, note, true);
  }

  function releaseDemoNote(note) {
    audio.release(note);
    setPressed(pianoRoot, note, false);
  }

  return {
    requestMidi,
    playDemoNote,
    releaseDemoNote,
    silence,
    noteOn,
    noteOff
  };
}
