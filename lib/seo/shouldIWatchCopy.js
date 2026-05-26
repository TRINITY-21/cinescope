/**
 * Editorial copy + FAQ for /should-i-watch/:slug pages.
 */

export function getShouldIWatchFaq(kind, title, byngeScore) {
  const kindLabel = kind === 'movie' ? 'movie' : 'TV show';
  const scoreLine =
    byngeScore != null
      ? `The current Bynge Score is ${byngeScore.toFixed(1)} / 10, blending TMDB, IMDb, Rotten Tomatoes, and Metacritic when available.`
      : 'We combine TMDB votes with IMDb, Rotten Tomatoes, and Metacritic when we can match the title.';

  return [
    {
      q: `Should I watch ${title}?`,
      a: `This page gives a straight verdict for ${title} — not a ranked list of alternatives. Read the headline verdict, rating signals, and content notes below, then jump to similar picks if you want options.`,
    },
    {
      q: 'How is the verdict calculated?',
      a: `${scoreLine} Tiered copy on this page maps that score to a clear yes / maybe / skip recommendation. See our methodology on Bynge.`,
    },
    {
      q: `Is ${title} a ${kindLabel}?`,
      a:
        kind === 'movie'
          ? `Yes — we treat ${title} as a film. If you meant a series with a similar name, try searching from Shows or use a TV slug like /should-i-watch/severance.`
          : `Yes — we treat ${title} as a TV series. If you meant a film, try /should-i-watch/inception or browse Movies.`,
    },
    {
      q: 'Are the content warnings official ratings?',
      a: 'No. Notes here are genre- and runtime-based hints from TMDB metadata — not MPAA or TV parental guidance. Check your streaming service for official age ratings before family viewing.',
    },
  ];
}
