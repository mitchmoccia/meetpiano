import { staffNote, BASS_CLEF, TREBLE_CLEF } from '../staff.js';
import { LH_C, RH_C, RH_D, RH_E } from '../hands.js';

export const HOME_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 4, length: 'long', part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 0, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_D, onsetBeats: 1, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_E, onsetBeats: 2, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_C, onsetBeats: 3, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 4, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 4, durationBeats: 2, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 6, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 6, durationBeats: 2, part: 'right' }
];

export const TRANSFER_EVENTS = [
  { kind: 'note', pitch: LH_C, onsetBeats: 0, durationBeats: 4, length: 'long', part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 0, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_D, onsetBeats: 1, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_C, onsetBeats: 2, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: RH_C, onsetBeats: 3, durationBeats: 1, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 4, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_E, onsetBeats: 4, durationBeats: 2, part: 'right' },
  { kind: 'note', pitch: LH_C, onsetBeats: 6, durationBeats: 2, part: 'left' },
  { kind: 'note', pitch: RH_C, onsetBeats: 6, durationBeats: 2, part: 'right' }
];

export const HOME_PATTERN = {
  id: 'little-piece',
  bpm: 72,
  countInBeats: 2,
  events: HOME_EVENTS
};

export const TRANSFER_PATTERN = {
  id: 'little-piece-down',
  bpm: 72,
  countInBeats: 2,
  events: TRANSFER_EVENTS
};

export const HOME_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 0),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 0),
  staffNote(RH_D, 'quarter', 'D', TREBLE_CLEF, 1),
  staffNote(RH_E, 'quarter', 'E', TREBLE_CLEF, 2),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 3),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 4),
  staffNote(RH_E, 'half', 'E', TREBLE_CLEF, 4),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 5),
  staffNote(RH_C, 'half', 'C', TREBLE_CLEF, 5)
];

export const TRANSFER_NOTES = [
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 0),
  staffNote(RH_E, 'quarter', 'E', TREBLE_CLEF, 0),
  staffNote(RH_D, 'quarter', 'D', TREBLE_CLEF, 1),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 2),
  staffNote(RH_C, 'quarter', 'C', TREBLE_CLEF, 3),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 4),
  staffNote(RH_E, 'half', 'E', TREBLE_CLEF, 4),
  staffNote(LH_C, 'half', 'C', BASS_CLEF, 5),
  staffNote(RH_C, 'half', 'C', TREBLE_CLEF, 5)
];

export const L20 = {
  lessonId: 'L20',
  curriculumVersion: 'beginner-v1',
  title: 'Complete little piece',
  prerequisites: ['S-SMALL-HARMONY'],
  primaryNewSkill: ['S-LITTLE-PIECE'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 72,
  reducedBpm: 56,
  countInBeats: 2,
  scoreReleases: true,
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
    required: 'Lower C and higher C–E playable. Hold the bass without stretching to a far key.',
    accessibleAlternatives: 'A grown-up may hold the bass while the learner walks, then switch. On-screen keys are an exploration stand-in, not proof of hand coordination.',
    cannotObserve: 'Which hand held, balance, or a finished “piece” in a recital sense. MIDI reports pitch, time, and release length only.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L20 · TOGETHER',
      title: 'Complete little piece',
      paragraphs: [
        'A short original piece: hold lower C while the higher walk goes C – D – E – C. Then land on C with E, and home on two C keys.',
        'Prepare each hand. Slow is allowed. Letting the hold go too soon fails the hold — not every later note. On-screen keys explore; they do not prove coordination at a piano.'
      ],
      action: 'Show me the little piece'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Hold, walk, then home',
      paragraphs: [
        'The bass hold starts with the first click and lasts four clicks. The walk uses one higher key per click. Then two landing pairs.',
        'Same letters rushed off the clock must not pass. Extra releases of keys you were not holding are ignored.'
      ],
      hear: 'Hear the little piece',
      hearWrong: 'Hear same letters, wrong time',
      action: 'Prepare each hand'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Hold, then the piece',
      left: 'Hold only the lower C for four clicks, then tap it for the two landings.',
      right: 'Walk only the higher C – D – E – C, then E, then C.',
      together: 'The whole little piece. Helpers optional. Slow if you want.',
      cousin: 'Hear the cousin: the walk comes down, then the same landings. Do not play it yet.',
      handLabel: 'A grown-up checked that both hands were ready before the whole piece.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'The whole little piece',
      perform: 'Hold, walk, land. Tiles off. A short hold or an extra tap fails this take. Later pairs still wait if an early note was wrong.',
      remediation: 'Plant the hold with the first click. Walk on the next three. Then C with E, then two C keys.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'A COUSIN PIECE',
      title: 'Walk down, then home',
      perform: 'Hold lower C. Walk E – D – C – C. Then C with E, then two C keys. A copied climb does not count.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'The piece later',
      pause: 'Take a named pause, then try the home piece again.',
      play: 'Play the little piece with the clock.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'A complete little piece',
      practicedTitle: 'You practiced the little piece',
      startedTitle: 'A start is still a start',
      firstReward: 'Little piece',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Together',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. The computer heard pitch, time, and the hold length. It cannot certify which hands played or that this was a recital piece.',
        practiced: 'Device record: Practiced. The little piece is saved on this device only.',
        explored: 'Device record: Explored. You opened Complete little piece and tried something on this device.',
        retained: 'Device record: Retained. A later little piece already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That was the little piece. Your keys earn the try.',
      cousinListen: 'Just listening. The cousin waits for the next check.',
      pass: 'The little piece landed.',
      transferYes: 'The cousin piece landed.',
      reviewYes: 'The piece after the pause.',
      leftYes: 'The hold and landings are ready.',
      rightYes: 'The walk is ready.',
      hit: 'Together on the click.',
      early: 'A little early. Wait for the click.',
      late: 'A little late. Land with the click.',
      miss: 'A part missed its click.',
      extra: 'An extra tap. The next part of the piece is still waiting.',
      rest: 'That slot was empty.',
      wrongPitch: 'Right time, different key. The piece is still waiting.',
      tooShort: 'The hold let go too soon.',
      tooLong: 'That note held too long.',
      paused: 'Paused. Not a miss.',
      disconnect: 'The keyboard left. That take does not count as a fail.',
      slower: 'Slower heartbeat. Same little piece.',
      needHands: 'Prepare the left part, then the right part, before a together try.',
      screenStandIn: 'On-screen keys are an exploration stand-in. They are not proof of hand coordination.',
      audioMissing: 'Sound is not available. You can still tap keys. Timing checks stay incomplete until sound works.'
    }
  }
};
