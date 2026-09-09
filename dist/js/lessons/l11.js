import { staffNote } from '../staff.js';

export const STAFF_WALK = [60, 62, 64];
export const STAFF_NEIGHBORS = [65, 67];
export const TRANSFER_ORDER = [64, 60, 65];
export const WALK_NOTES = STAFF_WALK.map((midi, index) => staffNote(midi, 'quarter', ['C', 'D', 'E'][index]));
export const NEIGHBOR_NOTES = STAFF_NEIGHBORS.map((midi, index) => staffNote(midi, 'quarter', ['F', 'G'][index]));
export const TRANSFER_NOTES = TRANSFER_ORDER.map((midi, index) => staffNote(midi, 'quarter', ['E', 'C', 'F'][index]));

export const L11 = {
  lessonId: 'L11',
  curriculumVersion: 'beginner-v1',
  title: 'Patterns to the staff',
  prerequisites: ['S-STEP-SKIP'],
  primaryNewSkill: ['S-STAFF-MAP'],
  octavePolicy: 'exact-pitch-when-specified',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  staffWalk: STAFF_WALK,
  staffNeighbors: STAFF_NEIGHBORS,
  transferOrder: TRANSFER_ORDER,
  walkNotes: WALK_NOTES,
  neighborNotes: NEIGHBOR_NOTES,
  transferNotes: TRANSFER_NOTES,
  demo: {
    walk: STAFF_WALK,
    neighbors: STAFF_NEIGHBORS,
    singles: { C: 60, E: 64, F: 65, G: 67 }
  },
  equipment: {
    required: 'C, D, E, F, and G playable, plus a view of the staff.',
    accessibleAlternatives: 'A grown-up may point to each head while the learner plays.',
    cannotObserve: 'Whether they read the head or guessed from leftover letters.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L11 · READ AND PLAY',
      title: 'Patterns to the staff',
      paragraphs: [
        'Notes can sit on a picture of five lines. This lesson uses the treble clef. The curly G wraps the line where G lives.',
        'A known walk on the keys can live on that picture. Each quarter is one tap and one same-length sound.'
      ],
      action: 'Show me the picture'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'G sits on the G line',
      paragraphs: [
        'The staff walk is C – D – E as three quarters. Then F – G as two quarters. Clef, heads, sound, and keys use the same notes.',
        'Letters may sit under the heads, then fade.'
      ],
      hearWalk: 'Hear the staff walk',
      hearNeighbors: 'Hear F then G',
      hearG: 'Hear the G on the clef line',
      action: 'Now you map it'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Keys and picture agree',
      walk: 'Echo the staff walk: C – D – E. Letters may show.',
      neighbors: 'Echo the neighbors on the staff: F – G.',
      ear: 'Hear F then G, then play the matching heads.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'The picture is the boss',
      walk: 'Play the staff walk. Letters and key glow stay off. This picture is C4–D4–E4, not any octave.',
      remediation: 'This C is the ledger C. The picture, not a remembered walk, is the boss.',
      hearWalk: 'Hear the two-note neighbors',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A NEW ORDER',
      title: 'Same friends, new picture',
      order: 'Play E – C – F from the staff. Letters off. A copied C–D–E does not count.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You mapped a pattern',
      practicedTitle: 'You practiced the staff picture',
      startedTitle: 'A start is still a start',
      firstReward: 'Staff walk',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Read and play',
      evidence: {
        independent: 'Device record: Independent. The computer heard the staff walk and the new order at the named pitches. It cannot see whether you read or remembered leftover letters.',
        practiced: 'Device record: Practiced. Staff mapping is saved on this device only.',
        explored: 'Device record: Explored. You opened Patterns to the staff and tried something on this device.',
        retained: 'Device record: Retained. A later staff walk already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      walkYes: 'The walk matches the picture.',
      neighborsYes: 'F and G sit where they sound.',
      earYes: 'Heard, then found on the staff.',
      transferYes: 'New order. Same friends.',
      wrong: 'Look at the picture. This register is the one on the staff.',
      octave: 'That is the same letter in another room. The staff wants this key.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.'
    }
  }
};
