/**
 * Allowlist for cookieless funnel events. public/js/analytics.js mirrors this module.
 * scripts/analytics-allowlist-check.mjs fails if the two copies disagree.
 * No names, emails, child data, free text, or account ids.
 */

export const INSIGHTS_SCRIPT = '/_vercel/insights/script.js';
export const MAX_EVENT_PROPS = 2;

export const BLOCKED_HOSTS = [
  'va.vercel-scripts.com',
  'cdn.vercel-insights.com',
  'vitals.vercel-insights.com'
] as const;

export const SONG_SLUGS = [
  'mary-had-a-little-lamb',
  'ode-to-joy',
  'twinkle-twinkle',
  'hot-cross-buns',
  'row-row-row-your-boat',
  'jingle-bells',
  'london-bridge',
  'old-macdonald',
  'happy-birthday',
  'frere-jacques',
  'itsy-bitsy-spider',
  'baa-baa-black-sheep',
  'yankee-doodle',
  'amazing-grace',
  'when-the-saints',
  'brahms-lullaby',
  'minuet-in-g',
  'camptown-races',
  'oh-susanna',
  'skip-to-my-lou'
] as const;

export const LESSON_IDS = Array.from({ length: 24 }, (_, index) => `L${String(index + 1).padStart(2, '0')}`);
export const GRADES = ['S', 'A', 'B', 'C'] as const;
export const VIEWS = ['keys', 'drop', 'sheet', 'legend'] as const;
export const LEVELS = ['noob', 'pro', 'expert'] as const;

/** pathname, page prop, coarse path stored with the page view. */
export const PAGE_ROWS: readonly (readonly [string, string, string])[] = [
  ['/', 'home', '/'],
  ['/index.html', 'home', '/'],
  ['/learn', 'learn', '/learn'],
  ['/learn/', 'learn', '/learn'],
  ['/learn/index.html', 'learn', '/learn'],
  ['/songs', 'songs', '/songs'],
  ['/songs/', 'songs', '/songs'],
  ['/songs/index.html', 'songs', '/songs'],
  ['/signup', 'signup', '/signup'],
  ['/signin', 'signin', '/signin'],
  ['/check-email', 'check_email', '/check-email'],
  ['/forgot-password', 'forgot_password', '/forgot-password'],
  ['/reset-password', 'reset_password', '/reset-password'],
  ['/play', 'play', '/play'],
  ['/family', 'family', '/family'],
  ['/family/', 'family', '/family'],
  ['/family/welcome', 'family_welcome', '/family/welcome'],
  ['/family/account', 'family_account', '/family/account'],
  ['/family/children/new', 'family_child_new', '/family/children/new'],
  ['/verify', 'verify', '/verify']
];

/** name, allowed props, required props. At most two props so a Pro plan can store them. */
export const EVENT_ROWS: readonly (readonly [string, readonly string[], readonly string[]])[] = [
  ['page_view', ['page'], ['page']],
  ['lesson_start', ['lesson'], ['lesson']],
  ['lesson_complete', ['lesson'], ['lesson']],
  ['song_open', ['song'], ['song']],
  ['song_play', ['song', 'level'], ['song', 'level']],
  ['song_complete', ['song', 'grade'], ['song', 'grade']],
  ['view_change', ['view', 'song'], ['view', 'song']],
  ['level_change', ['level', 'song'], ['level', 'song']],
  ['note_inspect_open', ['song', 'view'], ['song', 'view']],
  ['midi_connect_success', [], []],
  ['signup_start', [], []],
  ['signup_complete', [], []],
  ['see_results_open', ['song', 'grade'], ['song', 'grade']]
];

export type PrivacySignals = {
  doNotTrack?: string | null;
  windowDoNotTrack?: string | null;
  msDoNotTrack?: string | null;
  globalPrivacyControl?: boolean;
};

export type PreparedEvent = { name: string; props: Record<string, string> };

export type AnalyticsIngress = {
  type?: string;
  url?: string;
  payload?: { name?: unknown; data?: unknown };
};

const PAGE_VALUES = new Set(PAGE_ROWS.map((row) => row[1]));
const LESSON_SET = new Set<string>(LESSON_IDS);
const SONG_SET = new Set<string>(SONG_SLUGS);
const GRADE_SET = new Set<string>(GRADES);
const VIEW_SET = new Set<string>(VIEWS);
const LEVEL_SET = new Set<string>(LEVELS);
const PAGE_BY_PATH = new Map(PAGE_ROWS.map((row) => [row[0], { page: row[1], path: row[2] }]));
const EVENT_BY_NAME = new Map(EVENT_ROWS.map((row) => [row[0], { props: row[1], required: row[2] }]));

export function trackingOptOut(signals: PrivacySignals): boolean {
  const flagged = [signals.doNotTrack, signals.windowDoNotTrack, signals.msDoNotTrack];
  if (flagged.some((value) => value === '1' || value === 'yes')) return true;
  return signals.globalPrivacyControl === true;
}

export function pageRecord(pathname: string): { page: string; path: string } | null {
  if (typeof pathname !== 'string' || pathname.length > 80 || !pathname.startsWith('/')) return null;
  if (pathname.includes('//') || pathname.includes('\\') || pathname.includes('%') || pathname.includes('?') || pathname.includes('#')) {
    return null;
  }
  const trimmed = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return PAGE_BY_PATH.get(pathname) ?? PAGE_BY_PATH.get(trimmed) ?? null;
}

function propValue(key: string, value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 1 || value.length > 40) return null;
  if (/\s/.test(value) || value.includes('@') || value.includes('/') || value.includes('\\') || value.includes('?') || value.includes('#')) {
    return null;
  }
  if (key === 'page' && PAGE_VALUES.has(value)) return value;
  if (key === 'lesson' && LESSON_SET.has(value)) return value;
  if (key === 'song' && SONG_SET.has(value)) return value;
  if (key === 'grade' && GRADE_SET.has(value)) return value;
  if (key === 'view' && VIEW_SET.has(value)) return value;
  if (key === 'level' && LEVEL_SET.has(value)) return value;
  return null;
}

function isPlain(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Returns null when the event or any prop is outside the allowlist. */
export function prepareEvent(name: unknown, props?: unknown): PreparedEvent | null {
  if (typeof name !== 'string') return null;
  const spec = EVENT_BY_NAME.get(name);
  if (!spec || spec.props.length > MAX_EVENT_PROPS) return null;
  if (props == null) return spec.required.length ? null : { name, props: {} };
  if (!isPlain(props)) return null;
  for (const key of Object.keys(props)) {
    if (!spec.props.includes(key)) return null;
  }
  const clean: Record<string, string> = {};
  for (const key of spec.props) {
    if (!Object.prototype.hasOwnProperty.call(props, key)) {
      if (spec.required.includes(key)) return null;
      continue;
    }
    const value = propValue(key, props[key]);
    if (!value) return null;
    clean[key] = value;
  }
  return { name, props: clean };
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function coarseHref(url: URL, path: string): string {
  const next = new URL(url.origin);
  next.pathname = path;
  return next.href;
}

/** Drops identify calls, query strings, and any page that is not on the path allowlist. */
export function redactAnalyticsEvent(event: AnalyticsIngress | null, pageHref: string): AnalyticsIngress | null {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return null;
  const type = event.type;
  if (type === 'identify' || type === 'group' || type === 'reset') return null;
  const current = parseHttpUrl(pageHref);
  const incoming = typeof event.url === 'string' ? parseHttpUrl(event.url) : null;
  if (incoming && current && incoming.origin !== current.origin) return null;
  const basis = incoming ?? current;
  if (!basis) return null;
  const record = pageRecord(basis.pathname);
  if (!record) return null;
  const url = coarseHref(basis, record.path);
  if (type === 'event') {
    const payload = event.payload;
    const name = payload && typeof payload === 'object' ? payload.name : undefined;
    const data = payload && typeof payload === 'object' ? payload.data : undefined;
    const clean = prepareEvent(name, data);
    if (!clean) return null;
    const next: AnalyticsIngress = { type: 'event', url, payload: { name: clean.name } };
    if (Object.keys(clean.props).length) next.payload = { name: clean.name, data: clean.props };
    return next;
  }
  if (type === 'pageview' || type == null) return { type: 'pageview', url };
  return null;
}

function isInsightsPath(pathname: string): boolean {
  return pathname === '/_vercel/insights' || pathname.startsWith('/_vercel/insights/');
}

/** How the page should treat a URL before the insights script sends it. */
export function insightsFetchPlan(url: string, pageOrigin: string): 'omit' | 'block' | 'passthrough' {
  if (typeof url !== 'string' || typeof pageOrigin !== 'string') return 'block';
  let parsed: URL;
  try {
    parsed = new URL(url, pageOrigin);
  } catch {
    return 'block';
  }
  if ((BLOCKED_HOSTS as readonly string[]).includes(parsed.host)) return 'block';
  if (!isInsightsPath(parsed.pathname)) return 'passthrough';
  return parsed.origin === pageOrigin ? 'omit' : 'block';
}
