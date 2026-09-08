import { PHASE_ORDER } from './player.js';
import { evidenceRank, FIRST_NOTES_LESSONS, nextLessonId, unitView } from './unit.js';

const STEP_LABELS = ['Explain', 'See', 'Try', 'Check', 'Done'];

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === false || value == null) continue;
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function renderSteps(root, phaseIndex) {
  root.replaceChildren(...STEP_LABELS.map((label, index) => {
    const state = index < phaseIndex ? 'done' : index === phaseIndex ? 'active' : '';
    return el('li', { className: `phase-step ${state}`, 'aria-current': index === phaseIndex ? 'step' : null }, String(index + 1), el('span', {}, label));
  }));
}

export function renderParagraphs(root, paragraphs) {
  root.replaceChildren(...(paragraphs || []).map((text) => el('p', {}, text)));
}

export function phaseCopy(view) {
  const { lessonSpec, phase, guidedStep, independentStep, transferStep } = view;
  const copy = lessonSpec.copy;
  if (phase === 'explanation') return copy.explanation;
  if (phase === 'demo') return copy.demo;
  if (phase === 'guided') return stepCopy(copy.guided, guidedTitles(lessonSpec.lessonId, 'guided'), guidedStep);
  if (phase === 'independent') return stepCopy(copy.independent, guidedTitles(lessonSpec.lessonId, 'independent'), independentStep);
  if (phase === 'transfer') return stepCopy(copy.transfer, guidedTitles(lessonSpec.lessonId, 'transfer'), transferStep);
  if (phase === 'review') return copy.review;
  return resultCopy(view);
}

function stepCopy(block, titles, step) {
  if (!block) return { eyebrow: '', title: '', paragraphs: [] };
  const title = titles[step] || block.title;
  const camel = String(step || '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const paragraph = block[step] || block[camel];
  const paragraphs = paragraph ? [paragraph] : (block.paragraphs || []);
  return { ...block, title, paragraphs: paragraphs.length ? paragraphs : [block.title] };
}

function guidedTitles(lessonId, phase) {
  if (lessonId === 'L01' && phase === 'guided') {
    return { unlock: 'Wake the sound', 'high-low': 'High, then low', groups: 'Clumps of two and three', posture: 'A grown-up check' };
  }
  if (lessonId === 'L01' && phase === 'independent') {
    return { 'high-low': 'No glow this time', groups: 'Find both clumps', done: 'Ready for one more look' };
  }
  if (lessonId === 'L01' && phase === 'transfer') {
    return { 'other-two': 'Another clump of two', three: 'The clump of three' };
  }
  if (lessonId === 'L02' && phase === 'guided') {
    return { find: 'The doorstep', name: 'Name it', other: 'Another room', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L02' && phase === 'independent') {
    return { find: 'No glow this time', register: 'A C in a new room', done: 'Ready for another house' };
  }
  if (lessonId === 'L02' && phase === 'transfer') {
    return { 'other-house': 'Another house of two', done: 'Saved' };
  }
  if (lessonId === 'L03' && phase === 'guided') {
    return { 'find-c': 'Find C first', neighbors: 'Next door', row: 'C–D–E in a row', fingering: 'A grown-up check', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L03' && phase === 'independent') {
    return { order: 'A new order', done: 'Ready for one more walk' };
  }
  if (lessonId === 'L03' && phase === 'transfer') {
    return { order: 'Another new order', done: 'Saved' };
  }
  if (lessonId === 'L04' && phase === 'guided') {
    return { hear: 'Hear Little Wave', head: 'First four', tail: 'Last three', all: 'The whole wave', cousin: 'A cousin — just listening', done: 'Ready for a quiet check' };
  }
  if (lessonId === 'L04' && phase === 'independent') {
    return { home: 'Little Wave, no tiles', done: 'Now the cousin' };
  }
  if (lessonId === 'L04' && phase === 'transfer') {
    return { cousin: 'Wave the other way', done: 'Saved' };
  }
  return {};
}

function resultCopy(view) {
  const state = view.lesson.evidenceState;
  const copy = view.lessonSpec.copy.result;
  const sentence = evidenceSentence(state, view.lessonSpec);
  if (state === 'independent' || state === 'retained') {
    return { ...copy, paragraphs: [sentence, view.firstCompletionNow ? copy.firstRewardNote : copy.repeatNote] };
  }
  if (state === 'practiced') {
    return { eyebrow: copy.eyebrow, title: copy.practicedTitle, paragraphs: [sentence, 'Independent is still waiting if you want a quiet check next time.'] };
  }
  return { eyebrow: copy.eyebrow, title: copy.startedTitle, paragraphs: [sentence, 'Nothing here claims a finished skill. Come back on this same device to continue.'] };
}

export function evidenceSentence(state, lessonSpec) {
  const custom = lessonSpec?.copy?.result?.evidence?.[state];
  if (custom) return custom;
  if (state === 'independent') return 'Device record: Independent. The computer heard high/low and both black-key groups. It still cannot see posture.';
  if (state === 'practiced') return 'Device record: Practiced. Guided exploration is saved on this device only.';
  if (state === 'explored') return 'Device record: Explored. You opened the lesson and tried something on this device.';
  if (state === 'retained') return 'Device record: Retained. A later review already succeeded on this device.';
  return 'Device record: started, not yet Explored. We did not mark a success.';
}

export function evidenceLabel(state) {
  if (!state) return 'Not yet explored';
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function renderPhraseTiles(root, phrase) {
  if (!root) return;
  if (!phrase || phrase.kind === 'hidden') {
    root.hidden = true;
    root.replaceChildren();
    return;
  }
  root.hidden = false;
  root.replaceChildren(...phrase.letters.map((letter, index) => {
    const state = phrase.current < 0 ? '' : index < phrase.current ? 'done' : index === phrase.current ? 'current' : '';
    return el('span', { className: `sequence-note ${state}` }, letter);
  }));
}

export function renderUnitHub(root, store, { onOpen, onContinue }) {
  const view = unitView(store);
  const continueCard = view.cards.find((card) => card.lessonId === view.continueLessonId);
  root.replaceChildren(
    el('div', { className: 'game-topline' },
      el('span', { className: 'game-label' }, el('span', { className: 'game-live-dot' }), ' FIRST PIANO JOURNEY · FIRST NOTES'),
      el('span', { className: 'game-xp' }, 'Device-local only')
    ),
    el('section', { className: 'unit-intro' },
      el('p', { className: 'mission-eyebrow' }, 'WORLD · FIRST NOTES'),
      el('h1', {}, 'Four little activities. Same keyboard.'),
      el('p', {}, 'Explore, find C, walk to the neighbors, then play Little Wave. The next activity unlocks when this device is ready. Nothing here is a teacher grade.'),
      continueCard ? el('button', {
        className: 'button button-dark',
        type: 'button',
        onClick: () => onContinue(continueCard.lessonId)
      }, continueCard.inProgress ? `Continue ${continueCard.title}` : `Start ${continueCard.title}`) : null
    ),
    el('ol', { className: 'unit-map', 'aria-label': 'First Notes activities' },
      ...view.cards.map((card) => unitCard(card, onOpen))
    ),
    el('p', { className: 'unit-limit' }, 'First Notes is L01–L04. Later lessons are not here yet.')
  );
}

function unitCard(card, onOpen) {
  const locked = !card.unlocked;
  const state = evidenceLabel(card.evidenceState);
  const action = locked
    ? lockReason(card)
    : card.inProgress
      ? 'Continue'
      : evidenceRank(card.evidenceState) >= 3
        ? 'Replay'
        : 'Open';
  return el('li', { className: `unit-card ${locked ? 'locked' : 'open'} ${card.inProgress ? 'current' : ''}` },
    el('span', { className: 'unit-id' }, card.lessonId),
    el('strong', {}, card.title),
    el('span', { className: 'unit-blurb' }, card.blurb),
    el('span', { className: 'unit-state' }, locked ? 'Locked' : state),
    locked
      ? el('p', { className: 'unit-lock-note' }, action)
      : el('button', {
        className: 'button button-small button-outline',
        type: 'button',
        onClick: () => onOpen(card.lessonId)
      }, action)
  );
}

function lockReason(card) {
  const prior = FIRST_NOTES_LESSONS.find((item) => item.lessonId === card.unlocksAfter);
  if (!prior) return 'Locked';
  if (card.unlockNeeds === 'independent') return `Locked until ${prior.title} is Independent on this device.`;
  return `Locked until ${prior.title} is Practiced on this device.`;
}

export function lessonHref(lessonId) {
  return `/learn/?lesson=${lessonId}`;
}

export function nextHref(lessonId) {
  const next = nextLessonId(lessonId);
  return next ? lessonHref(next) : '/learn/';
}

export { PHASE_ORDER, STEP_LABELS, unitView };
