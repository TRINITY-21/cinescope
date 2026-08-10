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
 * Probed Jul 2026 against Breaking Bad S1E1 (tmdb 1396 / tt0903747) and
 * Inception (tmdb 27205 / tt1375666). A host is kept only if it returned
 * HTTP 200 with a real player body AND did not send an X-Frame-Options /
 * frame-ancestors header that forbids embedding.
 *
 * Dropped as dead:
 *   playerx, vidsrc.nl   — domains now serve "this domain is for sale" parking
 *   hydrahd, flicky      — X-Frame-Options: SAMEORIGIN, refuse to be framed
 *   vidsrcme2, vidsrcsu,
 *   vidsrcembed          — byte-identical mirrors of one vsembed.ru backend
 *   vidsrc.cc (HTTP 522), embed.su, vidsrc.xyz, vidsrc.icu,
 *   player.smashy.stream, vidjoy, autoembed.cc, vidbinge
 *
 * Dropped by preference, not because they failed probing — these were live at
 * the time and can be restored from git history if wanted: vidcore, vidzee,
 * anyembed, vidapi, vidsrcme, mapple.
 *
 * Removed by user preference Jul 2026:
 *   vidking, multiembed/SuperEmbed, moviesapi, smashystream, nontongo
 *
 * Added after probing both Inception and Breaking Bad S1E1:
 *   wavembed, vidfast, vidlink, vidsrc.to, primesrc, hexa, 2embed.online
 *
 * Deliberately never added, so nobody re-probes them and thinks they were
 * missed:
 *   veloratv.ru, vidsrc.rip, pstream.org,
 *   2embed.org, netplayz.ru  — all serve the same anti-adblock "Redirecting..."
 *                              interstitial rather than a player
 *   vixsrc.to                — live, but responds identically for real and
 *                              bogus ids so we can't confirm it carries a
 *                              title; catalog also skews Italian audio
 *   vidsrc.win, vidsrc.site  — live but are an ad-loader stack and a Soap2Day
 *                              page, not embeddable players
 *   vidfast.net, mapple.uk   — byte-identical mirrors of hosts already listed
 *
 * Ordered best-first — the picker falls through this list when a saved
 * choice can't render the ids we have, so the head of this list is the
 * effective default. VidNest leads deliberately; keep it first unless you
 * also change the `server` default in buildStreamEmbedUrl below.
 */
export const STREAM_SERVERS = [
  { id: 'vidnest', label: 'VidNest', accepts: ['tmdb'] },
  { id: 'videasy', label: 'VidEasy', accepts: ['tmdb'] },
  { id: 'vidsrcpm', label: 'VidSrc.pm', accepts: ['tmdb', 'imdb'] },
  { id: 'wave', label: 'Wave', accepts: ['tmdb'] },
  { id: 'vidfast', label: 'VidFast', accepts: ['tmdb'] },
  { id: 'vidlink', label: 'VidLink', accepts: ['tmdb'] },
  { id: 'vidsrcto', label: 'VidSrc.to', accepts: ['tmdb', 'imdb'] },
  { id: 'primesrc', label: 'PrimeSrc', accepts: ['tmdb'] },
  { id: 'hexa', label: 'Hexa', accepts: ['tmdb'] },
  { id: 'twembedonline', label: '2Embed Online', accepts: ['tmdb', 'imdb'] },
  { id: 'cinemaos', label: 'CinemaOS', accepts: ['tmdb'] },
  { id: 'vidrock', label: 'VidRock', accepts: ['tmdb'] },
  { id: 'movies111', label: '111Movies', accepts: ['tmdb'] },
  { id: 'twembed', label: '2Embed', accepts: ['tmdb', 'imdb'] },
  { id: 'autoembed', label: 'AutoEmbed', accepts: ['tmdb', 'imdb'] },
  { id: 'vidvault', label: 'VidVault', accepts: ['tmdb'] },
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

function build2EmbedOnlineUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://www.2embed.online/embed', tmdb || imdb, season, episode);
}

function build111MoviesUrl(tmdb, season, episode) {
  return pathEmbed('https://111movies.com', tmdb, season, episode);
}

function buildVidSrcPmUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://vidsrc.pm/embed', tmdb || imdb, season, episode);
}

function buildWaveUrl(tmdb, season, episode) {
  return pathEmbed('https://wavembed.lol', tmdb, season, episode);
}

function buildVidFastUrl(tmdb, season, episode) {
  return pathEmbed('https://vidfast.pro', tmdb, season, episode);
}

function buildVidLinkUrl(tmdb, season, episode) {
  return pathEmbed('https://vidlink.pro', tmdb, season, episode);
}

function buildVidSrcToUrl(tmdb, imdb, season, episode) {
  return pathEmbed('https://vidsrc.to/embed', tmdb || imdb, season, episode);
}

function buildPrimeSrcUrl(tmdb, season, episode) {
  if (!tmdb) return null;
  if (isTv(season, episode)) {
    return `https://primesrc.me/embed/tv?tmdb=${tmdb}&season=${season}&episode=${episode}`;
  }
  return `https://primesrc.me/embed/movie?tmdb=${tmdb}`;
}

function buildHexaUrl(tmdb, season, episode) {
  return pathEmbed('https://hexa.su', tmdb, season, episode);
}

function buildCinemaOsUrl(tmdb, season, episode) {
  if (!tmdb) return null;
  if (isTv(season, episode)) {
    return `https://cinemaos.live/tv/${tmdb}-${season}-${episode}`;
  }
  return `https://cinemaos.live/movie/${tmdb}`;
}

function buildVidRockUrl(tmdb, season, episode) {
  return pathEmbed('https://vidrock.net', tmdb, season, episode);
}

function buildVidNestUrl(tmdb, season, episode) {
  return pathEmbed('https://vidnest.fun', tmdb, season, episode);
}

/**
 * Build a stream embed URL for a given server.
 * @returns {string|null}
 */
export function buildStreamEmbedUrl({ server = 'vidnest', imdbId, tmdbId, season, episode }) {
  const { imdb, tmdb } = ids({ imdbId, tmdbId });
  switch (server) {
    case 'videasy':
      return buildVideasyUrl(tmdb, season, episode);
    case 'autoembed':
      return buildAutoEmbedUrl(tmdb, imdb, season, episode);
    case 'vidvault':
      return buildVidVaultUrl(tmdb, season, episode);
    case 'twembed':
      return build2EmbedUrl(tmdb, imdb, season, episode);
    case 'twembedonline':
      return build2EmbedOnlineUrl(tmdb, imdb, season, episode);
    case 'movies111':
      return build111MoviesUrl(tmdb, season, episode);
    case 'vidsrcpm':
      return buildVidSrcPmUrl(tmdb, imdb, season, episode);
    case 'wave':
      return buildWaveUrl(tmdb, season, episode);
    case 'vidfast':
      return buildVidFastUrl(tmdb, season, episode);
    case 'vidlink':
      return buildVidLinkUrl(tmdb, season, episode);
    case 'vidsrcto':
      return buildVidSrcToUrl(tmdb, imdb, season, episode);
    case 'primesrc':
      return buildPrimeSrcUrl(tmdb, season, episode);
    case 'hexa':
      return buildHexaUrl(tmdb, season, episode);
    case 'cinemaos':
      return buildCinemaOsUrl(tmdb, season, episode);
    case 'vidrock':
      return buildVidRockUrl(tmdb, season, episode);
    case 'vidnest':
      return buildVidNestUrl(tmdb, season, episode);
    default:
      return buildVidNestUrl(tmdb, season, episode);
  }
}
