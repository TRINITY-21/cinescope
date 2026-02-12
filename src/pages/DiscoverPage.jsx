import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../api/tvmaze';
import { endpoints } from '../api/endpoints';
import { discoverMovies, hasTmdbKey } from '../api/tmdb';
import { MOVIE_MOOD_GENRES } from '../utils/constants';
import Container from '../components/ui/Container';
import ShowCard from '../components/show/ShowCard';
import MovieCard from '../components/movie/MovieCard';
import ShowCardSkeleton from '../components/show/ShowCardSkeleton';
import Button from '../components/ui/Button';

const MOODS = [
  { id: 'feel-good', label: 'Feel Good', emoji: '😊', genres: ['Comedy', 'Family', 'Romance'], description: 'Light, happy, and uplifting' },
  { id: 'thrilling', label: 'Thrilling', emoji: '😱', genres: ['Thriller', 'Crime', 'Mystery'], description: 'Edge-of-your-seat suspense' },
  { id: 'mind-bending', label: 'Mind-Bending', emoji: '🧠', genres: ['Science-Fiction', 'Supernatural', 'Fantasy'], description: 'Blow your mind' },
  { id: 'dark-gritty', label: 'Dark & Gritty', emoji: '🌑', genres: ['Crime', 'Drama', 'Horror'], description: 'Intense and raw' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🗺️', genres: ['Adventure', 'Action', 'Fantasy'], description: 'Epic journeys and quests' },
  { id: 'romantic', label: 'Romantic', emoji: '💕', genres: ['Romance', 'Drama', 'Comedy'], description: 'Love stories and drama' },
  { id: 'scary', label: 'Scary', emoji: '👻', genres: ['Horror', 'Supernatural', 'Thriller'], description: 'Sleepless nights guaranteed' },
  { id: 'brainy', label: 'Brainy', emoji: '🎓', genres: ['Drama', 'Medical', 'Legal'], description: 'Smart and sophisticated' },
];

const TV_LENGTHS = [
  { id: 'quick', label: 'Quick Bite', emoji: '⚡', description: '< 30 min episodes' },
  { id: 'standard', label: 'Standard', emoji: '📺', description: '30-60 min episodes' },
  { id: 'epic', label: 'Epic', emoji: '🎬', description: '60+ min episodes' },
];

const MOVIE_LENGTHS = [
  { id: 'short', label: 'Short', emoji: '⚡', description: '< 90 minutes' },
  { id: 'standard', label: 'Standard', emoji: '🎬', description: '90-120 minutes' },
  { id: 'epic', label: 'Epic', emoji: '🏔️', description: '120+ minutes' },
];

export default function DiscoverPage() {
  const [contentType, setContentType] = useState('tv');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedLength, setSelectedLength] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const isMovies = contentType === 'movies';
  const lengths = isMovies ? MOVIE_LENGTHS : TV_LENGTHS;

  const discover = useCallback(async () => {
    if (!selectedMood) return;
    setIsLoading(true);
    setSearched(true);

    try {
      if (isMovies) {
        // Movie discovery via TMDB
        const genreIds = MOVIE_MOOD_GENRES[selectedMood] || [];
        const options = { voteCountGte: 50 };

        if (selectedLength) {
          if (selectedLength === 'short') options.runtimeLte = 90;
          else if (selectedLength === 'standard') { options.runtimeGte = 90; options.runtimeLte = 120; }
          else if (selectedLength === 'epic') options.runtimeGte = 120;
        }

        const data = await discoverMovies(genreIds, 'vote_average.desc', 1, options);
        setResults((data.results || []).slice(0, 24));
      } else {
        // TV show discovery via TVMaze
        const pages = await Promise.all([
          fetchApi(endpoints.showIndex(Math.floor(Math.random() * 50))),
          fetchApi(endpoints.showIndex(Math.floor(Math.random() * 50))),
        ]);
        const allShows = pages.flat();

        const mood = MOODS.find((m) => m.id === selectedMood);

        let filtered = allShows.filter((show) => {
          if (!show.image || !show.rating?.average) return false;
          const hasGenre = show.genres?.some((g) => mood.genres.includes(g));
          if (!hasGenre) return false;
          if (selectedLength) {
            const runtime = show.runtime || show.averageRuntime || 45;
            if (selectedLength === 'quick' && runtime > 30) return false;
            if (selectedLength === 'standard' && (runtime < 25 || runtime > 65)) return false;
            if (selectedLength === 'epic' && runtime < 55) return false;
          }
          return true;
        });

        filtered.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
        setResults(filtered.slice(0, 24));
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  }, [selectedMood, selectedLength, isMovies]);

  function handleContentTypeChange(type) {
    setContentType(type);
    setResults([]);
    setSearched(false);
    setSelectedLength(null);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
      <Container>
        <div className="relative text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-shadow-hero">What's Your Mood?</h1>
          <p className="text-text-secondary mt-3 text-lg">
            Tell us how you're feeling, we'll find the perfect {isMovies ? 'movie' : 'show'}
          </p>
        </div>

        {/* Content type toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full p-1 glass border border-white/5">
            <button
              onClick={() => handleContentTypeChange('tv')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isMovies ? 'bg-accent-violet text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              TV Shows
            </button>
            <button
              onClick={() => handleContentTypeChange('movies')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isMovies
                  ? 'bg-accent-gold text-white'
                  : hasTmdbKey() ? 'text-text-secondary hover:text-white' : 'text-text-muted cursor-not-allowed opacity-50'
              }`}
              disabled={!hasTmdbKey()}
              title={!hasTmdbKey() ? 'TMDB API key required for movie discovery' : ''}
            >
              Movies
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">I'm in the mood for...</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-3 sm:p-4 rounded-xl text-center transition-all border card-hover-lift ${
                    selectedMood === mood.id
                      ? 'bg-accent-violet/20 border-accent-violet/50 shadow-lg shadow-accent-violet/10'
                      : 'glass border-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl block mb-1 sm:mb-2">{mood.emoji}</span>
                  <p className="font-semibold text-xs sm:text-sm text-white">{mood.label}</p>
                  <p className="text-xs text-text-muted mt-1">{mood.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
              {isMovies ? 'Runtime preference' : 'Episode length preference'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {lengths.map((length) => (
                <button
                  key={length.id}
                  onClick={() => setSelectedLength(selectedLength === length.id ? null : length.id)}
                  className={`p-3 sm:p-4 rounded-xl text-center transition-all border ${
                    selectedLength === length.id
                      ? 'bg-accent-gold/10 border-accent-gold/50'
                      : 'glass border-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="text-xl sm:text-2xl block mb-1">{length.emoji}</span>
                  <p className="font-semibold text-xs sm:text-sm text-white">{length.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{length.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button onClick={discover} variant="gradient" size="lg" disabled={!selectedMood || isLoading}>
              {isLoading ? 'Discovering...' : isMovies ? 'Discover Movies' : 'Discover Shows'}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {searched && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
              {isLoading ? (
                <div className="card-grid">
                  {Array.from({ length: 12 }, (_, i) => <ShowCardSkeleton key={i} />)}
                </div>
              ) : results.length > 0 ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-4">
                    Found {results.length} {isMovies ? 'movies' : 'shows'} for you
                  </h2>
                  <div className="card-grid">
                    {isMovies
                      ? results.map((movie) => <MovieCard key={movie.id} movie={movie} />)
                      : results.map((show) => <ShowCard key={show.id} show={show} />)
                    }
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <svg className="mx-auto mb-4 text-text-muted" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-white font-medium">No matches for this combination</p>
                  <p className="text-text-secondary text-sm mt-1">Try adjusting your mood or runtime preference</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </motion.div>
  );
}
