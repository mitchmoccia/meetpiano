import { PHASE_ORDER } from './player.js';

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
  root.replaceChildren(...paragraphs.map((text) => el('p', {}, text)));
}

export function phaseCopy(view) {
  const { lessonSpec, phase, guidedStep, independentStep, transferStep } = view;
  const copy = lessonSpec.copy;
  if (phase === 'explanation') return copy.explanation;
  if (phase === 'demo') return copy.demo;
  if (phase === 'guided') {
    const byStep = {
      unlock: { ...copy.guided, title: 'Wake the sound', paragraphs: [copy.guided.unlock] },
      'high-low': { ...copy.guided, title: 'High, then low', paragraphs: [copy.guided.highLow] },
      groups: { ...copy.guided, title: 'Clumps of two and three', paragraphs: [copy.guided.groups] },
      posture: { ...copy.guided, title: 'A grown-up check', paragraphs: [copy.guided.posture] }
    };
    return byStep[guidedStep] || copy.guided;
  }
  if (phase === 'independent') {
    const byStep = {
      'high-low': { ...copy.independent, paragraphs: [copy.independent.highLow] },
      groups: { ...copy.independent, title: 'Find both clumps', paragraphs: [copy.independent.groups] },
      done: { ...copy.independent, title: 'Ready for one more look', paragraphs: ['That check is in. Next is a different pair of two, or a grown-up confirm.'] }
    };
    return byStep[independentStep] || copy.independent;
  }
  if (phase === 'transfer') {
    const byStep = {
      'other-two': { ...copy.transfer, paragraphs: [copy.transfer.otherTwo] },
      three: { ...copy.transfer, title: 'The clump of three', paragraphs: [copy.transfer.three] },
      done: copy.transfer
    };
    return byStep[transferStep] || copy.transfer;
  }
  return resultCopy(view);
}

function resultCopy(view) {
  const state = view.lesson.evidenceState;
  const copy = view.lessonSpec.copy.result;
  if (state === 'independent' || state === 'retained') {
    return { ...copy, paragraphs: [evidenceSentence(state), view.firstCompletionNow ? copy.firstRewardNote : copy.repeatNote] };
  }
  if (state === 'practiced') {
    return { eyebrow: copy.eyebrow, title: copy.practicedTitle, paragraphs: [evidenceSentence(state), 'Independent is still waiting if you want a quiet check next time.'] };
  }
  return { eyebrow: copy.eyebrow, title: copy.startedTitle, paragraphs: [evidenceSentence(state), 'Nothing here claims a finished skill. Come back on this same device to continue.'] };
}

export function evidenceSentence(state) {
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

export { PHASE_ORDER, STEP_LABELS };
