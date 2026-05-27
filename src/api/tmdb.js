// All TMDB traffic is proxied through /api/proxy so the API key stays server-side.
const tmdbCache = new Map();

async function tmdbFetch(path) {
  const cacheKey = path;
  if (tmdbCache.has(cacheKey)) {
    const cached = tmdbCache.get(cacheKey);
    if (Date.now() - cached.time < 10 * 60 * 1000) return cached.data;
  }

  try {
    const res = await fetch(`/api/proxy?service=tmdb&path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = await res.json();
    tmdbCache.set(cacheKey, { data, time: Date.now() });
    return data;
  } catch {
    return null;
  }
}

// Find a TV show on TMDB using an IMDB ID
export async function findShowByImdb(imdbId) {
  if (!imdbId) return null;
  const data = await tmdbFetch(`/find/${imdbId}?external_source=imdb_id`);
  return data?.tv_results?.[0] || null;
}

/** IMDB / TVDB ids for a TMDB TV series — used to link into TVMaze-backed /show routes. */
export async function getTvExternalIds(tmdbTvId) {
  if (!tmdbTvId) return null;
  return await tmdbFetch(`/tv/${tmdbTvId}/external_ids`);
}

// Search TMDB by show name as fallback
export async function searchTmdbShow(name, year) {
  if (!name) return null;
  const q = encodeURIComponent(name);
  const yearParam = year ? `&first_air_date_year=${year}` : '';
  const data = await tmdbFetch(`/search/tv?query=${q}${yearParam}`);
  return data?.results?.[0] || null;
}

// Get videos (trailers) for a TMDB TV show
export async function getShowVideos(tmdbId) {
  if (!tmdbId) return [];
  const data = await tmdbFetch(`/tv/${tmdbId}/videos`);
  return data?.results || [];
}

// Get the best trailer from videos list
export function pickBestTrailer(videos) {
  if (!videos || videos.length === 0) return null;

  // Priority: Official trailer on YouTube > any trailer > any teaser > any video
  const youtubeVideos = videos.filter((v) => v.site === 'YouTube');

  const officialTrailer = youtubeVideos.find(
    (v) => v.type === 'Trailer' && v.official
  );
  if (officialTrailer) return officialTrailer;

  const anyTrailer = youtubeVideos.find((v) => v.type === 'Trailer');
  if (anyTrailer) return anyTrailer;

  const teaser = youtubeVideos.find((v) => v.type === 'Teaser');
  if (teaser) return teaser;

  return youtubeVideos[0] || null;
}

// Get watch/streaming providers for a TMDB TV show
export async function getWatchProviders(tmdbId, country = 'US') {
  if (!tmdbId) return null;
  const data = await tmdbFetch(`/tv/${tmdbId}/watch/providers`);
  return data?.results?.[country] || null;
}

// Get TMDB recommendations for a show
export async function getRecommendations(tmdbId) {
  if (!tmdbId) return [];
  const data = await tmdbFetch(`/tv/${tmdbId}/recommendations`);
  return data?.results?.slice(0, 10) || [];
}

// Get content ratings (age rating / certification)
export async function getContentRatings(tmdbId, country = 'US') {
  if (!tmdbId) return null;
  const data = await tmdbFetch(`/tv/${tmdbId}/content_ratings`);
  const ratings = data?.results || [];
  return ratings.find((r) => r.iso_3166_1 === country) || ratings[0] || null;
}

// Get images (backdrops + posters) for a TMDB TV show
export async function getShowImages(tmdbId) {
  if (!tmdbId) return null;
  const data = await tmdbFetch(`/tv/${tmdbId}/images`);
  if (!data) return null;
  return {
    backdrops: (data.backdrops || []).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)),
    posters: (data.posters || []).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)),
    logos: data.logos || [],
  };
}

// ─── Person endpoints ───

// Search TMDB for a person by name
export async function searchTmdbPerson(name) {
  if (!name) return null;
  const data = await tmdbFetch(`/search/person?query=${encodeURIComponent(name)}`);
  return data?.results?.[0] || null;
}

// Get full person details from TMDB
export async function getTmdbPersonDetails(tmdbPersonId) {
  if (!tmdbPersonId) return null;
  return await tmdbFetch(`/person/${tmdbPersonId}`);
}

// Get person external IDs (social media links)
export async function getTmdbPersonExternalIds(tmdbPersonId) {
  if (!tmdbPersonId) return null;
  return await tmdbFetch(`/person/${tmdbPersonId}/external_ids`);
}

// Get person tagged images
export async function getTmdbPersonImages(tmdbPersonId) {
  if (!tmdbPersonId) return null;
  const data = await tmdbFetch(`/person/${tmdbPersonId}/images`);
  return data?.profiles || [];
}

// Get person combined credits (movies + TV)
export async function getTmdbPersonCombinedCredits(tmdbPersonId) {
  if (!tmdbPersonId) return null;
  return await tmdbFetch(`/person/${tmdbPersonId}/combined_credits`);
}

// ─── Movie endpoints ───

export async function searchTmdbMovies(query) {
  if (!query) return [];
  const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}`);
  return data?.results || [];
}

export async function getMovieDetails(movieId) {
  if (!movieId) return null;
  return await tmdbFetch(`/movie/${movieId}`);
}

export async function getTvDetails(tvId) {
  if (!tvId) return null;
  return await tmdbFetch(`/tv/${tvId}`);
}

export async function getMovieCredits(movieId) {
  if (!movieId) return null;
  return await tmdbFetch(`/movie/${movieId}/credits`);
}

export async function getShowCredits(tmdbId) {
  if (!tmdbId) return null;
  return await tmdbFetch(`/tv/${tmdbId}/credits`);
}

export async function getMovieVideos(movieId) {
  if (!movieId) return [];
  const data = await tmdbFetch(`/movie/${movieId}/videos`);
  return (data?.results || []).filter((v) => v.site === 'YouTube');
}

export async function getMovieImages(movieId) {
  if (!movieId) return null;
  const data = await tmdbFetch(`/movie/${movieId}/images`);
  if (!data) return null;
  return {
    backdrops: (data.backdrops || []).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)),
    posters: (data.posters || []).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)),
    logos: data.logos || [],
  };
}

/** Pick best logo: English first, then highest-rated. */
function bestLogoFromTmdb(logos) {
  if (!Array.isArray(logos) || !logos.length) return null;
  const sorted = [...logos].sort((a, b) => {
    const aEn = (a.iso_639_1 || '').toLowerCase() === 'en' ? 1 : 0;
    const bEn = (b.iso_639_1 || '').toLowerCase() === 'en' ? 1 : 0;
    if (aEn !== bEn) return bEn - aEn;
    return (b.vote_average || 0) - (a.vote_average || 0);
  });
  return sorted[0]?.file_path
    ? `${TMDB_IMAGE_BASE}/original${sorted[0].file_path}`
    : null;
}

/** TMDB-hosted movie logo (transparent PNG). Used as fallback when fanart.tv has none. */
export async function getMovieLogoTmdb(movieId) {
  if (!movieId) return null;
  const data = await tmdbFetch(`/movie/${movieId}/images?include_image_language=en,null`);
  return bestLogoFromTmdb(data?.logos);
}

/** TMDB-hosted TV show logo (transparent PNG). */
export async function getShowLogoTmdb(tmdbId) {
  if (!tmdbId) return null;
  const data = await tmdbFetch(`/tv/${tmdbId}/images?include_image_language=en,null`);
  return bestLogoFromTmdb(data?.logos);
}

/** Pick best backdrop: prefer textless (no language), then highest-rated. */
function bestBackdropFromTmdb(backdrops) {
  if (!Array.isArray(backdrops) || !backdrops.length) return null;
  const sorted = [...backdrops].sort((a, b) => {
    const aTextless = !a.iso_639_1 ? 1 : 0;
    const bTextless = !b.iso_639_1 ? 1 : 0;
    if (aTextless !== bTextless) return bTextless - aTextless;
    return (b.vote_average || 0) - (a.vote_average || 0);
  });
  return sorted[0]?.file_path
    ? `${TMDB_IMAGE_BASE}/original${sorted[0].file_path}`
    : null;
}

/** TMDB-hosted movie backdrop (HD). Used as fallback when fanart.tv has none. */
export async function getMovieBackdropTmdb(movieId) {
  if (!movieId) return null;
  const data = await tmdbFetch(`/movie/${movieId}/images?include_image_language=en,null`);
  return bestBackdropFromTmdb(data?.backdrops);
}

/** TMDB-hosted TV show backdrop (HD). */
export async function getShowBackdropTmdb(tmdbId) {
  if (!tmdbId) return null;
  const data = await tmdbFetch(`/tv/${tmdbId}/images?include_image_language=en,null`);
  return bestBackdropFromTmdb(data?.backdrops);
}

export async function getMovieWatchProviders(movieId, country = 'US') {
  if (!movieId) return null;
  const data = await tmdbFetch(`/movie/${movieId}/watch/providers`);
  return data?.results?.[country] || null;
}

export async function getMovieRecommendations(movieId) {
  if (!movieId) return [];
  const data = await tmdbFetch(`/movie/${movieId}/recommendations`);
  return data?.results?.slice(0, 10) || [];
}

export async function getMovieReleaseDates(movieId, country = 'US') {
  if (!movieId) return null;
  const data = await tmdbFetch(`/movie/${movieId}/release_dates`);
  const results = data?.results || [];
  const countryData = results.find((r) => r.iso_3166_1 === country) || results[0];
  const release = countryData?.release_dates?.find((r) => r.certification) || countryData?.release_dates?.[0];
  return release?.certification || null;
}

// Get movie collection (franchise) details
export async function getMovieCollection(collectionId) {
  if (!collectionId) return null;
  return await tmdbFetch(`/collection/${collectionId}`);
}

// Get similar movies
export async function getSimilarMovies(movieId) {
  if (!movieId) return [];
  const data = await tmdbFetch(`/movie/${movieId}/similar`);
  return data?.results?.slice(0, 12) || [];
}

// Get movie reviews
export async function getMovieReviews(movieId) {
  if (!movieId) return [];
  const data = await tmdbFetch(`/movie/${movieId}/reviews`);
  return data?.results || [];
}

// Get trending people this week
export async function getTrendingPeople() {
  const data = await tmdbFetch('/trending/person/week');
  return data?.results || [];
}

// ─── Movie list endpoints ───

export async function getTrendingMovies(window = 'week') {
  const data = await tmdbFetch(`/trending/movie/${window}`);
  return data?.results || [];
}

export async function getTrendingAll(window = 'week') {
  const data = await tmdbFetch(`/trending/all/${window}`);
  return data?.results || [];
}

export async function getTrendingTv(window = 'week') {
  const data = await tmdbFetch(`/trending/tv/${window}`);
  return data?.results || [];
}

/** Last-N-days "trending" via discover sort_by=popularity.desc. */
export async function getPopularSinceDate(date, mediaType = 'movie') {
  const param = mediaType === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte';
  const data = await tmdbFetch(
    `/discover/${mediaType}?sort_by=popularity.desc&${param}=${date}&vote_count.gte=20`,
  );
  return data?.results || [];
}

export async function getNowPlayingMovies() {
  const data = await tmdbFetch('/movie/now_playing');
  return data?.results || [];
}

export async function getUpcomingMovies() {
  const data = await tmdbFetch('/movie/upcoming');
  return data?.results || [];
}

export async function getTopRatedMovies(page = 1) {
  const data = await tmdbFetch(`/movie/top_rated?page=${page}`);
  return data?.results || [];
}

export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch(`/movie/popular?page=${page}`);
  return data?.results || [];
}

export async function getTopRatedShows(page = 1) {
  const data = await tmdbFetch(`/tv/top_rated?page=${page}`);
  return data?.results || [];
}

export async function getPopularShows(page = 1) {
  const data = await tmdbFetch(`/tv/popular?page=${page}`);
  return data?.results || [];
}

export async function discoverByProvider(providerId, mediaType = 'movie', page = 1, region = 'US') {
  const data = await tmdbFetch(
    `/discover/${mediaType}?with_watch_providers=${providerId}&watch_region=${region}&sort_by=popularity.desc&page=${page}`,
  );
  return data?.results || [];
}

export async function discoverMovies(genreIds = [], sortBy = 'popularity.desc', page = 1, options = {}) {
  const { runtimeGte, runtimeLte, voteCountGte } = options;
  let params = `sort_by=${sortBy}&page=${page}`;
  if (genreIds.length > 0) params += `&with_genres=${genreIds.join(',')}`;
  if (runtimeGte) params += `&with_runtime.gte=${runtimeGte}`;
  if (runtimeLte) params += `&with_runtime.lte=${runtimeLte}`;
  if (voteCountGte) params += `&vote_count.gte=${voteCountGte}`;
  const data = await tmdbFetch(`/discover/movie?${params}`);
  return data || { results: [], total_pages: 0, total_results: 0, page: 1 };
}

export async function getTmdbMovieGenres() {
  const data = await tmdbFetch('/genre/movie/list');
  return data?.genres || [];
}

/**
 * Discover movies or TV shows by origin country (ISO 3166-1 alpha-2, e.g. 'us').
 * Used by the /country/:code listing page.
 */
export async function discoverByCountry(countryCode, mediaType = 'movie', page = 1) {
  const code = String(countryCode || '').toUpperCase();
  if (!code) return { results: [], total_pages: 0 };
  const data = await tmdbFetch(
    `/discover/${mediaType}?with_origin_country=${code}&sort_by=popularity.desc&page=${page}`,
  );
  return data || { results: [], total_pages: 0, total_results: 0, page: 1 };
}

/**
 * Discover anime — animation films/series from Japan, sorted by popularity.
 * TMDB genre 16 = Animation. Combining with with_origin_country=JP catches
 * anime without dragging in Pixar, Aardman, etc.
 */
export async function discoverAnime(mediaType = 'movie', page = 1) {
  const data = await tmdbFetch(
    `/discover/${mediaType}?with_genres=16&with_origin_country=JP&sort_by=popularity.desc&page=${page}`,
  );
  return data || { results: [], total_pages: 0, total_results: 0, page: 1 };
}

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Kept for backwards compatibility — the proxy handles missing-key cases server-side
// and TMDB calls now degrade gracefully (returning null) when the server has no key.
export function hasTmdbKey() {
  return true;
}
