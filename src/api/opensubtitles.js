/**
 * OpenSubtitles API client — free with email registration.
 * Get a key at: https://www.opensubtitles.com/en/consumers
 * Requests are routed through /api/proxy?service=opensubtitles (server-side key).
 * Set OPENSUBTITLES_API_KEY in the server-side env (no VITE_ prefix).
 *
 * Free tier: 200 downloads / day per user. Search is unmetered.
 * The free key works for /api/v1/subtitles search; downloading the actual
 * .srt requires a logged-in user account (skip download flow for now, just
 * link to the OpenSubtitles page where users can grab the file themselves).
 *
 * Docs: https://opensubtitles.stoplight.io/docs/opensubtitles-api/
 */

// All OpenSubtitles traffic is proxied through /api/proxy so the API key stays server-side.
const cache = new Map();

// Server enforces presence of the key; degrade gracefully (return null) if absent.
export function hasOpenSubtitlesKey() {
  return true;
}

async function osFetch(path) {
  if (cache.has(path)) return cache.get(path);
  try {
    const res = await fetch(`/api/proxy?service=opensubtitles&path=${encodeURIComponent(path)}`);
    if (!res.ok) { cache.set(path, null); return null; }
    const data = await res.json();
    cache.set(path, data);
    return data;
  } catch {
    cache.set(path, null);
    return null;
  }
}

/**
 * Search subtitles for a TV episode or movie.
 *   For movies: pass { imdbId }   →  /subtitles?imdb_id=...
 *   For TV:     pass { imdbId, season, episode }
 *   Optional: { languages: 'en,es,fr' }
 *
 * Returns up to ~20 candidate subtitle entries, grouped by language.
 */
export async function searchSubtitles({ imdbId, season, episode, languages = 'en' }) {
  if (!imdbId) return [];
  const cleanId = String(imdbId).replace(/^tt/i, '');
  const params = new URLSearchParams({
    imdb_id: cleanId,
    languages,
    order_by: 'download_count',
  });
  if (season != null) params.set('season_number', String(season));
  if (episode != null) params.set('episode_number', String(episode));

  const data = await osFetch(`/subtitles?${params}`);
  return data?.data || [];
}

/** Group results by language so the UI can show a language picker. */
export function groupByLanguage(results) {
  const groups = new Map();
  for (const r of results) {
    const lang = r.attributes?.language || 'unknown';
    if (!groups.has(lang)) groups.set(lang, []);
    groups.get(lang).push(r);
  }
  return groups;
}

/** Generate a public OpenSubtitles page URL for browsing/downloading. */
export function getOpenSubtitlesUrl({ imdbId, season, episode, language = 'en' }) {
  if (!imdbId) return null;
  const cleanId = String(imdbId).replace(/^tt/i, '');
  if (season != null && episode != null) {
    return `https://www.opensubtitles.com/en/subtitles?type=episode&parent_imdb_id=${cleanId}&season_number=${season}&episode_number=${episode}&languages=${language}`;
  }
  return `https://www.opensubtitles.com/en/subtitles?type=movie&imdb_id=${cleanId}&languages=${language}`;
}
