/**
 * Same-origin funnel beacon for static pages and the Next.js app.
 * Keep this file in step with src/lib/analytics/events.ts.
 * The allowlist check compares the two copies.
 * Loads /_vercel/insights/script.js only. No third-party host, no inline bootstrap.
 */

export const INSIGHTS_SCRIPT = '/_vercel/insights/script.js';
export const MAX_EVENT_PROPS = 2;

export const BLOCKED_HOSTS = [
  'va.vercel-scripts.com',
  'cdn.vercel-insights.com',
  'vitals.vercel-insights.com'
];

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
];

export const LESSON_IDS = Array.from({ length: 24 }, (_, index) => `L${String(index + 1).padStart(2, '0')}`);
export const GRADES = ['S', 'A', 'B', 'C'];
export const VIEWS = ['keys', 'drop', 'sheet', 'legend'];
export const LEVELS = ['noob', 'pro', 'expert'];

export const PAGE_ROWS = [
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

export const EVENT_ROWS = [
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

const PAGE_VALUES = new Set(PAGE_ROWS.map((row) => row[1]));
const LESSON_SET = new Set(LESSON_IDS);
const SONG_SET = new Set(SONG_SLUGS);
const GRADE_SET = new Set(GRADES);
const VIEW_SET = new Set(VIEWS);
const LEVEL_SET = new Set(LEVELS);
const PAGE_BY_PATH = new Map(PAGE_ROWS.map((row) => [row[0], { page: row[1], path: row[2] }]));
const EVENT_BY_NAME = new Map(EVENT_ROWS.map((row) => [row[0], { props: row[1], required: row[2] }]));

let started = false;

export function trackingOptOut(signals) {
  const flagged = [signals?.doNotTrack, signals?.windowDoNotTrack, signals?.msDoNotTrack];
  if (flagged.some((value) => value === '1' || value === 'yes')) return true;
  return signals?.globalPrivacyControl === true;
}

export function pageRecord(pathname) {
  if (typeof pathname !== 'string' || pathname.length > 80 || !pathname.startsWith('/')) return null;
  if (pathname.includes('//') || pathname.includes('\\') || pathname.includes('%') || pathname.includes('?') || pathname.includes('#')) {
    return null;
  }
  const trimmed = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return PAGE_BY_PATH.get(pathname) || PAGE_BY_PATH.get(trimmed) || null;
}

function propValue(key, value) {
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

function isPlain(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function prepareEvent(name, props) {
  if (typeof name !== 'string') return null;
  const spec = EVENT_BY_NAME.get(name);
  if (!spec || spec.props.length > MAX_EVENT_PROPS) return null;
  if (props == null) return spec.required.length ? null : { name, props: {} };
  if (!isPlain(props)) return null;
  for (const key of Object.keys(props)) {
    if (!spec.props.includes(key)) return null;
  }
  const clean = {};
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

function parseHttpUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function coarseHref(url, path) {
  const next = new URL(url.origin);
  next.pathname = path;
  return next.href;
}

export function redactAnalyticsEvent(event, pageHref) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return null;
  const type = event.type;
  if (type === 'identify' || type === 'group' || type === 'reset') return null;
  const current = parseHttpUrl(pageHref);
  const incoming = typeof event.url === 'string' ? parseHttpUrl(event.url) : null;
  if (incoming && current && incoming.origin !== current.origin) return null;
  const basis = incoming || current;
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
    const next = { type: 'event', url, payload: { name: clean.name } };
    if (Object.keys(clean.props).length) next.payload = { name: clean.name, data: clean.props };
    return next;
  }
  if (type === 'pageview' || type == null) return { type: 'pageview', url };
  return null;
}

function isInsightsPath(pathname) {
  return pathname === '/_vercel/insights' || pathname.startsWith('/_vercel/insights/');
}

export function insightsFetchPlan(url, pageOrigin) {
  if (typeof url !== 'string' || typeof pageOrigin !== 'string') return 'block';
  let parsed;
  try {
    parsed = new URL(url, pageOrigin);
  } catch {
    return 'block';
  }
  if (BLOCKED_HOSTS.includes(parsed.host)) return 'block';
  if (!isInsightsPath(parsed.pathname)) return 'passthrough';
  return parsed.origin === pageOrigin ? 'omit' : 'block';
}

function browserSignals() {
  const nav = navigator;
  return {
    doNotTrack: nav.doNotTrack,
    windowDoNotTrack: window.doNotTrack,
    msDoNotTrack: nav.msDoNotTrack,
    globalPrivacyControl: nav.globalPrivacyControl === true
  };
}

function requestUrl(input) {
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.href;
  if (input && typeof input.url === 'string') return input.url;
  return '';
}

function installInsightsFetchGuard() {
  if (window.__mpInsightsGuard) return;
  window.__mpInsightsGuard = true;
  const origin = window.location.origin;
  const originalFetch = window.fetch?.bind(window);
  if (originalFetch) {
    window.fetch = (input, init) => {
      const plan = insightsFetchPlan(requestUrl(input), origin);
      if (plan === 'block') return Promise.resolve(new Response(null, { status: 204 }));
      if (plan === 'omit') return originalFetch(input, { ...init, credentials: 'omit', referrerPolicy: 'no-referrer' });
      return originalFetch(input, init);
    };
  }
  if (typeof navigator.sendBeacon === 'function' && originalFetch) {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => {
      const plan = insightsFetchPlan(String(url), origin);
      if (plan === 'block') return true;
      if (plan === 'omit') {
        originalFetch(url, { method: 'POST', body: data, keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer' }).catch(() => {});
        return true;
      }
      return originalBeacon(url, data);
    };
  }
}

function initQueue() {
  if (typeof window.va === 'function') return;
  window.va = function va() {
    (window.vaq = window.vaq || []).push(arguments);
  };
}

export function emit(name, props) {
  try {
    if (typeof window !== 'undefined' && trackingOptOut(browserSignals())) return;
    const clean = prepareEvent(name, props);
    if (!clean) return;
    if (typeof window === 'undefined' || typeof window.va !== 'function') return;
    if (Object.keys(clean.props).length) window.va('event', { name: clean.name, data: clean.props });
    else window.va('event', { name: clean.name });
  } catch {
    /* Practice and signup keep working when the beacon is blocked. */
  }
}

function boot() {
  try {
    if (typeof window === 'undefined' || started) return;
    started = true;
    window.mpTrack = emit;
    if (trackingOptOut(browserSignals())) return;
    const record = pageRecord(window.location.pathname);
    if (!record || !document.head) return;
    installInsightsFetchGuard();
    initQueue();
    window.va('beforeSend', (event) => redactAnalyticsEvent(event, window.location.href));
    const script = document.createElement('script');
    script.src = INSIGHTS_SCRIPT;
    script.defer = true;
    script.dataset.sdkn = '@vercel/analytics';
    script.dataset.sdkv = '2.0.1';
    document.head.appendChild(script);
    emit('page_view', { page: record.page });
  } catch {
    /* A failed beacon must not stop the page. */
  }
}

boot();
