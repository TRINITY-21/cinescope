/**
 * OMDB client — provides Rotten Tomatoes + IMDB + Metacritic scores in a
 * single call, plus awards strings, content ratings, and other fields that
 * TMDB doesn't expose.
 *
 * Free tier: 1000 requests/day per key.
 * Register: https://www.omdbapi.com/apikey.aspx (email, instant key).
 * Requests are routed through /api/proxy?service=omdb (server-side key).
 * Add OMDB_API_KEY to the server-side env (no VITE_ prefix).
 */

// All OMDB traffic is proxied through /api/proxy so the API key stays server-side.
const cache = new Map();

// Server enforces presence of the key; degrade gracefully (return null) if absent.
export function hasOmdbKey() {
  return true;
}

async function omdbFetch(params) {
  if (cache.has(params)) return cache.get(params);
  try {
    const res = await fetch(`/api/proxy?service=omdb&query=${encodeURIComponent(params)}`);
    if (!res.ok) {
      cache.set(params, null);
      return null;
    }
    const data = await res.json();
    if (data?.Response === 'False') {
      cache.set(params, null);
      return null;
    }
    cache.set(params, data);
    return data;
  } catch {
    cache.set(params, null);
    return null;
  }
}

/** Look up by IMDb id (preferred — most reliable). */
export async function getByImdbId(imdbId) {
  if (!imdbId) return null;
  return omdbFetch(`i=${encodeURIComponent(imdbId)}&plot=short`);
}

/**
 * Parse OMDB's Ratings array into a clean shape:
 *   { imdb: 9.2, rottenTomatoes: 96, metacritic: 87 }
 * Returns null fields when a source isn't available.
 */
export function parseRatings(omdbData) {
  if (!omdbData) return { imdb: null, rottenTomatoes: null, metacritic: null };

  const imdb = omdbData.imdbRating && omdbData.imdbRating !== 'N/A'
    ? Number(omdbData.imdbRating)
    : null;

  let rottenTomatoes = null;
  let metacritic = null;
  for (const r of omdbData.Ratings || []) {
    if (r.Source === 'Rotten Tomatoes') {
      const v = parseInt(r.Value, 10);
      if (!Number.isNaN(v)) rottenTomatoes = v;
    } else if (r.Source === 'Metacritic') {
      const m = r.Value?.split('/')?.[0];
      const v = parseInt(m, 10);
      if (!Number.isNaN(v)) metacritic = v;
    }
  }

  // Metacritic also shows in top-level field on some entries
  if (metacritic === null && omdbData.Metascore && omdbData.Metascore !== 'N/A') {
    metacritic = parseInt(omdbData.Metascore, 10) || null;
  }

  return { imdb, rottenTomatoes, metacritic };
}

/** Returns the awards string (e.g. "Won 16 Primetime Emmys & 161 wins…") or null. */
export function parseAwards(omdbData) {
  if (!omdbData?.Awards || omdbData.Awards === 'N/A') return null;
  return omdbData.Awards;
}
