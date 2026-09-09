import { takeExpectedSequence } from '../assess.js';

export function takePhrase(runtime, note, expected, policy) {
  const heard = runtime.attempt.restore.sequence;
  const result = takeExpectedSequence(heard, note, expected, policy);
  if (!result.ok) {
    runtime.attempt.restore.sequence = [];
    runtime.recordEvent('note-on', { heard: note, expected: result.expected, match: false });
    runtime.persist();
    return { ok: false, extra: result.extra === true, expected: result.expected };
  }
  runtime.attempt.restore.sequence = result.next;
  runtime.recordEvent('note-on', { heard: note, expected: result.expected, match: true });
  runtime.persist();
  return { ok: true, done: result.done === true };
}

export function stepName(list, index, fallback) {
  return list[index] || fallback;
}
