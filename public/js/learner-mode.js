import { STORAGE_KEY } from './progress-core.js';
import { emptyStore, validateStore } from './progress.js';
import { setLessonAvailability } from './unit.js';
import { mergeCloudIntoStore } from './cloud-merge.js';
import { createOutbox } from './cloud-outbox.js';
import { installLearnerCopy } from './learner-copy.js';
import { backingStorage, clearLearnerCookie, learnerKey, readContextCache, readLearnerCookie, writeContextCache } from './learner-storage.js';

const CONTEXT_URL = '/api/learner/context';
const AVATARS = new Set(['sun', 'berry', 'ember', 'sky', 'leaf', 'plum']);

const STATUS_LABELS = {
  saved: () => 'Saved',
  saving: () => 'Saving…',
  offline: () => 'Offline · saves when the connection is back',
  retrying: () => "Can't reach MeetPiano · trying again",
  waiting: () => 'Waiting to save',
  failed: (count) => `${count} ${count === 1 ? 'try' : 'tries'} could not be saved`,
  'signed-out': () => 'Signed out · not saving',
  'other-account': () => 'Another grown-up signed in · not saving'
};

function node(doc, tag, { className, text, attrs = {} } = {}, ...children) {
  const element = doc.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  element.append(...children.filter(Boolean));
  return element;
}

function cachedFor(childId, backing) {
  const cached = readContextCache(backing);
  return cached?.child?.id === childId ? { kind: 'ready', context: cached, offline: true } : { kind: 'unreachable' };
}

async function loadContext(childId, backing) {
  let response;
  try {
    response = await fetch(CONTEXT_URL, { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
  } catch (_) {
    return cachedFor(childId, backing);
  }
  if (response.status === 401) return { kind: 'signed-out' };
  if (!response.ok) return cachedFor(childId, backing);
  const body = await response.json().catch(() => null);
  if (body?.status !== 'ready' || body.child?.id !== childId || typeof body.userId !== 'string') return { kind: 'choose' };
  return { kind: 'ready', context: body };
}

function readLocalStore(storage) {
  try {
    const checked = validateStore(JSON.parse(storage.getItem(STORAGE_KEY) || 'null'));
    return checked.ok ? checked.store : emptyStore();
  } catch (_) {
    return emptyStore();
  }
}

/** Halts learn.js on an explanation card: a signed-in learner's page must never fall back to guest records. */
function halt() {
  return new Promise(() => {});
}

function showBlocked(doc, { title, text, actions }) {
  for (const id of ['unit-hub', 'lesson-shell', 'grownup-shell', 'setup-strip-mount', 'device-disclosure']) {
    const element = doc.getElementById(id);
    if (element) element.hidden = true;
  }
  doc.querySelector('.learn-nav-actions')?.setAttribute('hidden', '');
  const heading = node(doc, 'h1', { text: title, attrs: { tabindex: '-1' } });
  const card = node(doc, 'section', { className: 'learn-shell learner-blocked', attrs: { id: 'learner-blocked' } },
    node(doc, 'p', { className: 'mission-eyebrow', text: 'FAMILY PROFILE' }),
    heading,
    node(doc, 'p', { text }),
    node(doc, 'div', { className: 'phase-actions' }, ...actions));
  doc.querySelector('#main > .wrap')?.prepend(card);
  heading.focus();
}

function linkButton(doc, href, text, dark = false) {
  return node(doc, 'a', { className: `button ${dark ? 'button-dark' : 'button-outline'}`, text, attrs: { href } });
}

function actionButton(doc, text, onClick) {
  const button = node(doc, 'button', { className: 'button button-outline', text, attrs: { type: 'button' } });
  button.addEventListener('click', onClick);
  return button;
}

function playAsGuest() {
  clearLearnerCookie();
  window.location.replace('/learn/');
}

function blockSignedOut(doc) {
  clearLearnerCookie(doc);
  showBlocked(doc, {
    title: 'A grown-up needs to sign in',
    text: 'This learner saves to a family profile, and the grown-up who manages it is signed out on this browser. Sign in to keep saving, or play as a guest. Guest practice stays on this device only.',
    actions: [linkButton(doc, '/signin?next=%2Fplay', 'Grown-up sign in', true), actionButton(doc, 'Play as guest', playAsGuest)]
  });
}

function blockUnreachable(doc) {
  showBlocked(doc, {
    title: "We can't reach MeetPiano right now",
    text: 'This browser has not opened this learner before, so there is nothing saved here to practice with offline. Check the connection and try again.',
    actions: [
      actionButton(doc, 'Try again', () => window.location.reload()),
      actionButton(doc, 'Play as guest', playAsGuest)
    ]
  });
}

function renderLearnerBar(doc, child) {
  const avatar = AVATARS.has(child.avatar) ? child.avatar : 'none';
  const status = node(doc, 'p', { className: 'learner-status', text: 'Saved', attrs: { role: 'status', 'aria-live': 'polite', 'data-kind': 'saved' } });
  const bar = node(doc, 'section', { className: 'learner-bar wrap', attrs: { id: 'learner-bar', 'aria-label': 'Who is practicing' } },
    node(doc, 'span', { className: `learner-avatar avatar-${avatar}`, text: child.nickname.slice(0, 1).toUpperCase(), attrs: { 'aria-hidden': 'true' } }),
    node(doc, 'p', { className: 'learner-name' }, doc.createTextNode('Practicing as '), node(doc, 'strong', { text: child.nickname })),
    status,
    linkButton(doc, '/play', 'Switch learner'),
    linkButton(doc, '/family', 'Family'));
  doc.getElementById('main')?.prepend(bar);
  return (view) => {
    status.dataset.kind = view.kind;
    status.textContent = (STATUS_LABELS[view.kind] || STATUS_LABELS.saved)(view.failed);
  };
}

function enterLearner(doc, { context, offline }) {
  const backing = backingStorage();
  setLessonAvailability(context.catalog || {});
  const paint = renderLearnerBar(doc, context.child);
  const outbox = createOutbox({ userId: context.userId, childId: context.child.id, backing, onStatus: paint });
  if (!offline) {
    const store = mergeCloudIntoStore(readLocalStore(outbox.storage), context.progress || {});
    outbox.storage.setItem(STORAGE_KEY, JSON.stringify(store));
    writeContextCache(backing, context);
  }
  const disclosure = doc.getElementById('device-disclosure');
  if (disclosure) {
    disclosure.textContent = offline
      ? 'Offline. Practice saves in this browser and goes to the family profile when the connection is back.'
      : `Saving to ${context.child.nickname}'s family profile. Touch practice is never MIDI verified.`;
  }
  installLearnerCopy(doc.body, { skip: doc.getElementById('learner-bar') });
  leaveWhenPurgedElsewhere(context.child.id);
  outbox.start(window);
  return { mode: 'learner', storage: outbox.storage, child: context.child };
}

/** Sign-out or deleting this learner in another tab removes the learner's records; this tab then stops showing them. */
function leaveWhenPurgedElsewhere(childId) {
  const syncKey = learnerKey(childId, 'sync');
  window.addEventListener('storage', (event) => {
    if (event.key === null || (event.key === syncKey && event.newValue === null)) window.location.replace('/learn/');
  });
}

/**
 * Chooses guest or family-learner mode before learn.js reads any records. Guest mode makes no network calls and
 * keeps using the original device-local keys.
 */
export async function startLearnerMode(doc = document) {
  const childId = readLearnerCookie(doc);
  if (!childId) return { mode: 'guest', storage: undefined, child: null };
  const loaded = await loadContext(childId, backingStorage());
  if (loaded.kind === 'ready') return enterLearner(doc, loaded);
  if (loaded.kind === 'choose') window.location.replace('/play?reason=choose');
  else if (loaded.kind === 'signed-out') blockSignedOut(doc);
  else blockUnreachable(doc);
  return halt();
}
