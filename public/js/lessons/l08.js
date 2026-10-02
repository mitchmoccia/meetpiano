export const WALK_EVEN = {
  id: 'cde-c-even',
  bpm: 80,
  countInBeats: 4,
  events: [
    { kind: 'note', pitch: 60, onsetBeats: 0, durationBeats: 1 },
    { kind: 'note', pitch: 62, onsetBeats: 1, durationBeats: 1 },
    { kind: 'note', pitch: 64, onsetBeats: 2, durationBeats: 1 },
    { kind: 'note', pitch: 60, onsetBeats: 3, durationBeats: 1 }
  ]
};

export const WALK_LONG_HEAD = {
  id: 'c-long-d-e',
  bpm: 80,
  countInBeats: 4,
  events: [
    { kind: 'note', pitch: 60, onsetBeats: 0, durationBeats: 2, length: 'long' },
    { kind: 'note', pitch: 62, onsetBeats: 2, durationBeats: 1 },
    { kind: 'note', pitch: 64, onsetBeats: 3, durationBeats: 1 }
  ]
};

export const WALK_LETTERS = ['C', 'D', 'E', 'C'];
export const TRANSFER_LETTERS = ['C', 'D', 'E'];

export const L08 = {
  lessonId: 'L08',
  curriculumVersion: 'beginner-v1',
  unitId: 'rhythm-club',
  title: 'Notes with a beat',
  prerequisites: ['S-REST'],
  primaryNewSkill: ['S-RHYTHM-PHRASE'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 80,
  reducedBpm: 60,
  countInBeats: 4,
  scoreReleases: true,
  patterns: {
    guided: WALK_EVEN,
    independent: WALK_EVEN,
    transfer: WALK_LONG_HEAD,
    review: WALK_EVEN
  },
  equipment: {
    required: 'C, D, and E playable.',
    accessibleAlternatives: 'Learner may sing the walk while a grown-up plays.',
    cannotObserve: 'Fingering, reading vs ear, or swing.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L08 · RHYTHM CLUB',
      title: 'Notes with a beat',
      paragraphs: [
        'Neighbors can walk on the heartbeat. The home walk is C – D – E – C, one note per beat.',
        'The same letters at any old time are a different piece. Rhythm Club does not pass pitch-only.'
      ],
      action: 'Show me the walk'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Letters that wait',
      paragraphs: [
        'Tiles light with the pulse: C, D, E, C.',
        'Same letters dumped as fast as you can is the wrong time — that must not pass.'
      ],
      hear: 'Hear the walk',
      hearWrong: 'Hear same letters, wrong time',
      action: 'Now you try'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Walk on the clicks',
      hear: 'Hear C – D – E – C with the heartbeat.',
      echo: 'Play C – D – E – C, one key per click. Optional next-tile hint.',
      cousin: 'Hear the cousin: a long C, then D, then E. Do not play it yet.',
      action: 'Continue to a quiet check',
      hintsOn: 'Tiles on',
      hintsOff: 'Tiles off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No tiles this time',
      perform: 'C – D – E – C on the beat. Correct letters as fast as possible fail. Early, late, missed, or extra notes fail.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE COUSIN RHYTHM',
      title: 'Long C, then D, then E',
      perform: 'Hold C for two beats, then D, then E. A copied even walk does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER REVIEW',
      title: 'The walk again',
      pause: 'Play something else, then come back. A pass after this pause can be Retained.',
      play: 'C – D – E – C with no tiles.',
      back: 'I’m back — walk on the beat'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You walked on the beat',
      practicedTitle: 'You practiced the walk',
      startedTitle: 'A start is still a start',
      firstReward: 'Notes with a beat',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Rhythm Club',
      pause: 'Play something else, then come back',
      evidence: {
        independent: 'Device record: Independent. The computer heard C–D–E–C on the clock, then the cousin rhythm. Pitch-only does not pass.',
        practiced: 'Device record: Practiced. Guided walk work is saved on this device only.',
        explored: 'Device record: Explored. You opened Notes with a beat and tried something on this device.',
        retained: 'Device record: Retained. A later walk already succeeded on this device after a gap.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'Heard the walk. Now you play it on the clicks.',
      cousinListen: 'That was the cousin rhythm — just listening for now.',
      hit: 'On the beat.',
      early: 'Too soon. The letters wait for the click.',
      late: 'A little late.',
      miss: 'A slot went by. One key per click.',
      extra: 'An extra tap. Same letters at any old time do not pass.',
      rest: 'That hole was supposed to stay quiet.',
      wrongPitch: 'C, then D, then E, then C — and on the beat.',
      tooShort: 'The long C needs to stay for two heartbeats.',
      tooLong: 'Let that short neighbor go.',
      pass: 'C – D – E – C on the clock.',
      transferYes: 'Long C, then D, then E. New rhythm.',
      reviewYes: 'The walk after a gap. Saved as Retained on this device.',
      paused: 'Paused. This take is not a miss.',
      disconnect: 'Keyboard disconnected. This take was not marked as a miss.',
      hintsOff: 'Hide the tiles, then walk. Saved progress stays.',
      audioMissing: 'Sound is not available. Timing checks stay incomplete until sound works.',
      slower: 'Slower heartbeat. The letters still wait for each click.'
    }
  }
};
