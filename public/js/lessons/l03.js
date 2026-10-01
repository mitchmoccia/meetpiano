export const L03 = {
  lessonId: 'L03',
  curriculumVersion: 'beginner-v1',
  title: 'Neighbors C–D–E',
  prerequisites: ['S-FIND-C'],
  primaryNewSkill: ['S-NEIGHBOR', 'S-FINGER-CDE', 'S-ORDER-CDE'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  register: { C: 60, D: 62, E: 64 },
  demoOrder: [60, 62, 64],
  listenDown: [64, 62, 60],
  independentOrder: [62, 60, 64],
  transferOrder: [64, 60, 62],
  bannedIndependent: [
    [60, 62, 64],
    [64, 62, 60]
  ],
  fingers: { 60: 1, 62: 2, 64: 3 },
  demo: {
    up: [60, 62, 64],
    down: [64, 62, 60]
  },
  equipment: {
    required: 'Three adjacent white keys C–D–E visible or on a real keyboard.',
    accessibleAlternatives: 'One-finger playing of the correct keys if 1–2–3 is not yet possible.',
    cannotObserve: 'Actual finger numbers without a grown-up.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L03 · FIRST NOTES',
      title: 'Neighbors C–D–E',
      paragraphs: [
        'D lives next door to C, one white key to the right. E is next door to D. Together they are three neighbors.',
        'We can walk C–D–E with right-hand fingers 1 (thumb), 2, and 3 as a demonstrated pattern. The app can hear the notes. A grown-up watches the fingers.'
      ],
      action: 'Show me the neighbors'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Three neighbors, three fingers',
      paragraphs: [
        'C, then D, then E light in order. Thumb on C, index on D, middle on E.',
        'A grown-up checks fingers. MIDI cannot.'
      ],
      hearUp: 'Hear C, D, E',
      hearDown: 'Hear E, D, C — just listening',
      action: 'Now you walk'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Next door',
      findC: 'Find C — the doorstep left of two black keys.',
      neighbors: 'Play the next white key (D), then the next (E).',
      row: 'Play C–D–E in a row. Optional finger numbers 1–2–3.',
      fingering: 'Grown-up check: thumb was on C, next two fingers on D and E.',
      fingeringLabel: 'A grown-up checked fingers 1–2–3. MIDI cannot see fingers.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'A new order',
      order: 'Play D, then C, then E. Hints off. Finger numbers off. A new pattern — not the climbing row.',
      remediation: 'Neighbors share a fence — the next white key. Black keys are a different path.',
      hearNeighbors: 'Hear C to D only',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'ONE MORE LOOK',
      title: 'Another new order',
      order: 'Play E, then C, then D. Same three neighbors, different walk.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You met the neighbors',
      practicedTitle: 'You walked next door',
      startedTitle: 'A start is still a start',
      firstReward: 'Neighbor walker',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to First Notes',
      evidence: {
        independent: 'Device record: Independent. The computer heard a new C–D–E order. Fingering stays adult-observed.',
        practiced: 'Device record: Practiced. Neighbor walking is saved on this device only.',
        explored: 'Device record: Explored. You opened Neighbors and tried something on this device.',
        retained: 'Device record: Retained. A later neighbor order already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      foundC: 'C. Now the next white key to the right.',
      foundD: 'D, next door. Now E, the next white key.',
      foundE: 'C, D, and E. Three neighbors.',
      rowYes: 'C–D–E in a row.',
      orderYes: 'A new order. Not the climbing row.',
      transferYes: 'Another new walk. Same three friends.',
      skip: 'Neighbors share a fence — the next white key. Black keys are a different path.',
      needC: 'Start from C, left of the two black keys.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.',
      listenOnly: 'Just listening — that falling row is not the check.'
    }
  }
};

export function isCdePitchClass(note) {
  const pc = ((Number(note) % 12) + 12) % 12;
  return pc === 0 || pc === 2 || pc === 4;
}
