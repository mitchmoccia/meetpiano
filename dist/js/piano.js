export const WHITE_NOTES = [60, 62, 64, 65, 67, 69, 71];
export const BLACK_NOTES = [
  { note: 61, className: 'black-1', group: 'two-4' },
  { note: 63, className: 'black-2', group: 'two-4' },
  { note: 66, className: 'black-3', group: 'three-4' },
  { note: 68, className: 'black-4', group: 'three-4' },
  { note: 70, className: 'black-5', group: 'three-4' }
];

export const COMPUTER_KEYS = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71
};

export function blackGroupId(note) {
  const pc = ((note % 12) + 12) % 12;
  const octave = Math.floor(note / 12) - 1;
  if (pc === 1 || pc === 3) return `two-${octave}`;
  if (pc === 6 || pc === 8 || pc === 10) return `three-${octave}`;
  return null;
}

export function groupKind(groupId) {
  if (!groupId) return null;
  return groupId.startsWith('two-') ? 'two' : groupId.startsWith('three-') ? 'three' : null;
}

export function renderPiano(root) {
  root.replaceChildren();
  root.classList.add('piano');
  root.setAttribute('aria-label', 'On-screen piano stand-in');
  WHITE_NOTES.forEach((note) => {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'piano-key white-key';
    key.dataset.note = String(note);
    key.setAttribute('aria-label', `White key, computer key ${computerLabel(note)}`);
    root.append(key);
  });
  BLACK_NOTES.forEach((item) => {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = `piano-key black-key ${item.className}`;
    key.dataset.note = String(item.note);
    key.dataset.group = item.group;
    key.setAttribute('aria-label', `Black key, computer key ${computerLabel(item.note)}`);
    root.append(key);
  });
}

function computerLabel(note) {
  const found = Object.entries(COMPUTER_KEYS).find(([, value]) => value === note);
  return found ? found[0].toUpperCase() : '';
}

export function keyElement(root, note) {
  return root.querySelector(`[data-note="${note}"]`);
}

export function setPressed(root, note, on) {
  keyElement(root, note)?.classList.toggle('pressed', on);
}

export function clearPressed(root) {
  root.querySelectorAll('.piano-key.pressed').forEach((key) => key.classList.remove('pressed'));
}

export function setHints(root, notes) {
  root.querySelectorAll('.piano-key.hint').forEach((key) => key.classList.remove('hint'));
  notes.forEach((note) => keyElement(root, note)?.classList.add('hint'));
}

export function setGroupOutlines(root, kinds) {
  root.classList.toggle('outline-two', kinds.includes('two'));
  root.classList.toggle('outline-three', kinds.includes('three'));
}

export function setSweep(root, note) {
  root.querySelectorAll('.piano-key.sweep').forEach((key) => key.classList.remove('sweep'));
  if (note != null) keyElement(root, note)?.classList.add('sweep');
}
