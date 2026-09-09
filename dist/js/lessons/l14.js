import { staffNote, BASS_CLEF } from '../staff.js';
import { LH_C, LH_D, LH_E, LH_F } from '../hands.js';

export const BASS_WALK = [LH_C, LH_D, LH_E];
export const BASS_NEIGHBORS = [LH_F, 55];
export const BASS_TRANSFER = [LH_E, LH_C, LH_F];
export const WALK_NOTES = BASS_WALK.map((midi, index) => staffNote(midi, 'quarter', ['C', 'D', 'E'][index], BASS_CLEF));
export const NEIGHBOR_NOTES = BASS_NEIGHBORS.map((midi, index) => staffNote(midi, 'quarter', ['F', 'G'][index], BASS_CLEF));
export const TRANSFER_NOTES = BASS_TRANSFER.map((midi, index) => staffNote(midi, 'quarter', ['E', 'C', 'F'][index], BASS_CLEF));

export const L14 = {
  lessonId: 'L14',
  curriculumVersion: 'beginner-v1',
  title: 'Left-hand reading',
  prerequisites: ['S-LH-C'],
  primaryNewSkill: ['S-BASS-MAP'],
  octavePolicy: 'exact-pitch-when-specified',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  staffWalk: BASS_WALK,
  staffNeighbors: BASS_NEIGHBORS,
  transferOrder: BASS_TRANSFER,
  walkNotes: WALK_NOTES,
  neighborNotes: NEIGHBOR_NOTES,
  transferNotes: TRANSFER_NOTES,
  demo: {
    walk: BASS_WALK,
    neighbors: BASS_NEIGHBORS,
    singles: { C: LH_C, E: LH_E, F: LH_F, G: 55 }
  },
  equipment: {
    required: 'Lower C, D, E, and F playable, plus a view of the bass staff.',
    accessibleAlternatives: 'A grown-up may point to each head while the learner plays.',
    cannotObserve: 'Which hand played, or whether they read the head or guessed from leftover letters.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L14 · LEFT HAND',
      title: 'Left-hand reading',
      paragraphs: [
        'Notes can sit on a picture of five lines. This lesson uses the bass clef. The F of the clef wraps the line where F lives (F3).',
        'A known left-hand walk on the keys can live on that picture. Each quarter is one tap and one same-length sound.'
      ],
      action: 'Show me the bass picture'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'F sits on the F line',
      paragraphs: [
        'The bass walk is C – D – E as three quarters. Then F – G as two quarters. Clef, heads, sound, and keys use the same notes.',
        'Letters may sit under the heads, then fade. This is a different picture from the treble staff.'
      ],
      hearWalk: 'Hear the bass walk',
      hearNeighbors: 'Hear F then G',
      hearF: 'Hear the F on the clef line',
      action: 'Now you map it'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Keys and bass picture agree',
      walk: 'Echo the bass walk: C – D – E. Letters may show.',
      neighbors: 'Echo the neighbors on the bass staff: F – G.',
      ear: 'Hear F then G, then play the matching heads.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'The bass picture is the boss',
      walk: 'Play the bass walk. Letters and key glow stay off. This picture is C3–D3–E3, not any octave.',
      remediation: 'This C lives on the bass staff. The picture, not a remembered higher walk, is the boss.',
      hearWalk: 'Hear the two-note neighbors',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A NEW ORDER',
      title: 'Same friends, new bass picture',
      order: 'Play E – C – F from the bass staff. Letters off. A copied C–D–E does not count.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You mapped a bass pattern',
      practicedTitle: 'You practiced the bass picture',
      startedTitle: 'A start is still a start',
      firstReward: 'Bass walk',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Left hand',
      evidence: {
        independent: 'Device record: Independent. The computer heard the bass walk and the new order at the named pitches. It cannot see which hand you used.',
        practiced: 'Device record: Practiced. Bass mapping is saved on this device only.',
        explored: 'Device record: Explored. You opened Left-hand reading and tried something on this device.',
        retained: 'Device record: Retained. A later bass walk already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      walkYes: 'The walk matches the bass picture.',
      neighborsYes: 'F and G sit where they sound.',
      earYes: 'Heard, then found on the bass staff.',
      transferYes: 'New order. Same friends.',
      wrong: 'Look at the bass picture. This register is the one on the staff.',
      octave: 'That is the same letter in another room. The staff wants this key.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.'
    }
  }
};
