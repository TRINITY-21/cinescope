/**
 * Genres + countries — the data behind the /genres and /country index pages,
 * the navbar dropdowns, and the /country/:code listing.
 *
 * Genre names match the existing TVMaze-style labels in src/utils/constants.js
 * so a genre chip can link straight to /browse/:genre (the existing TV browse
 * page handles the filter). Descriptions are editorial blurbs.
 *
 * Countries are the top-25 production countries by share of TMDB titles —
 * enough variety without becoming a wall of dead links.
 */

import { GENRES as TVMAZE_GENRES } from '../utils/constants.js';

const GENRE_BLURBS = {
  Drama: 'Character-driven stories that land emotional punches.',
  Comedy: 'Laugh-out-loud, dry wit, or warm and weird.',
  Action: 'High-octane chases, fights, and standoffs.',
  Crime: 'Heists, mobsters, detectives, and the line between.',
  Thriller: 'Tension wound tight enough to hurt.',
  'Science-Fiction': 'Aliens, AI, time, and other realities.',
  Horror: 'Slow-burn dread or full-body scares.',
  Romance: 'Two people, a thousand reasons to root for them.',
  Adventure: 'Journeys, quests, and escapes into the unknown.',
  Fantasy: 'Magic, myth, and the strange.',
  Supernatural: 'Ghosts, demons, and unexplained things.',
  Mystery: 'Whodunits, twists, and slow-revealed secrets.',
  Family: 'Watchable by everyone in the room.',
  Medical: 'Hospitals, scrubs, and high-stakes diagnoses.',
  Legal: 'Courtrooms, plea bargains, and moral grey zones.',
  Anime: 'Japanese animation across every genre.',
  Music: 'Concerts, biopics of musicians, and musicals.',
  History: 'Period pieces and historical reenactments.',
  Espionage: 'Spies, double agents, and slow-burn intrigue.',
};

export const GENRES = TVMAZE_GENRES.map((name) => ({
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  blurb: GENRE_BLURBS[name] || '',
}));

export function findGenreBySlug(slug) {
  return GENRES.find((g) => g.slug === slug.toLowerCase()) || null;
}

export const COUNTRIES = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' },
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
  { code: 'jp', name: 'Japan' },
  { code: 'kr', name: 'South Korea' },
  { code: 'cn', name: 'China' },
  { code: 'in', name: 'India' },
  { code: 'mx', name: 'Mexico' },
  { code: 'br', name: 'Brazil' },
  { code: 'ar', name: 'Argentina' },
  { code: 'ie', name: 'Ireland' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'za', name: 'South Africa' },
  { code: 'se', name: 'Sweden' },
  { code: 'no', name: 'Norway' },
  { code: 'dk', name: 'Denmark' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'pl', name: 'Poland' },
  { code: 'tr', name: 'Turkey' },
  { code: 'ru', name: 'Russia' },
];

export function findCountry(code) {
  return COUNTRIES.find((c) => c.code === code.toLowerCase()) || null;
}
