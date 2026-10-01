import { staffNote, BASS_CLEF, TREBLE_CLEF } from '../staff.js';
import { LH_C, RH_C, RH_D, RH_E } from '../hands.js';

export const HOME_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 0, durationBeats: 2, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 2, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 2, durationBeats: 2, part: 'right' }
];

export const TRANSFER_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_D, onsetBeats: 0, durationBeats: 2, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 2, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 2, durationBeats: 2, part: 'right' }
];

export const HOME_PATTERN = {
  id: 'first-together',
  bpm: 72,
  countInBeats: 2,
  events: HOME_EVENTS
};

export const TRANSFER_PATTERN = {
  id: 'neighbors-together',
  bpm: 72,
  countInBeats: 2,
  events: TRANSFER_EVENTS
};

export const HOME_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 0),
  staffNote(RH_C, 'half', 'C', TREBLE_CLEF, 0),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 1),
  staffNote(RH_E, 'half', 'E', TREBLE_CLEF, 1)
];

export const TRANSFER_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 0),
  staffNote(RH_D, 'half', 'D', TREBLE_CLEF, 0),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 1),
  staffNote(RH_C, 'half', 'C', TREBLE_CLEF, 1)
];

export const L17 = {
  lessonId: 'L17',
  curriculumVersion: 'beginner-v1',
  title: 'First together',
  prerequisites: ['S-TWO-PULSE'],
  primaryNewSkill: ['S-TOGETHER'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 72,
  reducedBpm: 56,
  countInBeats: 2,
  scoreReleases: false,
  stickyAlign: true,
  defaultHandFocus: 'both',
  patterns: {
    guided: HOME_PATTERN,
    independent: HOME_PATTERN,
    transfer: TRANSFER_PATTERN,
    review: HOME_PATTERN
  },
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  equipment: {
    required: 'Lower C and higher C–E playable. No stretch past a five-finger place.',
    accessibleAlternatives: 'Prepare the left key, then the right key, then both. On-screen keys are an exploration stand-in, not proof of hand coordination. A grown-up may play one part.',
    cannotObserve: 'Which hand pressed, balance, or coordination mastery. MIDI reports pitch and time only.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L17 · TOGETHER',
      title: 'First together',
      paragraphs: [
        'Two keys can sound on the same click. Lower C in the left room. Higher C in the right room. Then the same lower C with a higher E.',
        'Prepare one hand, then the other, then both. On-screen keys let you explore the sounds. They are not proof that two hands coordinated at a piano.'
      ],
      action: 'Show me together'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Same click, two rooms',
      paragraphs: [
        'Both C keys start together. Then lower C stays friends with higher E. Each hand stays in its own five-finger place — no stretch.',
        'Same letters dumped as fast as you can is the wrong time.'
      ],
      hear: 'Hear both keys together',
      hearWrong: 'Hear same letters, wrong time',
      action: 'Prepare each hand'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Left, right, then both',
      left: 'Play only the lower C on each click. Leave the higher keys quiet.',
      right: 'Play only the higher walk: C, then E. Leave the lower C quiet.',
      together: 'Now both rooms on the same clicks. Helpers optional.',
      cousin: 'Hear the cousin: lower C with D, then lower C with C. Do not play it yet.',
      handLabel: 'A grown-up checked that both hands were ready before the together try.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Both rooms, no glow',
      perform: 'Lower C with higher C, then lower C with higher E. Tiles off. A wrong extra tap does not skip the next pair.',
      remediation: 'Plant the lower C. Meet it with the higher key on the same click.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A NEW PAIR',
      title: 'Neighbors together',
      perform: 'Lower C with higher D, then lower C with higher C. A copied C-then-E does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'Together again later',
      pause: 'Take a named pause, then try the home pairs again.',
      play: 'Play the home pairs with the clock.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'Two keys shared a click',
      practicedTitle: 'You practiced first together',
      startedTitle: 'A start is still a start',
      firstReward: 'Together',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Together',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. The computer heard two pitches on a click. It cannot certify which hands played them or that they coordinated at a piano.',
        practiced: 'Device record: Practiced. First together is saved on this device only.',
        explored: 'Device record: Explored. You opened First together and tried something on this device.',
        retained: 'Device record: Retained. A later together pair already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That was two rooms on one click. Your keys earn the try.',
      cousinListen: 'Just listening. The cousin waits for the next check.',
      pass: 'Same click. Two rooms.',
      transferYes: 'Neighbors together.',
      reviewYes: 'Together again after the pause.',
      leftYes: 'Lower C is ready.',
      rightYes: 'The higher walk is ready.',
      hit: 'Together on the click.',
      early: 'A little early. Wait for the click.',
      late: 'A little late. Land with the click.',
      miss: 'A part missed its click.',
      extra: 'An extra tap. The next pair is still waiting — we did not skip it.',
      rest: 'That slot was empty.',
      wrongPitch: 'Right time, different key. The pair is still waiting.',
      tooShort: 'That together let go too soon.',
      tooLong: 'That together held too long.',
      paused: 'Paused. Not a miss.',
      disconnect: 'The keyboard left. That take does not count as a fail.',
      slower: 'Slower heartbeat. Same pairs.',
      needHands: 'Prepare the left part, then the right part, before a together try.',
      screenStandIn: 'On-screen keys are an exploration stand-in. They are not proof of hand coordination.',
      audioMissing: 'Sound is not available. You can still tap keys. Timing checks stay incomplete until sound works.'
    }
  }
};
