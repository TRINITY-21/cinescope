import { endpoints } from '../api/endpoints';
import { getTvExternalIds } from '../api/tmdb';
import { fetchApi } from '../api/tvmaze';

const TVMAZE_LOOKUP = 'https://api.tvmaze.com/lookup/shows';

/**
 * Map a TMDB trending TV row to our TVMaze /show/:id route.
 * TMDB ids are not valid on ShowPage — we bridge via IMDB or title search.
 */
export async function resolveTvmazeShowHref(tmdbTvItem) {
  if (!tmdbTvItem?.id) return null;

  try {
    const ext = await getTvExternalIds(tmdbTvItem.id);
    if (ext?.imdb_id) {
      const byImdb = await fetchApi(`${TVMAZE_LOOKUP}?imdb=${ext.imdb_id}`);
      if (byImdb?.id) return `/show/${byImdb.id}`;
    }
    if (ext?.tvdb_id) {
      const byTvdb = await fetchApi(`${TVMAZE_LOOKUP}?thetvdb=${ext.tvdb_id}`);
      if (byTvdb?.id) return `/show/${byTvdb.id}`;
    }
  } catch {
    /* fall through to name search */
  }

  try {
    const byName = await fetchApi(endpoints.singleSearch(tmdbTvItem.name));
    if (byName?.id) return `/show/${byName.id}`;
  } catch {
    /* unresolved */
  }

  return null;
}

export async function enrichTrendingHrefs(items) {
  return Promise.all(
    items.map(async (item) => {
      if (item.media_type !== 'tv') return item;
      const href = await resolveTvmazeShowHref(item);
      return href ? { ...item, _href: href } : item;
    }),
  );
}

export function hrefForTrendingItem(item) {
  if (item._href) return item._href;
  if (item.media_type === 'person') return `/tmdb-person/${item.id}`;
  if (item.media_type === 'movie' || item.title) return `/movie/${item.id}`;
  if (item.media_type === 'tv') return null;
  return `/movie/${item.id}`;
}

export function kindForTrendingItem(item) {
  if (item.media_type === 'person') return 'Person';
  if (item.media_type === 'movie' || item.title) return 'Movie';
  return 'TV';
}
