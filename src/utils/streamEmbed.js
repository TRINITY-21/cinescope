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
 * usually does. Labels are the real provider names so users learn which
 * hosts work best for their region / browser.
 */
export const STREAM_SERVERS = [
  { id: 'vsembed', label: 'VSEmbed' },
  { id: 'superembed', label: 'SuperEmbed' },
  { id: 'vidsrc', label: 'VidSrc' },
  { id: 'embedsu', label: 'Embed.su' },
  { id: 'autoembed', label: 'AutoEmbed' },
];

function resolveId(videoId, useTmdb) {
  if (videoId == null || videoId === '') return null;
  return useTmdb ? String(videoId) : formatImdbId(videoId) || String(videoId);
}

function buildVsEmbedUrl(id, season, episode) {
  const base = 'https://vsembed.ru/embed';
  if (season != null && episode != null) {
    return `${base}/tv/${id}/${season}/${episode}`;
  }
  return `${base}/movie/${id}`;
}

function buildSuperEmbedUrl(id, useTmdb, season, episode) {
  const params = new URLSearchParams();
  params.set('video_id', id);
  if (useTmdb) params.set('tmdb', '1');
  if (season != null) params.set('s', String(season));
  if (episode != null) params.set('e', String(episode));
  return `https://multiembed.mov/?${params.toString()}`;
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
  server = 'vsembed',
  videoId,
  useTmdb = false,
  season,
  episode,
}) {
  const id = resolveId(videoId, useTmdb);
  if (!id) return null;
  switch (server) {
    case 'superembed':
      return buildSuperEmbedUrl(id, useTmdb, season, episode);
    case 'vidsrc':
      return buildVidSrcUrl(id, season, episode);
    case 'embedsu':
      return buildEmbedSuUrl(id, season, episode);
    case 'autoembed':
      return buildAutoEmbedUrl(id, useTmdb, season, episode);
    case 'vsembed':
    default:
      return buildVsEmbedUrl(id, season, episode);
  }
}
