export const LONG_SHORT = {
  id: 'long-short-short',
  bpm: 80,
  countInBeats: 4,
  events: [
    { kind: 'note', pitch: 60, onsetBeats: 0, durationBeats: 2, length: 'long' },
    { kind: 'note', pitch: 60, onsetBeats: 2, durationBeats: 0.5, length: 'short' },
    { kind: 'note', pitch: 60, onsetBeats: 3, durationBeats: 0.5, length: 'short' }
  ]
};

export const SHORT_SHORT_LONG = {
  id: 'short-short-long',
  bpm: 80,
  countInBeats: 4,
  events: [
    { kind: 'note', pitch: 60, onsetBeats: 0, durationBeats: 0.5, length: 'short' },
    { kind: 'note', pitch: 60, onsetBeats: 1, durationBeats: 0.5, length: 'short' },
    { kind: 'note', pitch: 60, onsetBeats: 2, durationBeats: 2, length: 'long' }
  ]
};

export const L06 = {
  lessonId: 'L06',
  curriculumVersion: 'beginner-v1',
  unitId: 'rhythm-club',
  title: 'Long and short',
  prerequisites: ['S-PULSE'],
  primaryNewSkill: ['S-LONG-SHORT'],
  octavePolicy: 'pitch-class-any-octave',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 80,
  reducedBpm: 60,
  countInBeats: 4,
  scoreReleases: true,
  patterns: {
    guided: LONG_SHORT,
    independent: LONG_SHORT,
    transfer: SHORT_SHORT_LONG,
    review: LONG_SHORT
  },
  equipment: {
    required: 'A key that can be held and released.',
    accessibleAlternatives: 'A grown-up may hold while the learner says stay and short.',
    cannotObserve: 'Arm weight, legato, or pedal.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L06 · RHYTHM CLUB',
      title: 'Long and short',
      paragraphs: [
        'Some notes stay. Some notes wave hello and go.',
        'The clock hears the press and the let-go. A long note needs a hold. A short note needs a release.'
      ],
      action: 'Show me long and short'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Stay, then two waves',
      paragraphs: [
        'A wide yellow bar is the long C. Two short pink taps follow.',
        'Count-in, then long – short – short.'
      ],
      hear: 'Hear long then short',
      action: 'Now you try'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Hold, then tap-tap',
      hear: 'Hear the long C, then two short C taps.',
      echo: 'Hold C for two heartbeats, then two quick C taps. Bars may help.',
      action: 'Continue to a quiet check',
      hintsOn: 'Bars on',
      hintsOff: 'Bars off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No bars this time',
      perform: 'Long – short – short. Right-time presses still fail if the long note is chopped or a short note is held.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE OTHER WAY',
      title: 'Short, short, then stay',
      perform: 'Two short C taps, then one long C. A copied home pattern does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER REVIEW',
      title: 'Long and short again',
      pause: 'Play something else, then come back. A pass after this pause can be Retained.',
      play: 'Long – short – short, no bars.',
      back: 'I’m back — play long and short'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You held and let go',
      practicedTitle: 'You practiced long and short',
      startedTitle: 'A start is still a start',
      firstReward: 'Long and short',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Rhythm Club',
      pause: 'Play something else, then come back',
      evidence: {
        independent: 'Device record: Independent. The computer heard a long hold and two short releases. It cannot see arm weight.',
        practiced: 'Device record: Practiced. Guided long and short work is saved on this device only.',
        explored: 'Device record: Explored. You opened Long and short and tried something on this device.',
        retained: 'Device record: Retained. A later long–short already succeeded on this device after a gap.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'Heard stay then tap-tap. Now you try.',
      hit: 'On the clock.',
      early: 'Too soon.',
      late: 'A little late.',
      miss: 'A slot went by. Try the pattern again.',
      extra: 'An extra tap.',
      rest: 'That hole was supposed to stay quiet.',
      wrongPitch: 'Stay on C for this pattern.',
      tooShort: 'The long note needs to stay. Hold through two heartbeats.',
      tooLong: 'That one was a short wave. Let go sooner.',
      pass: 'Stay, then two waves.',
      transferYes: 'Short, short, then stay.',
      reviewYes: 'Long and short after a gap. Saved as Retained on this device.',
      paused: 'Paused. This take is not a miss.',
      disconnect: 'Keyboard disconnected. This take was not marked as a miss.',
      hintsOff: 'Hide the bars, then play. Saved progress stays.',
      audioMissing: 'Sound is not available. Timing checks stay incomplete until sound works.',
      slower: 'Slower heartbeat. Hold windows stay fair.'
    }
  }
};
