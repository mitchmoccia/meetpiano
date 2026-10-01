import { staffNote, BASS_CLEF, TREBLE_CLEF } from '../staff.js';
import { LH_C, RH_C, RH_D, RH_E } from '../hands.js';

export const HOME_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 0, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 1, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_D, onsetBeats: 1, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 2, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 2, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 3, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 3, durationBeats: 1, part: 'right' }
];

export const TRANSFER_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 0, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 1, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_D, onsetBeats: 1, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 2, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 2, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 3, durationBeats: 1, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 3, durationBeats: 1, part: 'right' }
];

export const HEAD_UNTIL = 2;

export const HOME_PATTERN = {
  id: 'keep-going',
  bpm: 72,
  countInBeats: 2,
  events: HOME_EVENTS,
  loopUntilBeat: HEAD_UNTIL
};

export const TRANSFER_PATTERN = {
  id: 'keep-going-down',
  bpm: 72,
  countInBeats: 2,
  events: TRANSFER_EVENTS
};

export const HOME_NOTES = [
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 0),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 0),
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 1),
  staffNote(RH_D, 'quarter', 'D', TREBLE_CLEF, 1),
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 2),
  staffNote(RH_E, 'quarter', 'E', TREBLE_CLEF, 2),
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 3),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 3)
];

export const TRANSFER_NOTES = [
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 0),
  staffNote(RH_E, 'quarter', 'E', TREBLE_CLEF, 0),
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 1),
  staffNote(RH_D, 'quarter', 'D', TREBLE_CLEF, 1),
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 2),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 2),
  staffNote(LH_C, 'quarter', 'C', BASS_CLEF, 3),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 3)
];

export const L18 = {
  lessonId: 'L18',
  curriculumVersion: 'beginner-v1',
  title: 'Keep going',
  prerequisites: ['S-TOGETHER'],
  primaryNewSkill: ['S-KEEP-GOING'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 72,
  reducedBpm: 56,
  countInBeats: 2,
  scoreReleases: false,
  stickyAlign: true,
  defaultHandFocus: 'both',
  loopUntilBeat: HEAD_UNTIL,
  patterns: {
    guided: HOME_PATTERN,
    independent: HOME_PATTERN,
    transfer: TRANSFER_PATTERN,
    review: HOME_PATTERN
  },
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  equipment: {
    required: 'Lower C and higher C–E playable. Each hand stays in a five-finger place.',
    accessibleAlternatives: 'Loop the first two clicks slowly. On-screen keys are an exploration stand-in, not proof of hand coordination.',
    cannotObserve: 'Which hand pressed, or whether the parts stayed even. MIDI reports pitch and time only.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L18 · TOGETHER',
      title: 'Keep going',
      paragraphs: [
        'The left room taps C on every click. The right room walks C – D – E – C. Keep going — do not stop after the first pair.',
        'A small loop of the first two clicks is allowed. Slow is allowed. A wrong tap does not throw away the rest of the walk. On-screen keys explore sound; they do not prove two-hand coordination.'
      ],
      action: 'Show me the walk'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Four clicks, still together',
      paragraphs: [
        'Lower C with each higher step. No stretch. You may loop the first two clicks until they feel friendly.',
        'Same letters rushed off the clock must not pass.'
      ],
      hear: 'Hear the four clicks',
      hearWrong: 'Hear same letters, wrong time',
      action: 'Prepare, then loop'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Small loop, then the walk',
      left: 'Tap only the lower C on each click.',
      right: 'Walk only the higher C – D – E – C.',
      loop: 'Loop just the first two clicks: C with C, then C with D. Slow if you want.',
      together: 'The whole walk. Four clicks. Helpers optional.',
      cousin: 'Hear the cousin: the walk comes down. Do not play it yet.',
      handLabel: 'A grown-up checked that both hands were ready before the whole walk.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Keep the walk going',
      perform: 'Four together clicks. Tiles off. An extra or wrong tap fails this take but does not skip the next pair.',
      remediation: 'Loop the first two clicks slowly. Then add E and the last C.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE OTHER WAY',
      title: 'Walk down together',
      perform: 'Lower C with E – D – C – C. A copied climb does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'Keep going later',
      pause: 'Take a named pause, then try the home walk again.',
      play: 'Play the four clicks with the clock.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You kept going',
      practicedTitle: 'You practiced keeping going',
      startedTitle: 'A start is still a start',
      firstReward: 'Keep going',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Together',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. The computer heard the together walk. It cannot certify coordination at a piano.',
        practiced: 'Device record: Practiced. Keep going is saved on this device only.',
        explored: 'Device record: Explored. You opened Keep going and tried something on this device.',
        retained: 'Device record: Retained. A later keep-going walk already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That was the four-click walk. Your keys earn the try.',
      cousinListen: 'Just listening. The cousin waits for the next check.',
      pass: 'You kept going.',
      transferYes: 'The walk came down together.',
      reviewYes: 'Keep going after the pause.',
      leftYes: 'Lower C is ready.',
      rightYes: 'The higher walk is ready.',
      loopYes: 'The small loop is friendly. Now the whole walk.',
      hit: 'Together on the click.',
      early: 'A little early. Wait for the click.',
      late: 'A little late. Land with the click.',
      miss: 'A part missed its click.',
      extra: 'An extra tap. The next click is still waiting.',
      rest: 'That slot was empty.',
      wrongPitch: 'Right time, different key. The walk is still waiting.',
      tooShort: 'Let go too soon.',
      tooLong: 'Held too long.',
      paused: 'Paused. Not a miss.',
      disconnect: 'The keyboard left. That take does not count as a fail.',
      slower: 'Slower heartbeat. Same walk.',
      needHands: 'Prepare the left part, then the right part, before a together try.',
      screenStandIn: 'On-screen keys are an exploration stand-in. They are not proof of hand coordination.',
      audioMissing: 'Sound is not available. You can still tap keys. Timing checks stay incomplete until sound works.'
    }
  }
};
