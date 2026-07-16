/** Normalize IMDb id to tt-prefixed form for embed providers. */
export function formatImdbId(imdb) {
  if (!imdb) return null;
  const id = String(imdb).trim();
  if (id.startsWith('tt')) return id;
  if (/^\d+$/.test(id)) return `tt${id}`;
  return id;
}

/**
 * Stream servers — public TMDB/IMDB iframe embed providers.
 *
 * Verified Jul 2026 against Breaking Bad S1E1 (tmdb 1396 / tt0903747):
 * only hosts that returned HTTP 200 with a real player/page body were kept.
 *
 * Removed (dead / empty / user-reported broken):
 * vidsrc.cc, embed.su, vidcore, vidsrc.xyz, vidsrc.icu, moviesapi,
 * smashy, vidjoy, autoembed.cc, vidbinge.
 */
export const STREAM_SERVERS = [
  // Previously solid
  { id: 'videasy', label: 'VidEasy', accepts: ['tmdb'] },
  { id: 'vidsrcme', label: 'VidSrc.me', accepts: ['imdb'] },
  { id: 'autoembed', label: 'AutoEmbed', accepts: ['tmdb', 'imdb'] },
  { id: 'vidvault', label: 'VidVault', accepts: ['tmdb'] },
  { id: 'twembed', label: '2Embed', accepts: ['tmdb', 'imdb'] },
  { id: 'multiembed', label: 'SuperEmbed', accepts: ['imdb'] },
  { id: 'vidlink', label: 'VidLink', accepts: ['tmdb'] },
  { id: 'vidsrcto', label: 'VidSrc.to', accepts: ['tmdb', 'imdb'] },
  { id: 'movies111', label: '111Movies', accepts: ['tmdb'] },
  { id: 'vidfast', label: 'VidFast', accepts: ['tmdb'] },

  // Replacements — probed live (BB S1E1) Jul 2026
  { id: 'vidsrcpm', label: 'VidSrc.pm', accepts: ['tmdb', 'imdb'] },
  { id: 'vidsrcnl', label: 'VidSrc.nl', accepts: ['tmdb', 'imdb'] },
  { id: 'playerx', label: 'PlayerX', accepts: ['tmdb', 'imdb'] },
  { id: 'vidsrcembed', label: 'VidSrc Embed', accepts: ['imdb'] },
  { id: 'vidsrcme2', label: 'VidSrc.me 2', accepts: ['imdb'] },
  { id: 'vidsrcsu', label: 'VidSrc.su', accepts: ['imdb'] },
  { id: 'hydrahd', label: 'HydraHD', accepts: ['tmdb'] },
  { id: 'flicky', label: 'Flicky', accepts: ['tmdb'] },
];

function ids({ imdbId, tmdbId }) {
  return {
    imdb: formatImdbId(imdbId),
    tmdb: tmdbId != null && tmdbId !== '' ? String(tmdbId) : null,
  };
}

function isTv(season, episode) {
  return season != null && episode != null;
}

/** /movie/:id  or  /tv/:id/:s/:e */
function pathEmbed(base, id, season, episode) {
  if (!id) return null;
  if (isTv(season, episode)) return `${base}/tv/${id}/${season}/${episode}`;
  return `${base}/movie/${id}`;
}

function buildVidSrcMeUrl(imdb, season, episode) {
  return pathEmbed('https://vidsrcme.ru/embed', imdb, season, episode);
}

function buildVideasyUrl(tmdb, season, episode) {
  return pathEmbed('https://player.videasy.net', tmdb, season, episode);
}

function buildVidVaultUrl(tmdb, season, episode) {
  return pathEmbed('https://vidvault.ru', tmdb, season, episode);
}

function buildAutoEmbedUrl(tmdb, imdb, season, episode) {
  const kind = tmdb ? 'tmdb' : 'imdb';
  const id = tmdb || imdb;
  if (!id) return null;
  if (isTv(season, episode)) return `https://autoembed.co/tv/${kind}/${id}-${season}-${episode}`;
  return `https://autoembed.co/movie/${kind}/${id}`;
}

function build2EmbedUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://www.2embed.stream/embed', tmdb || imdb, season, episode);
}

function buildMultiEmbedUrl(imdb, season, episode) {
  if (!imdb) return null;
  if (isTv(season, episode)) {
    return `https://multiembed.mov/?video_id=${imdb}&s=${season}&e=${episode}`;
  }
  return `https://multiembed.mov/?video_id=${imdb}`;
}

function buildVidLinkUrl(tmdb, season, episode) {
  return pathEmbed('https://vidlink.pro', tmdb, season, episode);
}

function buildVidSrcToUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://vidsrc.to/embed', tmdb || imdb, season, episode);
}

function build111MoviesUrl(tmdb, season, episode) {
  return pathEmbed('https://111movies.com', tmdb, season, episode);
}

function buildVidFastUrl(tmdb, season, episode) {
  return pathEmbed('https://vidfast.pro', tmdb, season, episode);
}

function buildVidSrcPmUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://vidsrc.pm/embed', tmdb || imdb, season, episode);
}

function buildVidSrcNlUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://vidsrc.nl/embed', tmdb || imdb, season, episode);
}

function buildPlayerXUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://playerx.stream/embed', tmdb || imdb, season, episode);
}

function buildVidSrcEmbedUrl(imdb, season, episode) {
  return pathEmbed('https://vidsrc-embed.ru/embed', imdb, season, episode);
}

function buildVidSrcMe2Url(imdb, season, episode) {
  return pathEmbed('https://vidsrc.me/embed', imdb, season, episode);
}

function buildVidSrcSuUrl(imdb, season, episode) {
  return pathEmbed('https://vidsrc-embed.su/embed', imdb, season, episode);
}

function buildHydraHdUrl(tmdb, season, episode) {
  return pathEmbed('https://hydrahd.ac/embed', tmdb, season, episode);
}

function buildFlickyUrl(tmdb, season, episode) {
  if (!tmdb) return null;
  if (isTv(season, episode)) {
    return `https://flicky.host/embed/tv/?id=${tmdb}/${season}/${episode}`;
  }
  return `https://flicky.host/embed/movie/?id=${tmdb}`;
}

/**
 * Build a stream embed URL for a given server.
 * @returns {string|null}
 */
export function buildStreamEmbedUrl({ server = 'videasy', imdbId, tmdbId, season, episode }) {
  const { imdb, tmdb } = ids({ imdbId, tmdbId });
  switch (server) {
    case 'videasy':
      return buildVideasyUrl(tmdb, season, episode);
    case 'vidsrcme':
      return buildVidSrcMeUrl(imdb, season, episode);
    case 'autoembed':
      return buildAutoEmbedUrl(tmdb, imdb, season, episode);
    case 'vidvault':
      return buildVidVaultUrl(tmdb, season, episode);
    case 'twembed':
      return build2EmbedUrl(tmdb, imdb, season, episode);
    case 'multiembed':
      return buildMultiEmbedUrl(imdb, season, episode);
    case 'vidlink':
      return buildVidLinkUrl(tmdb, season, episode);
    case 'vidsrcto':
      return buildVidSrcToUrl(tmdb, imdb, season, episode);
    case 'movies111':
      return build111MoviesUrl(tmdb, season, episode);
    case 'vidfast':
      return buildVidFastUrl(tmdb, season, episode);
    case 'vidsrcpm':
      return buildVidSrcPmUrl(tmdb, imdb, season, episode);
    case 'vidsrcnl':
      return buildVidSrcNlUrl(tmdb, imdb, season, episode);
    case 'playerx':
      return buildPlayerXUrl(tmdb, imdb, season, episode);
    case 'vidsrcembed':
      return buildVidSrcEmbedUrl(imdb, season, episode);
    case 'vidsrcme2':
      return buildVidSrcMe2Url(imdb, season, episode);
    case 'vidsrcsu':
      return buildVidSrcSuUrl(imdb, season, episode);
    case 'hydrahd':
      return buildHydraHdUrl(tmdb, season, episode);
    case 'flicky':
      return buildFlickyUrl(tmdb, season, episode);
    default:
      return buildVideasyUrl(tmdb, season, episode);
  }
}
