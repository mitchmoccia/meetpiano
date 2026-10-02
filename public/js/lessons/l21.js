import { staffNote, TREBLE_CLEF } from '../staff.js';
import { SOFT_WALK, SOFT_WALK_DOWN } from '../expression-score.js';

export const HOME_PHRASE = [...SOFT_WALK, ...SOFT_WALK];
export const TRANSFER_PHRASE = [...SOFT_WALK_DOWN, ...SOFT_WALK_DOWN];
export const HOME_LETTERS = ['C', 'D', 'E', 'C', 'C', 'D', 'E', 'C'];
export const TRANSFER_LETTERS = ['E', 'D', 'C', 'C', 'E', 'D', 'C', 'C'];

export const HOME_NOTES = HOME_PHRASE.map((midi, index) => staffNote(midi, 'quarter', HOME_LETTERS[index], TREBLE_CLEF, index));
export const TRANSFER_NOTES = TRANSFER_PHRASE.map((midi, index) => staffNote(midi, 'quarter', TRANSFER_LETTERS[index], TREBLE_CLEF, index));

export const L21 = {
  lessonId: 'L21',
  curriculumVersion: 'beginner-v1',
  title: 'Shape the sound',
  prerequisites: ['S-LITTLE-PIECE'],
  primaryNewSkill: ['S-DYNAMIC'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  homePhrase: HOME_PHRASE,
  transferPhrase: TRANSFER_PHRASE,
  homeLetters: HOME_LETTERS,
  transferLetters: TRANSFER_LETTERS,
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  split: 4,
  quietVelocity: 0.28,
  strongVelocity: 0.9,
  equipment: {
    required: 'C, D, and E playable in the named room.',
    accessibleAlternatives: 'On-screen and computer keys can practice the letters. Quiet versus strong needs MIDI velocity or a grown-up who listened.',
    cannotObserve: 'Wrist, weight, finger, or studio-grade loudness. Technique is never inferred.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L21 · EXPRESSION',
      title: 'Shape the sound',
      paragraphs: [
        'The same short walk can feel different. Soft Walk is MeetPiano’s own C – D – E – C. Play it quieter. Play it again stronger. Relative only — not a studio meter.',
        'MIDI can compare how hard the keys spoke, if the keyboard sent velocity. Touch and computer keys cannot show that. The app never guesses your wrist or finger.'
      ],
      action: 'Show me quieter and stronger'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Same letters, two colors',
      paragraphs: [
        'Hear Soft Walk whispered, then the same letters spoken out. The picture stays C – D – E – C both times.',
        'A copied Little Wave or a rushed dump of letters is a different job.'
      ],
      hearQuiet: 'Hear quieter Soft Walk',
      hearStrong: 'Hear stronger Soft Walk',
      action: 'I will try both colors'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Quieter, then stronger',
      hear: 'Listen first. Quieter Soft Walk, then stronger Soft Walk.',
      notes: 'Play Soft Walk twice: C – D – E – C, then again. Helpers optional.',
      listen: 'A grown-up heard quieter, then stronger. Needed when this input cannot send velocity.',
      self: 'I noticed the second walk felt stronger.',
      cousin: 'Hear the cousin: E – D – C – C, quieter then stronger. Do not play it yet.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Shape Soft Walk',
      notes: 'Soft Walk twice. Hints off. MIDI compares relative velocity when it is present. Touch cannot invent a dynamics score.',
      remediation: 'Same four letters, twice. First time softer. Second time stronger. The computer will not guess your technique.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A COUSIN WALK',
      title: 'Down, then stronger',
      notes: 'E – D – C – C quieter, then the same letters stronger. A copied climb does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'Shape it later',
      pause: 'Take a named pause, then try Soft Walk quieter then stronger again.',
      play: 'The same walk, two colors.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You shaped the sound',
      practicedTitle: 'You practiced quieter and stronger',
      startedTitle: 'A start is still a start',
      firstReward: 'Soft Walk colors',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Expression',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. Notes are saved separately from dynamics. Dynamics used velocity only when this input could send it, or a grown-up listened. Technique was not inferred.',
        practiced: 'Device record: Practiced. Shape the sound is saved on this device only.',
        explored: 'Device record: Explored. You opened Shape the sound and tried something on this device.',
        retained: 'Device record: Retained. A later quieter-then-stronger walk already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That was Soft Walk. Your keys earn the try.',
      cousinListen: 'Just listening. The cousin waits for the next check.',
      notesYes: 'Those letters landed.',
      dynamicsYes: 'The second walk spoke stronger. Relative only.',
      dynamicsNo: 'The two walks were too alike, or the strong one came first. Try quieter, then stronger.',
      dynamicsUnavailable: 'This input cannot show quiet versus strong. Notes can still count. A grown-up can listen if you want Independent.',
      otherValid: 'Those letters are a real walk, but this check wants Soft Walk twice.',
      wrong: 'Different letters. Soft Walk is C – D – E – C, twice.',
      transferYes: 'The cousin walk had two colors.',
      reviewYes: 'The later walk had two colors.',
      needListen: 'When velocity is missing, Independent waits for a grown-up who heard quieter then stronger.',
      hintsOff: 'Hide helpers, then play. Saved progress stays.',
      technique: 'The app does not infer wrist, weight, or finger.',
      audioMissing: 'Sound is not available. You can still tap keys. Dynamics stay incomplete until sound works.'
    }
  }
};
