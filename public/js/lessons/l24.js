import { staffNote, TREBLE_CLEF } from '../staff.js';
import { LITTLE_WAVE, SOFT_WALK } from '../expression-score.js';

export const WAVE_PHRASE = [...LITTLE_WAVE];
export const WALK_PHRASE = [...SOFT_WALK];
export const WAVE_LETTERS = ['C', 'D', 'E', 'D', 'E', 'D', 'C'];
export const WALK_LETTERS = ['C', 'D', 'E', 'C'];

export const HOME_NOTES = WAVE_PHRASE.map((midi, index) => staffNote(midi, 'quarter', WAVE_LETTERS[index], TREBLE_CLEF, index));
export const TRANSFER_NOTES = WALK_PHRASE.map((midi, index) => staffNote(midi, 'quarter', WALK_LETTERS[index], TREBLE_CLEF, index));

export const L24 = {
  lessonId: 'L24',
  curriculumVersion: 'beginner-v1',
  title: 'First recital',
  prerequisites: ['S-PURPOSE'],
  primaryNewSkill: ['S-SHARE'],
  octavePolicy: 'exact-pitch-when-specified',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'review', 'result'],
  pieces: {
    wave: WAVE_PHRASE,
    walk: WALK_PHRASE
  },
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  recitalMode: true,
  finishThroughMistakes: true,
  equipment: {
    required: 'C, D, E, and G if the chosen ending uses G.',
    accessibleAlternatives: 'A grown-up may sit nearby and listen all the way through. On-screen keys are a stand-in stage, not a concert hall.',
    cannotObserve: 'Readiness for a real recital, nerves, posture, or a jury score. Finishing through wobbles is the job. Technique is never inferred.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L24 · EXPRESSION',
      title: 'First recital',
      paragraphs: [
        'This is a share, not a jury. Pick Little Wave, Soft Walk, or the ending you made yours. A grown-up listens all the way through.',
        'Recital mode hides glowing keys. A wobble does not stop the piece. Notes, rhythm, help, and “we listened” stay on separate lines.'
      ],
      action: 'Show me the recital'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Pick a piece to share',
      paragraphs: [
        'Hear Little Wave, Soft Walk, or a reminder that your L22 ending is also welcome.',
        'No published method piece. No contest language.'
      ],
      hearWave: 'Hear Little Wave',
      hearWalk: 'Hear Soft Walk',
      action: 'I will pick a piece'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'One reminder, then the stage',
      pick: 'Choose Little Wave, Soft Walk, or your ending.',
      remind: 'Hear it once if you want. Helpers may still glow here.',
      play: 'Play it through. A miss does not stop the share.',
      listen: 'A grown-up listened all the way through.',
      self: 'I kept going, even if a note wobbled.',
      cousin: 'Later you can share a different piece. Just listening for now.',
      action: 'Continue to recital mode',
      hintsOn: 'Helpers on',
      hintsOff: 'Helpers off'
    },
    independent: {
      eyebrow: 'RECITAL MODE',
      title: 'No glow. Finish the share.',
      pick: 'Pick the piece again.',
      play: 'Glowing keys stay off. Play to the end even if a note is wrong. Then a grown-up marks that you were heard.',
      remediation: 'The stage does not stop for a wobble. Keep the next note coming. We still write notes and rhythm separately.',
      finishForNow: 'Save and finish for now',
      imFinished: 'I finished the share'
    },
    transfer: {
      eyebrow: 'ANOTHER SHARE',
      title: 'A different piece, still no glow',
      pick: 'Share a different piece than the first recital.',
      play: 'No glow. Finish through mistakes. A copied same-piece replay is not the transfer.',
      action: 'See how this share went'
    },
    review: {
      eyebrow: 'LATER TRANSFER CHECK',
      title: 'Share it later',
      pause: 'Take a named pause, then share again with no glow.',
      play: 'Finish the piece. A grown-up listens.',
      back: 'Ready after the pause'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You shared a first recital',
      practicedTitle: 'You practiced a share',
      startedTitle: 'A start is still a start',
      firstReward: 'First share',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Expression',
      pause: 'Named pause, then try again',
      evidence: {
        independent: 'Device record: Independent. You finished a share and a grown-up listened. Notes, rhythm, and help are listed separately. This is not a jury result.',
        practiced: 'Device record: Practiced. First recital is saved on this device only.',
        explored: 'Device record: Explored. You opened First recital and tried something on this device.',
        retained: 'Device record: Retained. A later share already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the share.',
      heard: 'That was the piece. Your keys earn the share.',
      cousinListen: 'Just listening. Another piece waits for the transfer share.',
      needPick: 'Pick Little Wave, Soft Walk, or your ending first.',
      needOther: 'The transfer share wants a different piece than the first one.',
      finished: 'You played to the end. Notes and rhythm are on the card. A grown-up still marks the listen.',
      keptGoing: 'A wobble did not stop the piece.',
      needListen: 'Independent waits until a grown-up marks that they listened all the way through.',
      notesYes: 'The letters of this piece landed.',
      notesMiss: 'Some letters wobbled. The share can still finish.',
      rhythmYes: 'The share was paced, not dumped.',
      rhythmMiss: 'The letters rushed. Rhythm is a separate line from finishing.',
      transferYes: 'A different piece was shared.',
      reviewYes: 'A later share finished.',
      hintsOff: 'Recital mode hides glowing keys.',
      audioMissing: 'Sound is not available. You can still tap keys. A share without sound stays incomplete for listening.'
    }
  }
};
