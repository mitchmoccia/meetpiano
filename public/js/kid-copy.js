const FALLBACK = 'Look at the yellow job. Then try it.';

const PHASE_FALLBACK = {
  explanation: 'Read the short job. Then tap Next.',
  demo: 'Listen once. Words stay on the screen.',
  guided: 'Your turn. Follow the yellow job.',
  independent: 'No glow. Play the same job.',
  transfer: 'Same idea. A new pattern.',
  review: 'After a pause, try it again.',
  remediation: 'A smaller try. Same skill.',
  result: 'This device saved what it heard.'
};

const TARGETS = {
  L01: {
    explanation: 'See the long row of keys.',
    demo: 'Listen. High is right. Low is left.',
    guided: {
      unlock: 'Tap to wake the sound.',
      'high-low': 'Play high. Then play low.',
      groups: 'Tap a clump of two. Then a clump of three.',
      posture: 'Ask a grown-up to check sitting.'
    },
    independent: {
      'high-low': 'High, then low. No glow.',
      groups: 'Find both clumps. No glow.',
      done: 'You did the quiet check.'
    },
    transfer: {
      'other-two': 'Find another clump of two.',
      three: 'Point to a clump of three.'
    },
    result: 'You met the keyboard.'
  },
  L02: {
    explanation: 'C lives left of two black keys.',
    demo: 'Watch the tiny house. C is the doorstep.',
    guided: {
      find: 'Find the doorstep C.',
      name: 'Say C. Then play it.',
      other: 'Find C in another room.',
      done: 'Ready for a quiet check.'
    },
    independent: {
      find: 'Find C. No glow.',
      register: 'A C in a new room.',
      done: 'Saved the quiet C.'
    },
    transfer: { 'other-house': 'Another house of two.', done: 'Saved.' },
    result: 'You found C.'
  },
  L03: {
    explanation: 'D and E live next door to C.',
    demo: 'Hear C, then D, then E.',
    guided: {
      'find-c': 'Find C first.',
      neighbors: 'Walk to the next white keys.',
      row: 'Play C–D–E in a row.',
      fingering: 'Ask a grown-up to watch fingers 1-2-3.',
      done: 'Ready for a quiet check.'
    },
    independent: { order: 'A new order. No glow.', done: 'Saved the walk.' },
    transfer: { order: 'Another new order.', done: 'Saved.' },
    result: 'You walked the neighbors.'
  },
  L04: {
    explanation: 'Little Wave goes up, then home.',
    demo: 'Listen to Little Wave once.',
    guided: {
      hear: 'Just listen to Little Wave.',
      head: 'Play the first four.',
      tail: 'Play the last three.',
      all: 'Play the whole wave.',
      cousin: 'Just listen to the cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { home: 'Little Wave. No tiles.', done: 'Now the cousin.' },
    transfer: { cousin: 'Wave the other way.', done: 'Saved.' },
    review: 'After a pause, play it again.',
    result: 'You played a little tune.'
  },
  L05: {
    explanation: 'The click is the heartbeat.',
    demo: 'Listen to the heartbeat.',
    guided: {
      hear: 'Just listen to the clicks.',
      echo: 'Tap C with the clock.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Tap with the clock. No helper glow.', done: 'Saved the pulse.' },
    transfer: { perform: 'A new heartbeat pattern.', done: 'Saved.' },
    review: 'After a pause, tap with the clock.',
    result: 'You kept the heartbeat.'
  },
  L06: {
    explanation: 'Some notes stay. Some notes tap.',
    demo: 'Hear long, then short.',
    guided: {
      hear: 'Just listen: stay, then tap-tap.',
      echo: 'Hold, then two short taps.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Long then short. No glow.', done: 'Saved.' },
    transfer: { perform: 'A new long-short pattern.', done: 'Saved.' },
    review: 'After a pause, hold then tap.',
    result: 'You played long and short.'
  },
  L07: {
    explanation: 'A rest is a quiet beat.',
    demo: 'Hear the hole in the middle.',
    guided: {
      hear: 'Just listen. Leave the hole empty.',
      echo: 'Play, rest, play. Do not fill the hole.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Leave the rest empty. No glow.', done: 'Saved.' },
    transfer: { perform: 'A new rest pattern.', done: 'Saved.' },
    review: 'After a pause, leave the hole.',
    result: 'You left a rest empty.'
  },
  L08: {
    explanation: 'Walk C–D–E–C on the beat.',
    demo: 'Listen to the walk with the clock.',
    guided: {
      hear: 'Just listen to the walk.',
      echo: 'Play the walk with the clicks.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Walk on the beat. No dump.', done: 'Saved.' },
    transfer: { perform: 'A new walk on the clock.', done: 'Saved.' },
    review: 'After a pause, walk on the beat.',
    result: 'You walked on the beat.'
  },
  L09: {
    explanation: 'F lives left of three black keys.',
    demo: 'Watch the longer house. F then G.',
    guided: {
      find: 'Find the longer doorstep — F.',
      name: 'Say F. Then play it.',
      neighbor: 'Next white key is G.',
      fingering: 'Ask a grown-up to watch the hand.',
      done: 'Ready for a quiet check.'
    },
    independent: { find: 'This F, then this G. No glow.', done: 'Saved.' },
    transfer: { neighbors: 'G then F.', done: 'Saved.' },
    result: 'You found F and G.'
  },
  L10: {
    explanation: 'A step is next door. A skip jumps.',
    demo: 'Hear a step, a repeat, and a skip.',
    guided: {
      step: 'Play a step.',
      repeat: 'Play the same key twice.',
      skip: 'Play a skip.',
      make: 'Make a three-note goodbye.',
      done: 'Ready for a quiet check.'
    },
    independent: { chain: 'Step, repeat, skip. No glow.', done: 'Saved.' },
    transfer: { chain: 'Down the path.', done: 'Saved.' },
    result: 'You heard steps and skips.'
  },
  L11: {
    explanation: 'The staff picture is the boss.',
    demo: 'See C–D–E on the staff.',
    guided: {
      walk: 'Play the staff walk.',
      neighbors: 'Find F and G on the picture.',
      ear: 'Hear a bit. Then find it.',
      done: 'Ready for a quiet check.'
    },
    independent: { walk: 'The picture is the boss. No letters.', done: 'Saved.' },
    transfer: { order: 'Same friends, new picture.', done: 'Saved.' },
    result: 'You read a staff walk.'
  },
  L12: {
    explanation: 'Porch Steps is a new little tune.',
    demo: 'Listen to Porch Steps once.',
    guided: {
      hear: 'Just listen to Porch Steps.',
      head: 'Play the first four.',
      tail: 'Play the last three.',
      all: 'Play the whole porch.',
      make: 'Make a three-note goodbye.',
      cousin: 'Just listen to the cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { home: 'Porch Steps. No letters.', done: 'Now the cousin.' },
    transfer: { cousin: 'Porch the other way.', done: 'Saved.' },
    review: 'After a pause, read it again.',
    result: 'You read a little tune.'
  },
  L13: {
    explanation: 'The left room has its own C.',
    demo: 'Hear the lower C, then neighbors.',
    guided: {
      find: 'Find the lower doorstep.',
      name: 'Say the lower C. Then play it.',
      neighbors: 'Walk C–D–E in the left room.',
      fingering: 'Ask a grown-up to watch left fingers.',
      done: 'Ready for a quiet check.'
    },
    independent: { find: 'Lower C, then neighbors. No glow.', done: 'Saved.' },
    transfer: { neighbors: 'E then D then C.', done: 'Saved.' },
    result: 'You met the left hand.'
  },
  L14: {
    explanation: 'Bass clef is the left-room picture.',
    demo: 'See the bass walk.',
    guided: {
      walk: 'Play the bass walk.',
      neighbors: 'Find F and G on the bass picture.',
      ear: 'Hear a bit. Then find it.',
      done: 'Ready for a quiet check.'
    },
    independent: { walk: 'The bass picture is the boss.', done: 'Saved.' },
    transfer: { order: 'Same friends, new bass picture.', done: 'Saved.' },
    result: 'You read a bass walk.'
  },
  L15: {
    explanation: 'One hand asks. The other answers.',
    demo: 'Hear the question, then the answer.',
    guided: {
      question: 'Play just the question.',
      answer: 'Play just the answer.',
      both: 'Question, then answer.',
      hands: 'Ask a grown-up which hand asked.',
      done: 'Ready for a quiet check.'
    },
    independent: { both: 'The whole conversation. No glow.', done: 'Saved.' },
    transfer: { both: 'Answer, then ask.', done: 'Saved.' },
    result: 'You took turns.'
  },
  L16: {
    explanation: 'One hand holds. One hand walks.',
    demo: 'Listen: hold, then walk.',
    guided: {
      hear: 'Just listen to both parts.',
      echo: 'Hold and walk with the clock.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Both parts with the clock.', done: 'Saved.' },
    transfer: { perform: 'Hold, then walk down.', done: 'Saved.' },
    review: 'After a pause, hold and walk.',
    result: 'You shared one pulse.'
  },
  L17: {
    explanation: 'Two keys on one click.',
    demo: 'Hear left, right, then both.',
    guided: {
      left: 'Just the left room.',
      right: 'Just the right room.',
      loop: 'A small loop.',
      together: 'Both rooms together.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Both rooms. No glow.', done: 'Saved.' },
    transfer: { perform: 'A new together pair.', done: 'Saved.' },
    review: 'After a pause, play both rooms.',
    result: 'You played two keys together.'
  },
  L18: {
    explanation: 'Keep a short together walk going.',
    demo: 'Listen to the together walk.',
    guided: {
      left: 'Just the left room.',
      right: 'Just the right room.',
      loop: 'Loop a small bit.',
      together: 'The whole together walk.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Keep the walk going. No glow.', done: 'Saved.' },
    transfer: { perform: 'A new together walk.', done: 'Saved.' },
    review: 'After a pause, keep going.',
    result: 'You kept going together.'
  },
  L19: {
    explanation: 'Two colors at once — a small harmony.',
    demo: 'Hear the two colors together.',
    guided: {
      left: 'Just the left color.',
      right: 'Just the right color.',
      loop: 'Loop the pair.',
      together: 'Play the harmony.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'Harmony. No glow.', done: 'Saved.' },
    transfer: { perform: 'A new harmony pair.', done: 'Saved.' },
    review: 'After a pause, play the colors.',
    result: 'You played a small harmony.'
  },
  L20: {
    explanation: 'A whole little piece with a held bass.',
    demo: 'Listen to the whole piece once.',
    guided: {
      left: 'Just the held bass.',
      right: 'Just the walk.',
      loop: 'Loop a small bit.',
      together: 'The whole piece.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { perform: 'The whole piece. No glow.', done: 'Saved.' },
    transfer: { perform: 'A new little piece.', done: 'Saved.' },
    review: 'After a pause, play the piece.',
    result: 'You finished a little piece.'
  },
  L21: {
    explanation: 'Same notes. Quieter, then stronger.',
    demo: 'Listen: soft walk, then a stronger walk.',
    guided: {
      hear: 'Just listen to quiet, then strong.',
      notes: 'Play quieter, then stronger.',
      listen: 'Ask a grown-up if they heard the change.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { play: 'Shape Soft Walk. No glow.', notes: 'Shape Soft Walk. No glow.', done: 'Saved.' },
    transfer: { play: 'Down, then stronger.', notes: 'Down, then stronger.', done: 'Saved.' },
    review: 'After a pause, shape it again.',
    result: 'You shaped the sound.'
  },
  L22: {
    explanation: 'Pick an ending. More than one is okay.',
    demo: 'Hear two honest endings.',
    guided: {
      pick: 'Pick an ending you like.',
      play: 'Play the one you picked.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { pick: 'Pick again. No glow.', play: 'Your ending. No glow.', done: 'Saved.' },
    transfer: { pick: 'A new start, your ending.', play: 'Down the hill, your ending.', done: 'Saved.' },
    review: 'After a pause, pick again.',
    result: 'You made an ending yours.'
  },
  L23: {
    explanation: 'Name one job. Do only that job.',
    demo: 'Hear notes, rhythm, and the sticky spot.',
    guided: {
      pick: 'Name the job.',
      work: 'Do only that job.',
      whole: 'Put Little Wave back together.',
      cousin: 'Just listen to a cousin.',
      done: 'Ready for a quiet check.'
    },
    independent: { pick: 'Name the job again.', work: 'The job. No glow.', play: 'The job. No glow.', done: 'Saved.' },
    transfer: { pick: 'Same kind of job.', work: 'The cousin job.', play: 'The cousin job.', done: 'Saved.' },
    review: 'After a pause, pick a job.',
    result: 'You practiced on purpose.'
  },
  L24: {
    explanation: 'A share, not a test. Finish even if a note wobbles.',
    demo: 'Pick a piece. Hear one reminder.',
    guided: {
      pick: 'Pick a piece to share.',
      remind: 'Hear one reminder.',
      play: 'Play it through. Glow stays off.',
      listen: 'Ask a grown-up if they listened.',
      done: 'Ready for recital mode.'
    },
    independent: { pick: 'Pick the piece.', play: 'Recital mode. No glow.', done: 'Saved.' },
    transfer: { pick: 'A different piece.', play: 'Another share. No glow.', done: 'Saved.' },
    review: 'After a pause, share again.',
    result: 'You shared a first recital.'
  }
};

function stepOf(view) {
  if (!view) return '';
  if (view.phase === 'guided') return view.guidedStep || '';
  if (view.phase === 'independent') return view.independentStep || '';
  if (view.phase === 'transfer') return view.transferStep || '';
  return '';
}

export function kidTarget(lessonId, phase, step) {
  const lesson = TARGETS[lessonId];
  if (!lesson) return PHASE_FALLBACK[phase] || FALLBACK;
  const block = lesson[phase];
  if (typeof block === 'string' && block) return block;
  if (block && typeof block === 'object') {
    if (step && block[step]) return block[step];
    const first = Object.values(block)[0];
    if (typeof first === 'string') return first;
  }
  return PHASE_FALLBACK[phase] || FALLBACK;
}

export function kidLine(view) {
  if (!view?.lessonSpec) return FALLBACK;
  return kidTarget(view.lessonSpec.lessonId, view.phase, stepOf(view));
}

export function kidTitle(view) {
  if (view?.phase === 'result') return 'Saved on this device';
  if (view?.phase === 'review') return 'After a pause';
  if (view?.phase === 'remediation') return 'A smaller try';
  return 'Do this now';
}

export function kidSpoken(view) {
  const job = kidLine(view);
  const title = view?.lessonSpec?.title || 'this lesson';
  return `${title}. ${job}`;
}

export function hasKidTarget(lessonId) {
  return Object.prototype.hasOwnProperty.call(TARGETS, lessonId);
}

export { TARGETS, PHASE_FALLBACK };
