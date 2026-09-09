import { staffNote, TREBLE_CLEF } from '../staff.js';
import { CHOICES, STEM_DOWN, STEM_UP, TRANSFER_CHOICES, phraseForChoice } from '../expression-score.js';

export const HOME_STEM = [...STEM_UP];
export const TRANSFER_STEM = [...STEM_DOWN];
export { CHOICES, TRANSFER_CHOICES };

export const HOME_HOME = phraseForChoice(HOME_STEM, 'home');
export const HOME_OPEN = phraseForChoice(HOME_STEM, 'open');
export const HOME_TURN = phraseForChoice(HOME_STEM, 'turn');
export const TRANSFER_HOME = phraseForChoice(TRANSFER_STEM, 'home', TRANSFER_CHOICES);
export const TRANSFER_OPEN = phraseForChoice(TRANSFER_STEM, 'open', TRANSFER_CHOICES);
export const TRANSFER_TURN = phraseForChoice(TRANSFER_STEM, 'turn', TRANSFER_CHOICES);

export const HOME_NOTES = HOME_HOME.map((midi, index) => staffNote(midi, 'quarter', ['C', 'D', 'E', 'C'][index], TREBLE_CLEF, index));
export const TRANSFER_NOTES = TRANSFER_HOME.map((midi, index) => staffNote(midi, 'quarter', ['E', 'D', 'C', 'C'][index], TREBLE_CLEF, index));

export const L22 = {
  lessonId: 'L22',
  curriculumVersion: 'beginner-v1',
  title: 'Make it yours',
  prerequisites: ['S-DYNAMIC'],
  primaryNewSkill: ['S-MAKE-YOURS'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  homeStem: HOME_STEM,
  transferStem: TRANSFER_STEM,
  choices: CHOICES,
  transferChoices: TRANSFER_CHOICES,
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  equipment: {
    required: 'C, D, E, and G playable in the named room. No stretch past G.',
    accessibleAlternatives: 'A grown-up may play the ending the learner points to. Mark that as adult-supported, not an independent choice at the keys.',
    cannotObserve: 'Whether the ending felt “pretty,” or which melody is the one true tune. There is no single correct melody.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L22 · EXPRESSION',
      title: 'Make it yours',
      paragraphs: [
        'Start with C – D – E. Then you choose how it ends. Land on C. Open on G. Or turn back D – C. Each ending is a real piece. The app will not crown one of them as the right song.',
        'Pick first. Then play the walk you picked. Playing a different valid ending is still a choice — switch the button, or play the one you picked.'
      ],
      action: 'Show me the endings'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Three honest endings',
      paragraphs: [
        'Hear land-on-C, open-on-G, and turn-back. Same start. Different last step.',
        'None of these is Little Wave, and none is a published primer song.'
      ],
      hearHome: 'Hear land on C',
      hearOpen: 'Hear open on G',
      hearTurn: 'Hear turn back',
      action: 'I will pick one'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Pick, then play',
      pick: 'Choose an ending. Land, open, or turn. Helpers optional.',
      play: 'Play C – D – E plus the ending you picked.',
      cousin: 'Hear a downward start with three new endings. Do not play it yet.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Your ending, no glow',
      pick: 'Pick again. Hints off.',
      play: 'Play the start plus the ending you picked. Another valid ending is not wrong music — it is a different choice.',
      remediation: 'C – D – E first. Then only the ending on the button you pressed.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A NEW START',
      title: 'Down the hill, your ending',
      pick: 'Start is now E – D – C. Pick stay-on-C, open-on-G, or turn-up D – E.',
      play: 'Play the new start plus the ending you picked. A copied climb does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'Choose later',
      pause: 'Take a named pause, then pick an ending again.',
      play: 'Pick, then play. No glow.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You made it yours',
      practicedTitle: 'You practiced choosing an ending',
      startedTitle: 'A start is still a start',
      firstReward: 'Your ending',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Expression',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. The computer heard the start plus the ending you named. It did not grade one melody as the correct song.',
        practiced: 'Device record: Practiced. Make it yours is saved on this device only.',
        explored: 'Device record: Explored. You opened Make it yours and tried something on this device.',
        retained: 'Device record: Retained. A later chosen ending already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That ending is one honest choice.',
      cousinListen: 'Just listening. The downward start waits for the next check.',
      needPick: 'Pick an ending first. The app will not invent a correct melody for you.',
      match: 'That was the ending you picked.',
      otherValid: 'That is a real ending, and a different choice than the button you pressed. Switch the button, or play the one you picked.',
      wrong: 'The start is C – D – E, then only your ending.',
      transferWrong: 'The start is E – D – C, then only your ending.',
      transferYes: 'The new start plus your ending landed.',
      reviewYes: 'A later choice landed.',
      hintsOff: 'Hide helpers, then play. Saved progress stays.',
      audioMissing: 'Sound is not available. You can still tap keys. Choice checks stay incomplete until sound works.'
    }
  }
};
