/**
 * Client helpers for the self-hosted stream pipeline:
 *   /api/stream  → resolve a title to { sources, subtitles }
 *   /api/hls     → proxy a media URL (inject Referer/Origin, fix CORS)
 */

/**
 * Ask our resolver for playable sources.
 * @returns {Promise<{sources: Array, subtitles: Array}>}
 * @throws {Error} with a human-readable message on failure
 */
export async function fetchStreamSources({ type, tmdbId, imdbId, season, episode, signal }) {
  const params = new URLSearchParams({ type: type === 'tv' ? 'tv' : 'movie' });
  if (tmdbId != null && tmdbId !== '') params.set('id', String(tmdbId));
  if (imdbId) params.set('imdb', imdbId);
  if (type === 'tv') {
    params.set('season', String(season));
    params.set('episode', String(episode));
  }

  const res = await fetch(`/api/stream?${params.toString()}`, { signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Resolver failed (${res.status})`);
  }
  return {
    sources: Array.isArray(data.sources) ? data.sources : [],
    subtitles: Array.isArray(data.subtitles) ? data.subtitles : [],
  };
}

/**
 * Turn a resolved source into a URL the <video>/hls.js can actually load.
 * When the source needs custom headers (Referer/Origin), route it through the
 * proxy; otherwise (a source you fully control with open CORS) play it direct.
 */
export function toPlaybackUrl(source) {
  if (!source?.url) return null;
  if (!source.needsProxy && !source.headers) return source.url;

  const ref = source.headers?.Referer || source.headers?.referer || '';
  const origin =
    source.headers?.Origin || source.headers?.origin || (ref ? safeOrigin(ref) : '');

  const qs = new URLSearchParams({ url: source.url });
  if (ref) qs.set('ref', ref);
  if (origin) qs.set('origin', origin);
  return `/api/hls?${qs.toString()}`;
}

function safeOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

/** Pick the best default source: prefer HLS "auto", else highest mp4 quality. */
export function pickBestSource(sources = []) {
  if (!sources.length) return null;
  const hls = sources.find((s) => s.type === 'hls');
  if (hls) return hls;
  const byQuality = [...sources].sort(
    (a, b) => qualityNum(b.quality) - qualityNum(a.quality)
  );
  return byQuality[0];
}

function qualityNum(q) {
  const m = String(q).match(/(\d{3,4})/);
  return m ? Number(m[1]) : 0;
}
