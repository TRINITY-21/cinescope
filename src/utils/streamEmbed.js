/** Normalize IMDb id to tt-prefixed form for embed providers. */
export function formatImdbId(imdb) {
  if (!imdb) return null;
  const id = String(imdb).trim();
  if (id.startsWith('tt')) return id;
  if (/^\d+$/.test(id)) return `tt${id}`;
  return id;
}

/**
 * Stream servers — five public TMDB/IMDB embed providers.
 *
 * Each server declares which id types it accepts. buildStreamEmbedUrl uses
 * that to feed the right id and returns null when the title only has the
 * "wrong" id type for that server — the UI then shows a "not available on
 * this server" hint, instead of loading a broken embed.
 *
 * Verified live against movies2watchtv.tv inspect-element URLs:
 *   - vidsrcme.ru/embed/movie/:imdb         (their VidPlay)
 *   - player.videasy.net/movie/:tmdb        (their VidEasy)
 */
export const STREAM_SERVERS = [
  // Reliable on new/long-tail titles — verified live against movies2watchtv.
  { id: 'videasy', label: 'VidEasy', accepts: ['tmdb'] },
  { id: 'vidsrcme', label: 'VidSrc.me', accepts: ['imdb'] },
  // Broader fallbacks, larger but spottier catalogs.
  { id: 'vidsrc', label: 'VidSrc', accepts: ['tmdb', 'imdb'] },
  { id: 'autoembed', label: 'AutoEmbed', accepts: ['tmdb', 'imdb'] },
  { id: 'vidvault', label: 'VidVault', accepts: ['tmdb'] },
];

function buildVidSrcMeUrl(imdbId, season, episode) {
  if (!imdbId) return null;
  const base = 'https://vidsrcme.ru/embed';
  if (season != null && episode != null) {
    return `${base}/tv/${imdbId}/${season}/${episode}`;
  }
  return `${base}/movie/${imdbId}`;
}

function buildVideasyUrl(tmdbId, season, episode) {
  if (!tmdbId) return null;
  const base = 'https://player.videasy.net';
  if (season != null && episode != null) {
    return `${base}/tv/${tmdbId}/${season}/${episode}`;
  }
  return `${base}/movie/${tmdbId}`;
}

function buildVidSrcUrl(tmdbId, imdbId, season, episode) {
  // vidsrc.cc accepts either; prefer TMDB (broader coverage on their end).
  const id = tmdbId || imdbId;
  if (!id) return null;
  const base = 'https://vidsrc.cc/v2/embed';
  if (season != null && episode != null) {
    return `${base}/tv/${id}/${season}/${episode}`;
  }
  return `${base}/movie/${id}`;
}

function buildVidVaultUrl(tmdbId, season, episode) {
  if (!tmdbId) return null;
  const base = 'https://vidvault.ru';
  if (season != null && episode != null) {
    return `${base}/tv/${tmdbId}/${season}/${episode}`;
  }
  return `${base}/movie/${tmdbId}`;
}

function buildAutoEmbedUrl(tmdbId, imdbId, season, episode) {
  // AutoEmbed has separate /tmdb and /imdb paths; prefer TMDB.
  const kind = tmdbId ? 'tmdb' : 'imdb';
  const id = tmdbId || imdbId;
  if (!id) return null;
  if (season != null && episode != null) {
    return `https://autoembed.co/tv/${kind}/${id}-${season}-${episode}`;
  }
  return `https://autoembed.co/movie/${kind}/${id}`;
}

/**
 * Build a stream embed URL for a given server.
 * @param {object} args
 * @param {string} args.server      — server id (see STREAM_SERVERS)
 * @param {string|null} args.imdbId — tt-prefixed IMDB id (or null)
 * @param {string|number|null} args.tmdbId — numeric TMDB id (or null)
 * @param {number} [args.season]
 * @param {number} [args.episode]
 * @returns {string|null} embed URL, or null when this server can't serve this title
 */
export function buildStreamEmbedUrl({ server = 'videasy', imdbId, tmdbId, season, episode }) {
  const imdb = formatImdbId(imdbId);
  const tmdb = tmdbId != null && tmdbId !== '' ? String(tmdbId) : null;
  switch (server) {
    case 'videasy':
      return buildVideasyUrl(tmdb, season, episode);
    case 'vidsrc':
      return buildVidSrcUrl(tmdb, imdb, season, episode);
    case 'vidvault':
      return buildVidVaultUrl(tmdb, season, episode);
    case 'autoembed':
      return buildAutoEmbedUrl(tmdb, imdb, season, episode);
    case 'vidsrcme':
      return buildVidSrcMeUrl(imdb, season, episode);
    default:
      return buildVideasyUrl(tmdb, season, episode);
  }
}
