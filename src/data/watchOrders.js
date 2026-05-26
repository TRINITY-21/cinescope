/**
 * Curated franchise watch-order guides.
 *
 * Each franchise lists its entries in BOTH release order (what came out when)
 * and chronological order (in-universe timeline). For franchises where they're
 * identical we omit chronological order entirely.
 *
 * Movie tmdbId is required — links route to /movie/:id.
 * Show id (TVMaze) is optional — links route to /show/:id.
 *
 * To add a new franchise: copy an existing entry, change the slug, fill in
 * title + description + entries. Routes /watch-order/:slug + sitemap pick it
 * up automatically.
 */

export const WATCH_ORDERS = [
  {
    slug: 'star-wars',
    title: 'Star Wars',
    tagline: 'A long time ago in a galaxy far, far away…',
    description:
      'There are two ways to watch the Skywalker Saga: in the order George Lucas released them, or in the chronological order events unfold in-universe. Both are valid — start with release order if it\'s your first time, then revisit in chronological order.',
    entries: [
      { type: 'movie', tmdbId: 11, title: 'Star Wars: A New Hope', year: 1977, release: 1, chrono: 4 },
      { type: 'movie', tmdbId: 1891, title: 'The Empire Strikes Back', year: 1980, release: 2, chrono: 5 },
      { type: 'movie', tmdbId: 1892, title: 'Return of the Jedi', year: 1983, release: 3, chrono: 6 },
      { type: 'movie', tmdbId: 1893, title: 'The Phantom Menace', year: 1999, release: 4, chrono: 1 },
      { type: 'movie', tmdbId: 1894, title: 'Attack of the Clones', year: 2002, release: 5, chrono: 2 },
      { type: 'movie', tmdbId: 1895, title: 'Revenge of the Sith', year: 2005, release: 6, chrono: 3 },
      { type: 'movie', tmdbId: 140607, title: 'The Force Awakens', year: 2015, release: 7, chrono: 7 },
      { type: 'movie', tmdbId: 181808, title: 'The Last Jedi', year: 2017, release: 8, chrono: 8 },
      { type: 'movie', tmdbId: 181812, title: 'The Rise of Skywalker', year: 2019, release: 9, chrono: 9 },
      { type: 'movie', tmdbId: 330459, title: 'Rogue One', year: 2016, release: 10, chrono: 3.5, note: 'Set just before A New Hope' },
      { type: 'movie', tmdbId: 348350, title: 'Solo: A Star Wars Story', year: 2018, release: 11, chrono: 2.5 },
    ],
    related: ['mcu', 'lord-of-the-rings'],
    faq: [
      {
        q: 'What order should I watch Star Wars in for the first time?',
        a: 'Release order — start with A New Hope (1977). It preserves the original surprises (especially the reveal in The Empire Strikes Back) that chronological order spoils outright.',
      },
      {
        q: 'Where does Rogue One fit in?',
        a: 'Chronologically it sits just before A New Hope — Rogue One ends literally minutes before Episode IV begins. Most fans watch it after seeing the original trilogy at least once.',
      },
      {
        q: 'Is the "Machete Order" still recommended?',
        a: 'It dropped the prequels except for Attack of the Clones and Revenge of the Sith. Cleaner than chronological for newcomers, but it predates the sequel trilogy. Modern equivalent: release order, skip Phantom Menace on first watch.',
      },
      {
        q: 'Do I need to watch the Disney+ shows (Mandalorian, Andor, etc.) too?',
        a: 'Not to follow the Skywalker Saga. Andor and Rogue One pair perfectly though, and The Mandalorian sits between Return of the Jedi and The Force Awakens if you want the full canon.',
      },
    ],
  },
  {
    slug: 'mcu',
    title: 'Marvel Cinematic Universe',
    tagline: 'The Infinity Saga and beyond.',
    description:
      'The MCU is famously interconnected — release order is how most fans experience it, building reveal-by-reveal. The chronological order moves Captain America: The First Avenger to the start, since it\'s set in WWII.',
    entries: [
      { type: 'movie', tmdbId: 1726, title: 'Iron Man', year: 2008, release: 1, chrono: 3 },
      { type: 'movie', tmdbId: 1724, title: 'The Incredible Hulk', year: 2008, release: 2, chrono: 4 },
      { type: 'movie', tmdbId: 10138, title: 'Iron Man 2', year: 2010, release: 3, chrono: 5 },
      { type: 'movie', tmdbId: 10195, title: 'Thor', year: 2011, release: 4, chrono: 6 },
      { type: 'movie', tmdbId: 1771, title: 'Captain America: The First Avenger', year: 2011, release: 5, chrono: 1 },
      { type: 'movie', tmdbId: 24428, title: 'The Avengers', year: 2012, release: 6, chrono: 7 },
      { type: 'movie', tmdbId: 68721, title: 'Iron Man 3', year: 2013, release: 7, chrono: 8 },
      { type: 'movie', tmdbId: 76338, title: 'Thor: The Dark World', year: 2013, release: 8, chrono: 9 },
      { type: 'movie', tmdbId: 100402, title: 'Captain America: The Winter Soldier', year: 2014, release: 9, chrono: 10 },
      { type: 'movie', tmdbId: 118340, title: 'Guardians of the Galaxy', year: 2014, release: 10, chrono: 11 },
      { type: 'movie', tmdbId: 99861, title: 'Avengers: Age of Ultron', year: 2015, release: 11, chrono: 13 },
      { type: 'movie', tmdbId: 102899, title: 'Ant-Man', year: 2015, release: 12, chrono: 14 },
      { type: 'movie', tmdbId: 271110, title: 'Captain America: Civil War', year: 2016, release: 13, chrono: 15 },
      { type: 'movie', tmdbId: 284052, title: 'Doctor Strange', year: 2016, release: 14, chrono: 16 },
      { type: 'movie', tmdbId: 283995, title: 'Guardians of the Galaxy Vol. 2', year: 2017, release: 15, chrono: 12 },
      { type: 'movie', tmdbId: 315635, title: 'Spider-Man: Homecoming', year: 2017, release: 16, chrono: 17 },
      { type: 'movie', tmdbId: 284053, title: 'Thor: Ragnarok', year: 2017, release: 17, chrono: 18 },
      { type: 'movie', tmdbId: 284054, title: 'Black Panther', year: 2018, release: 18, chrono: 19 },
      { type: 'movie', tmdbId: 299536, title: 'Avengers: Infinity War', year: 2018, release: 19, chrono: 20 },
      { type: 'movie', tmdbId: 363088, title: 'Ant-Man and the Wasp', year: 2018, release: 20, chrono: 21 },
      { type: 'movie', tmdbId: 299537, title: 'Captain Marvel', year: 2019, release: 21, chrono: 2 },
      { type: 'movie', tmdbId: 299534, title: 'Avengers: Endgame', year: 2019, release: 22, chrono: 22 },
    ],
    related: ['star-wars', 'dceu'],
    faq: [
      {
        q: 'What order should I watch the MCU in?',
        a: 'Release order is overwhelmingly recommended. The MCU was built reveal-by-reveal — chronological order spoils Captain Marvel and breaks the Phase 1–3 arc structure.',
      },
      {
        q: 'How long does it take to watch the entire MCU?',
        a: 'The Infinity Saga (Phases 1–3) is roughly 50 hours of film. The full MCU including post-Endgame is 60+ hours of film plus 100+ hours of Disney+ shows.',
      },
      {
        q: 'Can I skip any MCU movies?',
        a: 'The Incredible Hulk and Thor: The Dark World are the most-skipped without losing main-arc context. Iron Man 2 and Ant-Man are skippable on a rewatch but contain setups paid off later.',
      },
      {
        q: 'Do I need to watch the Disney+ shows?',
        a: 'For the Infinity Saga: no. For Phase 4 onward: WandaVision, Loki, and Hawkeye are setups for movies that follow them. Skip them and Multiverse of Madness loses some emotional weight.',
      },
    ],
  },
  {
    slug: 'lord-of-the-rings',
    title: 'The Lord of the Rings & The Hobbit',
    tagline: 'Middle-earth, beginning to end.',
    description:
      'Peter Jackson\'s two trilogies tell one continuous story. Release order is how the world experienced them; chronological starts with The Hobbit (set ~60 years before The Fellowship of the Ring).',
    entries: [
      { type: 'movie', tmdbId: 120, title: 'The Fellowship of the Ring', year: 2001, release: 1, chrono: 4 },
      { type: 'movie', tmdbId: 121, title: 'The Two Towers', year: 2002, release: 2, chrono: 5 },
      { type: 'movie', tmdbId: 122, title: 'The Return of the King', year: 2003, release: 3, chrono: 6 },
      { type: 'movie', tmdbId: 49051, title: 'The Hobbit: An Unexpected Journey', year: 2012, release: 4, chrono: 1 },
      { type: 'movie', tmdbId: 57158, title: 'The Hobbit: The Desolation of Smaug', year: 2013, release: 5, chrono: 2 },
      { type: 'movie', tmdbId: 122917, title: 'The Hobbit: The Battle of the Five Armies', year: 2014, release: 6, chrono: 3 },
    ],
    related: ['harry-potter', 'star-wars'],
  },
  {
    slug: 'harry-potter',
    title: 'Harry Potter & Fantastic Beasts',
    tagline: 'Eight Hogwarts years, plus a prequel.',
    description:
      'The eight mainline Harry Potter films are linear — no decision needed. Fantastic Beasts is a prequel set decades earlier; watch chronologically if you want to follow the timeline, or save for last if you prefer release order.',
    entries: [
      { type: 'movie', tmdbId: 671, title: 'Harry Potter and the Philosopher\'s Stone', year: 2001, release: 1, chrono: 8 },
      { type: 'movie', tmdbId: 672, title: 'Harry Potter and the Chamber of Secrets', year: 2002, release: 2, chrono: 9 },
      { type: 'movie', tmdbId: 673, title: 'Harry Potter and the Prisoner of Azkaban', year: 2004, release: 3, chrono: 10 },
      { type: 'movie', tmdbId: 674, title: 'Harry Potter and the Goblet of Fire', year: 2005, release: 4, chrono: 11 },
      { type: 'movie', tmdbId: 675, title: 'Harry Potter and the Order of the Phoenix', year: 2007, release: 5, chrono: 12 },
      { type: 'movie', tmdbId: 767, title: 'Harry Potter and the Half-Blood Prince', year: 2009, release: 6, chrono: 13 },
      { type: 'movie', tmdbId: 12444, title: 'Deathly Hallows: Part 1', year: 2010, release: 7, chrono: 14 },
      { type: 'movie', tmdbId: 12445, title: 'Deathly Hallows: Part 2', year: 2011, release: 8, chrono: 15 },
      { type: 'movie', tmdbId: 259316, title: 'Fantastic Beasts and Where to Find Them', year: 2016, release: 9, chrono: 1 },
      { type: 'movie', tmdbId: 338952, title: 'The Crimes of Grindelwald', year: 2018, release: 10, chrono: 2 },
      { type: 'movie', tmdbId: 338953, title: 'The Secrets of Dumbledore', year: 2022, release: 11, chrono: 3 },
    ],
    related: ['lord-of-the-rings', 'narnia'],
  },
  {
    slug: 'fast-and-furious',
    title: 'Fast & Furious',
    tagline: 'A franchise that became a family.',
    description:
      'Release order works almost perfectly except for Tokyo Drift — released third but chronologically slotted between Fast 6 and Furious 7. Most fans now watch by chrono order to keep Han\'s arc intact.',
    entries: [
      { type: 'movie', tmdbId: 9799, title: 'The Fast and the Furious', year: 2001, release: 1, chrono: 1 },
      { type: 'movie', tmdbId: 584, title: '2 Fast 2 Furious', year: 2003, release: 2, chrono: 2 },
      { type: 'movie', tmdbId: 9615, title: 'The Fast and the Furious: Tokyo Drift', year: 2006, release: 3, chrono: 7 },
      { type: 'movie', tmdbId: 13804, title: 'Fast & Furious', year: 2009, release: 4, chrono: 3 },
      { type: 'movie', tmdbId: 51497, title: 'Fast Five', year: 2011, release: 5, chrono: 4 },
      { type: 'movie', tmdbId: 82992, title: 'Fast & Furious 6', year: 2013, release: 6, chrono: 5 },
      { type: 'movie', tmdbId: 168259, title: 'Furious 7', year: 2015, release: 7, chrono: 8 },
      { type: 'movie', tmdbId: 337339, title: 'The Fate of the Furious', year: 2017, release: 8, chrono: 9 },
      { type: 'movie', tmdbId: 384018, title: 'Fast & Furious Presents: Hobbs & Shaw', year: 2019, release: 9, chrono: 9.5 },
      { type: 'movie', tmdbId: 385128, title: 'F9', year: 2021, release: 10, chrono: 10 },
      { type: 'movie', tmdbId: 385687, title: 'Fast X', year: 2023, release: 11, chrono: 11 },
    ],
    related: ['mission-impossible', 'john-wick'],
  },
  {
    slug: 'mission-impossible',
    title: 'Mission: Impossible',
    tagline: 'Your mission, should you choose to accept it…',
    description:
      'Strict release order. Each film stands largely alone — but Fallout (#6) and the Dead Reckoning two-parter pay off two decades of buildup, so watching from #1 rewards.',
    entries: [
      { type: 'movie', tmdbId: 954, title: 'Mission: Impossible', year: 1996, release: 1 },
      { type: 'movie', tmdbId: 955, title: 'Mission: Impossible II', year: 2000, release: 2 },
      { type: 'movie', tmdbId: 956, title: 'Mission: Impossible III', year: 2006, release: 3 },
      { type: 'movie', tmdbId: 56292, title: 'Ghost Protocol', year: 2011, release: 4 },
      { type: 'movie', tmdbId: 177677, title: 'Rogue Nation', year: 2015, release: 5 },
      { type: 'movie', tmdbId: 353081, title: 'Fallout', year: 2018, release: 6 },
      { type: 'movie', tmdbId: 575264, title: 'Dead Reckoning Part One', year: 2023, release: 7 },
    ],
    related: ['james-bond', 'john-wick'],
  },
  {
    slug: 'john-wick',
    title: 'John Wick',
    tagline: 'You wanted him back. You got him.',
    description:
      'Linear chronology, watch in release order. Ballerina is a 2025 spinoff set between Chapters 3 and 4 — slot it accordingly if you\'re catching up after a rewatch.',
    entries: [
      { type: 'movie', tmdbId: 245891, title: 'John Wick', year: 2014, release: 1 },
      { type: 'movie', tmdbId: 324552, title: 'John Wick: Chapter 2', year: 2017, release: 2 },
      { type: 'movie', tmdbId: 458156, title: 'Chapter 3 – Parabellum', year: 2019, release: 3 },
      { type: 'movie', tmdbId: 603692, title: 'Chapter 4', year: 2023, release: 4 },
    ],
    related: ['mission-impossible', 'fast-and-furious'],
  },
  {
    slug: 'james-bond-craig',
    title: 'James Bond (Daniel Craig era)',
    tagline: 'The first Bond films told as one continuous story.',
    description:
      'Craig\'s five films are unique in the Bond canon: they form a single connected arc with character growth across all five. Watch in release order — it\'s the only way the ending lands.',
    entries: [
      { type: 'movie', tmdbId: 36557, title: 'Casino Royale', year: 2006, release: 1 },
      { type: 'movie', tmdbId: 10764, title: 'Quantum of Solace', year: 2008, release: 2 },
      { type: 'movie', tmdbId: 37724, title: 'Skyfall', year: 2012, release: 3 },
      { type: 'movie', tmdbId: 206647, title: 'Spectre', year: 2015, release: 4 },
      { type: 'movie', tmdbId: 370172, title: 'No Time to Die', year: 2021, release: 5 },
    ],
    related: ['mission-impossible'],
  },
  {
    slug: 'planet-of-the-apes',
    title: 'Planet of the Apes (modern)',
    tagline: 'The Caesar trilogy and beyond.',
    description:
      'The Wyatt/Reeves reboot trilogy plus Kingdom is a complete arc. Skip the 2001 Tim Burton remake — different continuity. Original 1968 Apes is a separate timeline entirely.',
    entries: [
      { type: 'movie', tmdbId: 61791, title: 'Rise of the Planet of the Apes', year: 2011, release: 1 },
      { type: 'movie', tmdbId: 119450, title: 'Dawn of the Planet of the Apes', year: 2014, release: 2 },
      { type: 'movie', tmdbId: 281338, title: 'War for the Planet of the Apes', year: 2017, release: 3 },
      { type: 'movie', tmdbId: 653346, title: 'Kingdom of the Planet of the Apes', year: 2024, release: 4 },
    ],
    related: ['dune', 'star-wars'],
  },
  {
    slug: 'shrek',
    title: 'Shrek',
    tagline: 'What are you doin\' in my swamp?',
    description:
      'Release order is chronological. The Puss in Boots spinoffs sit before and during the main saga — watch Puss in Boots (2011) before Shrek 4, and The Last Wish anytime after.',
    entries: [
      { type: 'movie', tmdbId: 808, title: 'Shrek', year: 2001, release: 1 },
      { type: 'movie', tmdbId: 809, title: 'Shrek 2', year: 2004, release: 2 },
      { type: 'movie', tmdbId: 810, title: 'Shrek the Third', year: 2007, release: 3 },
      { type: 'movie', tmdbId: 10192, title: 'Shrek Forever After', year: 2010, release: 4 },
      { type: 'movie', tmdbId: 49444, title: 'Puss in Boots', year: 2011, release: 5 },
      { type: 'movie', tmdbId: 315162, title: 'Puss in Boots: The Last Wish', year: 2022, release: 6 },
    ],
    related: ['toy-story'],
  },
  {
    slug: 'toy-story',
    title: 'Toy Story',
    tagline: 'You\'ve got a friend in me.',
    description:
      'Watch in release order. The films are chronological and span 25 in-story years (Andy growing up). Tip: Toy Story 4 functions as an epilogue — beautiful but optional after Toy Story 3\'s definitive ending.',
    entries: [
      { type: 'movie', tmdbId: 862, title: 'Toy Story', year: 1995, release: 1 },
      { type: 'movie', tmdbId: 863, title: 'Toy Story 2', year: 1999, release: 2 },
      { type: 'movie', tmdbId: 10193, title: 'Toy Story 3', year: 2010, release: 3 },
      { type: 'movie', tmdbId: 301528, title: 'Toy Story 4', year: 2019, release: 4 },
    ],
    related: ['shrek'],
  },
  {
    slug: 'dune',
    title: 'Dune',
    tagline: 'Dreams are messages from the deep.',
    description:
      'Denis Villeneuve\'s two-parter is one story split in half — watch back-to-back if possible. The 1984 David Lynch adaptation is a separate, very different version (and famously divisive).',
    entries: [
      { type: 'movie', tmdbId: 438631, title: 'Dune: Part One', year: 2021, release: 1 },
      { type: 'movie', tmdbId: 693134, title: 'Dune: Part Two', year: 2024, release: 2 },
    ],
    related: ['lord-of-the-rings', 'planet-of-the-apes'],
  },
];

export function getWatchOrder(slug) {
  return WATCH_ORDERS.find((w) => w.slug === slug) || null;
}

export function listWatchOrders() {
  return WATCH_ORDERS.map(({ slug, title, tagline, entries }) => ({
    slug,
    title,
    tagline,
    count: entries.length,
  }));
}

/** Sort entries by release order (default) or chronological order. */
export function sortEntries(entries, mode = 'release') {
  const key = mode === 'chronological' ? 'chrono' : 'release';
  return [...entries].sort((a, b) => {
    const av = a[key] ?? a.release ?? 0;
    const bv = b[key] ?? b.release ?? 0;
    return av - bv;
  });
}

/** Does this franchise have meaningfully different chronological + release orderings? */
export function hasChronologicalOrder(franchise) {
  if (!franchise?.entries?.length) return false;
  const releaseSorted = sortEntries(franchise.entries, 'release').map((e) => e.tmdbId);
  const chronoSorted = sortEntries(franchise.entries, 'chronological').map((e) => e.tmdbId);
  return releaseSorted.join(',') !== chronoSorted.join(',');
}
