import { staffNote, BASS_CLEF, TREBLE_CLEF } from '../staff.js';
import { LH_C, RH_E, RH_G } from '../hands.js';

export const HOME_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 0, durationBeats: 2, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 2, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_G, onsetBeats: 2, durationBeats: 2, part: 'right' }
];

export const TRANSFER_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_G, onsetBeats: 0, durationBeats: 2, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 2, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 2, durationBeats: 2, part: 'right' }
];

export const HOME_PATTERN = {
  id: 'small-harmony',
  bpm: 72,
  countInBeats: 2,
  events: HOME_EVENTS
};

export const TRANSFER_PATTERN = {
  id: 'harmony-other-way',
  bpm: 72,
  countInBeats: 2,
  events: TRANSFER_EVENTS
};

export const HOME_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 0),
  staffNote(RH_E, 'half', 'E', TREBLE_CLEF, 0),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 1),
  staffNote(RH_G, 'half', 'G', TREBLE_CLEF, 1)
];

export const TRANSFER_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 0),
  staffNote(RH_G, 'half', 'G', TREBLE_CLEF, 0),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 1),
  staffNote(RH_E, 'half', 'E', TREBLE_CLEF, 1)
];

export const L19 = {
  lessonId: 'L19',
  curriculumVersion: 'beginner-v1',
  title: 'Small harmony',
  prerequisites: ['S-KEEP-GOING'],
  primaryNewSkill: ['S-SMALL-HARMONY'],
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
    required: 'Lower C and higher E–G playable. Right hand stays in a C–G five-finger place — no stretch.',
    accessibleAlternatives: 'Prepare each hand. On-screen keys are an exploration stand-in, not proof of hand coordination.',
    cannotObserve: 'Which hand, blend, or whether the interval felt “pretty.” MIDI reports pitch and time only.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L19 · TOGETHER',
      title: 'Small harmony',
      paragraphs: [
        'Two friends can share a click and make a thicker sound. Lower C with higher E. Then lower C with higher G. G is the top of the right-hand five-finger place — no stretch.',
        'Prepare one hand, then the other, then both. Extra taps are noticed. They do not skip the next harmony. On-screen keys explore; they do not prove coordination.'
      ],
      action: 'Show me the colors'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'C with E, then C with G',
      paragraphs: [
        'Each pair shares one click and holds a little. Same letters rushed off the clock must not pass.',
        'An extra note is an extra — the next pair still waits.'
      ],
      hear: 'Hear the two colors',
      hearWrong: 'Hear same letters, wrong time',
      action: 'Prepare each color'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'One color, then both',
      left: 'Play only the lower C on each harmony click.',
      right: 'Play only the higher friends: E, then G.',
      together: 'Both colors: C with E, then C with G.',
      cousin: 'Hear the cousin: G first, then E. Do not play it yet.',
      handLabel: 'A grown-up checked that both hands were ready before the harmony try.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Two colors, no glow',
      perform: 'C with E, then C with G. Tiles off. Extra notes fail this take without skipping the next pair.',
      remediation: 'Find E first, then G, each with the lower C on the same click.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE OTHER ORDER',
      title: 'G first, then E',
      perform: 'Lower C with G, then lower C with E. A copied E-then-G does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'Harmony later',
      pause: 'Take a named pause, then try the home colors again.',
      play: 'Play C with E, then C with G.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'Two colors shared a click',
      practicedTitle: 'You practiced small harmony',
      startedTitle: 'A start is still a start',
      firstReward: 'Harmony',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Together',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. The computer heard the two harmony pairs. It cannot certify blend or hand coordination.',
        practiced: 'Device record: Practiced. Small harmony is saved on this device only.',
        explored: 'Device record: Explored. You opened Small harmony and tried something on this device.',
        retained: 'Device record: Retained. A later harmony already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That was C with E, then C with G. Your keys earn the try.',
      cousinListen: 'Just listening. The cousin waits for the next check.',
      pass: 'Two colors on the clicks.',
      transferYes: 'G first, then E.',
      reviewYes: 'Harmony after the pause.',
      leftYes: 'Lower C is ready.',
      rightYes: 'E then G is ready.',
      hit: 'Together on the click.',
      early: 'A little early. Wait for the click.',
      late: 'A little late. Land with the click.',
      miss: 'A part missed its click.',
      extra: 'An extra tap. The next color is still waiting.',
      rest: 'That slot was empty.',
      wrongPitch: 'Right time, different key. The pair is still waiting.',
      tooShort: 'The harmony let go too soon.',
      tooLong: 'The harmony held too long.',
      paused: 'Paused. Not a miss.',
      disconnect: 'The keyboard left. That take does not count as a fail.',
      slower: 'Slower heartbeat. Same colors.',
      needHands: 'Prepare the left part, then the right part, before a together try.',
      screenStandIn: 'On-screen keys are an exploration stand-in. They are not proof of hand coordination.',
      audioMissing: 'Sound is not available. You can still tap keys. Timing checks stay incomplete until sound works.'
    }
  }
};
