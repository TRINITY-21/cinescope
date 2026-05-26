/**
 * Bynge Score — a single 0-10 "should I watch this tonight?" metric.
 *
 * Combines whatever signals we have for a title into one number:
 *   - TMDB rating (vote_average) — weighted heaviest because it's almost
 *     always present, with a small confidence penalty when vote_count is low.
 *   - OMDB IMDb rating — second-most reliable critic signal when available.
 *   - Rotten Tomatoes critic score (%) — converted to 0-10.
 *   - Metacritic (0-100) — converted to 0-10.
 *   - Freshness boost — small bump for recent + well-rated titles, since
 *     "watch tonight" matters more than "watch this all-time classic".
 *   - Fanart presence — tiny cultural-relevance bump (real wordmarks only
 *     get made for shows people care about).
 *
 * The result is clamped to [0.0, 10.0] and rounded to 1 decimal.
 *
 * Inputs are forgiving: pass whatever subset you have. A title with only
 * TMDB will still get a real score; more signals just sharpen it.
 *
 * @param {object} args
 * @param {number} [args.tmdbRating]       0-10
 * @param {number} [args.tmdbVotes]        vote count (lifts confidence)
 * @param {number} [args.imdbRating]       0-10 (from OMDB)
 * @param {number} [args.imdbVotes]        IMDb vote count
 * @param {number} [args.rottenTomatoes]   0-100 critics %
 * @param {number} [args.metacritic]       0-100 metascore
 * @param {string} [args.releaseDate]      YYYY-MM-DD or YYYY
 * @param {boolean} [args.hasFanart]       fanart.tv logo or backdrop present
 * @returns {number|null} 0.0-10.0 or null if no signals at all.
 */
export function computeByngeScore({
  tmdbRating,
  tmdbVotes,
  imdbRating,
  imdbVotes,
  rottenTomatoes,
  metacritic,
  releaseDate,
  hasFanart,
} = {}) {
  const parts = [];

  if (tmdbRating > 0) {
    // Confidence factor: 1.0 at 1000+ votes, scales down to ~0.85 below 100.
    const confidence = Math.min(1, 0.85 + Math.log10(Math.max(1, (tmdbVotes || 0) + 1)) * 0.05);
    parts.push({ value: tmdbRating, weight: 0.4 * confidence });
  }

  if (imdbRating > 0) {
    const confidence = Math.min(1, 0.85 + Math.log10(Math.max(1, (imdbVotes || 0) + 1)) * 0.05);
    parts.push({ value: imdbRating, weight: 0.3 * confidence });
  }

  if (rottenTomatoes > 0) {
    parts.push({ value: rottenTomatoes / 10, weight: 0.15 });
  }

  if (metacritic > 0) {
    parts.push({ value: metacritic / 10, weight: 0.1 });
  }

  if (!parts.length) return null;

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  let base = parts.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;

  // Freshness boost — recent + already-good titles get nudged up.
  const year = parseInt(String(releaseDate || '').slice(0, 4), 10);
  const currentYear = new Date().getFullYear();
  if (Number.isFinite(year) && year && base >= 6.5) {
    const ageYears = currentYear - year;
    if (ageYears <= 1) base += 0.25;
    else if (ageYears <= 3) base += 0.15;
  }

  // Cultural relevance bump — fanart logos/backdrops only get made for shows
  // that people actually care about.
  if (hasFanart && base >= 6) base += 0.1;

  return Math.max(0, Math.min(10, Math.round(base * 10) / 10));
}

/** What badge color a Bynge Score should use. */
export function byngeScoreTier(score) {
  if (score == null) return 'unknown';
  if (score >= 8.5) return 'godlike';
  if (score >= 7.5) return 'great';
  if (score >= 6.5) return 'good';
  if (score >= 5) return 'okay';
  return 'skip';
}

/** Human label for a Bynge Score tier. */
export function byngeScoreLabel(score) {
  switch (byngeScoreTier(score)) {
    case 'godlike': return 'Must-watch';
    case 'great': return 'Highly rated';
    case 'good': return 'Worth your night';
    case 'okay': return 'Decent pick';
    case 'skip': return 'Mixed reviews';
    default: return '';
  }
}
