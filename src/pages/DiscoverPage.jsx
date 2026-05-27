import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { discoverMovies, hasTmdbKey } from '../api/tmdb';
import { fetchApi } from '../api/tvmaze';
import CuratedMoodCard from '../components/discover/CuratedMoodCard';
import MovieCard from '../components/movie/MovieCard';
import ShowCard from '../components/show/ShowCard';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import RollDiceButton from '../components/ui/RollDiceButton';
import { MOODS as CURATED_MOVIE_MOODS } from '../data/moods';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { MOVIE_MOOD_GENRES } from '../utils/constants';
import { sortByRatingThenYear } from '../utils/sort';

/**
 * Discover — the "what should I watch tonight" picker. Three controls:
 *
 *  1. TV / Movies content type
 *  2. Mood (genre cluster)
 *  3. Runtime / episode length
 *
 * Each mood has its own accent color so the picker feels like flipping
 * through colored chapter tabs in a magazine, not stamps in a Pokédex.
 */

const MOODS = [
  { id: 'feel-good',     label: 'Feel-good',     tagline: 'Lift the room.',                 genres: ['Comedy', 'Family', 'Romance'],              accent: '#d4a056' },
  { id: 'thrilling',     label: 'Thrilling',     tagline: 'Hold your breath.',              genres: ['Thriller', 'Crime', 'Mystery'],             accent: '#c4553a' },
  { id: 'mind-bending',  label: 'Mind-bending',  tagline: 'Rewire your brain.',             genres: ['Science-Fiction', 'Supernatural', 'Fantasy'], accent: '#9b87c4' },
  { id: 'dark-gritty',   label: 'Dark + gritty', tagline: 'No happy endings.',              genres: ['Crime', 'Drama', 'Horror'],                 accent: '#7a6a5a' },
  { id: 'adventurous',   label: 'Adventurous',   tagline: 'Take the long road.',            genres: ['Adventure', 'Action', 'Fantasy'],           accent: '#c4835b' },
  { id: 'romantic',      label: 'Romantic',      tagline: 'Lights low, hearts open.',       genres: ['Romance', 'Drama', 'Comedy'],               accent: '#d4566b' },
  { id: 'scary',         label: 'Scary',         tagline: 'Lights on, doors locked.',       genres: ['Horror', 'Supernatural', 'Thriller'],       accent: '#5a3a3a' },
  { id: 'brainy',        label: 'Brainy',        tagline: 'Reward attention.',              genres: ['Drama', 'Medical', 'Legal'],                accent: '#5a8a9a' },
];

const TV_LENGTHS = [
  { id: 'quick',    label: 'Quick',    desc: 'Under 30 min' },
  { id: 'standard', label: 'Standard', desc: '30 – 60 min' },
  { id: 'epic',     label: 'Epic',     desc: '60 min+' },
];

const MOVIE_LENGTHS = [
  { id: 'short',    label: 'Short',    desc: 'Under 90 min' },
  { id: 'standard', label: 'Standard', desc: '90 – 120 min' },
  { id: 'epic',     label: 'Epic',     desc: '120 min+' },
];

export default function DiscoverPage() {
  usePageHead({
    title: 'Discover — Browse TV & Movies by Mood — Bynge',
    description: 'Pick a mood and length to find shows or movies, or browse hand-picked curated lists for cozy nights, date night, thrillers, and more.',
    canonical: `${SITE_ORIGIN}/discover`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Discover', item: `${SITE_ORIGIN}/discover` },
        ],
      },
    ],
  });

  const [searchParams] = useSearchParams();
  const [contentType, setContentType] = useState('tv');
  const [selectedMood, setSelectedMood] = useState(() => {
    const mood = searchParams.get('mood');
    return MOODS.some((m) => m.id === mood) ? mood : null;
  });
  const [selectedLength, setSelectedLength] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const isMovies = contentType === 'movies';
  const lengths = isMovies ? MOVIE_LENGTHS : TV_LENGTHS;
  const moodObj = MOODS.find((m) => m.id === selectedMood) || null;
  const ctaRef = useRef(null);

  function handleMoodSelect(moodId) {
    setSelectedMood(moodId);
    requestAnimationFrame(() => {
      ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  useEffect(() => {
    const mood = searchParams.get('mood');
    if (mood && MOODS.some((m) => m.id === mood)) {
      setSelectedMood(mood);
    }
  }, [searchParams]);

  useEffect(() => {
    if (window.location.hash === '#curated-movies') {
      document.getElementById('curated-movies')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const discover = useCallback(async (moodOverride) => {
    const moodId = moodOverride || selectedMood;
    if (!moodId) return;
    setIsLoading(true);
    setSearched(true);

    try {
      if (isMovies) {
        const genreIds = MOVIE_MOOD_GENRES[moodId] || [];
        const options = { voteCountGte: 50 };
        if (selectedLength === 'short') options.runtimeLte = 90;
        else if (selectedLength === 'standard') { options.runtimeGte = 90; options.runtimeLte = 120; }
        else if (selectedLength === 'epic') options.runtimeGte = 120;

        const randomPage = Math.floor(Math.random() * 3) + 1;
        const data = await discoverMovies(genreIds, 'vote_average.desc', randomPage, options);
        setResults(sortByRatingThenYear((data.results || []).slice(0, 24)));
      } else {
        const pages = await Promise.all([
          fetchApi(endpoints.showIndex(Math.floor(Math.random() * 50))),
          fetchApi(endpoints.showIndex(Math.floor(Math.random() * 50))),
        ]);
        const allShows = pages.flat();
        const target = MOODS.find((m) => m.id === moodId);

        const filtered = allShows.filter((show) => {
          if (!show.image || !show.rating?.average) return false;
          const hasGenre = show.genres?.some((g) => target.genres.includes(g));
          if (!hasGenre) return false;
          if (selectedLength) {
            const runtime = show.runtime || show.averageRuntime || 45;
            if (selectedLength === 'quick' && runtime > 30) return false;
            if (selectedLength === 'standard' && (runtime < 25 || runtime > 65)) return false;
            if (selectedLength === 'epic' && runtime < 55) return false;
          }
          return true;
        });
        setResults(sortByRatingThenYear(filtered).slice(0, 24));
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
    requestAnimationFrame(() => {
      document.getElementById('discover-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [selectedMood, selectedLength, isMovies]);

  const surpriseMe = useCallback(async () => {
    const random = MOODS[Math.floor(Math.random() * MOODS.length)];
    setSelectedMood(random.id);
    setSelectedLength(null);
    await discover(random.id);
  }, [discover]);

  function handleContentTypeChange(type) {
    setContentType(type);
    setResults([]);
    setSearched(false);
    setSelectedLength(null);
  }

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }} className="relative">
      {/* Atmospheric tint that follows the selected mood */}
      {moodObj && (
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-[60vh] pointer-events-none opacity-50 transition-opacity duration-500"
          style={{ background: `radial-gradient(ellipse at top, ${moodObj.accent}33 0%, ${moodObj.accent}0a 30%, transparent 60%)` }}
        />
      )}

      <Container className={`relative ${selectedMood && !searched ? 'pb-28 sm:pb-32' : ''}`}>
        {/* Editorial header */}
        <header className="mb-section">
          <p
            className="text-meta uppercase font-semibold tracking-widest"
            style={{ color: moodObj?.accent || undefined }}
          >
            {moodObj ? `In the mood for ${moodObj.label.toLowerCase()}` : 'Browse by mood'}
          </p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
            Discover <span className="text-text-secondary">what to watch tonight.</span>
          </h1>
          <p className="mt-3 text-body-sm text-text-secondary max-w-xl leading-relaxed">
            Match TV or movies to your mood, or jump into a curated movie list — all on this page.
          </p>
          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-muted list-none">
            <li className={selectedMood ? 'text-accent-peach font-medium' : ''}>① Pick a mood</li>
            <li className={selectedLength ? 'text-white font-medium' : ''}>② Length (optional)</li>
            <li className={searched ? 'text-accent-gold font-medium' : ''}>③ See results</li>
          </ol>
        </header>

        {/* Content type toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-section">
          <span className="text-meta uppercase text-text-muted font-semibold">Looking for</span>
          <div className="inline-flex rounded-full bg-white/[0.04] border border-white/[0.08] p-1">
            <button
              type="button"
              onClick={() => handleContentTypeChange('tv')}
              className={`
                px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors
                ${!isMovies ? 'bg-white/[0.10] text-white' : 'text-text-secondary hover:text-white'}
              `}
            >
              TV Shows
            </button>
            <button
              type="button"
              onClick={() => handleContentTypeChange('movies')}
              disabled={!hasTmdbKey()}
              title={!hasTmdbKey() ? 'TMDB API key required' : ''}
              className={`
                px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors
                ${isMovies ? 'bg-white/[0.10] text-white' : 'text-text-secondary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'}
              `}
            >
              Movies
            </button>
          </div>
        </div>

        {/* Mood picker — no emojis, color + type led */}
        <section className="mb-section-lg">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-h3 font-semibold text-white">Pick a mood</h2>
            <RollDiceButton variant="subtle" onClick={surpriseMe} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {MOODS.map((mood) => {
              const isActive = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleMoodSelect(mood.id)}
                  className="
                    group relative text-left p-4 sm:p-5 rounded-xl
                    border transition-all duration-200
                    overflow-hidden
                  "
                  style={{
                    borderColor: isActive ? `${mood.accent}66` : 'rgba(255,255,255,0.06)',
                    background: isActive
                      ? `linear-gradient(135deg, ${mood.accent}26 0%, ${mood.accent}06 60%)`
                      : 'rgba(255,255,255,0.02)',
                    boxShadow: isActive ? `0 8px 32px ${mood.accent}1f, inset 0 0 0 1px ${mood.accent}33` : undefined,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className="text-h3 font-semibold tracking-tight"
                      style={{ color: isActive ? mood.accent : 'white' }}
                    >
                      {mood.label}
                    </h3>
                    {isActive && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: mood.accent }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-1 text-caption text-text-secondary italic">{mood.tagline}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Length picker — segmented, no emojis */}
        <section className="mb-section-lg">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-h3 font-semibold text-white">{isMovies ? 'Runtime' : 'Episode length'}</h2>
            <span className="text-caption text-text-muted">Optional</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {lengths.map((length) => {
              const isActive = selectedLength === length.id;
              return (
                <button
                  key={length.id}
                  type="button"
                  onClick={() => setSelectedLength(isActive ? null : length.id)}
                  className={`
                    p-3.5 sm:p-4 rounded-xl border text-left transition-colors
                    ${isActive
                      ? 'border-white/[0.18] bg-white/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10]'}
                  `}
                >
                  <p
                    className={`text-body font-semibold ${isActive ? 'text-white' : 'text-text-primary'}`}
                  >
                    {length.label}
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-caption text-text-muted">{length.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Primary CTA — directly after filters, before curated lists */}
        <section
          ref={ctaRef}
          id="discover-cta"
          className="mb-section-lg scroll-mt-24"
          aria-label="Find matches"
        >
          <div
            className={`
              rounded-2xl border p-5 sm:p-6 transition-colors
              ${selectedMood
                ? 'border-accent-peach/30 bg-accent-peach/[0.06]'
                : 'border-white/[0.06] bg-white/[0.02]'}
            `}
          >
            {selectedMood && moodObj ? (
              <p className="text-body-sm text-text-secondary mb-4">
                <span className="font-semibold" style={{ color: moodObj.accent }}>
                  {moodObj.label}
                </span>
                {' '}selected
                {selectedLength ? (
                  <> · {lengths.find((l) => l.id === selectedLength)?.label} length</>
                ) : (
                  <> · any length</>
                )}
                . Tap below when you&apos;re ready.
              </p>
            ) : (
              <p className="text-body-sm text-text-secondary mb-4">
                Select a mood above to enable matching.
              </p>
            )}
            <DiscoverCtaRow
              selectedMood={selectedMood}
              isLoading={isLoading}
              isMovies={isMovies}
              onDiscover={() => discover()}
              onReset={() => {
                setSelectedMood(null);
                setSelectedLength(null);
                setResults([]);
                setSearched(false);
              }}
            />
          </div>
        </section>

        {/* Results */}
        <AnimatePresence>
          {searched && (
            <motion.section
              id="discover-results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-h3 font-semibold text-white">
                  {isLoading
                    ? 'Searching…'
                    : `${results.length} ${isMovies ? 'movie' : 'show'}${results.length === 1 ? '' : 's'} for you`}
                </h3>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-caption text-text-muted font-mono uppercase tracking-widest">
                  By rating · year
                </span>
              </div>

              {isLoading ? (
                <div className="card-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <EmptyState
                  icon={
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                  }
                  title="Nothing matches that combination"
                  description="Try removing the length filter or picking a different mood."
                  action={selectedLength ? { label: 'Clear length filter', onClick: () => setSelectedLength(null) } : undefined}
                />
              ) : (
                <div className="card-grid">
                  {isMovies
                    ? results.map((m) => <MovieCard key={m.id} movie={m} />)
                    : results.map((s) => <ShowCard key={s.id} show={s} />)}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Curated lists — below the picker flow so they don't hide the CTA */}
        <section id="curated-movies" className="mb-section-lg scroll-mt-28 pt-section border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-h3 font-semibold text-white">Curated movie lists</h2>
              <p className="mt-1 text-body-sm text-text-secondary max-w-lg">
                Fixed lineups for cozy nights, date night, tearjerkers, and more — not algorithm picks.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {CURATED_MOVIE_MOODS.map((m, i) => (
              <CuratedMoodCard key={m.slug} mood={m} index={i} />
            ))}
          </div>
        </section>
      </Container>

      {/* Sticky CTA when a mood is picked but results aren't shown yet */}
      {selectedMood && !searched && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 pointer-events-none px-4 pb-4 sm:pb-6"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.10] bg-bg-primary/90 backdrop-blur-xl shadow-elevation-3 px-4 py-3 sm:px-5 sm:py-4">
              <p className="text-body-sm text-text-secondary min-w-0">
                <span className="text-white font-medium">{moodObj?.label}</span> ready — find {isMovies ? 'movies' : 'shows'}?
              </p>
              <DiscoverCtaRow
                selectedMood={selectedMood}
                isLoading={isLoading}
                isMovies={isMovies}
                onDiscover={() => discover()}
                onReset={() => {
                  setSelectedMood(null);
                  setSelectedLength(null);
                  setResults([]);
                  setSearched(false);
                }}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function DiscoverCtaRow({ selectedMood, isLoading, isMovies, onDiscover, onReset, compact = false }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${compact ? 'shrink-0' : ''}`}>
      <button
        type="button"
        onClick={onDiscover}
        disabled={!selectedMood || isLoading}
        className={`
          group inline-flex items-center gap-2.5 rounded-full font-semibold tracking-tight
          bg-accent-peach text-white hover:bg-accent-gold
          disabled:opacity-30 disabled:cursor-not-allowed
          shadow-[0_4px_24px_rgba(196,131,91,0.30)] hover:shadow-[0_6px_32px_rgba(212,160,86,0.35)]
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-peach/50
          ${compact ? 'h-10 px-5 text-sm' : 'h-12 px-7 text-body'}
        `}
      >
        {isLoading ? 'Discovering…' : `Show me ${isMovies ? 'movies' : 'shows'}`}
        {!isLoading && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        )}
      </button>
      {selectedMood && (
        <button
          type="button"
          onClick={onReset}
          className="text-caption text-text-muted hover:text-white underline underline-offset-4 decoration-text-muted/40 hover:decoration-white transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );
}
