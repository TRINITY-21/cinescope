import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchApi } from '../api/tvmaze';
import { endpoints } from '../api/endpoints';
import { GENRES, GENRE_COLORS } from '../utils/constants';
import Container from '../components/ui/Container';
import ShowCard from '../components/show/ShowCard';
import ShowCardSkeleton from '../components/show/ShowCardSkeleton';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export default function BrowsePage() {
  const { genre: urlGenre } = useParams();
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(urlGenre ? decodeURIComponent(urlGenre) : 'All');
  const [shows, setShows] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Advanced filters
  const [sortBy, setSortBy] = useState('name');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [loadMoreRef, isLoadMoreVisible] = useIntersectionObserver({ triggerOnce: false, rootMargin: '400px' });

  const loadPage = useCallback(async (pageNum) => {
    try {
      setIsLoading(true);
      const data = await fetchApi(endpoints.showIndex(pageNum));
      if (data.length === 0) { setHasMore(false); return; }
      setShows((prev) => pageNum === 0 ? data : [...prev, ...data]);
    } catch { setHasMore(false); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadPage(0); }, []);

  useEffect(() => {
    if (isLoadMoreVisible && hasMore && !isLoading && page < 5) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPage(nextPage);
    }
  }, [isLoadMoreVisible, hasMore, isLoading, page]);

  useEffect(() => {
    document.title = selectedGenre !== 'All' ? `Browse ${selectedGenre} — Bynge` : 'Browse — Bynge';
    return () => { document.title = 'Bynge'; };
  }, [selectedGenre]);

  function handleGenreChange(genre) {
    setSelectedGenre(genre);
    navigate(genre === 'All' ? '/browse' : `/browse/${encodeURIComponent(genre)}`, { replace: true });
  }

  const filteredShows = useMemo(() => {
    let result = selectedGenre === 'All' ? shows : shows.filter((s) => s.genres?.includes(selectedGenre));

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (ratingFilter > 0) {
      result = result.filter((s) => (s.rating?.average || 0) >= ratingFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'rating': return (b.rating?.average || 0) - (a.rating?.average || 0);
        case 'year': return (b.premiered || '').localeCompare(a.premiered || '');
        case 'year-asc': return (a.premiered || '').localeCompare(b.premiered || '');
        default: return (a.name || '').localeCompare(b.name || '');
      }
    });

    return result;
  }, [shows, selectedGenre, sortBy, statusFilter, ratingFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
      <Container>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Browse Shows</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-accent-violet/20 text-accent-violet' : 'glass text-text-secondary hover:text-white'}`}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 4h18M7 8h10M10 12h4"/></svg>
            Filters
          </button>
        </div>
        <p className="text-text-secondary mb-4">Discover shows by genre</p>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="glass-subtle rounded-xl gradient-border p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Sort by</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-violet/50">
                <option value="name">Name (A-Z)</option>
                <option value="rating">Rating (High to Low)</option>
                <option value="year">Newest First</option>
                <option value="year-asc">Oldest First</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-violet/50">
                <option value="all">All Status</option>
                <option value="Running">Running</option>
                <option value="Ended">Ended</option>
                <option value="To Be Determined">TBD</option>
                <option value="In Development">In Development</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Min rating: {ratingFilter > 0 ? ratingFilter : 'Any'}</label>
              <input type="range" min="0" max="9" step="1" value={ratingFilter} onChange={(e) => setRatingFilter(Number(e.target.value))} className="w-full accent-accent-violet" />
            </div>
          </motion.div>
        )}

        <div className="sticky top-16 z-30 bg-bg-primary/90 backdrop-blur-xl py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/5 shadow-elevation-2 mb-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button onClick={() => handleGenreChange('All')} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedGenre === 'All' ? 'bg-accent-violet text-white' : 'bg-bg-elevated/50 text-text-secondary hover:text-white hover:bg-bg-elevated'}`}>All</button>
            {GENRES.map((genre) => {
              const color = GENRE_COLORS[genre];
              const isActive = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => handleGenreChange(genre)}
                  className={`genre-pill flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive ? '' : ''}`}
                  style={isActive
                    ? { backgroundColor: `${color}30`, color, border: `1px solid ${color}50`, '--genre-color': color }
                    : { '--genre-color': color }
                  }
                >{genre}</button>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-text-muted mb-4">{filteredShows.length} shows</p>

        <div className="card-grid">
          {filteredShows.map((show) => <ShowCard key={show.id} show={show} />)}
          {isLoading && Array.from({ length: 12 }, (_, i) => <ShowCardSkeleton key={`skel-${i}`} />)}
        </div>

        {hasMore && <div ref={loadMoreRef} className="h-10" />}
      </Container>
    </motion.div>
  );
}
