/** Normalize IMDb id to tt-prefixed form for embed providers. */
export function formatImdbId(imdb) {
  if (!imdb) return null;
  const id = String(imdb).trim();
  if (id.startsWith('tt')) return id;
  if (/^\d+$/.test(id)) return `tt${id}`;
  return id;
}

/**
 * Exposed as neutral "Server 1 / Server 2" — different backends behind each
 * so users get a real fallback when one host doesn't have the title.
 *
 *  Server 1 → vsembed.ru          — what lastflix uses, lightest ad load
 *  Server 2 → multiembed.mov      — SuperEmbed aggregator, exposes many
 *                                    internal server options inside its
 *                                    own player UI (biggest catalog
 *                                    coverage, heavier ads)
 */
export const STREAM_SERVERS = [
  { id: 'vsembed', label: 'Server 1' },
  { id: 'superembed', label: 'Server 2' },
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
    case 'vsembed':
    default:
      return buildVsEmbedUrl(id, season, episode);
  }
}
