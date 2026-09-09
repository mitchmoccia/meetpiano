export const HEARTBEAT = {
  id: 'heartbeat-4',
  bpm: 80,
  countInBeats: 4,
  events: [0, 1, 2, 3].map((beat) => ({
    kind: 'note',
    pitch: 60,
    onsetBeats: beat,
    durationBeats: 0.5
  }))
};

export const HEARTBEAT_QUICK = {
  ...HEARTBEAT,
  id: 'heartbeat-4-quick',
  bpm: 96
};

export const L05 = {
  lessonId: 'L05',
  curriculumVersion: 'beginner-v1',
  unitId: 'rhythm-club',
  title: 'Hear the heartbeat',
  prerequisites: ['S-PHRASE'],
  primaryNewSkill: ['S-PULSE'],
  octavePolicy: 'pitch-class-any-octave',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 80,
  reducedBpm: 60,
  countInBeats: 4,
  scoreReleases: false,
  patterns: {
    guided: HEARTBEAT,
    independent: HEARTBEAT,
    transfer: HEARTBEAT_QUICK,
    review: HEARTBEAT
  },
  equipment: {
    required: 'One playable C.',
    accessibleAlternatives: 'On-screen C is a stand-in. A grown-up may tap while the learner counts.',
    cannotObserve: 'Inner counting or exam-grade steadiness.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L05 · RHYTHM CLUB',
      title: 'Hear the heartbeat',
      paragraphs: [
        'Music has a heartbeat. We wait for it, then tap with it.',
        'The computer listens with a sound clock, not the screen’s animation. A late glow does not move the beat.'
      ],
      action: 'Show me the heartbeat'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Four heartbeats',
      paragraphs: [
        'A yellow pulse marks each beat. The glow is a helper. The click is the boss.',
        'After a count-in, four C taps — one per beat.'
      ],
      hear: 'Hear the heartbeat',
      action: 'Now you try'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Tap with the pulse',
      hear: 'Hear four heartbeats. Count-in clicks do not earn a try.',
      echo: 'Tap C with the pulse, four times. Guided windows are wide on purpose.',
      action: 'Continue to a quiet check',
      hintsOn: 'Pulse glow on',
      hintsOff: 'Pulse glow off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No glow this time',
      perform: 'Four C taps after the count-in. The pulse glow stays off. Tapping C whenever you like does not pass.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A QUICKER HEART',
      title: 'Same taps, new pace',
      perform: 'Four C taps at a slightly quicker heartbeat.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER REVIEW',
      title: 'Heartbeat again',
      pause: 'Play something else, then come back. A pass after this pause can be Retained.',
      play: 'Four C taps, no glow. This is a later listen.',
      back: 'I’m back — tap the heartbeat'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You caught the heartbeat',
      practicedTitle: 'You practiced the heartbeat',
      startedTitle: 'A start is still a start',
      firstReward: 'Heartbeat',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Rhythm Club',
      pause: 'Play something else, then come back',
      evidence: {
        independent: 'Device record: Independent. The computer heard four C taps on the clock. It cannot see how you counted inside.',
        practiced: 'Device record: Practiced. Guided pulse work is saved on this device only.',
        explored: 'Device record: Explored. You opened Hear the heartbeat and tried something on this device.',
        retained: 'Device record: Retained. A later heartbeat already succeeded on this device after a gap.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'Heard the heartbeat. Now you tap with it.',
      hit: 'With the heartbeat.',
      early: 'Too soon. Wait for the next click.',
      late: 'A little late. Land with the next click.',
      miss: 'A heartbeat went by. Try the four taps again.',
      extra: 'An extra tap. Four with the click is enough.',
      rest: 'That hole was supposed to stay quiet.',
      wrongPitch: 'Use C for this heartbeat.',
      pass: 'Four with the clock.',
      transferYes: 'Same taps, quicker heart.',
      reviewYes: 'Heartbeat after a gap. Saved as Retained on this device.',
      paused: 'Paused. This take is not a miss.',
      disconnect: 'Keyboard disconnected. This take was not marked as a miss.',
      hintsOff: 'Hide the pulse glow, then tap. Saved progress stays.',
      audioMissing: 'Sound is not available. You can still tap keys. Timing checks stay incomplete until sound works.',
      slower: 'Slower heartbeat. Windows stay the same size — no trick fails.'
    }
  }
};
