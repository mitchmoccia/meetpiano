import { LH_C, LH_D, LH_E, RH_C } from '../hands.js';

export const L13_C = LH_C;
export const L13_D = LH_D;
export const L13_E = LH_E;
export const L13_WALK = [LH_C, LH_D, LH_E];
export const L13_TRANSFER = [LH_E, LH_D, LH_C];

export const L13 = {
  lessonId: 'L13',
  curriculumVersion: 'beginner-v1',
  title: 'Meet the left hand',
  prerequisites: ['S-READ-PHRASE'],
  primaryNewSkill: ['S-LH-C'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  register: { C: L13_C, D: L13_D, E: L13_E },
  walk: L13_WALK,
  transfer: L13_TRANSFER,
  higherC: RH_C,
  demo: {
    landmark: [49, 51, LH_C],
    walk: L13_WALK,
    contrast: [LH_C, RH_C],
    higherC: [RH_C]
  },
  equipment: {
    required: 'A view of a lower C left of two black keys.',
    accessibleAlternatives: 'A grown-up may play the lower C while the learner points. Mark adult-supported, not independent motor skill.',
    cannotObserve: 'Which hand pressed the key, finger number, or bench height.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L13 · LEFT HAND',
      title: 'Meet the left hand',
      paragraphs: [
        'The left hand lives on the lower side of the keyboard. Notes there sound lower. Find C the same way — left of two black keys — in this lower room.',
        'Left-hand pinky is finger 5. It often sits on that C. The computer can hear the pitch. It cannot see which hand or which finger you used.'
      ],
      action: 'Show me the left-hand C'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'A lower doorstep',
      paragraphs: [
        'Watch the lower house of two, then the white key on its left. That doorstep is C — the left-hand C on this preview.',
        'Hear it next to the higher C you already know. Same letter. Different room. Different hand picture.'
      ],
      hearLandmark: 'Hear the lower house, then C',
      hearWalk: 'Hear C – D – E in the left room',
      hearContrast: 'Hear lower C, then higher C',
      action: 'Now you find it'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'The left-hand doorstep',
      find: 'Play the white key hugging the left of this lower house of two. That is C.',
      name: 'Say it aloud: “C.” Same name as the higher C, lower room.',
      neighbors: 'Walk the next white keys: D, then E. Optional glow.',
      fingering: 'A grown-up may watch left-hand fingers 5 – 4 – 3 on C – D – E. The app cannot.',
      fingeringLabel: 'A grown-up checked left-hand fingers 5–4–3.',
      handLabel: 'A grown-up checked that this was the left hand.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'This C, then its neighbors',
      find: 'Find this lower C, then D, then E. Hints stay off. The preview wants C3 – D3 – E3, not the higher C.',
      remediation: 'Left-hand C is the doorstep of the lower house of two. The higher C is a different room.',
      hearDoorstep: 'Hear the lower C, then the higher C',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'ONE MORE LOOK',
      title: 'Walk home',
      neighbors: 'Play E, then D, then C in the left room. A copied C–D–E does not count.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You met the left hand',
      practicedTitle: 'You practiced the left-hand doorstep',
      startedTitle: 'A start is still a start',
      firstReward: 'Left-hand C',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Left hand',
      evidence: {
        independent: 'Device record: Independent. The computer heard this lower C and its neighbors. It cannot see which hand or finger you used.',
        practiced: 'Device record: Practiced. The left-hand doorstep is saved on this device only.',
        explored: 'Device record: Explored. You opened Meet the left hand and tried something on this device.',
        retained: 'Device record: Retained. A later left-hand C find already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      foundC: 'Left of the lower house of two. That is C.',
      named: 'C. Same name in every room. This one is the lower room.',
      neighborsYes: 'C – D – E in the left room.',
      needC: 'Look left of the lower house of two — the doorstep, not the room in the middle.',
      needThisC: 'That is a C in another room. This check wants this lower C.',
      needNeighbors: 'Next white keys: D, then E. Stay in the left room.',
      transferYes: 'E then D then C. The walk came home.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.',
      previewOneRoom: 'This stand-in shows one lower C and one higher C. A helper piano or MIDI can reach more rooms.'
    }
  }
};

export function isHigherCError(note) {
  return Number(note) === RH_C;
}
