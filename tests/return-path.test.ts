import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/lib/security/request';

describe('safeReturnPath', () => {
  it.each(['/family', '/family/children/abc?tab=1', '/play', '/admin/audit', '/learn/?lesson=L01'])('keeps the signed-in path %s', (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it.each([
    'https://evil.example/steal',
    '//evil.example/steal',
    '/\\evil.example',
    '/signin',
    '/familyx',
    '/family/%2e%2e/signin',
    'family',
    '',
    null,
    undefined
  ])('falls back for %s', (value) => {
    expect(safeReturnPath(value)).toBe('/family');
  });

  it('drops a fragment and honours a custom fallback', () => {
    expect(safeReturnPath('/play#top')).toBe('/play');
    expect(safeReturnPath('//evil.example', '/play')).toBe('/play');
  });
});
