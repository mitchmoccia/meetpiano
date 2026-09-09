import { staffNote, TREBLE_CLEF } from '../staff.js';
import { LITTLE_WAVE, LITTLE_WAVE_COUSIN, SOFT_WALK, SOFT_WALK_DOWN, SPOT_TAIL } from '../expression-score.js';

export const HOME_PHRASE = [...LITTLE_WAVE];
export const TRANSFER_PHRASE = [...LITTLE_WAVE_COUSIN];
export const RHYTHM_PHRASE = [...SOFT_WALK];
export const RHYTHM_TRANSFER = [...SOFT_WALK_DOWN];
export const SPOT_PHRASE = [...SPOT_TAIL];

export const HOME_EVENTS = RHYTHM_PHRASE.map((pitch, index) => ({
  kind: 'note',
  pitch,
  onsetBeats: index,
  durationBeats: 1
}));

export const TRANSFER_EVENTS = RHYTHM_TRANSFER.map((pitch, index) => ({
  kind: 'note',
  pitch,
  onsetBeats: index,
  durationBeats: 1
}));

export const HOME_PATTERN = {
  id: 'purpose-rhythm',
  bpm: 72,
  countInBeats: 2,
  events: HOME_EVENTS
};

export const TRANSFER_PATTERN = {
  id: 'purpose-rhythm-down',
  bpm: 72,
  countInBeats: 2,
  events: TRANSFER_EVENTS
};

export const HOME_NOTES = HOME_PHRASE.map((midi, index) => staffNote(midi, 'quarter', ['C', 'D', 'E', 'D', 'E', 'D', 'C'][index], TREBLE_CLEF, index));
export const TRANSFER_NOTES = TRANSFER_PHRASE.map((midi, index) => staffNote(midi, 'quarter', ['E', 'D', 'C', 'D', 'C', 'D', 'E'][index], TREBLE_CLEF, index));

export const L23 = {
  lessonId: 'L23',
  curriculumVersion: 'beginner-v1',
  title: 'Practice with a purpose',
  prerequisites: ['S-MAKE-YOURS'],
  primaryNewSkill: ['S-PURPOSE'],
  octavePolicy: 'mixed-by-phase',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  defaultBpm: 72,
  reducedBpm: 56,
  countInBeats: 2,
  homePhrase: HOME_PHRASE,
  transferPhrase: TRANSFER_PHRASE,
  spotPhrase: SPOT_PHRASE,
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  patterns: {
    guided: HOME_PATTERN,
    independent: HOME_PATTERN,
    transfer: TRANSFER_PATTERN,
    review: HOME_PATTERN
  },
  equipment: {
    required: 'C, D, and E playable in the named room.',
    accessibleAlternatives: 'Slow the clock for the rhythm purpose. Isolate the last three notes for the sticky spot.',
    cannotObserve: 'Whether practice “felt focused,” or exam-grade rhythm. Notes and rhythm are reported as separate lanes.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L23 · EXPRESSION',
      title: 'Practice with a purpose',
      paragraphs: [
        'A purpose is a named job for this try. Notes first. Rhythm on the clock. Or only the sticky last three notes of Little Wave.',
        'Pick a purpose. Practice that job. Then put Little Wave back together. Results keep notes, rhythm, and help on separate lines.'
      ],
      action: 'Show me the three jobs'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Three ways to practice',
      paragraphs: [
        'Little Wave for the notes job. Soft Walk on the clock for the rhythm job. E – D – C for the sticky spot.',
        'Dumping the letters as fast as possible is not the rhythm job.'
      ],
      hearNotes: 'Hear Little Wave (notes)',
      hearRhythm: 'Hear Soft Walk on the clock',
      hearSpot: 'Hear the last three',
      action: 'I will pick a purpose'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'Name the job',
      pick: 'Choose notes, rhythm, or the sticky spot.',
      work: 'Do only that job. Helpers optional.',
      whole: 'Now the whole Little Wave, still with that purpose in mind.',
      cousin: 'Hear the cousin wave. Do not play it yet.',
      action: 'Continue to a quiet check',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'Same purpose, no glow',
      pick: 'Pick the job again. Hints off.',
      work: 'Do the job you named.',
      whole: 'Then Little Wave once more. Notes and rhythm stay separate on the card.',
      remediation: 'Name the job first. Notes: the wave letters. Rhythm: Soft Walk with the clock. Spot: only E – D – C.',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE OTHER WAVE',
      title: 'Same purpose, new pattern',
      pick: 'Keep the same kind of job.',
      work: 'Notes use the cousin wave. Rhythm walks down. Spot is still the last three of the cousin.',
      action: 'See how this try went'
    },
    review: {
      eyebrow: 'LATER CHECK',
      title: 'A purpose later',
      pause: 'Take a named pause, then pick a purpose again.',
      play: 'Name the job, then do it.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You practiced on purpose',
      practicedTitle: 'You named a job and tried it',
      startedTitle: 'A start is still a start',
      firstReward: 'A named job',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Expression',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. Notes and rhythm are stored as separate lanes. Help used is listed. This is not a jury score.',
        practiced: 'Device record: Practiced. Practice with a purpose is saved on this device only.',
        explored: 'Device record: Explored. You opened Practice with a purpose and tried something on this device.',
        retained: 'Device record: Retained. A later purposeful practice already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      heard: 'That was the job’s picture. Your keys earn the try.',
      cousinListen: 'Just listening. The cousin waits for the next check.',
      needPick: 'Pick notes, rhythm, or the sticky spot first.',
      notesYes: 'Those letters landed.',
      rhythmYes: 'The clock job landed.',
      spotYes: 'The sticky spot landed.',
      wholeYes: 'Little Wave came back together.',
      dumped: 'Those letters rushed off the clock. The rhythm job wants the heartbeat.',
      wrong: 'Different letters than this job asked for.',
      transferYes: 'The cousin job landed.',
      reviewYes: 'A later purpose landed.',
      hintsOff: 'Hide helpers, then play. Saved progress stays.',
      slower: 'Slower heartbeat. Same rhythm job.',
      paused: 'Paused. Not a miss.',
      disconnect: 'The keyboard left. That take does not count as a fail.',
      audioMissing: 'Sound is not available. You can still tap keys. Timing checks stay incomplete until sound works.'
    }
  }
};
