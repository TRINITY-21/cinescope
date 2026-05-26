/**
 * MusicBrainz client — completely free, no key, no auth.
 * Etiquette: send a User-Agent header (we can't from browser, but they
 * tolerate browser requests). Rate-limit ourselves to ≤1 req/sec via cache.
 *
 * We use it to find a movie's soundtrack release group → composer → cover art.
 *
 * Cover art is served from coverartarchive.org which mirrors MusicBrainz IDs.
 */

const MB_BASE = 'https://musicbrainz.org/ws/2';
const CAA_BASE = 'https://coverartarchive.org';

const cache = new Map();

async function mbFetch(path) {
  if (cache.has(path)) return cache.get(path);
  try {
    const res = await fetch(`${MB_BASE}${path}${path.includes('?') ? '&' : '?'}fmt=json`, {
      headers: { Accept: 'application/json' },
    });
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
 * Find the original motion-picture soundtrack release group for a movie.
 * The naive "first match" approach misses the right album for common titles
 * (a video-game soundtrack named "Dune" ranks above Hans Zimmer's film score),
 * so we re-rank candidates with weighted signals.
 */
export async function findMovieSoundtrack(movieTitle, year) {
  if (!movieTitle) return null;
  const q = `"${movieTitle}" AND primarytype:album AND secondarytype:soundtrack`;
  const data = await mbFetch(`/release-group?query=${encodeURIComponent(q)}&limit=15`);
  const groups = data?.['release-groups'] || [];
  if (!groups.length) return null;

  const normalized = movieTitle.toLowerCase().trim();
  const ranked = groups.map((g) => {
    const title = (g.title || '').toLowerCase();
    let score = Number(g.score || 0);

    // exact title match — strong signal it's THIS movie
    if (title === normalized) score += 200;
    else if (title.startsWith(normalized)) score += 100;
    else if (title.includes(normalized)) score += 40;
    else score -= 80; // doesn't even contain the movie name → unlikely

    // "motion picture" / "original soundtrack" / "OST" — film score idioms
    if (/motion picture|original score|original soundtrack|\bOST\b/i.test(g.title || '')) score += 60;
    if (/film|movie/i.test(g.title || '')) score += 20;
    // penalize game/franchise sequel titles when matching a single-film name
    if (/\b(II|III|IV|V|VI|2|3|4|5|6|2000|2001|2002)\b/.test(g.title || '') && !normalized.match(/\d/)) {
      score -= 70;
    }

    // year proximity if we know it
    if (year && g['first-release-date']) {
      const releaseYear = parseInt(g['first-release-date'].slice(0, 4), 10);
      const movieYear = parseInt(year, 10);
      if (releaseYear === movieYear) score += 80;
      else if (Math.abs(releaseYear - movieYear) <= 1) score += 30;
      else if (Math.abs(releaseYear - movieYear) > 10) score -= 30;
    }

    return { g, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0]?.g;
  if (!best) return null;

  return {
    id: best.id,
    title: best.title,
    artist: best['artist-credit']?.[0]?.name || best['artist-credit']?.[0]?.artist?.name || null,
    artistId: best['artist-credit']?.[0]?.artist?.id || null,
    firstReleased: best['first-release-date'] || null,
    score: best.score,
  };
}

/** Cover Art Archive image for a release-group id (front cover, 500px). */
export function getCoverArtUrl(releaseGroupId) {
  if (!releaseGroupId) return null;
  return `${CAA_BASE}/release-group/${releaseGroupId}/front-500`;
}
