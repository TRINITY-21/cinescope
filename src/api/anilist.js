/**
 * AniList GraphQL client — completely free, no key, generous rate limits
 * (90 req/min). Best-in-class data for anime: native + English + romaji titles,
 * studio, source material, episode count, season/year, characters, genres,
 * tags with rank, trailer, related/recommendations.
 *
 * Docs: https://anilist.gitbook.io/anilist-apiv2-docs/
 *
 * Use this only when content_type is anime — for everything else TMDB has
 * better Western coverage.
 */

const ANILIST = 'https://graphql.anilist.co';
const cache = new Map();

async function anilistQuery(query, variables = {}) {
  const key = JSON.stringify({ query, variables });
  if (cache.has(key)) return cache.get(key);
  try {
    const res = await fetch(ANILIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) { cache.set(key, null); return null; }
    const data = await res.json();
    cache.set(key, data?.data || null);
    return data?.data || null;
  } catch {
    cache.set(key, null);
    return null;
  }
}

const SEARCH_ANIME = `
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      id
      idMal
      title { romaji english native }
      format
      episodes
      duration
      status
      season seasonYear
      averageScore meanScore
      popularity
      genres
      studios(isMain: true) { nodes { name } }
      coverImage { large extraLarge color }
      bannerImage
      trailer { id site }
      description(asHtml: false)
      siteUrl
    }
  }
`;

const ANIME_BY_IDS = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id idMal
      title { romaji english native }
      format episodes duration status
      season seasonYear averageScore meanScore popularity genres
      studios(isMain: true) { nodes { name } }
      coverImage { large extraLarge color }
      bannerImage
      trailer { id site }
      description(asHtml: false)
      siteUrl
    }
  }
`;

export async function searchAnime(title) {
  if (!title) return null;
  const data = await anilistQuery(SEARCH_ANIME, { search: title });
  return data?.Media || null;
}

export async function getAnimeById(id) {
  if (!id) return null;
  const data = await anilistQuery(ANIME_BY_IDS, { id });
  return data?.Media || null;
}

/** Quick check — does this look like anime? Used to decide whether to call AniList at all. */
export function looksLikeAnime(show) {
  const genres = show?.genres || [];
  const isAnimation = genres.some((g) => String(g).toLowerCase() === 'animation');
  const isJapanese = (show?.language || show?.original_language || '').toLowerCase() === 'japanese';
  return isAnimation && isJapanese;
}
