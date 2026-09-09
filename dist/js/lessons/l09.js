export const L09_F = 65;
export const L09_G = 67;

export const L09 = {
  lessonId: 'L09',
  curriculumVersion: 'beginner-v1',
  title: 'Meet F and G',
  prerequisites: ['S-RHYTHM-PHRASE'],
  primaryNewSkill: ['S-FIND-FG'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  register: { F: L09_F, G: L09_G },
  visibleThreeGroup: 'three-4',
  doorstepWrong: [64, 69],
  demo: {
    landmark: [66, 68, 70, 65],
    clusterThenF: [65, 66, 68, 70, 65],
    neighbors: [65, 67],
    gAlone: [67],
    higherF: [77],
    higherG: [79]
  },
  equipment: {
    required: 'A view of at least one three-black group.',
    accessibleAlternatives: 'A paper keyboard, or a grown-up pointing to a real F or G while the learner plays on-screen.',
    cannotObserve: 'Whether the learner used the landmark or a leftover letter label.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L09 · READ AND PLAY',
      title: 'Meet F and G',
      paragraphs: [
        'Find a group of three black keys. The white key hugging the left side of that group is F.',
        'The next white key to its right is G. C still lives left of two black keys. F and G live beside the house of three.'
      ],
      action: 'Show me F and G'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Left of the three black keys',
      paragraphs: [
        'Watch the three black keys glow, then the white key on their left. That doorstep is F. Next door to the right is G.',
        'No staff yet. Letters may appear, then fade.'
      ],
      hearLandmark: 'Hear F, the three black keys, then F',
      hearNeighbors: 'Hear F, then G',
      hearG: 'Hear G',
      hearHigherF: 'Hear a higher F',
      action: 'Now you find them'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'The longer doorstep',
      find: 'Play the white key hugging the left of this three-black group. That is F.',
      name: 'Say it aloud: “F.” Hear it again if you want.',
      neighbor: 'Now G — the next white key to the right of F.',
      fingering: 'A grown-up may watch fingers on F and G. The app cannot.',
      fingeringLabel: 'A grown-up checked fingers on F and G.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'This F, then this G',
      find: 'Find this F, then this G. Hints and letter labels stay off. The preview wants F4 then G4 — not another room.',
      remediation: 'F is the doorstep on the left of three. G is the next white key, not a skip.',
      hearDoorstep: 'Hear F, then G — which one was the doorstep?',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'ONE MORE LOOK',
      title: 'Neighbors the other way',
      neighbors: 'Play G, then F. A copied F-then-G does not count.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You met F and G',
      practicedTitle: 'You practiced the three-key landmark',
      startedTitle: 'A start is still a start',
      firstReward: 'F and G',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Read and play',
      evidence: {
        independent: 'Device record: Independent. The computer heard this F and this G. It cannot see how you found them.',
        practiced: 'Device record: Practiced. The landmark is saved on this device only.',
        explored: 'Device record: Explored. You opened Meet F and G and tried something on this device.',
        retained: 'Device record: Retained. A later F and G find already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      foundF: 'Left of the three black keys. That is F.',
      named: 'F. Same name beside every house of three.',
      foundG: 'Next door to the right. That is G.',
      needF: 'Look left of the three black keys — the longer doorstep, not E beside the house of two.',
      needG: 'G is the next white key to the right of F, not a skip past it.',
      needThisF: 'That is an F in another room. This check wants this F on the preview.',
      needThisG: 'That is a G in another room. This check wants this G on the preview.',
      transferYes: 'G then F. The neighbors turned around.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.',
      previewOneRoom: 'This stand-in shows one F and one G. A helper piano or MIDI can reach another room.'
    }
  }
};

export function isDoorstepFgError(note) {
  const pc = ((Number(note) % 12) + 12) % 12;
  return pc === 4 || pc === 9;
}
