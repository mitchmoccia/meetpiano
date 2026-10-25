/** Modal behavior for the song results dialog. Close, Escape, and the backdrop share one path. */
export function createResultsDialog({ root, onClose, getFocusables }) {
  function close() {
    onClose();
  }

  function onKeydown(event) {
    if (!root || root.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = (getFocusables() || []).filter((el) => el && !el.disabled);
    if (!items.length) return;
    const active = root.ownerDocument?.activeElement;
    const first = items[0];
    const last = items[items.length - 1];
    const index = items.indexOf(active);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (index === -1 || index === items.length - 1)) {
      event.preventDefault();
      first.focus();
    }
  }

  function onPointer(event) {
    if (event.target === root) close();
  }

  return { close, onKeydown, onPointer };
}
