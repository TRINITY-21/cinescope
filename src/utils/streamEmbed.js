/** Normalize IMDb id to tt-prefixed form for embed providers. */
export function formatImdbId(imdb) {
  if (!imdb) return null;
  const id = String(imdb).trim();
  if (id.startsWith('tt')) return id;
  if (/^\d+$/.test(id)) return `tt${id}`;
  return id;
}

/**
 * Stream servers — five public TMDB/IMDB embed providers. Order is fallback
 * order: if the user's favorite has no source for the title, the next one
 * usually does. VidSrc.me + VidEasy match the hosts that movies2watchtv
 * uses live (verified via inspect element), so coverage is comparable.
 */
export const STREAM_SERVERS = [
  { id: 'vidsrcme', label: 'VidSrc.me' },
  { id: 'videasy', label: 'VidEasy' },
  { id: 'vidsrc', label: 'VidSrc' },
  { id: 'embedsu', label: 'Embed.su' },
  { id: 'autoembed', label: 'AutoEmbed' },
];

function resolveId(videoId, useTmdb) {
  if (videoId == null || videoId === '') return null;
  return useTmdb ? String(videoId) : formatImdbId(videoId) || String(videoId);
}

function buildVidSrcMeUrl(id, season, episode) {
  const base = 'https://vidsrcme.ru/embed';
  if (season != null && episode != null) {
    return `${base}/tv/${id}/${season}/${episode}`;
  }
  return `${base}/movie/${id}`;
}

function buildVideasyUrl(id, season, episode) {
  const base = 'https://player.videasy.net';
  if (season != null && episode != null) {
    return `${base}/tv/${id}/${season}/${episode}`;
  }
  return `${base}/movie/${id}`;
}

function buildVidSrcUrl(id, season, episode) {
  const base = 'https://vidsrc.cc/v2/embed';
  if (season != null && episode != null) {
    return `${base}/tv/${id}/${season}/${episode}`;
  }
  return `${base}/movie/${id}`;
}

function buildEmbedSuUrl(id, season, episode) {
  const base = 'https://embed.su/embed';
  if (season != null && episode != null) {
    return `${base}/tv/${id}/${season}/${episode}`;
  }
  return `${base}/movie/${id}`;
}

function buildAutoEmbedUrl(id, useTmdb, season, episode) {
  const kind = useTmdb ? 'tmdb' : 'imdb';
  if (season != null && episode != null) {
    return `https://autoembed.co/tv/${kind}/${id}-${season}-${episode}`;
  }
  return `https://autoembed.co/movie/${kind}/${id}`;
}

export function buildStreamEmbedUrl({
  server = 'vidsrcme',
  videoId,
  useTmdb = false,
  season,
  episode,
}) {
  const id = resolveId(videoId, useTmdb);
  if (!id) return null;
  switch (server) {
    case 'videasy':
      return buildVideasyUrl(id, season, episode);
    case 'vidsrc':
      return buildVidSrcUrl(id, season, episode);
    case 'embedsu':
      return buildEmbedSuUrl(id, season, episode);
    case 'autoembed':
      return buildAutoEmbedUrl(id, useTmdb, season, episode);
    case 'vidsrcme':
    default:
      return buildVidSrcMeUrl(id, season, episode);
  }
}
