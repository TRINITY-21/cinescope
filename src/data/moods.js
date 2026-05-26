/**
 * Curated movie mood lists — served at /discover/mood/:slug (legacy /mood/:slug redirects).
 * SEO targets searches like "cozy movies", "mind-bending movies", "tearjerkers".
 *
 * To add a mood: copy a block, change the slug + name, fill in tmdbIds.
 * Posters and metadata are fetched live from TMDB so we never have to keep
 * stale data in this file.
 */

export const MOODS = [
  {
    slug: 'cozy',
    name: 'Cozy',
    emoji: '☕',
    tagline: 'Wrap-in-a-blanket, hot-drink, world-feels-okay movies.',
    description:
      'When you need to be warmed, not challenged. Comfort-food cinema — kind characters, soft humor, satisfying endings.',
    tmdbIds: [120467, 194, 346648, 129, 228326, 15039, 122906, 2493, 14160, 316029, 2064, 862, 509, 9377],
    accent: '#d4a056',
  },
  {
    slug: 'intense',
    name: 'Intense',
    emoji: '🔥',
    tagline: 'Edge-of-your-seat, can\'t-look-away thrillers.',
    description:
      'Movies that grip and don\'t let go. Sustained tension, ruthless pacing, payoffs you\'ll think about for days.',
    tmdbIds: [273481, 146233, 6977, 76341, 244786, 97630, 949, 155, 466272, 338766, 388399, 64690, 245891, 1422],
    accent: '#c4553a',
  },
  {
    slug: 'mind-bending',
    name: 'Mind-Bending',
    emoji: '🌀',
    tagline: 'Reality-warping, twist-loaded sci-fi and thrillers.',
    description:
      'Movies that rewire how you think for the next 48 hours. Twists, paradoxes, ambiguity, the kind of films that make Reddit threads.',
    tmdbIds: [27205, 77, 1124, 14337, 577922, 157336, 141, 1018, 143946, 206487, 329865, 38, 300668, 54155],
    accent: '#c4835b',
  },
  {
    slug: 'date-night',
    name: 'Date Night',
    emoji: '🍷',
    tagline: 'Charming, romantic, easy to share with someone you like.',
    description:
      'Movies that work whether it\'s the first date or the fifth year. Sparkly chemistry, sharp dialogue, no homework required.',
    tmdbIds: [479455, 313369, 4951, 509, 19913, 82693, 639, 114, 24021, 6963, 4348, 858],
    accent: '#c4553a',
  },
  {
    slug: 'tearjerker',
    name: 'Tearjerker',
    emoji: '😭',
    tagline: 'Have tissues ready. Emotional gut-punches in the best way.',
    description:
      'Cry it out. Movies that earn their tears — real grief, real love, real catharsis. Not manipulative; just devastatingly honest.',
    tmdbIds: [1402, 10523, 332562, 11036, 354912, 424, 334541, 15392, 587, 10227],
    accent: '#c4835b',
  },
  {
    slug: 'nostalgic-90s',
    name: '90s Nostalgia',
    emoji: '📼',
    tagline: 'Back to the decade that defined modern cinema.',
    description:
      'The films that shaped a generation. From Pulp Fiction to Titanic, from Trainspotting to Toy Story — the 90s were peak movie-watching.',
    tmdbIds: [680, 13, 8587, 329, 769, 603, 597, 550, 862, 278, 857, 627],
    accent: '#d4a056',
  },
];

export function findMood(slug) {
  return MOODS.find((m) => m.slug === slug) || null;
}
