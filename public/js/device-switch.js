export const DEVICE_SWITCH_WARNING_ID = 'device-switch-warning';
export const DEVICE_SWITCH_POINTER_ID = 'device-switch-pointer';
export const EXISTING_EXPORT_ID = 'export-json';
export const EXISTING_EXPORT_HREF = '#export-json';

export const DEVICE_SWITCH_COPY = {
  warning: 'Guest progress stays on this device and this browser only. A new browser or another device will not have these records unless a grown-up uses the existing Export JSON, then Import JSON on that browser. Guest practice has no cloud sync, no account, and no automatic backup. A grown-up can sign in and pick a family learner to save practice to a family profile instead.',
  pointerLabel: 'Show the existing export'
};

export function focusExistingExport(root = typeof document === 'undefined' ? null : document) {
  const target = root?.querySelector?.(`#${EXISTING_EXPORT_ID}`);
  if (!target) return false;
  if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'nearest' });
  if (typeof target.focus === 'function') target.focus();
  return true;
}
