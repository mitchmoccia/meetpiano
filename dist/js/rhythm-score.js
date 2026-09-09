import { pitchClass } from './assess.js';
import { beatsToSeconds } from './rhythm-clock.js';

export const HIT_WINDOWS = {
  guided: { earlyMs: 180, lateMs: 220 },
  performance: { earlyMs: 90, lateMs: 110 }
};

export const RELEASE_WINDOWS = {
  guided: { longMinRatio: 0.55, shortMaxRatio: 1.6 },
  performance: { longMinRatio: 0.7, shortMaxRatio: 1.35 }
};

export function windowFor(mode) {
  return HIT_WINDOWS[mode] || HIT_WINDOWS.performance;
}

export function releaseWindowFor(mode) {
  return RELEASE_WINDOWS[mode] || RELEASE_WINDOWS.performance;
}

export function pitchesMatchLoose(heard, expected, octavePolicy) {
  if (!Number.isFinite(heard) || !Number.isFinite(expected)) return false;
  if (octavePolicy === 'exact-pitch') return heard === expected;
  return pitchClass(heard) === pitchClass(expected);
}

export function scoreOnset({ expectedSec, heardSec, mode }) {
  const window = windowFor(mode);
  const deltaMs = (heardSec - expectedSec) * 1000;
  if (deltaMs < -window.earlyMs) return { result: 'early', deltaMs };
  if (deltaMs > window.lateMs) return { result: 'late', deltaMs };
  return { result: 'hit', deltaMs };
}

export function scoreRelease({ expectedSec, heardSec, expectedBeats, bpm, mode, length }) {
  const held = heardSec - expectedSec;
  const want = beatsToSeconds(expectedBeats, bpm);
  const window = releaseWindowFor(mode);
  if (length === 'long' && held < want * window.longMinRatio) {
    return { result: 'too-short', held, want };
  }
  if (length === 'short' && held > want * window.shortMaxRatio) {
    return { result: 'too-long', held, want };
  }
  return { result: 'ok', held, want };
}

export function patternSpanSec(pattern) {
  const last = (pattern.events || []).reduce((max, event) => {
    const end = Number(event.onsetBeats) + Number(event.durationBeats || 0);
    return end > max ? end : max;
  }, 0);
  return beatsToSeconds(last, pattern.bpm);
}

export function createRhythmTake({
  pattern,
  mode = 'performance',
  now,
  octavePolicy = 'pitch-class',
  scoreReleases = false
}) {
  const events = (pattern.events || []).map((event, index) => ({
    ...event,
    index,
    onsetBeats: Number(event.onsetBeats)
  }));
  const notes = events.filter((event) => event.kind === 'note');
  const rests = events.filter((event) => event.kind === 'rest');
  const hits = notes.map(() => null);
  const extras = [];
  const ignored = [];
  let origin = null;
  let countInOrigin = null;
  let paused = false;
  let pauseStarted = null;
  let aborted = null;
  const open = new Map();

  function at() {
    return Number(now()) || 0;
  }

  function expectedSec(event) {
    return origin + beatsToSeconds(event.onsetBeats, pattern.bpm);
  }

  function inCountIn(t) {
    return origin != null && t < origin;
  }

  function restAt(t) {
    return rests.find((rest) => {
      const start = expectedSec(rest);
      const end = start + beatsToSeconds(rest.durationBeats || 1, pattern.bpm);
      return t >= start && t < end;
    });
  }

  function start(startAt) {
    const begin = startAt ?? at();
    countInOrigin = begin;
    origin = begin + beatsToSeconds(pattern.countInBeats || 0, pattern.bpm);
    paused = false;
    aborted = null;
    return { countInOrigin, origin };
  }

  function startAtOrigin(originAt) {
    countInOrigin = originAt;
    origin = originAt;
    paused = false;
    aborted = null;
    return { countInOrigin, origin };
  }

  function pause() {
    if (aborted || paused || origin == null) return false;
    paused = true;
    pauseStarted = at();
    return true;
  }

  function resume() {
    if (!paused) return false;
    const dt = at() - pauseStarted;
    origin += dt;
    countInOrigin += dt;
    paused = false;
    pauseStarted = null;
    return true;
  }

  function abort(reason) {
    aborted = reason || 'abort';
    paused = false;
    return snapshot();
  }

  function nextOpenNote() {
    const index = hits.findIndex((hit) => hit == null);
    return index < 0 ? null : notes[index];
  }

  function mark(note, payload) {
    const index = notes.indexOf(note);
    if (index >= 0) hits[index] = payload;
  }

  function noteOn(pitch, heardSec = at()) {
    if (aborted) {
      ignored.push({ reason: 'aborted', pitch, t: heardSec });
      return { ignore: true, reason: 'aborted' };
    }
    if (paused) {
      ignored.push({ reason: 'paused', pitch, t: heardSec });
      return { ignore: true, reason: 'paused' };
    }
    if (origin == null) {
      ignored.push({ reason: 'not-started', pitch, t: heardSec });
      return { ignore: true, reason: 'not-started' };
    }
    if (inCountIn(heardSec)) {
      ignored.push({ reason: 'count-in', pitch, t: heardSec });
      return { ignore: true, reason: 'count-in' };
    }

    const window = windowFor(mode);
    let candidate = nextOpenNote();
    while (candidate && heardSec > expectedSec(candidate) + window.lateMs / 1000) {
      mark(candidate, { result: 'miss', pitch: null, expected: candidate.pitch, t: heardSec });
      candidate = nextOpenNote();
    }

    const rest = restAt(heardSec);
    if (!candidate) {
      extras.push({ reason: rest ? 'rest' : 'extra', pitch, t: heardSec });
      return { ok: false, result: rest ? 'rest' : 'extra', extra: true };
    }

    const expected = expectedSec(candidate);
    const timing = scoreOnset({ expectedSec: expected, heardSec, mode });
    const pitchOk = pitchesMatchLoose(pitch, candidate.pitch, octavePolicy);

    if (timing.result !== 'hit') {
      if (rest) {
        extras.push({ reason: 'rest', pitch, t: heardSec });
        return { ok: false, result: 'rest', extra: true };
      }
      extras.push({ reason: timing.result, pitch, t: heardSec, expected: candidate.pitch });
      return { ok: false, result: timing.result, extra: true, deltaMs: timing.deltaMs };
    }

    if (!pitchOk) {
      mark(candidate, { result: 'wrong-pitch', pitch, expected: candidate.pitch, t: heardSec });
      return { ok: false, result: 'wrong-pitch', expected: candidate.pitch };
    }

    mark(candidate, { result: 'hit', pitch, expected: candidate.pitch, t: heardSec, onsetSec: heardSec });
    if (scoreReleases && candidate.length) {
      open.set(pitchClass(pitch), { note: candidate, onsetSec: heardSec });
    }
    return { ok: true, result: 'hit', expected: candidate.pitch, deltaMs: timing.deltaMs };
  }

  function noteOff(pitch, heardSec = at()) {
    if (!scoreReleases || aborted || paused || origin == null) {
      return { ignore: true };
    }
    const key = pitchClass(pitch);
    const held = open.get(key);
    if (!held) return { ignore: true, reason: 'not-open' };
    open.delete(key);
    const scored = scoreRelease({
      expectedSec: held.onsetSec,
      heardSec,
      expectedBeats: held.note.durationBeats,
      bpm: pattern.bpm,
      mode,
      length: held.note.length
    });
    const index = notes.indexOf(held.note);
    if (index >= 0 && hits[index]?.result === 'hit') {
      hits[index] = { ...hits[index], release: scored };
    }
    return { ok: scored.result === 'ok', result: scored.result, held: scored.held };
  }

  function flushOpen(atTime = at()) {
    if (!scoreReleases) return;
    for (const [key, held] of open) {
      noteOff(notes.find((item) => pitchClass(item.pitch) === key)?.pitch ?? held.note.pitch, atTime);
    }
  }

  function finalize(atTime = at()) {
    if (!aborted) {
      const window = windowFor(mode);
      let candidate = nextOpenNote();
      while (candidate && atTime > expectedSec(candidate) + window.lateMs / 1000) {
        mark(candidate, { result: 'miss', pitch: null, expected: candidate.pitch, t: atTime });
        candidate = nextOpenNote();
      }
      flushOpen(atTime);
    }
    return snapshot();
  }

  function snapshot() {
    const misses = hits.filter((hit) => hit?.result === 'miss');
    const badHits = hits.filter((hit) => hit && hit.result !== 'hit');
    const badReleases = hits.filter((hit) => hit?.release && hit.release.result !== 'ok');
    const pending = hits.filter((hit) => hit == null);
    const passed = !aborted
      && extras.length === 0
      && badHits.length === 0
      && badReleases.length === 0
      && pending.length === 0;
    return {
      passed,
      aborted,
      unfairFailure: Boolean(aborted),
      mode,
      bpm: pattern.bpm,
      hits: hits.map((hit) => hit),
      extras: extras.slice(),
      ignored: ignored.slice(),
      misses,
      pending: pending.length
    };
  }

  return {
    start,
    startAtOrigin,
    pause,
    resume,
    abort,
    noteOn,
    noteOff,
    finalize,
    snapshot,
    get origin() {
      return origin;
    },
    get paused() {
      return paused;
    },
    get aborted() {
      return aborted;
    }
  };
}
