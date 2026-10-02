export const STEP_UP = [60, 62];
export const REPEAT_G = [67, 67];
export const SKIP_UP = [60, 64];
export const HOME_CHAIN = [60, 62, 62, 65];
export const TRANSFER_CHAIN = [67, 65, 65, 62];
export const HOME_LETTERS = ['C', 'D', 'D', 'F'];
export const TRANSFER_LETTERS = ['G', 'F', 'F', 'D'];

export const L10 = {
  lessonId: 'L10',
  curriculumVersion: 'beginner-v1',
  title: 'Steps, repeats, and skips',
  prerequisites: ['S-FIND-FG'],
  primaryNewSkill: ['S-STEP-SKIP'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  stepUp: STEP_UP,
  repeatG: REPEAT_G,
  skipUp: SKIP_UP,
  homeChain: HOME_CHAIN,
  transferChain: TRANSFER_CHAIN,
  homeLetters: HOME_LETTERS,
  transferLetters: TRANSFER_LETTERS,
  demo: {
    step: STEP_UP,
    repeat: REPEAT_G,
    skip: SKIP_UP,
    contrastSkip: [60, 64]
  },
  equipment: {
    required: 'C through G playable.',
    accessibleAlternatives: 'A grown-up may play the interval while the learner names step, repeat, or skip.',
    cannotObserve: 'Fingering, or whether they counted keys versus listened.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L10 · READ AND PLAY',
      title: 'Steps, repeats, and skips',
      paragraphs: [
        'A step is the next white key. A repeat is the same key again. A skip leaves out one white key — C to E, D to F, or E to G.',
        'We hear the jump before we name it.'
      ],
      action: 'Show me the jumps'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Next door, same place, one rest',
      paragraphs: [
        'C then D is a step. G then G is a repeat. C then E is a skip — one white key takes a rest.',
        'Letters may show, then fade. Still no staff required.'
      ],
      hearStep: 'Hear a step',
      hearRepeat: 'Hear a repeat',
      hearSkip: 'Hear a skip',
      action: 'Now you try'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Name the jump',
      step: 'From C, play a step up — the next white key.',
      repeat: 'Play a repeat on G. Same place twice.',
      skip: 'From C, play a skip up — leave D sitting.',
      make: 'Make a three-note goodbye that uses one step and one skip. Any valid mix is fine.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Step, repeat, skip',
      chain: 'Play C – D – D – F. Letters stay off. This preview wants those exact keys, not another octave.',
      remediation: 'A step shares a fence. A skip leaves one white key sitting.',
      hearNeighbors: 'Hear C to D, then C to E',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE OTHER WAY',
      title: 'Down the path',
      chain: 'Play G – F – F – D. A copied C–D–D–F does not count.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You named the jumps',
      practicedTitle: 'You practiced steps and skips',
      startedTitle: 'A start is still a start',
      firstReward: 'Step and skip',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Read and play',
      evidence: {
        independent: 'Device record: Independent. The computer heard a step, a repeat, and a skip in the named register. It cannot see fingering.',
        practiced: 'Device record: Practiced. Interval work is saved on this device only.',
        explored: 'Device record: Explored. You opened Steps, repeats, and skips and tried something on this device.',
        retained: 'Device record: Retained. A later interval chain already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      stepYes: 'A step. Next door.',
      repeatYes: 'A repeat. Same place.',
      skipYes: 'A skip. One white key sat still.',
      makeYes: 'A goodbye with a step and a skip.',
      needStep: 'A step is the next white key. Try C to D.',
      needRepeat: 'Play the same G again.',
      needSkip: 'A skip leaves one white key sitting. Try C to E, not C to D.',
      chainYes: 'Step, repeat, skip.',
      transferYes: 'Down the path. New order.',
      wrong: 'Not that jump yet. Hear it, then try again.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.'
    }
  }
};
