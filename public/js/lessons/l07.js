export const REST_HOME = {
  id: 'c-rest-c-c',
  bpm: 80,
  countInBeats: 4,
  events: [
    { kind: 'note', pitch: 60, onsetBeats: 0, durationBeats: 0.5 },
    { kind: 'rest', onsetBeats: 1, durationBeats: 1 },
    { kind: 'note', pitch: 60, onsetBeats: 2, durationBeats: 0.5 },
    { kind: 'note', pitch: 60, onsetBeats: 3, durationBeats: 0.5 }
  ]
};

export const REST_MOVED = {
  id: 'c-c-rest-c',
  bpm: 80,
  countInBeats: 4,
  events: [
    { kind: 'note', pitch: 60, onsetBeats: 0, durationBeats: 0.5 },
    { kind: 'note', pitch: 60, onsetBeats: 1, durationBeats: 0.5 },
    { kind: 'rest', onsetBeats: 2, durationBeats: 1 },
    { kind: 'note', pitch: 60, onsetBeats: 3, durationBeats: 0.5 }
  ]
};

export const L07 = {
  lessonId: 'L07',
  curriculumVersion: 'beginner-v1',
  unitId: 'rhythm-club',
  title: 'Silence belongs',
  prerequisites: ['S-LONG-SHORT'],
  primaryNewSkill: ['S-REST'],
  octavePolicy: 'pitch-class-any-octave',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 80,
  reducedBpm: 60,
  countInBeats: 4,
  scoreReleases: false,
  patterns: {
    guided: REST_HOME,
    independent: REST_HOME,
    transfer: REST_MOVED,
    review: REST_HOME
  },
  equipment: {
    required: 'One playable C and a way to wait.',
    accessibleAlternatives: 'Clap the sounding beats and hold still on the rest.',
    cannotObserve: 'Whether they counted 1-2-3-4 internally.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L07 · RHYTHM CLUB',
      title: 'Silence belongs',
      paragraphs: [
        'Quiet is part of the music. A rest is a place we leave empty on purpose.',
        'Playing the right note in the hole does not keep the beat. The hole is the point.'
      ],
      action: 'Show me the hole'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'An empty box',
      paragraphs: [
        'Four beat boxes. Beat 2 says shh. C on 1, quiet on 2, C on 3, C on 4.',
        'The empty box is a note too — a silent one.'
      ],
      hear: 'Hear the hole',
      action: 'Now you try'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Leave the hole empty',
      hear: 'Hear C, rest, C, C.',
      echo: 'Play C — (shh) — C — C. The rest box may glow.',
      action: 'Continue to a quiet check',
      hintsOn: 'Rest glow on',
      hintsOff: 'Rest glow off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No glow this time',
      perform: 'C, rest, C, C. A tap in the hole fails the take. Missing the C after the rest also fails.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE HOLE MOVES',
      title: 'Quiet on beat three',
      perform: 'C, C, rest, C. The rest sits in a new slot.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER REVIEW',
      title: 'The hole again',
      pause: 'Play something else, then come back. A pass after this pause can be Retained.',
      play: 'C, rest, C, C. No glow.',
      back: 'I’m back — leave the hole'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You left the quiet',
      practicedTitle: 'You practiced the rest',
      startedTitle: 'A start is still a start',
      firstReward: 'Silence belongs',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Rhythm Club',
      pause: 'Play something else, then come back',
      evidence: {
        independent: 'Device record: Independent. The computer heard C, a quiet slot, then two C taps. It cannot see how you waited.',
        practiced: 'Device record: Practiced. Guided rest work is saved on this device only.',
        explored: 'Device record: Explored. You opened Silence belongs and tried something on this device.',
        retained: 'Device record: Retained. A later rest pattern already succeeded on this device after a gap.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'Heard the hole. Now leave it empty.',
      hit: 'Sounded on the clock.',
      early: 'Too soon.',
      late: 'A little late.',
      miss: 'A slot went by — including the quiet one you play after.',
      extra: 'An extra tap.',
      rest: 'That hole was music too. Leave it empty.',
      wrongPitch: 'Use C when it is time to play.',
      pass: 'C, quiet, C, C.',
      transferYes: 'The hole moved, and you left it.',
      reviewYes: 'The rest after a gap. Saved as Retained on this device.',
      paused: 'Paused. This take is not a miss.',
      disconnect: 'Keyboard disconnected. This take was not marked as a miss.',
      hintsOff: 'Hide the rest glow, then play. Saved progress stays.',
      audioMissing: 'Sound is not available. Timing checks stay incomplete until sound works.',
      slower: 'Slower heartbeat. The hole stays one beat.'
    }
  }
};
