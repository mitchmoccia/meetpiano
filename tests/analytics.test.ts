import { describe, expect, it } from 'vitest';
import {
  EVENT_ROWS,
  GRADES,
  LESSON_IDS,
  LEVELS,
  MAX_EVENT_PROPS,
  SONG_SLUG_PATTERN,
  VIEWS,
  songIdsFromCatalog,
  insightsFetchPlan,
  pageRecord,
  prepareEvent,
  redactAnalyticsEvent,
  trackingOptOut
} from '@/lib/analytics/events';

const LEARN = 'https://meetpiano.app/learn/?lesson=L01&token=secret';
const HOME = 'https://meetpiano.app/';

const PLAYER_SONGS = songIdsFromCatalog([
  { id: 'ode-to-joy' },
  { id: 'twinkle-twinkle' },
  { id: 'jingle-bells' },
  { id: 'hot-cross-buns' },
  { id: 'frere-jacques' },
  { id: 'london-bridge' },
  { id: 'minuet-in-g' },
  { id: 'brahms-lullaby' }
]);

describe('analytics allowlist', () => {
  it('keeps every custom event to two props or fewer', () => {
    for (const [name, props, required] of EVENT_ROWS) {
      expect(props.length).toBeLessThanOrEqual(MAX_EVENT_PROPS);
      for (const key of required) expect(props).toContain(key);
      expect(new Set(props).size).toBe(props.length);
      expect(name).toMatch(/^[a-z_]+$/);
    }
  });

  it('names every lesson from L01 through L24', () => {
    expect(LESSON_IDS).toHaveLength(24);
    expect(LESSON_IDS[0]).toBe('L01');
    expect(LESSON_IDS[23]).toBe('L24');
  });

  it('accepts a landing view and a lesson start', () => {
    expect(prepareEvent('page_view', { page: 'home' })).toEqual({ name: 'page_view', props: { page: 'home' } });
    expect(prepareEvent('lesson_start', { lesson: 'L01' })).toEqual({ name: 'lesson_start', props: { lesson: 'L01' } });
    expect(prepareEvent('lesson_complete', { lesson: 'L24' })).toEqual({ name: 'lesson_complete', props: { lesson: 'L24' } });
  });

  it('accepts song, view, level, and grade bucket props', () => {
    expect(prepareEvent('song_open', { song: 'ode-to-joy' }, PLAYER_SONGS)).toEqual({ name: 'song_open', props: { song: 'ode-to-joy' } });
    expect(prepareEvent('song_play', { song: 'ode-to-joy', level: 'pro' }, PLAYER_SONGS)).toEqual({
      name: 'song_play',
      props: { song: 'ode-to-joy', level: 'pro' }
    });
    expect(prepareEvent('song_complete', { song: 'twinkle-twinkle', grade: 'A' }, PLAYER_SONGS)).toEqual({
      name: 'song_complete',
      props: { song: 'twinkle-twinkle', grade: 'A' }
    });
    expect(prepareEvent('view_change', { view: 'sheet', song: 'jingle-bells' }, PLAYER_SONGS)?.props.view).toBe('sheet');
    expect(prepareEvent('level_change', { level: 'expert', song: 'hot-cross-buns' }, PLAYER_SONGS)?.props.level).toBe('expert');
    expect(prepareEvent('note_inspect_open', { song: 'frere-jacques', view: 'legend' }, PLAYER_SONGS)?.props).toEqual({
      song: 'frere-jacques',
      view: 'legend'
    });
    expect(prepareEvent('see_results_open', { song: 'minuet-in-g', grade: 'S' }, PLAYER_SONGS)?.props.grade).toBe('S');
    expect(GRADES).toEqual(['S', 'A', 'B', 'C']);
    expect(VIEWS).toEqual(['keys', 'drop', 'sheet', 'legend']);
    expect(LEVELS).toEqual(['noob', 'pro', 'expert']);
  });

  it('sends signup and MIDI success with no props', () => {
    expect(prepareEvent('signup_start')).toEqual({ name: 'signup_start', props: {} });
    expect(prepareEvent('signup_complete', undefined)).toEqual({ name: 'signup_complete', props: {} });
    expect(prepareEvent('midi_connect_success')).toEqual({ name: 'midi_connect_success', props: {} });
  });

  it('drops emails, child ids, free text, and unknown props', () => {
    expect(prepareEvent('lesson_start', { lesson: 'L01', email: 'ada@example.com' })).toBeNull();
    expect(prepareEvent('lesson_start', { lesson: 'L01', child: 'sam' })).toBeNull();
    expect(prepareEvent('lesson_start', { lesson: 'L01', name: 'Ada' })).toBeNull();
    expect(prepareEvent('song_open', { song: 'my diary today' }, PLAYER_SONGS)).toBeNull();
    expect(prepareEvent('page_view', { page: 'home', note: 'hello there' })).toBeNull();
    expect(prepareEvent('signup_start', { email: 'ada@example.com' })).toBeNull();
    expect(prepareEvent('midi_connect_success', { device: 'Yamaha P-45' })).toBeNull();
    expect(prepareEvent('not_a_real_event', { page: 'home' })).toBeNull();
  });

  it('drops lesson ids and song slugs outside the catalogs', () => {
    expect(prepareEvent('lesson_start', { lesson: 'L00' })).toBeNull();
    expect(prepareEvent('lesson_start', { lesson: 'L25' })).toBeNull();
    expect(prepareEvent('lesson_start', { lesson: 'l01' })).toBeNull();
    expect(prepareEvent('song_open', { song: 'happy-birthday-remix' }, PLAYER_SONGS)).toBeNull();
    expect(prepareEvent('song_complete', { song: 'ode-to-joy', grade: 'A+' }, PLAYER_SONGS)).toBeNull();
    expect(prepareEvent('level_change', { level: 'Beginner', song: 'ode-to-joy' }, PLAYER_SONGS)).toBeNull();
    expect(prepareEvent('song_open', { song: 'ode-to-joy' })).toBeNull();
  });

  it('accepts a song that was added only to the catalog', () => {
    const songs = songIdsFromCatalog([
      { id: 'ode-to-joy' },
      { id: 'fresh-daily-song' },
      { id: 'ada@example.com' },
      { id: 'Child_123' },
      { id: 'my diary' }
    ]);
    expect(SONG_SLUG_PATTERN.source).toBe('^[a-z0-9-]{1,64}$');
    expect(songs).toEqual(['ode-to-joy', 'fresh-daily-song']);
    expect(prepareEvent('song_open', { song: 'fresh-daily-song' }, songs)).toEqual({
      name: 'song_open',
      props: { song: 'fresh-daily-song' }
    });
    expect(prepareEvent('song_play', { song: 'fresh-daily-song', level: 'noob' }, songs)?.props).toEqual({
      song: 'fresh-daily-song',
      level: 'noob'
    });
    expect(prepareEvent('song_open', { song: 'fresh-daily-song' }, ['ode-to-joy'])).toBeNull();
    expect(prepareEvent('song_open', { song: 'ada@example.com' }, songs)).toBeNull();
    expect(prepareEvent('song_open', { song: 'Child_123' }, songs)).toBeNull();
    expect(prepareEvent('song_open', { song: 'my diary' }, songs)).toBeNull();
    expect(prepareEvent('song_complete', { song: 'a'.repeat(65), grade: 'S' }, ['a'.repeat(65)])).toBeNull();
  });

  it('maps public paths and refuses child and admin paths', () => {
    expect(pageRecord('/')).toEqual({ page: 'home', path: '/' });
    expect(pageRecord('/learn/')).toEqual({ page: 'learn', path: '/learn' });
    expect(pageRecord('/songs')).toEqual({ page: 'songs', path: '/songs' });
    expect(pageRecord('/family/children/new')).toEqual({ page: 'family_child_new', path: '/family/children/new' });
    expect(pageRecord('/family/children/child_123')).toBeNull();
    expect(pageRecord('/admin')).toBeNull();
    expect(pageRecord('/family/children/%2e%2e')).toBeNull();
  });

  it('strips query strings and refuses another origin', () => {
    expect(redactAnalyticsEvent({ type: 'pageview', url: LEARN }, LEARN)).toEqual({
      type: 'pageview',
      url: 'https://meetpiano.app/learn'
    });
    const lesson = redactAnalyticsEvent(
      { type: 'event', url: LEARN, payload: { name: 'lesson_start', data: { lesson: 'L01' } } },
      LEARN
    );
    expect(lesson).toEqual({
      type: 'event',
      url: 'https://meetpiano.app/learn',
      payload: { name: 'lesson_start', data: { lesson: 'L01' } }
    });
    expect(JSON.stringify(lesson)).not.toContain('token');
    expect(JSON.stringify(lesson)).not.toContain('secret');
    expect(redactAnalyticsEvent({ type: 'pageview', url: 'https://meetpiano.app/family/children/abc?token=1' }, HOME)).toBeNull();
    expect(redactAnalyticsEvent({ type: 'pageview', url: 'https://evil.example/learn' }, HOME)).toBeNull();
    expect(redactAnalyticsEvent({ type: 'identify', url: HOME, payload: { name: 'identify' } }, HOME)).toBeNull();
    expect(
      redactAnalyticsEvent(
        { type: 'event', url: 'https://meetpiano.app/signup', payload: { name: 'signup_start', data: { email: 'a@b.c' } } },
        'https://meetpiano.app/signup'
      )
    ).toBeNull();
  });

  it('honors Do Not Track and Global Privacy Control', () => {
    expect(trackingOptOut({ doNotTrack: '1' })).toBe(true);
    expect(trackingOptOut({ windowDoNotTrack: 'yes' })).toBe(true);
    expect(trackingOptOut({ msDoNotTrack: '1' })).toBe(true);
    expect(trackingOptOut({ globalPrivacyControl: true })).toBe(true);
    expect(trackingOptOut({ doNotTrack: '0', globalPrivacyControl: false })).toBe(false);
  });

  it('sends insights beacons without cookies and blocks the vendor script host', () => {
    expect(insightsFetchPlan('/_vercel/insights/event', 'https://meetpiano.app')).toBe('omit');
    expect(insightsFetchPlan('https://meetpiano.app/_vercel/insights/view', 'https://meetpiano.app')).toBe('omit');
    expect(insightsFetchPlan('https://va.vercel-scripts.com/v1/script.debug.js', 'https://meetpiano.app')).toBe('block');
    expect(insightsFetchPlan('https://cdn.vercel-insights.com/v1/script.js', 'https://meetpiano.app')).toBe('block');
    expect(insightsFetchPlan('https://evil.example/_vercel/insights/event', 'https://meetpiano.app')).toBe('block');
    expect(insightsFetchPlan('https://meetpiano.app/api/learner/context', 'https://meetpiano.app')).toBe('passthrough');
  });
});
