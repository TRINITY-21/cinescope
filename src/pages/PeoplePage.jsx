import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchApi } from '../api/tvmaze';
import { endpoints } from '../api/endpoints';
import { getPersonImage } from '../utils/imageUrl';
import Container from '../components/ui/Container';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useDebounce } from '../hooks/useDebounce';

function PersonCardSkeleton() {
  return (
    <div className="glass rounded-xl p-3 sm:p-5 text-center animate-pulse">
      <div className="w-18 h-18 sm:w-24 sm:h-24 mx-auto rounded-full bg-bg-elevated" />
      <div className="h-4 w-20 sm:w-24 mx-auto bg-bg-elevated rounded mt-2 sm:mt-3" />
      <div className="h-3 w-14 sm:w-16 mx-auto bg-bg-elevated rounded mt-2" />
    </div>
  );
}

export default function PeoplePage() {
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const [loadMoreRef, isLoadMoreVisible] = useIntersectionObserver({ triggerOnce: false, rootMargin: '400px' });

  const loadPage = useCallback(async (pageNum) => {
    try {
      setIsLoading(true);
      const data = await fetchApi(endpoints.peopleIndex(pageNum));
      if (!data || data.length === 0) { setHasMore(false); return; }
      setPeople((prev) => pageNum === 0 ? data : [...prev, ...data]);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(0); }, []);

  useEffect(() => {
    if (isLoadMoreVisible && hasMore && !isLoading && !searchQuery && page < 5) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPage(nextPage);
    }
  }, [isLoadMoreVisible, hasMore, isLoading, page, searchQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    fetchApi(endpoints.searchPeople(debouncedQuery)).then((data) => {
      setSearchResults(data || []);
      setSearchLoading(false);
    }).catch(() => setSearchLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    document.title = 'Browse People — Bynge';
    return () => { document.title = 'Bynge'; };
  }, []);

  const displayPeople = searchResults
    ? searchResults.map((r) => r.person)
    : people;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
      <Container>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Browse People</h1>
            <p className="text-text-secondary mt-1">Discover actors, directors & creators</p>
          </div>

          <div className="relative w-full sm:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl bg-bg-elevated/50 border border-white/10 text-white placeholder-text-muted text-xs sm:text-sm focus:outline-none focus:border-accent-violet/50 transition-colors"
            />
          </div>
        </div>

        {searchResults && (
          <p className="text-sm text-text-muted mb-4">{displayPeople.length} results for "{searchQuery}"</p>
        )}

        <div className="card-grid">
          {displayPeople.map((person) => (
            <Link key={person.id} to={`/person/${person.id}`}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="glass rounded-xl p-3 sm:p-5 text-center group cursor-pointer h-full card-hover-lift"
              >
                <div className="w-18 h-18 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden border-2 border-white/10 group-hover:border-accent-violet/50 group-hover:shadow-[0_0_15px_rgba(196,131,91,0.15)] transition-all duration-300 shadow-lg">
                  <img
                    src={getPersonImage(person.image)}
                    alt={person.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-white truncate group-hover:text-accent-violet transition-colors">
                  {person.name}
                </p>
                {person.country?.name && (
                  <p className="text-xs text-text-muted mt-0.5">{person.country.name}</p>
                )}
                {person.birthday && (
                  <p className="text-xs text-text-muted mt-0.5">
                    Born {new Date(person.birthday).getFullYear()}
                  </p>
                )}
              </motion.div>
            </Link>
          ))}

          {(isLoading || searchLoading) && Array.from({ length: 12 }, (_, i) => <PersonCardSkeleton key={`skel-${i}`} />)}
        </div>

        {!searchQuery && hasMore && <div ref={loadMoreRef} className="h-10" />}

        {displayPeople.length === 0 && !isLoading && !searchLoading && (
          <div className="text-center py-20">
            <p className="text-text-secondary text-lg">No people found</p>
            {searchQuery && <p className="text-text-muted mt-2">Try a different search term</p>}
          </div>
        )}
      </Container>
    </motion.div>
  );
}
