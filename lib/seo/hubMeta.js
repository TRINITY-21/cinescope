/**
 * Static SEO copy for marketing / hub routes (edge middleware + reference).
 */

export const TRENDING_WINDOWS = {
  today: {
    title: 'Trending Today — Movies & TV',
    description:
      'What everyone is watching right now — the hottest movies and TV shows trending today on Bynge, ranked live from TMDB.',
  },
  week: {
    title: 'Trending This Week — Movies & TV',
    description:
      'The titles everyone talked about this week. See the top trending movies and TV shows ranked on Bynge.',
  },
  month: {
    title: 'Trending This Month — Movies & TV',
    description:
      'The biggest movies and TV shows of the last 30 days — ranked by popularity on Bynge.',
  },
  year: {
    title: `Trending ${new Date().getFullYear()} — Movies & TV`,
    description: `The year's biggest hits so far — top trending movies and TV in ${new Date().getFullYear()} on Bynge.`,
  },
};

export const HUB_PAGES = {
  discover: {
    title: 'Discover — Browse TV & Movies by Mood',
    description:
      'Pick a mood and length to find shows or movies, or browse curated lists for cozy nights, thrillers, and more on Bynge.',
  },
  'hidden-gems': {
    title: 'Hidden Gems — Underrated Movies',
    description:
      'High-rated movies most people have not seen yet. Underrated picks with 7.5+ scores and small but passionate audiences.',
  },
  trailers: {
    title: 'Movie Trailers — Most-Watched',
    description:
      'The most-watched official movie trailers right now, ranked by popularity. Watch before they hit theaters.',
  },
  compare: {
    title: 'Compare TV Shows — Side by Side',
    description:
      'Pick two series and compare ratings, runtime, network, and genre. Settle the debate on Bynge.',
  },
  'watch-order': {
    title: 'Watch Order Guides — Franchise Binge Orders',
    description:
      'MCU, Star Wars, Lord of the Rings, and more — release order vs chronological order, curated on Bynge.',
  },
  streaming: {
    title: 'Streaming Service Hubs — What to Watch',
    description:
      'Browse the best movies on Netflix, Disney+, Max, Prime Video, Hulu, and more — all in one place.',
  },
};
