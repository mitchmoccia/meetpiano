export const BLUR_POLICY = {
  id: 'blur-releases-sound-keeps-midi-holds',
  summary: 'Leaving the tab or window silences sound and clears on-screen pressed keys. Computer-key holds reset. MIDI notes that were already down stay locked so they cannot count again until a real note-off and a new note-on. Press again after you come back if you want the note to sound.'
};

export function parseMidiMessage(data) {
  if (!data || data.length < 3) return null;
  const status = Number(data[0]);
  const note = Number(data[1]);
  const velocity = Number(data[2]);
  if (!Number.isInteger(note) || note < 0 || note > 127) return null;
  if (!Number.isFinite(velocity)) return null;
  const command = status & 0xf0;
  const channel = status & 0x0f;
  if (command === 0x90 && velocity > 0) {
    return { type: 'note-on', note, velocity, channel };
  }
  if (command === 0x80 || (command === 0x90 && velocity === 0)) {
    return { type: 'note-off', note, velocity: 0, channel };
  }
  return null;
}

export function holdKey(portId, note) {
  return `${portId || 'local'}::${note}`;
}

export function createHeldNotes() {
  const held = new Set();

  return {
    press(portId, note) {
      const key = holdKey(portId, note);
      if (held.has(key)) return { accepted: false, reason: 'already-held' };
      held.add(key);
      return { accepted: true, key };
    },
    release(portId, note) {
      const key = holdKey(portId, note);
      if (!held.has(key)) return { accepted: false, reason: 'not-held' };
      held.delete(key);
      return { accepted: true, key };
    },
    has(portId, note) {
      return held.has(holdKey(portId, note));
    },
    notesFor(portId) {
      const prefix = `${portId || 'local'}::`;
      return [...held]
        .filter((key) => key.startsWith(prefix))
        .map((key) => Number(key.slice(prefix.length)));
    },
    clearPort(portId) {
      const notes = this.notesFor(portId);
      notes.forEach((note) => held.delete(holdKey(portId, note)));
      return notes;
    },
    clearComputer() {
      return this.clearPort('computer');
    },
    snapshot() {
      return [...held];
    },
    size() {
      return held.size;
    }
  };
}

export function applyMidiEvent(held, data, portId = 'midi') {
  const parsed = parseMidiMessage(data);
  if (!parsed) return { ignored: true, parsed: null, scored: false };
  if (parsed.type === 'note-on') {
    const press = held.press(portId, parsed.note);
    return {
      ignored: false,
      parsed,
      scored: press.accepted,
      released: false,
      reason: press.accepted ? 'note-on' : press.reason
    };
  }
  const release = held.release(portId, parsed.note);
  return {
    ignored: false,
    parsed,
    scored: false,
    released: release.accepted,
    reason: release.accepted ? 'note-off' : release.reason
  };
}

export function listMidiInputs(access) {
  if (!access || !access.inputs) return [];
  return [...access.inputs.values()].map((input) => ({
    id: input.id || '',
    name: input.name || 'MIDI keyboard',
    manufacturer: input.manufacturer || '',
    state: input.state || 'disconnected'
  }));
}

export function connectedMidiInputs(access) {
  return listMidiInputs(access).filter((input) => input.state === 'connected');
}

export function deviceIdentity(input) {
  if (!input) return null;
  const id = typeof input.id === 'string' && input.id ? input.id : null;
  const name = typeof input.name === 'string' && input.name ? input.name : null;
  const manufacturer = typeof input.manufacturer === 'string' && input.manufacturer ? input.manufacturer : null;
  if (!id && !name && !manufacturer) return null;
  return { id, name, manufacturer };
}

export function describeMidiState({
  supported,
  permission = 'unknown',
  devices = [],
  previousIds = [],
  requesting = false
}) {
  const connected = devices.filter((device) => device.state === 'connected');
  const names = connected.map((device) => device.name || 'MIDI keyboard');
  const currentIds = connected.map((device) => device.id);
  const lost = previousIds.filter((id) => !currentIds.includes(id));
  const gained = currentIds.filter((id) => !previousIds.includes(id));

  if (supported === false) {
    return {
      kind: 'unsupported',
      buttonLabel: 'MIDI not available in this browser',
      status: 'This browser does not offer Web MIDI. The on-screen keys and computer keys (A–J) still work. A real piano can still be a stand-in if a grown-up watches.',
      devices: [],
      change: null
    };
  }
  if (permission === 'denied') {
    return {
      kind: 'denied',
      buttonLabel: 'Keyboard access was not available',
      status: 'MIDI permission was not granted. Nothing is blocked: use the on-screen keys or computer keys. You can try connecting again if you change the browser permission.',
      devices: [],
      change: null
    };
  }
  if (requesting) {
    return {
      kind: 'requesting',
      buttonLabel: 'Waiting for MIDI permission…',
      status: 'Allow access to a MIDI keyboard if your browser asks. You can keep using the on-screen keys while you wait.',
      devices: connected,
      change: null
    };
  }
  if (lost.length && !connected.length) {
    return {
      kind: 'disconnected',
      buttonLabel: 'Keyboard disconnected',
      status: 'The MIDI keyboard disconnected. On-screen keys and computer keys still work. Plug it back in, then play a note or tap Connect again.',
      devices: [],
      change: { type: 'disconnect', ids: lost }
    };
  }
  if (connected.length) {
    const change = gained.length && previousIds.length
      ? { type: 'reconnect', ids: gained }
      : lost.length
        ? { type: 'disconnect', ids: lost }
        : null;
    const changeText = change?.type === 'reconnect'
      ? ' A keyboard just reconnected.'
      : change?.type === 'disconnect'
        ? ' One keyboard disconnected. Others listed here still work.'
        : '';
    return {
      kind: 'connected',
      buttonLabel: connected.length === 1 ? 'Keyboard connected' : `${connected.length} keyboards connected`,
      status: `Connected: ${names.join(', ')}. Compatible USB / Web MIDI instruments only — this is not universal MIDI support.${changeText}`,
      devices: connected,
      change
    };
  }
  if (permission === 'granted' || previousIds.length || permission === 'prompted') {
    return {
      kind: 'ready-empty',
      buttonLabel: 'Listening for a keyboard…',
      status: 'MIDI is allowed. No keyboard is connected yet. Plug in a compatible USB keyboard, or keep using the on-screen keys and computer keys.',
      devices: [],
      change: previousIds.length ? { type: 'disconnect', ids: previousIds } : null
    };
  }
  return {
    kind: 'idle',
    buttonLabel: 'Have a compatible keyboard? Try connecting it',
    status: 'Optional. A piano or MIDI keyboard is best for transfer. This on-screen keyboard is a stand-in if none is connected.',
    devices: [],
    change: null
  };
}

export function createMidiSession({ onNote, onRelease, onStatus, requestMIDIAccess } = {}) {
  const held = createHeldNotes();
  let access = null;
  let permission = 'unknown';
  let previousIds = [];
  let requesting = false;

  function snapshot(extra = {}) {
    const supported = typeof (requestMIDIAccess || globalThis.navigator?.requestMIDIAccess) === 'function' || access != null;
    return describeMidiState({
      supported: extra.supported ?? (access ? true : supported),
      permission,
      devices: connectedMidiInputs(access),
      previousIds,
      requesting
    });
  }

  function publish(extra) {
    onStatus?.(snapshot(extra));
  }

  function handleMessage(data, input) {
    const portId = input?.id || 'midi';
    const result = applyMidiEvent(held, data, portId);
    if (result.scored) {
      onNote?.(result.parsed.note, deviceIdentity(input), result.parsed.velocity);
    }
    if (result.released) {
      onRelease?.(result.parsed.note, deviceIdentity(input));
    }
    return result;
  }

  function wireInputs() {
    if (!access) return;
    const connected = connectedMidiInputs(access);
    [...access.inputs.values()].forEach((input) => {
      input.onmidimessage = ({ data }) => handleMessage(data, input);
    });
    const view = describeMidiState({
      supported: true,
      permission,
      devices: connected,
      previousIds,
      requesting: false
    });
    const gone = previousIds.filter((id) => !connected.some((item) => item.id === id));
    gone.forEach((id) => {
      held.clearPort(id).forEach((note) => onRelease?.(note, { id, name: null, manufacturer: null }));
    });
    previousIds = connected.map((item) => item.id);
    onStatus?.(view);
  }

  async function request() {
    const requestFn = requestMIDIAccess || globalThis.navigator?.requestMIDIAccess?.bind(globalThis.navigator);
    if (typeof requestFn !== 'function') {
      permission = 'unsupported';
      publish({ supported: false });
      return snapshot({ supported: false });
    }
    if (access) {
      wireInputs();
      return snapshot();
    }
    requesting = true;
    permission = 'prompted';
    publish();
    try {
      access = await requestFn({ sysex: false });
      permission = 'granted';
      requesting = false;
      wireInputs();
      access.onstatechange = () => wireInputs();
      return snapshot();
    } catch (_) {
      permission = 'denied';
      requesting = false;
      publish();
      return snapshot();
    }
  }

  function blur() {
    return {
      computerReleased: held.clearComputer(),
      midiStillHeld: held.snapshot(),
      policy: BLUR_POLICY
    };
  }

  return {
    request,
    handleMessage,
    wireInputs,
    blur,
    held,
    snapshot,
    getAccess: () => access,
    setAccessForTests(value) {
      access = value;
      permission = value ? 'granted' : permission;
    }
  };
}
