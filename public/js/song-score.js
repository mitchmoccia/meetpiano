/**
 * One master score drives every song view and difficulty.
 * Time is in quarter-note beats. Tempo scales playback; it does not rewrite the score.
 * Parts: melody (Noob+), bass (Pro+), color (Expert). Hands: rh | lh.
 */

export const VIEW_IDS = ['keys', 'drop', 'sheet', 'legend'];
export const DIFFICULTY_IDS = ['noob', 'pro', 'expert'];

export const PARTS_FOR = {
  noob: ['melody'],
  pro: ['melody', 'bass'],
  expert: ['melody', 'bass', 'color']
};

export const VIEW_LABELS = {
  keys: 'Keys',
  drop: 'Drop',
  sheet: 'Sheet',
  legend: 'Legend mode'
};

export const DIFFICULTY_COPY = {
  noob: 'Noob: right hand only, and the song waits for you.',
  pro: 'Pro: adds a simple left hand at full tempo.',
  expert: 'Expert: the full arrangement, and timing counts.'
};

export const VIEW_COPY = {
  keys: 'Keys: the next notes light up on the keyboard.',
  drop: 'Drop: notes fall onto the matching keys.',
  sheet: 'Sheet: the staff moves with a cursor.',
  legend: 'Legend mode: the staff sits above the falling notes, on the same beat.'
};

export const RESULT_COPY = {
  S: 'S rank. Clean from the first note to the last.',
  A: 'A rank. That streak had a real glow.',
  B: 'B rank. The tune is in your hands. One calmer pass and it shines.',
  C: 'C rank. You finished the song. That counts. Loop a phrase and try the tricky bit again.'
};

export const SONG_CATALOG = [
  { id: 'mary-had-a-little-lamb', file: 'mary-had-a-little-lamb.json' },
  { id: 'ode-to-joy', file: 'ode-to-joy.json' },
  { id: 'twinkle-twinkle', file: 'twinkle-twinkle.json' },
  { id: 'hot-cross-buns', file: 'hot-cross-buns.json' },
  { id: 'row-row-row-your-boat', file: 'row-row-row-your-boat.json' },
  { id: 'jingle-bells', file: 'jingle-bells.json' },
  { id: 'london-bridge', file: 'london-bridge.json' },
  { id: 'old-macdonald', file: 'old-macdonald.json' },
  { id: 'happy-birthday', file: 'happy-birthday.json' },
  { id: 'frere-jacques', file: 'frere-jacques.json' },
  { id: 'itsy-bitsy-spider', file: 'itsy-bitsy-spider.json' },
  { id: 'baa-baa-black-sheep', file: 'baa-baa-black-sheep.json' },
  { id: 'yankee-doodle', file: 'yankee-doodle.json' },
  { id: 'amazing-grace', file: 'amazing-grace.json' },
  { id: 'when-the-saints', file: 'when-the-saints.json' },
  { id: 'brahms-lullaby', file: 'brahms-lullaby.json' },
  { id: 'minuet-in-g', file: 'minuet-in-g.json' },
  { id: 'camptown-races', file: 'camptown-races.json' },
  { id: 'oh-susanna', file: 'oh-susanna.json' },
  { id: 'skip-to-my-lou', file: 'skip-to-my-lou.json' }
];

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

function whiteAtOrBelow(pitch) {
  let note = Math.floor(pitch);
  while (BLACK_PCS.has(((note % 12) + 12) % 12)) note -= 1;
  return note;
}

function whiteAtOrAbove(pitch) {
  let note = Math.ceil(pitch);
  while (BLACK_PCS.has(((note % 12) + 12) % 12)) note += 1;
  return note;
}

/**
 * Narrow Fit prefers the right hand. Noob does not show the low left-hand
 * octave, because that hand is not in the part. Pro and Expert keep it so
 * the keyboard can scroll to those notes.
 */
export function pitchesForKeyboard(notes, { difficulty = 'pro', narrow = false, fit = true } = {}) {
  const list = Array.isArray(notes) ? notes : [];
  const pitches = list.map((note) => Number(note.pitch)).filter(Number.isFinite);
  if (!narrow || !fit || difficulty !== 'noob') return pitches;
  const right = list
    .filter((note) => note.hand === 'rh' || note.part === 'melody')
    .map((note) => Number(note.pitch))
    .filter(Number.isFinite);
  return right.length ? right : pitches;
}

/** Fit the on-screen keyboard around the song. octaves 0 keeps the tight span. */
export function rangeCovering(pitches, octaves = 0) {
  const list = (pitches || []).map(Number).filter(Number.isFinite);
  if (!list.length) {
    const span = octaves > 0 ? octaves : 2;
    return { from: 60, to: 60 + span * 12 };
  }
  const min = Math.min(...list);
  const max = Math.max(...list);
  let from = whiteAtOrBelow(min);
  let to = whiteAtOrAbove(max);
  if (!(octaves > 0)) {
    if (to <= from) to = from + 12;
    return { from, to };
  }
  from -= ((from % 12) + 12) % 12;
  let span = octaves;
  while (from + span * 12 < max) span += 1;
  return { from, to: from + span * 12 };
}

/** Wide screens show more octaves. Narrow screens fit the song so the keys stay playable. */
export function autoOctaves(width) {
  if (width >= 1200) return 4;
  if (width >= 900) return 3;
  return 0;
}

export function missesByBar(notes, beatsPerBar) {
  const counts = new Map();
  for (const note of notes || []) {
    if (note.status !== 'missed') continue;
    const bar = Math.floor(note.beat / beatsPerBar) + 1;
    counts.set(bar, (counts.get(bar) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bar, count]) => ({ bar, count }));
}

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const DIATONIC_C = new Set([0, 2, 4, 5, 7, 9, 11]);
const EPS = 1e-4;

export function pitchName(pitch) {
  return NAMES[((Number(pitch) % 12) + 12) % 12];
}

export function defaultsFor(difficulty) {
  if (difficulty === 'noob') return { waitMode: true, timingScored: false, label: 'Noob' };
  if (difficulty === 'pro') return { waitMode: false, timingScored: false, label: 'Pro' };
  if (difficulty === 'expert') return { waitMode: false, timingScored: true, label: 'Expert' };
  return null;
}

export function changeView(session, view) {
  if (!VIEW_IDS.includes(view)) return session;
  return { view, cursor: session.cursor };
}

export function scoreLength(notes) {
  return (notes || []).reduce((max, note) => Math.max(max, note.beat + note.dur), 0);
}

export function beatsPerBarOf(score) {
  return score.timeSignature[0];
}

export function notesForDifficulty(score, difficulty) {
  const parts = PARTS_FOR[difficulty];
  if (!parts) return [];
  return score.notes
    .filter((note) => parts.includes(note.part))
    .map((note, index) => ({
      id: `${score.id}:${difficulty}:${index}`,
      pitch: note.pitch,
      beat: note.beat,
      dur: note.dur,
      hand: note.hand,
      part: note.part
    }))
    .sort((a, b) => a.beat - b.beat || a.pitch - b.pitch);
}

export function createTake(notes, length, cursor = 0) {
  return {
    notes: notes.map((note) => ({
      ...note,
      status: note.beat + EPS < cursor ? 'skipped' : 'pending'
    })),
    length,
    cursor,
    running: false,
    waiting: false,
    ended: false,
    misses: 0,
    combo: 0,
    maxCombo: 0,
    timingSum: 0,
    timingCount: 0,
    best: null,
    last: null
  };
}

export function rampedBpm(bpm, cursor, { ramp = false, rampBeats = 8 } = {}) {
  if (!ramp) return bpm;
  const t = Math.max(0, Math.min(1, cursor / rampBeats));
  return bpm * (0.75 + 0.25 * t);
}

export function windowsFor(difficulty, bpm) {
  const beatMs = 60000 / bpm;
  if (difficulty === 'expert') return { early: 160 / beatMs, late: 220 / beatMs };
  return { early: 420 / beatMs, late: 720 / beatMs };
}

export function timingCredit(deltaMs) {
  const delta = Math.abs(deltaMs);
  if (delta <= 80) return 1;
  if (delta <= 240) return 0.7;
  return 0.4;
}

export function rollLandingY(beat, cursor, hitY, pixelsPerBeat) {
  return hitY - (beat - cursor) * pixelsPerBeat;
}

export function sheetCursorX(beat, cursor, playhead, pixelsPerBeat) {
  return playhead + (beat - cursor) * pixelsPerBeat;
}

export function positionLabel(cursor, beatsPerBar) {
  const safe = Math.max(0, cursor);
  const bar = Math.floor(safe / beatsPerBar) + 1;
  const beat = Math.floor(safe % beatsPerBar + EPS) + 1;
  return `Bar ${bar}, beat ${beat}`;
}

export function lyricAt(lyrics, beat) {
  let text = '';
  for (const line of lyrics || []) {
    if (line.beat <= beat + EPS) text = line.text;
  }
  return text;
}

export function loopFromBars(startBar, endBar, beatsPerBar, lengthBeats) {
  if (!Number.isInteger(startBar) || !Number.isInteger(endBar)) {
    return { error: 'Use whole bar numbers.' };
  }
  if (startBar < 1 || endBar < startBar) {
    return { error: 'The end bar has to be the same as the start, or later.' };
  }
  const start = (startBar - 1) * beatsPerBar;
  const end = endBar * beatsPerBar;
  if (start >= lengthBeats) return { error: 'That bar is past the end of the song.' };
  return {
    loop: {
      start,
      end: Math.min(end, lengthBeats),
      label: startBar === endBar ? `Bar ${startBar}` : `Bars ${startBar}–${endBar}`
    }
  };
}

function pendingBeats(take) {
  const beats = [];
  for (const note of take.notes) {
    if (note.status !== 'pending') continue;
    if (!beats.some((beat) => Math.abs(beat - note.beat) < 0.03)) beats.push(note.beat);
  }
  beats.sort((a, b) => a - b);
  return beats;
}

export function armWait(take, waitMode) {
  if (!waitMode) {
    take.waiting = false;
    return take;
  }
  const beats = pendingBeats(take);
  if (!beats.length) return take;
  if (beats[0] <= take.cursor + 0.03) {
    take.cursor = beats[0];
    take.waiting = true;
  }
  return take;
}

export function stepTake(take, deltaBeats, { waitMode = false, loop = null, lateBeats = 0.5 } = {}) {
  if (!take.running || take.ended || take.waiting) {
    return { waiting: take.waiting, wrapped: false, ended: take.ended };
  }
  let next = take.cursor + deltaBeats;
  if (waitMode) {
    const beat = pendingBeats(take).find((item) => item >= take.cursor - EPS);
    if (beat != null && next + EPS >= beat) {
      take.cursor = beat;
      take.waiting = true;
      return { waiting: true, wrapped: false, ended: false };
    }
  }
  if (loop && next >= loop.end - EPS) {
    take.cursor = loop.end;
    return { waiting: false, wrapped: true, ended: false };
  }
  take.cursor = next;
  if (!waitMode) {
    for (const note of take.notes) {
      if (note.status === 'pending' && take.cursor > note.beat + lateBeats) note.status = 'missed';
    }
  }
  if (!loop && take.cursor >= take.length - EPS) {
    take.cursor = take.length;
    take.ended = true;
    take.running = false;
    take.waiting = false;
    for (const note of take.notes) {
      if (note.status === 'pending') note.status = 'missed';
    }
    return { waiting: false, wrapped: false, ended: true };
  }
  return { waiting: false, wrapped: false, ended: false };
}

export function rewindLoop(take, loop) {
  for (const note of take.notes) {
    if (note.beat >= loop.start - EPS && note.beat < loop.end - EPS) note.status = 'pending';
  }
  take.cursor = loop.start;
  take.waiting = false;
  take.ended = false;
  take.running = true;
  take.misses = 0;
  take.combo = 0;
  take.timingSum = 0;
  take.timingCount = 0;
  return take;
}

export function judgePitch(take, pitch, { difficulty = 'pro', bpm = 96, waitMode = false } = {}) {
  if (!take.running || take.ended) return { judged: false, hit: false };
  const pending = take.notes.filter((note) => note.status === 'pending');
  if (!pending.length) return { judged: false, hit: false };
  const window = windowsFor(difficulty, bpm);
  let pool;
  if (waitMode || take.waiting) {
    const beat = Math.min(...pending.map((note) => note.beat));
    pool = pending.filter((note) => Math.abs(note.beat - beat) < 0.03);
  } else {
    pool = pending.filter((note) => (
      take.cursor >= note.beat - window.early && take.cursor <= note.beat + window.late
    ));
  }
  const match = pool.find((note) => note.pitch === pitch);
  if (!match) {
    if (!pool.length && !take.waiting) return { judged: false, hit: false };
    take.misses += 1;
    take.combo = 0;
    const expected = pool[0] || pending[0];
    return { judged: true, hit: false, expected: expected.pitch };
  }
  match.status = 'hit';
  take.combo += 1;
  if (take.combo > take.maxCombo) take.maxCombo = take.combo;
  const beatMs = 60000 / bpm;
  const credit = difficulty === 'expert' ? timingCredit(Math.abs(take.cursor - match.beat) * beatMs) : 1;
  take.timingSum += credit;
  take.timingCount += 1;
  if (take.waiting) {
    const remain = take.notes.some((note) => note.status === 'pending' && Math.abs(note.beat - match.beat) < 0.03);
    if (!remain) take.waiting = false;
  }
  return { judged: true, hit: true, note: match, combo: take.combo };
}

export function gradeTake(take, difficulty, loop = null) {
  const relevant = take.notes.filter((note) => {
    if (note.status === 'skipped') return false;
    if (loop && (note.beat < loop.start - EPS || note.beat >= loop.end - EPS)) return false;
    if (note.status === 'hit') return true;
    if (take.ended) return true;
    return note.beat <= take.cursor + 0.05;
  });
  const hits = relevant.filter((note) => note.status === 'hit').length;
  const unplayed = relevant.filter((note) => note.status !== 'hit').length;
  const wrong = take.misses;
  const total = hits + unplayed + wrong;
  const accuracy = total === 0 ? 0 : hits / total;
  const timing = take.timingCount ? take.timingSum / take.timingCount : (difficulty === 'expert' ? 0 : 1);
  const score = difficulty === 'expert' ? accuracy * 0.7 + timing * 0.3 : accuracy;
  const letter = score >= 0.95 ? 'S' : score >= 0.85 ? 'A' : score >= 0.7 ? 'B' : 'C';
  return {
    letter,
    accuracy,
    score,
    hits,
    unplayed,
    wrong,
    maxCombo: take.maxCombo,
    copy: RESULT_COPY[letter]
  };
}

export function rememberBest(take, grade) {
  take.last = grade;
  if (!take.best || grade.score > take.best.score) take.best = grade;
  if (grade.maxCombo > take.maxCombo) take.maxCombo = grade.maxCombo;
  return grade;
}

export function missCopy(expected, heard) {
  const want = pitchName(expected);
  if (!Number.isInteger(heard)) return `This spot wants ${want}.`;
  if (pitchName(heard) === want) {
    return heard > expected
      ? `That's ${want} a bit higher. This one is lower.`
      : `That's ${want} a bit lower. This one is higher.`;
  }
  return `Almost. This spot wants ${want}.`;
}

export function validateScore(score) {
  const errors = [];
  if (!score || typeof score !== 'object') return ['Score must be an object.'];
  for (const key of ['id', 'title', 'key', 'tempo', 'timeSignature', 'provenance', 'phrases', 'notes']) {
    if (score[key] == null) errors.push(`Missing ${key}.`);
  }
  if (typeof score.title !== 'string' || !score.title.trim()) errors.push('Title is required.');
  if (typeof score.key !== 'string' || !score.key.trim()) errors.push('Key is required.');
  if (!Number.isFinite(score.tempo) || score.tempo < 40 || score.tempo > 220) errors.push('Tempo must be between 40 and 220.');
  const signature = score.timeSignature;
  if (!Array.isArray(signature) || signature.length !== 2) errors.push('Time signature must be [beats, unit].');
  else if (signature[1] !== 4 || ![2, 3, 4, 6].includes(signature[0])) {
    errors.push('Time signature must use a quarter-note beat.');
  }
  const provenance = score.provenance || {};
  if (typeof provenance.source !== 'string' || provenance.source.trim().length < 40) {
    errors.push('Provenance source is required.');
  }
  if (!Number.isInteger(provenance.publicationYear)) errors.push('Provenance publication year is required.');
  else if (provenance.publicationYear > 1930 || provenance.publicationYear < 1500) {
    errors.push('Publication year must be in the public-domain window through 1930.');
  }
  if (provenance.lyricPublicationYear != null) {
    if (!Number.isInteger(provenance.lyricPublicationYear) || provenance.lyricPublicationYear > 1930) {
      errors.push('Lyric publication year must be 1930 or earlier.');
    }
  }
  if (provenance.publicDomain !== true) errors.push('Provenance must mark the tune public domain.');
  if (typeof provenance.arrangement !== 'string' || provenance.arrangement.trim().length < 20) {
    errors.push('Arrangement credit is required.');
  }
  if (!Array.isArray(score.phrases) || !score.phrases.length) errors.push('At least one phrase is required.');
  if (!Array.isArray(score.notes) || !score.notes.length) errors.push('Notes are required.');
  const length = scoreLength(score.notes || []);
  for (const phrase of score.phrases || []) {
    if (typeof phrase.id !== 'string' || typeof phrase.label !== 'string') errors.push('Phrase id and label are required.');
    if (!Number.isFinite(phrase.start) || !Number.isFinite(phrase.end) || phrase.end <= phrase.start) {
      errors.push(`Phrase ${phrase.id || ''} has a bad range.`);
    } else if (phrase.start < 0 || phrase.end > length + EPS) {
      errors.push(`Phrase ${phrase.id || ''} sits outside the song.`);
    }
  }
  for (const line of score.lyrics || []) {
    if (!Number.isFinite(line.beat) || line.beat < 0 || typeof line.text !== 'string' || !line.text.trim()) {
      errors.push('Lyric lines need a beat and text.');
    }
  }
  for (const note of score.notes || []) {
    if (!Number.isInteger(note.pitch) || note.pitch < 0 || note.pitch > 127) errors.push('Note pitch is out of range.');
    if (!Number.isFinite(note.beat) || note.beat < 0) errors.push('Note beat must be zero or later.');
    if (!Number.isFinite(note.dur) || note.dur <= 0 || note.dur > 8) errors.push('Note duration is not usable.');
    if (note.hand !== 'rh' && note.hand !== 'lh') errors.push('Note hand must be rh or lh.');
    if (!['melody', 'bass', 'color'].includes(note.part)) errors.push('Note part must be melody, bass, or color.');
    if (note.part === 'melody' && note.hand !== 'rh') errors.push('Melody notes are right hand.');
    if (note.part !== 'melody' && note.hand !== 'lh') errors.push('Bass and color notes are left hand.');
    if (score.key === 'C' && !DIATONIC_C.has(((note.pitch % 12) + 12) % 12)) {
      errors.push('This C-major score has a note the staff would need an accidental for.');
    }
  }
  if (errors.length) return errors;
  for (const difficulty of DIFFICULTY_IDS) {
    if (!notesForDifficulty(score, difficulty).length) errors.push(`Difficulty ${difficulty} has no notes.`);
  }
  const noob = notesForDifficulty(score, 'noob').length;
  const pro = notesForDifficulty(score, 'pro').length;
  const expert = notesForDifficulty(score, 'expert').length;
  if (!(expert > pro && pro > noob)) errors.push('Expert must add notes beyond Pro, and Pro beyond Noob.');
  return errors;
}
