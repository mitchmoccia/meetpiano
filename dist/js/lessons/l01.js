export const L01 = {
  lessonId: 'L01',
  curriculumVersion: 'beginner-v1',
  title: 'Meet the keyboard',
  prerequisites: [],
  primaryNewSkill: ['S-SETUP', 'S-HIGH-LOW', 'S-BLACK-GROUPS'],
  octavePolicy: 'pitch-class-any-octave',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  minHighLowInterval: 5,
  demo: {
    highLow: [71, 60],
    rise: [60, 64, 67, 71],
    fall: [71, 67, 64, 60],
    twoCluster: [61, 63],
    threeCluster: [66, 68, 70],
    whiteHighLow: [71, 60]
  },
  visibleTwoGroup: 'two-4',
  visibleThreeGroup: 'three-4',
  hintHighLow: [71, 60],
  equipment: {
    required: 'A browser instrument or a real keyboard plus this page.',
    accessibleAlternatives: 'This on-screen keyboard is a stand-in if no piano is nearby. A grown-up may play while the learner points.',
    cannotObserve: 'The app cannot see sitting, bench height, or which finger pressed a real key.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L01 · FIRST PIANO JOURNEY',
      title: 'Meet the keyboard',
      paragraphs: [
        'A piano is a long row of hills. White keys are the path. Black keys stand up in clumps of two and three.',
        'Notes get higher as you move to the right (and usually toward the thinner strings / shorter side on a real piano) and lower to the left.',
        'Before playing, we sit so arms can reach without hunching.'
      ],
      action: 'Show me the keyboard'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Hills, clumps, high and low',
      paragraphs: [
        'One clump of two black keys. One clump of three. No note names yet — just the picture.',
        'Watch the glow walk right while the sound climbs, then left while the sound slides down.'
      ],
      hearHighLow: 'Hear high, then low',
      hearClusters: 'Hear black-key clumps',
      hearSweep: 'Play the up-and-down picture',
      seatingCaption: 'A grown-up checks this. The app cannot see your sitting.',
      action: 'Now you try'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Your turn to explore',
      unlock: 'Tap to unlock sound. Browsers wait for a gesture before they will play.',
      unlockAction: 'Tap to wake the sound',
      highLow: 'Play any high-sounding key, then any low-sounding key. High usually lives to the right. Low lives to the left.',
      groups: 'Tap inside a group of two black keys, then a group of three.',
      posture: 'Grown-up check: are shoulders soft and the bench a comfortable height?',
      postureLabel: 'A grown-up checked sitting. The app cannot see posture.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No glow this time',
      highLow: 'Play one note you call high, then one you call low. The second sound should be lower than the first.',
      groups: 'Play inside any two-black group and any three-black group, in either order. Outlines stay off.',
      remediation: 'Higher means the sound climbs, usually to the right — not which key is taller.',
      hearWhite: 'Hear two white keys: high, then low',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'ONE MORE LOOK',
      title: 'Another clump of two',
      otherTwo: 'Find a different group of two black keys than the one you used while practicing. On this small stand-in there is only one pair. Play a two-black group in another octave on a connected keyboard, or point to another pair on a real piano.',
      adultTwo: 'A grown-up confirms we found another group of two on a real piano (or we only have one pair on this preview).',
      three: 'This preview shows one group of three. Point to a group of three on a real piano if you have one.',
      adultThree: 'A grown-up confirms the learner pointed to a group of three.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You met the keyboard',
      practicedTitle: 'A good explore',
      startedTitle: 'A start is still a start',
      firstReward: 'Keyboard explorer',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to MeetPiano home'
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      needHigherFirst: 'Try a high sound first, then a lower one.',
      tooClose: 'Those are close neighbors. Try a key farther right, then one farther left.',
      highLowYes: 'High, then low. The sound stepped down.',
      needTwo: 'Find the clump of two black keys first.',
      needThree: 'Now the clump of three black keys.',
      groupsYes: 'Two, then three. Those are the little houses.',
      independentGroupsYes: 'Both clumps. Nice listening with your hands.',
      whiteKey: 'Black keys only for this bit — the ones that stand up in clumps.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.',
      unlocked: 'Sound is awake. Play when you are ready.'
    }
  }
};

export function interval(a, b) {
  return Math.abs(a - b);
}

export function isLower(second, first) {
  return second < first;
}
