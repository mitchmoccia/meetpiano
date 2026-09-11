export const SETUP_STORAGE_KEY = 'meetpiano:first-session-setup';
export const SETUP_TRY_NOTE = 60;
export const SETUP_SURFACES = ['hub', 'L01'];
export const SETUP_CONTINUE_HREF = '/learn/?lesson=L01';

export const SETUP_COPY = {
  eyebrow: 'FIRST SIT · THIS DEVICE',
  title: 'Hear one note, then start L01',
  lead: 'Wake the sound, try a key with touch or a computer key, and MIDI is optional. One heard note is enough. This is not a full tutorial.',
  unlockLabel: 'Wake the sound',
  unlockHint: 'Browsers wait for a tap before they will play. If sound stays quiet, tap Wake the sound again.',
  audioBlocked: 'Sound is blocked or autoplay is suspended. Tap Wake the sound, then try a key. You can still use on-screen and computer keys.',
  audioMissing: 'This browser cannot play Web Audio. You can still tap keys. Pitch checks stay incomplete until sound works.',
  tryKeyLabel: 'Try a key',
  tryKeyHint: 'Tap here, tap an on-screen key, or use a computer key (A–J). One heard note is the whole setup.',
  heardNote: 'You heard a note. That is enough. Start Meet the keyboard when you are ready.',
  midiLabel: 'Optional: try connecting a keyboard',
  midiIdle: 'MIDI is optional. On-screen keys and computer keys still work. Physical MIDI hardware is not verified from this page.',
  midiUnsupported: 'This browser does not offer Web MIDI. MIDI is optional — on-screen keys and computer keys still work.',
  midiDenied: 'MIDI permission was not granted. MIDI is optional — on-screen keys and computer keys still work. You can try again if you change the browser permission.',
  continueLabel: 'Start Meet the keyboard',
  dismissLabel: 'Skip for now'
};

function backend(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function emptySetupState() {
  return {
    dismissed: false,
    heardNote: false,
    soundUnlocked: false
  };
}

export function validateSetupState(value) {
  if (!isPlainObject(value)) return emptySetupState();
  return {
    dismissed: value.dismissed === true,
    heardNote: value.heardNote === true,
    soundUnlocked: value.soundUnlocked === true
  };
}

export function readSetupState(storage) {
  const local = backend(storage);
  if (!local) return emptySetupState();
  try {
    const raw = local.getItem(SETUP_STORAGE_KEY);
    if (!raw) return emptySetupState();
    return validateSetupState(JSON.parse(raw));
  } catch (_) {
    return emptySetupState();
  }
}

export function writeSetupState(state, storage) {
  const next = validateSetupState(state);
  const local = backend(storage);
  if (!local) return next;
  try {
    local.setItem(SETUP_STORAGE_KEY, JSON.stringify(next));
  } catch (_) {
    /* private-mode or quota — keep the in-memory next state */
  }
  return next;
}

export function resetSetupState(storage) {
  const local = backend(storage);
  if (local) {
    try {
      local.removeItem(SETUP_STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  }
  return emptySetupState();
}

export function hasJourneyProgress(store) {
  return Object.values(store?.lessons || {}).some((lesson) => Boolean(lesson?.evidenceState));
}

export function shouldShowSetupStrip({ store, setup, surface } = {}) {
  if (surface && !SETUP_SURFACES.includes(surface)) return false;
  const state = validateSetupState(setup);
  if (state.dismissed || state.heardNote) return false;
  if (hasJourneyProgress(store)) return false;
  return true;
}

export function applySetupEvent(state, event = {}) {
  const next = validateSetupState(state);
  if (event.type === 'dismiss') {
    next.dismissed = true;
    return next;
  }
  if (event.type === 'unlock') {
    next.soundUnlocked = event.ok === true;
    return next;
  }
  if (event.type === 'hear') {
    next.heardNote = true;
    next.soundUnlocked = true;
    return next;
  }
  return next;
}

export function describeAudioUnlock({ canPlay, state } = {}) {
  if (canPlay === false || state === 'unavailable') {
    return { kind: 'missing', message: SETUP_COPY.audioMissing };
  }
  if (state === 'suspended') {
    return { kind: 'blocked', message: SETUP_COPY.audioBlocked };
  }
  if (state === 'running') {
    return { kind: 'ready', message: SETUP_COPY.unlockHint };
  }
  return { kind: 'needs-gesture', message: SETUP_COPY.unlockHint };
}

export function describeSetupMidi(kind) {
  if (kind === 'unsupported') return SETUP_COPY.midiUnsupported;
  if (kind === 'denied') return SETUP_COPY.midiDenied;
  return SETUP_COPY.midiIdle;
}

export function setupStatusCopy(setup, { audioKind, midiKind } = {}) {
  const state = validateSetupState(setup);
  if (state.heardNote) return SETUP_COPY.heardNote;
  if (audioKind === 'missing') return SETUP_COPY.audioMissing;
  if (audioKind === 'blocked') return SETUP_COPY.audioBlocked;
  if (midiKind === 'unsupported') return SETUP_COPY.midiUnsupported;
  if (midiKind === 'denied') return SETUP_COPY.midiDenied;
  if (state.soundUnlocked) return SETUP_COPY.tryKeyHint;
  return SETUP_COPY.unlockHint;
}
