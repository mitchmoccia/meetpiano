export function currentCopyrightYear(now = new Date()) {
  return String(now.getFullYear());
}

export function stampCopyrightYear(root = document, now = new Date()) {
  const year = currentCopyrightYear(now);
  root.querySelectorAll('[data-copyright-year]').forEach((node) => {
    node.textContent = year;
  });
  return year;
}

if (typeof document !== 'undefined') {
  stampCopyrightYear();
}
