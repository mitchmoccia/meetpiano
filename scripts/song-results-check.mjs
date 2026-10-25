import { readFileSync } from 'node:fs';
import { createResultsDialog } from '../public/js/song-results.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const page = readFileSync('public/songs/index.html', 'utf8');
const css = readFileSync('public/songs/songs.css', 'utf8');
const player = readFileSync('public/js/song-player.js', 'utf8');

assert(page.includes('id="results-close"') && page.includes('aria-label="Close"'), 'results have a close button');
assert(page.includes('id="results-dismiss"') && page.includes('Try a loop') && page.includes('Play again'), 'results pin play, loop, and close');
assert(page.includes('role="dialog"') && page.includes('aria-modal="true"'), 'results are a modal dialog');
assert(css.includes('overflow-y: auto') && css.includes('max-height: calc(100dvh - 24px)'), 'the results panel scrolls inside the viewport');
assert(player.includes('createResultsDialog') && player.includes('results-close') && player.includes('onPointer'), 'the player wires close, escape, and the backdrop');

let closed = 0;
const root = { hidden: false, ownerDocument: { activeElement: null } };
const first = { disabled: false, focus() { root.ownerDocument.activeElement = first; } };
const last = { disabled: false, focus() { root.ownerDocument.activeElement = last; } };
const dialog = createResultsDialog({
  root,
  onClose: () => { closed += 1; },
  getFocusables: () => [first, last]
});

dialog.close();
assert(closed === 1, 'the close button closes the dialog');
let prevented = false;
dialog.onKeydown({ key: 'Escape', preventDefault() { prevented = true; } });
assert(closed === 2 && prevented, 'escape closes the dialog');
dialog.onPointer({ target: root });
assert(closed === 3, 'the backdrop closes the dialog');
dialog.onPointer({ target: { panel: true } });
assert(closed === 3, 'a click inside the panel stays open');

root.ownerDocument.activeElement = last;
prevented = false;
dialog.onKeydown({ key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
assert(prevented && root.ownerDocument.activeElement === first, 'tab wraps to the first control');
root.ownerDocument.activeElement = first;
prevented = false;
dialog.onKeydown({ key: 'Tab', shiftKey: true, preventDefault() { prevented = true; } });
assert(prevented && root.ownerDocument.activeElement === last, 'shift-tab wraps to the last control');

console.log('song results dialog checks passed');
