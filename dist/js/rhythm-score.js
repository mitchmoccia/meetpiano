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

export function eventsForPart(events, part) {
  if (!part || part === 'both') return events || [];
  return (events || []).filter((event) => event.part === part || event.kind === 'rest');
}

export function eventsUntilBeat(events, untilBeat) {
  if (!Number.isFinite(untilBeat)) return events || [];
  return (events || []).filter((event) => Number(event.onsetBeats) < untilBeat);
}

export function createRhythmTake({
  pattern,
  mode = 'performance',
  now,
  octavePolicy = 'pitch-class',
  scoreReleases = false,
  stickyAlign = false
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

  function unmatchedNotes() {
    return notes.filter((_, index) => hits[index] == null);
  }

  function currentGroup() {
    const openNotes = unmatchedNotes();
    if (!openNotes.length) return [];
    const onset = openNotes[0].onsetBeats;
    return openNotes.filter((note) => note.onsetBeats === onset);
  }

  function nextOpenNote() {
    return currentGroup()[0] || null;
  }

  function mark(note, payload) {
    const index = notes.indexOf(note);
    if (index >= 0) hits[index] = payload;
  }

  function missLateGroups(heardSec) {
    const window = windowFor(mode);
    let group = currentGroup();
    while (group.length && heardSec > expectedSec(group[0]) + window.lateMs / 1000) {
      group.forEach((note) => mark(note, { result: 'miss', pitch: null, expected: note.pitch, t: heardSec }));
      group = currentGroup();
    }
    return group;
  }

  function findOpen(pitch) {
    for (const [key, held] of open) {
      if (held.heardPitch === pitch || held.note.pitch === pitch) return [key, held];
    }
    if (octavePolicy !== 'exact-pitch') {
      for (const [key, held] of open) {
        if (pitchClass(held.heardPitch) === pitchClass(pitch) || pitchClass(held.note.pitch) === pitchClass(pitch)) {
          return [key, held];
        }
      }
    }
    return [null, null];
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

    const group = missLateGroups(heardSec);
    const rest = restAt(heardSec);
    if (!group.length) {
      extras.push({ reason: rest ? 'rest' : 'extra', pitch, t: heardSec });
      return { ok: false, result: rest ? 'rest' : 'extra', extra: true };
    }

    const expected = expectedSec(group[0]);
    const timing = scoreOnset({ expectedSec: expected, heardSec, mode });

    if (timing.result !== 'hit') {
      if (rest) {
        extras.push({ reason: 'rest', pitch, t: heardSec });
        return { ok: false, result: 'rest', extra: true };
      }
      extras.push({ reason: timing.result, pitch, t: heardSec, expected: group[0].pitch });
      return { ok: false, result: timing.result, extra: true, deltaMs: timing.deltaMs };
    }

    const match = group.find((note) => pitchesMatchLoose(pitch, note.pitch, octavePolicy));
    if (!match) {
      if (stickyAlign) {
        extras.push({ reason: 'wrong-pitch', pitch, t: heardSec, expected: group.map((note) => note.pitch) });
        return { ok: false, result: 'wrong-pitch', extra: true, expected: group[0].pitch, sticky: true };
      }
      mark(group[0], { result: 'wrong-pitch', pitch, expected: group[0].pitch, t: heardSec });
      return { ok: false, result: 'wrong-pitch', expected: group[0].pitch };
    }

    mark(match, { result: 'hit', pitch, expected: match.pitch, t: heardSec, onsetSec: heardSec });
    if (scoreReleases && match.length) {
      open.set(String(match.index), { note: match, onsetSec: heardSec, heardPitch: pitch });
    }
    return { ok: true, result: 'hit', expected: match.pitch, deltaMs: timing.deltaMs };
  }

  function noteOff(pitch, heardSec = at()) {
    if (!scoreReleases || aborted || paused || origin == null) {
      return { ignore: true };
    }
    const [key, held] = findOpen(pitch);
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
    for (const [, held] of open) {
      noteOff(held.heardPitch ?? held.note.pitch, atTime);
    }
  }

  function finalize(atTime = at()) {
    if (!aborted) {
      missLateGroups(atTime);
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
