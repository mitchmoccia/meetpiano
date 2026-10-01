export const HOME_PHRASE = [60, 62, 64, 62, 64, 62, 60];
export const TRANSFER_PHRASE = [64, 62, 60, 62, 60, 62, 64];
export const HOME_LETTERS = ['C', 'D', 'E', 'D', 'E', 'D', 'C'];
export const TRANSFER_LETTERS = ['E', 'D', 'C', 'D', 'C', 'D', 'E'];

export const L04 = {
  lessonId: 'L04',
  curriculumVersion: 'beginner-v1',
  title: 'First little tune',
  prerequisites: ['S-ORDER-CDE'],
  primaryNewSkill: ['S-PHRASE', 'S-TRANSFER-PHRASE', 'S-REPLAY'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  homePhrase: HOME_PHRASE,
  transferPhrase: TRANSFER_PHRASE,
  homeLetters: HOME_LETTERS,
  transferLetters: TRANSFER_LETTERS,
  homeHead: [60, 62, 64, 62],
  homeTail: [64, 62, 60],
  demo: {
    home: HOME_PHRASE,
    transfer: TRANSFER_PHRASE,
    singles: { C: 60, D: 62, E: 64 }
  },
  equipment: {
    required: 'C, D, and E playable.',
    accessibleAlternatives: 'The learner may sing the contour while a grown-up plays — mark as adult-supported, not independent keyboard skill.',
    cannotObserve: 'Whether they memorized by ear or leftover on-screen letters.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L04 · FIRST NOTES',
      title: 'First little tune',
      paragraphs: [
        'A tune is neighbors in a pattern we can remember. This lesson’s original home phrase is Little Wave. It is MeetPiano’s own three-note shape, not a published primer song.',
        'Little Wave: C – D – E – D | E – D – C. It climbs to E, slips back to D, then slides home to C.'
      ],
      action: 'Show me Little Wave'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Little Wave',
      paragraphs: [
        'Tiles light in order. A small arc rises, then falls — the wave.',
        'Replay under the tiles. No staff in this lesson.'
      ],
      hearHome: 'Hear Little Wave',
      hearTransfer: 'Hear a cousin of Little Wave',
      hearC: 'Hear C',
      hearD: 'Hear D',
      hearE: 'Hear E',
      action: 'Now you play'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Echo the wave',
      hear: 'Hear Little Wave once more, then get ready to echo.',
      head: 'Echo the first four notes: C – D – E – D.',
      tail: 'Now the last three: E – D – C.',
      all: 'Now all seven. The wave goes up to E, back to D, then down to C.',
      cousin: 'Hear the cousin phrase once. You do not play it yet.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'No tiles this time',
      home: 'Play Little Wave. Highlights stay off. You may try again.',
      transfer: 'Now play Wave the other way: E – D – C – D | C – D – E.',
      remediation: 'The wave goes up to E, back to D, then down to C. Stop on C.',
      clap: 'Clap the seven slots, then hear the last three',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE COUSIN',
      title: 'Wave the other way',
      phrase: 'Play the cousin: E – D – C – D | C – D – E. The contour flips. A copied Little Wave does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER REVIEW',
      title: 'Little Wave again',
      pause: 'Play something else, then come back. A pass after this pause can be Retained. A pass with no pause stays Independent.',
      play: 'Play Little Wave with no tiles. This is a later listen, not a first finish sticker.',
      back: 'I’m back — play Little Wave'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You played a little tune',
      practicedTitle: 'You practiced Little Wave',
      startedTitle: 'A start is still a start',
      firstReward: 'Little Wave',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to First Notes',
      pause: 'Play something else, then come back',
      evidence: {
        independent: 'Device record: Independent. The computer heard Little Wave and the flipped cousin. It cannot see fingering or memory style.',
        practiced: 'Device record: Practiced. Echo work is saved on this device only.',
        explored: 'Device record: Explored. You opened First little tune and tried something on this device.',
        retained: 'Device record: Retained. A later replay of Little Wave already succeeded on this device after a gap.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      headYes: 'First four. Now the slide home.',
      tailYes: 'Last three. Now the whole wave.',
      allYes: 'Little Wave. Up, slip, home.',
      homeYes: 'Little Wave. Now the cousin the other way.',
      transferYes: 'Wave the other way. The contour flipped.',
      extra: 'Stop on C. The wave is seven notes — up to E, back to D, down to C.',
      wrong: 'Not that shape yet. Hear it, then try the seven notes again.',
      reviewYes: 'Little Wave after a gap. Saved as Retained on this device.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.',
      cousinListen: 'That was the cousin — just listening for now.'
    }
  }
};
