export function beatsToSeconds(beats, bpm) {
  return (Number(beats) * 60) / Number(bpm);
}

export function secondsToBeats(seconds, bpm) {
  return (Number(seconds) * Number(bpm)) / 60;
}

export function createFakeClock(start = 0) {
  let t = Number(start) || 0;
  return {
    now() {
      return t;
    },
    advance(dt) {
      t += Number(dt) || 0;
      return t;
    },
    set(value) {
      t = Number(value) || 0;
      return t;
    }
  };
}

export function wallClockNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now() / 1000;
  }
  return Date.now() / 1000;
}

export function createRhythmClock({
  now = wallClockNow,
  setTimer = globalThis.setTimeout?.bind(globalThis),
  clearTimer = globalThis.clearTimeout?.bind(globalThis)
} = {}) {
  let bpm = 80;
  let origin = 0;
  let pauseShift = 0;
  let pauseStarted = null;
  let paused = false;
  let running = false;
  const timers = new Set();

  function current() {
    return Number(now()) || 0;
  }

  function transportTime(at = current()) {
    if (!running) return 0;
    if (paused && pauseStarted != null) {
      return Math.max(0, pauseStarted - origin - pauseShift);
    }
    return Math.max(0, at - origin - pauseShift);
  }

  function audioTimeForBeat(beat) {
    return origin + pauseShift + beatsToSeconds(beat, bpm);
  }

  function scheduleAt(audioTime, fn) {
    if (typeof setTimer !== 'function') {
      fn(current());
      return null;
    }
    const delay = Math.max(0, (audioTime - current()) * 1000);
    const id = setTimer(() => {
      timers.delete(id);
      if (paused) return;
      fn(current());
    }, delay);
    timers.add(id);
    return id;
  }

  function cancelAll() {
    if (typeof clearTimer === 'function') {
      timers.forEach((id) => clearTimer(id));
    }
    timers.clear();
  }

  return {
    now: current,
    get bpm() {
      return bpm;
    },
    get origin() {
      return origin;
    },
    get paused() {
      return paused;
    },
    get running() {
      return running;
    },
    get pauseShift() {
      return pauseShift;
    },
    setTempo(next) {
      bpm = Number(next) > 0 ? Number(next) : bpm;
      return bpm;
    },
    start({ audioOrigin, tempo } = {}) {
      cancelAll();
      bpm = Number(tempo) > 0 ? Number(tempo) : bpm;
      origin = audioOrigin ?? current();
      pauseShift = 0;
      pauseStarted = null;
      paused = false;
      running = true;
      return origin;
    },
    pause() {
      if (!running || paused) return false;
      paused = true;
      pauseStarted = current();
      cancelAll();
      return true;
    },
    resume() {
      if (!running || !paused) return false;
      pauseShift += current() - pauseStarted;
      paused = false;
      pauseStarted = null;
      return true;
    },
    stop() {
      running = false;
      paused = false;
      pauseStarted = null;
      cancelAll();
    },
    transportTime,
    beatAt(at = current()) {
      return secondsToBeats(transportTime(at), bpm);
    },
    audioTimeForBeat,
    scheduleAt,
    cancelAll,
    isAudioClock: true
  };
}
