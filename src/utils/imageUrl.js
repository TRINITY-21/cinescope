const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" fill="%231a1a2e"%3E%3Crect width="300" height="450"/%3E%3Ctext x="150" y="225" text-anchor="middle" fill="%234a4a5a" font-family="sans-serif" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';

const PLACEHOLDER_PERSON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="%231a1a2e"%3E%3Crect width="300" height="300"/%3E%3Ccircle cx="150" cy="120" r="50" fill="%234a4a5a"/%3E%3Cellipse cx="150" cy="260" rx="80" ry="60" fill="%234a4a5a"/%3E%3C/svg%3E';

export function getOriginalImage(imageObj) {
  return imageObj?.original || imageObj?.medium || PLACEHOLDER;
}

export function getMediumImage(imageObj) {
  return imageObj?.medium || imageObj?.original || PLACEHOLDER;
}

export function getPersonImage(imageObj) {
  return imageObj?.medium || imageObj?.original || PLACEHOLDER_PERSON;
}

export function getBackdropImage(images) {
  if (!images || !Array.isArray(images)) return null;
  const bg = images.find((img) => img.type === 'background');
  return bg?.resolutions?.original?.url || null;
}

// TMDB image URL helpers
const TMDB_IMG = 'https://image.tmdb.org/t/p';

export function getTmdbPosterUrl(posterPath, size = 'w342') {
  if (!posterPath) return PLACEHOLDER;
  return `${TMDB_IMG}/${size}${posterPath}`;
}

export function getTmdbBackdropUrl(backdropPath, size = 'w1280') {
  if (!backdropPath) return null;
  return `${TMDB_IMG}/${size}${backdropPath}`;
}

export function getTmdbProfileUrl(profilePath, size = 'w185') {
  if (!profilePath) return PLACEHOLDER_PERSON;
  return `${TMDB_IMG}/${size}${profilePath}`;
}

export { PLACEHOLDER, PLACEHOLDER_PERSON };
