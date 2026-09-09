import { staffNote, BASS_CLEF, TREBLE_CLEF } from '../staff.js';
import { LH_C, RH_C, RH_D, RH_E } from '../hands.js';

export const HOME_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 4, length: 'long', part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 0, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_D, onsetBeats: 1, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_E, onsetBeats: 2, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_C, onsetBeats: 3, durationBeats: 1, part: 'right' }
];

export const TRANSFER_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 4, length: 'long', part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 0, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_D, onsetBeats: 1, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_C, onsetBeats: 2, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_C, onsetBeats: 3, durationBeats: 1, part: 'right' }
];

export const HOME_PATTERN = {
  id: 'hold-c-walk',
  bpm: 80,
  countInBeats: 4,
  events: HOME_EVENTS
};

export const TRANSFER_PATTERN = {
  id: 'hold-c-down',
  bpm: 80,
  countInBeats: 4,
  events: TRANSFER_EVENTS
};

export const HOME_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF),
  staffNote(RH_D, 'quarter', 'D', TREBLE_CLEF),
  staffNote(RH_E, 'quarter', 'E', TREBLE_CLEF),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF)
];

export const TRANSFER_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF),
  staffNote(RH_E, 'quarter', 'E', TREBLE_CLEF),
  staffNote(RH_D, 'quarter', 'D', TREBLE_CLEF),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF)
];

export const L16 = {
  lessonId: 'L16',
  curriculumVersion: 'beginner-v1',
  title: 'Two parts one pulse',
  prerequisites: ['S-TURNS'],
  primaryNewSkill: ['S-TWO-PULSE'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 80,
  reducedBpm: 60,
  countInBeats: 4,
  scoreReleases: false,
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
    required: 'Lower C and higher C–E playable, plus a shared pulse.',
    accessibleAlternatives: 'Practice the hold, then the walk, then both. A grown-up may hold the bass while the learner walks.',
    cannotObserve: 'Which hand held, balance, or coordination mastery. MIDI reports pitch and time only.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L16 · LEFT HAND',
      title: 'Two parts one pulse',
      paragraphs: [
        'The left hand can hold C while the right hand walks C – D – E – C. Both parts share one heartbeat.',
        'Plant the hold first, then walk. You may practice one part and return. The computer hears pitch and time. It does not certify two-hand coordination.'
      ],
      action: 'Show me both parts'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Hold, then walk on the clock',
      paragraphs: [
        'A long lower C starts with the first click. The higher walk uses one key per click: C, D, E, C.',
        'Same letters dumped as fast as you can is the wrong time — that must not pass.'
      ],
      hear: 'Hear both parts',
      hearWrong: 'Hear same letters, wrong time',
      action: 'Now you try'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'One pulse for two parts',
      hear: 'Hear the hold and the walk with the heartbeat.',
      echo: 'Play the long lower C, then the higher walk, one key per click. Practice one hand if you want — then come back to both.',
      cousin: 'Hear the cousin: the hold stays, the walk comes down. Do not play it yet.',
      handLabel: 'A grown-up checked that one hand held and the other walked.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Performance windows',
      perform: 'Both parts with the clock. Tiles off. The same letters at any old time fail.',
      remediation: 'The hold starts with the first real click. The walk waits for each click.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A NEW WALK',
      title: 'Hold, walk down',
      perform: 'Hold the lower C. Walk E – D – C – C on the clicks. A copied even walk does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'Same pulse, later',
      pause: 'Take a named pause, then try both parts again.',
      play: 'Play the home pattern with the clock.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'Two parts shared a pulse',
      practicedTitle: 'You practiced both parts',
      startedTitle: 'A start is still a start',
      firstReward: 'One pulse',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Left hand',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. The computer heard pitch and time for both parts. It cannot certify which hand held or how the parts balanced.',
        practiced: 'Device record: Practiced. Two parts on a pulse are saved on this device only.',
        explored: 'Device record: Explored. You opened Two parts one pulse and tried something on this device.',
        retained: 'Device record: Retained. A later two-part pulse already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That was the hold and the walk. Your keys earn the try.',
      cousinListen: 'Just listening. The cousin waits for the next check.',
      hit: 'With the click.',
      early: 'A little early. Wait for the click.',
      late: 'A little late. Land with the click.',
      miss: 'A part missed its click.',
      extra: 'An extra tap. The letters wait for the heartbeat.',
      rest: 'That slot was empty.',
      wrongPitch: 'Right time, different key.',
      tooShort: 'The hold let go too soon.',
      tooLong: 'That walk note held too long.',
      paused: 'Paused. Not a miss.',
      disconnect: 'The keyboard left. That take does not count as a fail.',
      slower: 'Slower heartbeat. Same parts.',
      audioMissing: 'Sound is not available. You can still tap keys. Timing checks stay incomplete until sound works.'
    }
  }
};
