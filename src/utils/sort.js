/**
 * Project-wide sort for any "you might also like" / recommendation list.
 *
 * Rule (locked everywhere): rating high → low, then year newest → oldest as
 * tiebreaker. Works on TMDB movies, TMDB shows, and TVMaze shows by reading
 * whichever rating + date field is present.
 */
export function sortByRatingThenYear(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const aRating = a?.vote_average ?? a?.rating?.average ?? 0;
    const bRating = b?.vote_average ?? b?.rating?.average ?? 0;
    if (aRating !== bRating) return bRating - aRating;
    const aYear = String(a?.release_date || a?.first_air_date || a?.premiered || '').slice(0, 4);
    const bYear = String(b?.release_date || b?.first_air_date || b?.premiered || '').slice(0, 4);
    return bYear.localeCompare(aYear);
  });
}
