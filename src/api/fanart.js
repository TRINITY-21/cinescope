/**
 * fanart.tv client — provides HD clear logos (transparent PNG of the actual
 * show/movie wordmark) plus other higher-quality artwork than TMDB exposes.
 *
 * Auth: requires a free personal API key. Register at
 *   https://fanart.tv/get-an-api-key/
 * Requests are routed through /api/proxy?service=fanart (server-side key).
 * Set FANART_API_KEY in the server-side env (no VITE_ prefix).
 *
 * If no key is configured, every function returns null silently so callers
 * can fall back gracefully.
 */

// All fanart.tv traffic is proxied through /api/proxy so the API key stays server-side.
const cache = new Map();

// Server enforces presence of the key; degrade gracefully (return null) if absent.
export function hasFanartKey() {
  return true;
}

async function fanartFetch(path) {
  if (cache.has(path)) return cache.get(path);
  try {
    const res = await fetch(`/api/proxy?service=fanart&path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      cache.set(path, null);
      return null;
    }
    const data = await res.json();
    cache.set(path, data);
    return data;
  } catch {
    cache.set(path, null);
    return null;
  }
}

/** Pick the best art entry — prefers English language, then most-liked. */
function bestEntry(entries) {
  if (!Array.isArray(entries) || !entries.length) return null;
  const sorted = [...entries].sort((a, b) => {
    const aEn = (a.lang || '').toLowerCase() === 'en' ? 1 : 0;
    const bEn = (b.lang || '').toLowerCase() === 'en' ? 1 : 0;
    if (aEn !== bEn) return bEn - aEn;
    return Number(b.likes || 0) - Number(a.likes || 0);
  });
  return sorted[0] || null;
}

/* ------------------------------ Movies --------------------------------- */

/** TMDB id OR IMDb id (tt...) both accepted. */
export async function getMovieFanart(id) {
  if (!id) return null;
  return fanartFetch(`/movies/${id}`);
}

export async function getMovieLogoUrl(id) {
  const data = await getMovieFanart(id);
  return bestEntry(data?.hdmovielogo)?.url || null;
}

export async function getMovieBackgroundUrl(id) {
  const data = await getMovieFanart(id);
  return bestEntry(data?.moviebackground)?.url || null;
}

/* -------------------------------- TV ----------------------------------- */

/** Requires TVDB id (TVMaze exposes it via show.externals.thetvdb). */
export async function getShowFanart(tvdbId) {
  if (!tvdbId) return null;
  return fanartFetch(`/tv/${tvdbId}`);
}

export async function getShowLogoUrl(tvdbId) {
  const data = await getShowFanart(tvdbId);
  return bestEntry(data?.hdtvlogo)?.url || null;
}

export async function getShowBackgroundUrl(tvdbId) {
  const data = await getShowFanart(tvdbId);
  return bestEntry(data?.showbackground)?.url || null;
}
