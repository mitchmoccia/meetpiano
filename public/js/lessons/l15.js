import { staffNote, BASS_CLEF, TREBLE_CLEF } from '../staff.js';
import { LH_C, LH_D, LH_E, RH_C, RH_D, RH_E } from '../hands.js';

export const QUESTION = [RH_C, RH_D, RH_E];
export const ANSWER = [LH_E, LH_D, LH_C];
export const CONVERSATION = [...QUESTION, ...ANSWER];
export const TRANSFER_CONVERSATION = [...ANSWER, ...QUESTION];
export const QUESTION_NOTES = QUESTION.map((midi, index) => staffNote(midi, 'quarter', ['C', 'D', 'E'][index], TREBLE_CLEF));
export const ANSWER_NOTES = ANSWER.map((midi, index) => staffNote(midi, 'quarter', ['E', 'D', 'C'][index], BASS_CLEF));
export const HOME_NOTES = [...QUESTION_NOTES, ...ANSWER_NOTES];
export const TRANSFER_NOTES = [
  ...ANSWER.map((midi, index) => staffNote(midi, 'quarter', ['E', 'D', 'C'][index], BASS_CLEF)),
  ...QUESTION.map((midi, index) => staffNote(midi, 'quarter', ['C', 'D', 'E'][index], TREBLE_CLEF))
];

export const L15 = {
  lessonId: 'L15',
  curriculumVersion: 'beginner-v1',
  title: 'Musical conversation',
  prerequisites: ['S-BASS-MAP'],
  primaryNewSkill: ['S-TURNS'],
  octavePolicy: 'exact-pitch-when-specified',
  phases: ['explanation', 'demo', 'guided', 'independent', 'transfer', 'result'],
  question: QUESTION,
  answer: ANSWER,
  conversation: CONVERSATION,
  transfer: TRANSFER_CONVERSATION,
  questionNotes: QUESTION_NOTES,
  answerNotes: ANSWER_NOTES,
  homeNotes: HOME_NOTES,
  transferNotes: TRANSFER_NOTES,
  demo: {
    question: QUESTION,
    answer: ANSWER,
    both: CONVERSATION
  },
  equipment: {
    required: 'Lower C–E and higher C–E playable, plus both clefs.',
    accessibleAlternatives: 'Practice one hand, then the other. A grown-up may play one part while the learner plays the other.',
    cannotObserve: 'Which hand played which part. MIDI reports pitch and time only.'
  },
  copy: {
    explanation: {
      eyebrow: 'LESSON L15 · LEFT HAND',
      title: 'Musical conversation',
      paragraphs: [
        'One hand can ask. The other can answer. The question lives on the treble staff. The answer lives on the bass staff.',
        'You may practice one hand, then return. The step you were on stays. The computer hears pitches in order. A grown-up marks which hand asked and which hand answered.'
      ],
      action: 'Show me the conversation'
    },
    demo: {
      eyebrow: 'SEE AND HEAR',
      title: 'Ask, then answer',
      paragraphs: [
        'Question: C – D – E in the right room. Answer: E – D – C in the left room.',
        'Both clefs show. Both keyboard regions show. Turns, not both hands at once.'
      ],
      hearQuestion: 'Hear the question',
      hearAnswer: 'Hear the answer',
      hearBoth: 'Hear the whole conversation',
      action: 'Now you try the turns'
    },
    guided: {
      eyebrow: 'GUIDED PRACTICE',
      title: 'One part, then the other',
      question: 'Play only the question: C – D – E in the right room.',
      answer: 'Play only the answer: E – D – C in the left room.',
      both: 'Now the conversation: question, then answer. Hints optional.',
      hands: 'A grown-up may watch the turns. The app cannot see which hand you used.',
      handLabel: 'A grown-up checked that the hands took turns as shown.',
      fingeringLabel: 'A grown-up checked fingers on the demonstrated hands.',
      action: 'Continue to a quiet check',
      hintsOn: 'Hints on',
      hintsOff: 'Hints off'
    },
    independent: {
      eyebrow: 'INDEPENDENT CHECK',
      title: 'The whole conversation',
      both: 'Play the question, then the answer. Letters and glow stay off. You may practice one hand and come back — this check still wants both parts.',
      remediation: 'The question climbs in the right room. The answer walks home in the left room.',
      hearBoth: 'Hear the conversation once',
      finishForNow: 'Save and finish for now'
    },
    transfer: {
      eyebrow: 'THE OTHER WAY',
      title: 'Answer, then ask',
      both: 'Play the answer first, then the question. A copied question-then-answer does not count.',
      action: 'See how this try went'
    },
    result: {
      eyebrow: 'SAVED ON THIS DEVICE',
      title: 'You had a conversation',
      practicedTitle: 'You practiced taking turns',
      startedTitle: 'A start is still a start',
      firstReward: 'Turns',
      firstRewardNote: 'First finish on this device. We will not show this sticker again here.',
      repeatNote: 'You already finished this check on this device. No extra sticker.',
      restart: 'Start this lesson over',
      home: 'Back to Left hand',
      evidence: {
        independent: 'Device record: Independent. The computer heard the question and answer pitches. It cannot certify which hand played them.',
        practiced: 'Device record: Practiced. Turns are saved on this device only.',
        explored: 'Device record: Explored. You opened Musical conversation and tried something on this device.',
        retained: 'Device record: Retained. A later conversation already succeeded on this device.'
      }
    },
    feedback: {
      demoOnly: 'That was just listening. Your own keys earn the try.',
      questionYes: 'The question climbed.',
      answerYes: 'The answer walked home.',
      bothYes: 'Question, then answer.',
      transferYes: 'Answer first, then the question.',
      wrong: 'Keep the parts in their rooms. Right room asks. Left room answers.',
      octave: 'That letter is in the other room. This picture wants the named key.',
      audioMissing: 'Sound is not available. You can still tap keys. Pitch checks stay incomplete until sound works.'
    }
  }
};
