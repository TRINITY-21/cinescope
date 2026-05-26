import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { getPersonImage } from '../utils/imageUrl';

/**
 * Editorial people directory. Three zones, no circle-avatar wall:
 *
 *  1. Editorial header — page title + live search
 *  2. "Born today" featured strip — surfaces birthdays from the loaded set
 *  3. Browse grid — rectangular portrait cards, dense, no padding gimmicks
 *
 * The cards are 3:4 portraits (Letterboxd-style) instead of circles. Real
 * faces, real names, no extra chrome.
 */

const PAGE_LIMIT = 5;

export default function PeoplePage() {
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const [loadMoreRef, isLoadMoreVisible] = useIntersectionObserver({
    triggerOnce: false,
    rootMargin: '600px',
  });

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

  useEffect(() => { loadPage(0); }, [loadPage]);

  useEffect(() => {
    if (isLoadMoreVisible && hasMore && !isLoading && !searchQuery && page < PAGE_LIMIT) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPage(nextPage);
    }
  }, [isLoadMoreVisible, hasMore, isLoading, page, searchQuery, loadPage]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSearchResults(null); return; }
    setSearchLoading(true);
    fetchApi(endpoints.searchPeople(debouncedQuery))
      .then((data) => setSearchResults(data || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  usePageHead({
    title: 'People — Actors & Crew — Bynge',
    description:
      'Browse actors, directors, and creators. Search TV and film talent and explore their filmography on Bynge.',
    canonical: `${SITE_ORIGIN}/people`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'People', item: `${SITE_ORIGIN}/people` },
        ],
      },
    ],
  });

  const visible = useMemo(() => (
    searchResults
      ? searchResults.map((r) => r.person).filter(Boolean)
      : people
  ), [searchResults, people]);

  const bornToday = useMemo(() => {
    if (searchResults || people.length === 0) return [];
    const today = format(new Date(), 'MM-dd');
    return people
      .filter((p) => p.birthday && p.birthday.slice(5) === today)
      .slice(0, 3);
  }, [people, searchResults]);

  const showSkeletons = (isLoading && people.length === 0) || searchLoading;

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      <Container>
        <EditorialHeader
          query={searchQuery}
          onQuery={setSearchQuery}
          resultCount={visible.length}
          searching={!!searchResults}
        />

        {bornToday.length > 0 && <BornToday people={bornToday} />}

        <main className="mt-section-lg">
          {showSkeletons ? (
            <GridSkeleton count={12} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              }
              title={searchQuery ? `No results for "${searchQuery}"` : 'No people available'}
              description={searchQuery ? 'Try a different name or spelling.' : 'Try refreshing the page in a moment.'}
              action={searchQuery ? { label: 'Clear search', onClick: () => setSearchQuery('') } : undefined}
            />
          ) : (
            <PortraitGrid people={visible} />
          )}

          {!searchQuery && hasMore && <div ref={loadMoreRef} className="h-10" />}
        </main>
      </Container>
    </PageLayout>
  );
}

/* ───────────────────────  HEADER  ─────────────────────── */

function EditorialHeader({ query, onQuery, resultCount, searching }) {
  return (
    <header className="mb-section">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-meta uppercase text-text-muted font-semibold">Directory</p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
            People <span className="text-text-secondary">behind the camera and on it.</span>
          </h1>
        </div>

        <div className="lg:w-96 lg:flex-shrink-0">
          <label className="block">
            <span className="sr-only">Search people</span>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Search names, roles, actors…"
                className="
                  w-full pl-10 pr-4 h-11 rounded-lg
                  bg-white/[0.04] border border-white/[0.10]
                  text-body-sm text-white placeholder-text-muted
                  focus:outline-none focus:border-accent-peach/60 focus:bg-white/[0.06]
                  transition-colors
                "
              />
            </div>
          </label>
          {searching && (
            <p className="mt-2 text-caption text-text-muted">
              {resultCount} {resultCount === 1 ? 'match' : 'matches'} for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────  BORN TODAY  ─────────────────────── */

function BornToday({ people }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="
        relative overflow-hidden rounded-2xl
        border border-white/[0.06]
        bg-gradient-to-br from-bg-elevated/60 to-bg-secondary/30
        p-6 sm:p-8
      "
    >
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <div>
          <p className="text-meta uppercase text-accent-gold font-semibold tracking-widest">
            Born {format(new Date(), 'MMMM d')}
          </p>
          <h2 className="mt-1.5 text-h2 sm:text-h1 font-extrabold tracking-tight text-white">
            {people.length === 1 ? 'A birthday today' : 'Birthdays today'}
          </h2>
        </div>
        <span className="font-mono text-meta text-text-muted">
          {String(people.length).padStart(2, '0')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {people.map((person, i) => {
          const year = person.birthday?.slice(0, 4);
          const turning = year ? new Date().getFullYear() - Number(year) : null;
          return (
            <Link
              key={person.id}
              to={`/person/${person.id}`}
              className="group flex items-center gap-4"
            >
              <div className="flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-white/[0.10] group-hover:border-accent-gold/40 transition-colors">
                <img
                  src={getPersonImage(person.image)}
                  alt={person.name}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-white break-words min-w-0 group-hover:text-accent-gold transition-colors">
                  {person.name}
                </p>
                {turning != null && (
                  <p className="text-caption text-text-secondary mt-0.5">
                    Turning {turning}
                  </p>
                )}
                {person.country?.name && (
                  <p className="text-caption text-text-muted break-words min-w-0">{person.country.name}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}

/* ───────────────────────  PORTRAIT GRID  ─────────────────────── */

function PortraitGrid({ people }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
      {people.map((person, i) => (
        <Link key={person.id} to={`/person/${person.id}`} className="group block">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/[0.06] group-hover:border-white/[0.16] transition-colors">
            <img
              src={getPersonImage(person.image)}
              alt={person.name}
              loading={i < 6 ? 'eager' : 'lazy'}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/0 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
                {person.name}
              </p>
              {person.country?.name && (
                <p className="text-caption text-text-muted/80 break-words min-w-0">{person.country.name}</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ───────────────────────  SKELETON  ─────────────────────── */

function GridSkeleton({ count }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]"
        />
      ))}
    </div>
  );
}
