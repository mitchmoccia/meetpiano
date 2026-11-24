/**
 * Songs the player can open. Analytics reads this same list.
 * A new song belongs here (and in public/songs/catalog), not in the analytics allowlist.
 * Ids must match /^[a-z0-9-]{1,64}$/ or the funnel event is dropped.
 */
export const SONG_CATALOG = [
  { id: 'mary-had-a-little-lamb', file: 'mary-had-a-little-lamb.json', title: 'Mary Had a Little Lamb' },
  { id: 'ode-to-joy', file: 'ode-to-joy.json', title: 'Ode to Joy' },
  { id: 'twinkle-twinkle', file: 'twinkle-twinkle.json', title: 'Twinkle Twinkle Little Star' },
  { id: 'hot-cross-buns', file: 'hot-cross-buns.json', title: 'Hot Cross Buns' },
  { id: 'row-row-row-your-boat', file: 'row-row-row-your-boat.json', title: 'Row, Row, Row Your Boat' },
  { id: 'jingle-bells', file: 'jingle-bells.json', title: 'Jingle Bells' },
  { id: 'london-bridge', file: 'london-bridge.json', title: 'London Bridge' },
  { id: 'old-macdonald', file: 'old-macdonald.json', title: 'Old MacDonald' },
  { id: 'happy-birthday', file: 'happy-birthday.json', title: 'Happy Birthday' },
  { id: 'frere-jacques', file: 'frere-jacques.json', title: 'Are You Sleeping' },
  { id: 'itsy-bitsy-spider', file: 'itsy-bitsy-spider.json', title: 'Itsy Bitsy Spider' },
  { id: 'baa-baa-black-sheep', file: 'baa-baa-black-sheep.json', title: 'Baa, Baa, Black Sheep' },
  { id: 'yankee-doodle', file: 'yankee-doodle.json', title: 'Yankee Doodle' },
  { id: 'amazing-grace', file: 'amazing-grace.json', title: 'Amazing Grace' },
  { id: 'when-the-saints', file: 'when-the-saints.json', title: 'When the Saints Go Marching In' },
  { id: 'brahms-lullaby', file: 'brahms-lullaby.json', title: "Brahms' Lullaby" },
  { id: 'minuet-in-g', file: 'minuet-in-g.json', title: 'Minuet in G' },
  { id: 'camptown-races', file: 'camptown-races.json', title: 'Camptown Races' },
  { id: 'oh-susanna', file: 'oh-susanna.json', title: 'Oh! Susanna' },
  { id: 'skip-to-my-lou', file: 'skip-to-my-lou.json', title: 'Skip to My Lou' }
];
