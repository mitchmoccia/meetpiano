/**
 * Names the learner a browser is practicing as. It is readable by the static lesson page and is never trusted:
 * every server read and write re-checks that the child belongs to the signed-in parent's family.
 */
export const LEARNER_COOKIE = 'mp_learner';
export const LEARNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
