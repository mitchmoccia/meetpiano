export const L02 = {
  lessonId: 'L02',
  curriculumVersion: 'beginner-v1',
  title: 'Find C',
  prerequisites: ['S-SETUP', 'S-BLACK-GROUPS'],
  primaryNewSkill: ['S-FIND-C', 'S-REGISTER-C'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  guidedC: 60,
  otherC: 72,
  doorstepWrong: [62, 64],
  visibleTwoGroup: 'two-4',
  demo: {
    landmark: [61, 63, 60],
    clusterThenC: [60, 61, 63, 60],
    higherC: [72],
    lowerC: [48],
    doorstep: [60, 62]
  },
  equipment: {
    required: 'A view of at least one two-black group.',
    accessibleAlternatives: 'A paper keyboard, or a grown-up pointing to a real C while the learner plays on-screen.',
    cannotObserve: 'Whether the learner used the landmark or a leftover letter label.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L02 · FIRST NOTES',
      title: 'Find C',
      paragraphs: [
        'Find a group of two black keys. The white key hugging the left side of that group is C.',
        'Every two-black group has its own C. They sound like family members with the same name in different rooms.'
      ],
      action: 'Show me C'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Left of the two black keys',
      paragraphs: [
        'Watch the two black keys glow, then the white key on their left. That doorstep is C.',
        'No staff yet. A letter C may appear, then fade.'
      ],
      hearLandmark: 'Hear C, the two black keys, then C',
      hearHigher: 'Hear a higher C',
      hearLower: 'Hear a lower C',
      action: 'Now you find C'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'The doorstep',
      find: 'Play the white key hugging the left of this two-black group. That is C.',
      name: 'Say it aloud: “C.” Hear it again if you want.',
      other: 'If you have a wider keyboard or MIDI, play any other C. On this stand-in there is only one C — a grown-up can point to another on a real piano.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off',
      adultOther: 'A grown-up pointed to a different C on a real piano.'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No glow this time',
      find: 'Find C again. Hints and letter labels stay off.',
      register: 'Now a C in a new room — a different MIDI C if you have one, or point to a different C on a real piano.',
      adultRegister: 'A grown-up confirms we found a different C on a real piano (this preview only shows one C).',
      remediation: 'C is the doorstep on the left, not the room in the middle.',
      hearDoorstep: 'Hear C, then D — which one was the doorstep?',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'ONE MORE LOOK',
      title: 'Another house of two',
      otherHouse: 'Start from a two-black group that was not the practice house. What white key sits on its left? No letter labels.',
      adultHouse: 'A grown-up confirms another two-black house and its left-side C on a real piano.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You found C',
      practicedTitle: 'You practiced the landmark',
      startedTitle: 'A start is still a start',
      firstReward: 'C finder',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to First Notes',
      evidence: {
        independent: 'Device record: Independent. The computer heard C. A new register needs another C or a grown-up mark. The app cannot see how you found it.',
        practiced: 'Device record: Practiced. The landmark is saved on this device only.',
        explored: 'Device record: Explored. You opened Find C and tried something on this device.',
        retained: 'Device record: Retained. A later C find already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      foundC: 'Left of the two black keys. That is C.',
      named: 'C. Same name in every room.',
      otherC: 'A different C. Same name, new room.',
      needC: 'Look left of the two black keys — the doorstep, not the middle.',
      needDifferentC: 'That is the same C as practice. Try another octave, or ask a grown-up to confirm a different C.',
      houseYes: 'Another house, same doorstep name.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.',
      previewOneC: 'This stand-in shows one C. A helper piano or MIDI can reach a higher or lower C.'
    }
  }
};

export function isPitchClassC(note) {
  return ((Number(note) % 12) + 12) % 12 === 0;
}

export function isDoorstepError(note) {
  const pc = ((Number(note) % 12) + 12) % 12;
  return pc === 2 || pc === 4;
}
