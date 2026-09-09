export const SKILL_CATALOG_VERSION = 'beginner-v1';

const ADULT_ONLY = new Set(['S-POSTURE', 'S-FINGER-CDE', 'S-FINGER-LH', 'S-HAND-CHOICE']);
const NEVER_AUTO_RETAIN = new Set(['S-POSTURE']);

export const SKILL_CATALOG = {
  'S-SETUP': { title: 'Device and sound', version: 'beginner-v1', lessonId: 'L01' },
  'S-HIGH-LOW': { title: 'High and low', version: 'beginner-v1', lessonId: 'L01' },
  'S-BLACK-GROUPS': { title: 'Black-key groups', version: 'beginner-v1', lessonId: 'L01' },
  'S-POSTURE': { title: 'Sitting', version: 'beginner-v1', lessonId: 'L01', adultObserved: 'posture' },
  'S-FIND-C': { title: 'Find C', version: 'beginner-v1', lessonId: 'L02' },
  'S-REGISTER-C': { title: 'C in another room', version: 'beginner-v1', lessonId: 'L02' },
  'S-NEIGHBOR': { title: 'Next white key', version: 'beginner-v1', lessonId: 'L03' },
  'S-FINGER-CDE': { title: 'Fingers 1-2-3', version: 'beginner-v1', lessonId: 'L03', adultObserved: 'fingering' },
  'S-ORDER-CDE': { title: 'A C-D-E order', version: 'beginner-v1', lessonId: 'L03' },
  'S-PHRASE': { title: 'Little Wave', version: 'beginner-v1', lessonId: 'L04' },
  'S-TRANSFER-PHRASE': { title: 'Cousin wave', version: 'beginner-v1', lessonId: 'L04' },
  'S-REPLAY': { title: 'Replay after a gap', version: 'beginner-v1', lessonId: 'L04' },
  'S-PULSE': { title: 'Heartbeat', version: 'beginner-v1', lessonId: 'L05' },
  'S-LONG-SHORT': { title: 'Long and short', version: 'beginner-v1', lessonId: 'L06' },
  'S-REST': { title: 'A silent beat', version: 'beginner-v1', lessonId: 'L07' },
  'S-RHYTHM-PHRASE': { title: 'Notes with a beat', version: 'beginner-v1', lessonId: 'L08' },
  'S-FIND-FG': { title: 'Find F and G', version: 'beginner-v1', lessonId: 'L09' },
  'S-STEP-SKIP': { title: 'Steps and skips', version: 'beginner-v1', lessonId: 'L10' },
  'S-STAFF-MAP': { title: 'Patterns on the staff', version: 'beginner-v1', lessonId: 'L11' },
  'S-READ-PHRASE': { title: 'Read a little tune', version: 'beginner-v1', lessonId: 'L12' },
  'S-LH-C': { title: 'Left-hand C', version: 'beginner-v1', lessonId: 'L13' },
  'S-FINGER-LH': { title: 'Left-hand fingers 5-4-3', version: 'beginner-v1', lessonId: 'L13', adultObserved: 'fingering' },
  'S-HAND-CHOICE': { title: 'Which hand', version: 'beginner-v1', lessonId: 'L13', adultObserved: 'hand' },
  'S-BASS-MAP': { title: 'Bass staff map', version: 'beginner-v1', lessonId: 'L14' },
  'S-TURNS': { title: 'Hands take turns', version: 'beginner-v1', lessonId: 'L15' },
  'S-TWO-PULSE': { title: 'Two parts one pulse', version: 'beginner-v1', lessonId: 'L16' }
};

export const LESSON_SKILLS = {
  L01: ['S-SETUP', 'S-HIGH-LOW', 'S-BLACK-GROUPS', 'S-POSTURE'],
  L02: ['S-FIND-C', 'S-REGISTER-C'],
  L03: ['S-NEIGHBOR', 'S-FINGER-CDE', 'S-ORDER-CDE'],
  L04: ['S-PHRASE', 'S-TRANSFER-PHRASE', 'S-REPLAY'],
  L05: ['S-PULSE'],
  L06: ['S-LONG-SHORT'],
  L07: ['S-REST'],
  L08: ['S-RHYTHM-PHRASE'],
  L09: ['S-FIND-FG'],
  L10: ['S-STEP-SKIP'],
  L11: ['S-STAFF-MAP'],
  L12: ['S-READ-PHRASE'],
  L13: ['S-LH-C', 'S-FINGER-LH', 'S-HAND-CHOICE'],
  L14: ['S-BASS-MAP', 'S-HAND-CHOICE'],
  L15: ['S-TURNS', 'S-HAND-CHOICE'],
  L16: ['S-TWO-PULSE', 'S-HAND-CHOICE']
};

export function skillIdsFor(lessonId) {
  return LESSON_SKILLS[lessonId] ? [...LESSON_SKILLS[lessonId]] : [];
}

export function skillMeta(skillId) {
  return SKILL_CATALOG[skillId] || null;
}

export function currentSkillVersion(skillId) {
  return SKILL_CATALOG[skillId]?.version || null;
}

export function isAdultObservedSkill(skillId) {
  return ADULT_ONLY.has(skillId);
}

export function adultMarkFor(skillId) {
  return SKILL_CATALOG[skillId]?.adultObserved || null;
}

export function canAutoRetain(skillId) {
  return !NEVER_AUTO_RETAIN.has(skillId);
}

export function emptySkill(skillId) {
  return {
    skillId,
    skillVersion: currentSkillVersion(skillId) || 'beginner-v1',
    evidenceState: null,
    liveEvidenceState: null,
    invalidated: false,
    invalidReason: null,
    lanes: emptyLanes()
  };
}

export function emptyLanes() {
  return {
    explored: null,
    practiced: null,
    independent: null,
    retained: null
  };
}

export function knownSkillId(skillId) {
  return Object.prototype.hasOwnProperty.call(SKILL_CATALOG, skillId);
}
