const header = document.querySelector('.site-header');
const menuButton = header?.querySelector('.nav-menu');
const nav = document.getElementById('site-nav');

function setMenuOpen(open) {
  header.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  menuButton.textContent = open ? 'Close' : 'Menu';
}

function bindMenu() {
  if (!header || !menuButton || !nav) return;
  menuButton.addEventListener('click', () => {
    setMenuOpen(!header.classList.contains('is-open'));
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !header.classList.contains('is-open')) return;
    setMenuOpen(false);
    menuButton.focus();
  });
}

async function showFamilyWhenSignedIn() {
  const links = document.querySelectorAll('[data-account-link]');
  if (!links.length) return;
  try {
    const response = await fetch('/api/auth/get-session', { credentials: 'same-origin', headers: { accept: 'application/json' } });
    if (!response.ok) return;
    const session = await response.json();
    if (!session?.user) return;
    for (const link of links) {
      link.href = '/family';
      link.textContent = 'Family';
    }
  } catch {
    /* Leave Sign in in place when the session check cannot run. */
  }
}

bindMenu();
void showFamilyWhenSignedIn();
