export const GENRES = [
  'Drama', 'Comedy', 'Action', 'Crime', 'Thriller', 'Science-Fiction',
  'Horror', 'Romance', 'Adventure', 'Fantasy', 'Supernatural', 'Mystery',
  'Family', 'Medical', 'Legal', 'Anime', 'Music', 'History', 'Espionage',
];

export const GENRE_COLORS = {
  'Drama': '#c4553a',
  'Comedy': '#d4a056',
  'Action': '#d97a3e',
  'Crime': '#5a8ab5',
  'Thriller': '#8b7355',
  'Science-Fiction': '#4a9a8a',
  'Horror': '#b54040',
  'Romance': '#c47a8a',
  'Adventure': '#3a9a6a',
  'Fantasy': '#9a7a5a',
  'Supernatural': '#6a7a8a',
  'Mystery': '#7a6a5a',
  'Family': '#5aaa8a',
  'Medical': '#4a9a7a',
  'Legal': '#6a7a7a',
  'Anime': '#c46a6a',
  'Music': '#c48a4a',
  'History': '#8a7a3a',
  'Espionage': '#5a6a6a',
};

export const FEATURED_SHOW_IDS = [169, 82, 73, 44778, 216, 66, 431, 1371, 41428, 2993];

export const ITEMS_PER_PAGE = 24;

// TMDB movie genre IDs (hardcoded fallback — stable list)
export const TMDB_MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

// Mood → TMDB genre ID mapping for Discover Movies
export const MOVIE_MOOD_GENRES = {
  'feel-good': [35, 10751, 10749],
  'thrilling': [53, 80, 9648],
  'mind-bending': [878, 14],
  'dark-gritty': [80, 18, 27],
  'adventurous': [12, 28, 14],
  'romantic': [10749, 18, 35],
  'scary': [27, 53],
  'brainy': [18, 36, 99],
};

// TMDB genre ID → color for genre pills
export const TMDB_GENRE_COLORS = {
  28: '#d97a3e',
  12: '#3a9a6a',
  16: '#5aaa8a',
  35: '#d4a056',
  80: '#5a8ab5',
  99: '#6a7a7a',
  18: '#c4553a',
  10751: '#5aaa8a',
  14: '#9a7a5a',
  36: '#8a7a3a',
  27: '#b54040',
  10402: '#c48a4a',
  9648: '#7a6a5a',
  10749: '#c47a8a',
  878: '#4a9a8a',
  53: '#8b7355',
  10752: '#5a6a6a',
  37: '#8a6a3a',
};
