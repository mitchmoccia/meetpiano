const TITLES = {
  'mary-had-a-little-lamb': 'Mary Had a Little Lamb',
  'ode-to-joy': 'Ode to Joy',
  'twinkle-twinkle': 'Twinkle Twinkle Little Star',
  'hot-cross-buns': 'Hot Cross Buns',
  'row-row-row-your-boat': 'Row, Row, Row Your Boat',
  'jingle-bells': 'Jingle Bells',
  'london-bridge': 'London Bridge',
  'old-macdonald': 'Old MacDonald',
  'happy-birthday': 'Happy Birthday',
  'frere-jacques': 'Are You Sleeping',
  'itsy-bitsy-spider': 'Itsy Bitsy Spider',
  'baa-baa-black-sheep': 'Baa, Baa, Black Sheep',
  'yankee-doodle': 'Yankee Doodle',
  'amazing-grace': 'Amazing Grace',
  'when-the-saints': 'When the Saints Go Marching In',
  'brahms-lullaby': "Brahms' Lullaby",
  'minuet-in-g': 'Minuet in G',
  'camptown-races': 'Camptown Races',
  'oh-susanna': 'Oh! Susanna',
  'skip-to-my-lou': 'Skip to My Lou'
};

const requested = new URLSearchParams(location.search).get('song');
let id = Object.prototype.hasOwnProperty.call(TITLES, requested) ? requested : '';
if (!id) {
  try {
    const prefs = JSON.parse(localStorage.getItem('meetpiano:song-player') || 'null');
    if (prefs && Object.prototype.hasOwnProperty.call(TITLES, prefs.songId)) id = prefs.songId;
  } catch (_) {
    /* Storage can be blocked. The catalog default still applies. */
  }
}
if (!id) id = 'mary-had-a-little-lamb';
const title = TITLES[id];
const heading = document.getElementById('song-title');
if (heading) heading.textContent = title;
document.title = `${title} · Songs · MeetPiano`;
