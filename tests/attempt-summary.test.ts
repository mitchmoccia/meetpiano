import { describe, expect, it } from 'vitest';
import { attemptSummarySchema } from '@/features/progress/attempt-details';
import { sentSummary } from './fixtures';

const parses = (value: unknown) => attemptSummarySchema.safeParse(value).success;

describe('attemptSummarySchema', () => {
  it('accepts a bounded summary', () => {
    expect(parses(sentSummary())).toBe(true);
  });

  it('rejects fields it does not know, such as raw MIDI or audio', () => {
    expect(parses({ ...sentSummary(), rawMidi: [144, 60, 100] })).toBe(false);
    expect(parses({ ...sentSummary(), details: { ...sentSummary().details, audio: 'data:audio/wav;base64,AAAA' } })).toBe(false);
  });

  it.each([
    ['a malformed lesson id', { lessonId: 'lesson-1' }],
    ['a short attempt id', { clientAttemptId: 'abc' }],
    ['an uppercase content version', { contentVersion: 'Beginner-V1' }],
    ['revision zero', { revision: 0 }],
    ['an oversized revision', { revision: 100_001 }],
    ['an unknown input mode', { inputMode: 'microphone' }],
    ['a timestamp without a time zone', { startedAt: '2026-10-01T11:50:00' }]
  ])('rejects %s', (_case, change) => {
    expect(parses({ ...sentSummary(), ...change })).toBe(false);
  });
});
