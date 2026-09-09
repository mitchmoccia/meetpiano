function speechEngine(globalObj = globalThis) {
  return globalObj?.speechSynthesis || null;
}

export function narrationAvailable(globalObj = globalThis) {
  return Boolean(speechEngine(globalObj));
}

export function createNarrator(globalObj = globalThis) {
  let lastText = '';
  let failed = false;
  let lastReason = '';

  function cancel() {
    const synth = speechEngine(globalObj);
    if (!synth) return;
    try {
      synth.cancel();
    } catch (_) {
      failed = true;
      lastReason = 'cancel-failed';
    }
  }

  function speak(text) {
    const words = typeof text === 'string' ? text.trim() : '';
    lastText = words;
    if (!words) {
      return { ok: false, reason: 'empty', available: narrationAvailable(globalObj) };
    }
    const synth = speechEngine(globalObj);
    if (!synth) {
      failed = true;
      lastReason = 'unavailable';
      return { ok: false, reason: 'unavailable', available: false, text: words };
    }
    try {
      cancel();
      const Ctor = globalObj.SpeechSynthesisUtterance;
      if (typeof Ctor !== 'function') {
        failed = true;
        lastReason = 'unavailable';
        return { ok: false, reason: 'unavailable', available: false, text: words };
      }
      const utterance = new Ctor(words);
      utterance.rate = 0.92;
      utterance.pitch = 1;
      synth.speak(utterance);
      failed = false;
      lastReason = '';
      return { ok: true, reason: 'spoke', available: true, text: words };
    } catch (_) {
      failed = true;
      lastReason = 'failed';
      return { ok: false, reason: 'failed', available: true, text: words };
    }
  }

  function replay(text) {
    return speak(text || lastText);
  }

  return {
    speak,
    replay,
    cancel,
    available: () => narrationAvailable(globalObj),
    lastText: () => lastText,
    failed: () => failed,
    lastReason: () => lastReason
  };
}

export const NARRATION_FAIL_COPY = 'Words stay on the screen. Hearing the words is optional.';
export const NARRATION_UNAVAILABLE_COPY = 'This browser cannot say the words out loud. You can still read them and hear the piano demos.';
