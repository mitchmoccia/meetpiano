import { staffNote } from '../staff.js';

export const HOME_PHRASE = [60, 64, 65, 67, 65, 64, 60];
export const TRANSFER_PHRASE = [67, 64, 60, 64, 65, 67, 67];
export const HOME_HEAD = [60, 64, 65, 67];
export const HOME_TAIL = [65, 64, 60];
export const HOME_LETTERS = ['C', 'E', 'F', 'G', 'F', 'E', 'C'];
export const TRANSFER_LETTERS = ['G', 'E', 'C', 'E', 'F', 'G', 'G'];
export const HOME_NOTES = HOME_PHRASE.map((midi, index) => staffNote(midi, 'quarter', HOME_LETTERS[index]));
export const TRANSFER_NOTES = TRANSFER_PHRASE.map((midi, index) => staffNote(midi, 'quarter', TRANSFER_LETTERS[index]));

export const L12 = {
  lessonId: 'L12',
  curriculumVersion: 'beginner-v1',
  title: 'Read a little tune',
  prerequisites: ['S-STAFF-MAP'],
  primaryNewSkill: ['S-READ-PHRASE'],
  octavePolicy: 'exact-pitch-when-specified',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  homePhrase: HOME_PHRASE,
  transferPhrase: TRANSFER_PHRASE,
  homeHead: HOME_HEAD,
  homeTail: HOME_TAIL,
  homeLetters: HOME_LETTERS,
  transferLetters: TRANSFER_LETTERS,
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  demo: {
    home: HOME_PHRASE,
    transfer: TRANSFER_PHRASE,
    longShort: [67, 67]
  },
  equipment: {
    required: 'C, E, F, and G playable.',
    accessibleAlternatives: 'The learner may sing the contour while a grown-up plays — mark as adult-supported, not independent reading.',
    cannotObserve: 'Fingering, or whether they read versus guessed.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L12 · READ AND PLAY',
      title: 'Read a little tune',
      paragraphs: [
        'A tune we have not memorized on the keys can still be read. This lesson’s original home phrase is Porch Steps. It is MeetPiano’s own shape, not Little Wave.',
        'Porch Steps: C – E – F – G | F – E – C. It starts with a skip, then steps, then comes home. Each quarter is one tap.'
      ],
      action: 'Show me Porch Steps'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Porch Steps',
      paragraphs: [
        'The staff shows the tune. Letters fade. Clef, heads, sound, and keys use the same notes.',
        'A long G then a short G is just listening — this tune’s notes are all quarters.'
      ],
      hearHome: 'Hear Porch Steps',
      hearTransfer: 'Hear a cousin of Porch Steps',
      hearLongShort: 'Hear a long G, then a short G — just listening',
      action: 'Now you read'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Echo from the picture',
      hear: 'Hear Porch Steps once more, then get ready to echo.',
      head: 'Echo the first four notes: C – E – F – G.',
      tail: 'Now the last three: F – E – C.',
      all: 'Now all seven from the staff.',
      make: 'Make a three-note goodbye that uses F or G. This sits beside the reading check.',
      cousin: 'Hear the cousin phrase once. You do not play it yet.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No letters this time',
      home: 'Play Porch Steps from the staff. Highlights stay off. You may try again.',
      remediation: 'This tune starts with a skip: C up to E. The picture does not walk every neighbor.',
      clap: 'Hear the first two heads — the skip',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE COUSIN',
      title: 'Porch the other way',
      phrase: 'Play the cousin: G – E – C – E | F – G – G. A copied Porch Steps does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER REVIEW',
      title: 'Porch Steps again',
      pause: 'Play something else, then come back. A pass after this pause can be Retained. A pass with no pause stays Independent.',
      play: 'Play Porch Steps with no letters. This is a later listen, not a first finish sticker.',
      back: 'I’m back — play Porch Steps'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You read a little tune',
      practicedTitle: 'You practiced Porch Steps',
      startedTitle: 'A start is still a start',
      firstReward: 'Porch Steps',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Read and play',
      pause: 'Play something else, then come back',
      evidence: {
        independent: 'Device record: Independent. The computer heard Porch Steps and the flipped cousin at the named pitches. It cannot see fingering or how you read.',
        practiced: 'Device record: Practiced. Echo work is saved on this device only.',
        explored: 'Device record: Explored. You opened Read a little tune and tried something on this device.',
        retained: 'Device record: Retained. A later replay of Porch Steps already succeeded on this device after a gap.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      headYes: 'First four. Now the walk home.',
      tailYes: 'Last three. Now the whole porch.',
      allYes: 'Porch Steps. Skip, steps, home.',
      makeYes: 'A goodbye that uses F or G.',
      homeYes: 'Porch Steps. Now the cousin the other way.',
      transferYes: 'Porch the other way. The picture flipped.',
      extra: 'Stop on C. Seven quarters — skip up, step, then home.',
      wrong: 'Not that shape yet. The picture starts C to E, not C to D.',
      reviewYes: 'Porch Steps after a gap. Saved as Retained on this device.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.',
      cousinListen: 'That was the cousin — just listening for now.',
      octave: 'That is the same letter in another room. The staff wants this key.'
    }
  }
};
