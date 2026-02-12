const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

const tmdbCache = new Map();

async function tmdbFetch(path) {
  if (!TMDB_API_KEY) return null;

  const url = `${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;

  if (tmdbCache.has(url)) {
    const cached = tmdbCache.get(url);
    if (Date.now() - cached.time < 10 * 60 * 1000) return cached.data;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    tmdbCache.set(url, { data, time: Date.now() });
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

export async function getMovieCredits(movieId) {
  if (!movieId) return null;
  return await tmdbFetch(`/movie/${movieId}/credits`);
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

export async function getTrendingMovies() {
  const data = await tmdbFetch('/trending/movie/week');
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

export async function getTopRatedMovies() {
  const data = await tmdbFetch('/movie/top_rated');
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

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function hasTmdbKey() {
  return !!TMDB_API_KEY;
}
