import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import HorizontalScroll from '../components/ui/HorizontalScroll';
import { useApp } from '../context/AppContext';
import PageLayout from '../layouts/PageLayout';
import { GENRE_COLORS } from '../utils/constants';
import { formatYear } from '../utils/formatters';
import { getMediumImage, getTmdbPosterUrl } from '../utils/imageUrl';

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ──────────────────  VISUALIZATIONS  ────────────────── */

function GenreDonut({ entries, totalViews }) {
  const radius = 76;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  const gap = 6;

  const segments = useMemo(() => {
    const top = entries.slice(0, 6);
    let angle = 0;
    return top.map(([genre, count]) => {
      const pct = count / totalViews;
      const arcLen = Math.max(0, pct * circumference - gap);
      const seg = { genre, count, pct, arcLen, angle, color: GENRE_COLORS[genre] || '#c4835b' };
      angle += pct * 360;
      return seg;
    });
  }, [entries, totalViews, circumference]);

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <circle r={radius} cx="100" cy="100" fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/[0.03]" />
      {segments.map((seg, i) => (
        <motion.circle
          key={seg.genre}
          r={radius} cx="100" cy="100"
          fill="none" stroke={seg.color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${seg.arcLen} ${circumference - seg.arcLen}`}
          transform={`rotate(${seg.angle - 90} 100 100)`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.0, delay: 0.2 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      ))}
    </svg>
  );
}

function ProgressRing({ percentage, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage === 100 ? '#22c55e' : '#c4835b';
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700"
      />
      <text
        x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={size * 0.26} fontWeight="700"
        className="transform rotate-90" style={{ transformOrigin: 'center' }}
      >
        {percentage}%
      </text>
    </svg>
  );
}

/* ──────────────────  SHARED PRIMITIVES  ────────────────── */

function SectionHeader({ title, count, right }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 className="text-h3 font-semibold text-white">{title}</h2>
      <div className="flex-1 h-px bg-white/[0.06]" />
      {count != null && (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {String(count).padStart(2, '0')}
        </span>
      )}
      {right}
    </div>
  );
}

function StatBlock({ value, suffix, label, accent }) {
  return (
    <div>
      <p className="font-mono text-h1 sm:text-display-sm font-extrabold text-white tabular-nums leading-none">
        {value}
        {suffix && <span className="text-h3 font-semibold text-text-muted ml-0.5">{suffix}</span>}
      </p>
      <p className="mt-2 text-meta uppercase text-text-muted font-semibold tracking-widest">
        {label}
      </p>
      <div
        className="w-10 h-0.5 rounded-full mt-2"
        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
      />
    </div>
  );
}

/* ──────────────────  TRACKED SHOW CARD  ────────────────── */

function TrackedShowCard({ showId, watchedIds, onClear }) {
  const [show, setShow] = useState(null);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [showData, epsData] = await Promise.all([
          fetchApi(endpoints.show(showId)),
          fetchApi(endpoints.showEpisodes(showId)),
        ]);
        if (!cancelled) {
          setShow(showData);
          setTotalEpisodes(epsData?.length || 0);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [showId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-28 rounded-lg bg-white/[0.04] flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
            <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
            <div className="h-2 w-full bg-white/[0.04] rounded mt-4" />
          </div>
        </div>
      </div>
    );
  }
  if (!show) return null;

  const watched = watchedIds.length;
  const percentage = totalEpisodes > 0 ? Math.round((watched / totalEpisodes) * 100) : 0;
  const isComplete = percentage === 100;
  const runtime = show.runtime || show.averageRuntime || 0;
  const hoursWatched = Math.round((watched * runtime) / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      layout
      className="
        rounded-xl border border-white/[0.06] bg-white/[0.02] p-3
        hover:bg-white/[0.05] hover:border-white/[0.14]
        transition-colors group
      "
    >
      <div className="flex gap-3 sm:gap-4">
        <Link to={`/show/${show.id}`} className="flex-shrink-0">
          <img
            src={getMediumImage(show.image)}
            alt={show.name}
            className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg object-cover border border-white/[0.06] group-hover:border-accent-peach/30 transition-colors"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <Link to={`/show/${show.id}`} className="block">
                <h3 className="font-semibold text-white text-body-sm sm:text-body break-words min-w-0 group-hover:text-accent-peach transition-colors">
                  {show.name}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-caption text-text-secondary">
                <span>{formatYear(show.premiered)}</span>
                {show.network && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span>{show.network.name}</span>
                  </>
                )}
                {isComplete && (
                  <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">
                    Complete
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-caption text-text-secondary">
                <span className="font-mono text-white">{watched}</span> of{' '}
                <span className="font-mono">{totalEpisodes}</span> episodes
              </span>
              {hoursWatched > 0 && (
                <span className="text-caption text-text-muted font-mono">{hoursWatched}h watched</span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-accent-peach'}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <Link
              to={`/show/${show.id}`}
              className="text-caption text-accent-peach hover:text-accent-gold font-semibold whitespace-nowrap transition-colors"
            >
              {isComplete ? 'View show' : 'Continue watching →'}
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onClear(show.id, show.name)}
                className="text-caption text-text-muted hover:text-accent-red transition-colors sm:opacity-0 sm:group-hover:opacity-100"
              >
                Clear progress
              </button>
              <div className="flex-shrink-0 sm:hidden">
                <ProgressRing percentage={percentage} size={28} strokeWidth={2.5} />
              </div>
              <div className="flex-shrink-0 hidden sm:block">
                <ProgressRing percentage={percentage} size={36} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────  PAGE  ────────────────── */

const LIBRARY_TAB_ICONS = {
  watching: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  watchlist: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  watched: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  paused: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  dropped: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};

const LIBRARY_TABS = [
  { key: 'watching', label: 'Watching', color: 'text-green-400' },
  { key: 'watchlist', label: 'Watchlist', color: 'text-accent-peach' },
  { key: 'watched', label: 'Watched', color: 'text-blue-400' },
  { key: 'paused', label: 'Paused', color: 'text-yellow-400' },
  { key: 'dropped', label: 'Dropped', color: 'text-red-400' },
];

export default function TrackingPage() {
  const {
    watchedEpisodes, stats, clearShowProgress,
    watchlist, movieWatchlist, removeMovieFromWatchlist,
    recentlyViewed, collections, itemsByStatus,
    getWatchStreak, getTodayEpisodeCount, getWeekActivity,
  } = useApp();
  const [confirmClear, setConfirmClear] = useState(null);
  const [libraryTab, setLibraryTab] = useState('watchlist');
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Bucket every tracked item into its 5-state slot (defaults to 'watchlist'
  // when the user hasn't picked a status — that's the legacy behavior).
  const byStatus = useMemo(() => {
    const out = {};
    for (const t of LIBRARY_TABS) out[t.key] = itemsByStatus(t.key);
    return out;
  }, [itemsByStatus]);

  const libraryCounts = useMemo(() => {
    const out = {};
    for (const t of LIBRARY_TABS) {
      const b = byStatus[t.key];
      out[t.key] = (b?.shows?.length || 0) + (b?.movies?.length || 0);
    }
    return out;
  }, [byStatus]);

  const libraryTotal = Object.values(libraryCounts).reduce((s, n) => s + n, 0);

  useEffect(() => {
    document.title = 'My Library — Bynge';
    return () => { document.title = 'Bynge'; };
  }, []);

  const trackedShowIds = useMemo(() =>
    Object.entries(watchedEpisodes)
      .filter(([, eps]) => eps.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([id]) => id),
    [watchedEpisodes]
  );

  const totalShows = Object.keys(watchedEpisodes).length;
  const totalEpisodes = stats.totalEpisodesWatched || 0;
  const totalMinutes = stats.totalMinutesWatched || 0;
  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = (totalMinutes / (60 * 24)).toFixed(1);

  const genreEntries = Object.entries(stats.genresWatched || {}).sort((a, b) => b[1] - a[1]);
  const totalGenreViews = genreEntries.reduce((sum, [, c]) => sum + c, 0);
  const collectionsTotal = collections.reduce((sum, c) => sum + c.shows.length, 0);
  const usedCollections = collections.filter((c) => c.shows.length > 0);

  const hasData = totalEpisodes > 0 || watchlist.length > 0 || movieWatchlist.length > 0 || collectionsTotal > 0;

  function handleClearProgress(showId, showName) { setConfirmClear({ id: showId, name: showName }); }
  function confirmClearProgress() {
    if (!confirmClear) return;
    clearShowProgress(confirmClear.id);
    setConfirmClear(null);
  }

  /* ─── Empty state ─── */
  if (!hasData) {
    return (
      <PageLayout
        as={motion.div}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Container>
          <header className="mb-section">
            <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
              Your library
            </p>
            <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
              Your library <span className="text-text-secondary">is empty.</span>
            </h1>
          </header>
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
            title="Nothing tracked yet"
            description="Track episodes, save shows and movies. Your personal library fills in as you watch."
            action={{ label: 'Browse shows', to: '/browse' }}
            secondaryAction={{ label: 'Browse movies', to: '/movies' }}
          />
        </Container>
      </PageLayout>
    );
  }

  const streak = totalEpisodes > 0 ? getWatchStreak() : { current: 0, best: 0 };
  const todayCount = totalEpisodes > 0 ? getTodayEpisodeCount() : 0;

  return (
    <PageLayout
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container>
        {/* Editorial header */}
        <header className="mb-8">
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Your library
          </p>
          <h1 className="mt-2 text-h1 sm:text-h2 font-extrabold tracking-tight text-white leading-none">
            My library
          </h1>
          <p className="mt-2 text-body-sm text-text-secondary">
            <span className="text-white font-mono">{trackedShowIds.length}</span> shows tracked
            {movieWatchlist.length > 0 && (
              <> · <span className="text-white font-mono">{movieWatchlist.length}</span> movies saved</>
            )}
            {watchlist.length > 0 && (
              <> · <span className="text-white font-mono">{watchlist.length}</span> in watchlist</>
            )}
          </p>
        </header>

        <motion.div variants={stagger} initial="initial" animate="animate">

          {/* Quick summary */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-8">
            {libraryTotal > 0 && (
              <span className="text-caption px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-text-secondary">
                <span className="text-white font-mono">{libraryTotal}</span> in library
              </span>
            )}
            {trackedShowIds.length > 0 && (
              <span className="text-caption px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-text-secondary">
                <span className="text-white font-mono">{trackedShowIds.length}</span> in progress
              </span>
            )}
            {totalEpisodes > 0 && (
              <span className="text-caption px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-text-secondary">
                <span className="text-white font-mono">{totalEpisodes}</span> episodes ·{' '}
                <span className="text-white font-mono">{streak.current}</span>d streak
              </span>
            )}
          </motion.div>

          {/* LIBRARY — primary */}
          {libraryTotal > 0 && (
            <motion.section variants={fadeUp} className="mb-10">
              <SectionHeader
                title="Library"
                count={libraryTotal}
                right={
                  <Link
                    to="/browse"
                    className="ml-2 inline-flex items-center gap-1 text-caption text-accent-peach hover:text-accent-gold transition-colors"
                  >
                    Add more
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                }
              />

              <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar pb-1 mb-4 sm:overflow-visible">
                <div className="flex sm:flex-wrap gap-2 whitespace-nowrap">
                {LIBRARY_TABS.map((t) => {
                  const n = libraryCounts[t.key];
                  const active = libraryTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setLibraryTab(t.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                        active
                          ? 'bg-accent-peach text-white'
                          : 'bg-bg-elevated/50 text-text-secondary hover:text-white hover:bg-bg-elevated'
                      }`}
                    >
                      <span className={`flex items-center justify-center ${active ? 'text-white' : t.color}`}>
                        {LIBRARY_TAB_ICONS[t.key]}
                      </span>
                      <span>{t.label}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-white/15' : 'bg-white/[0.05]'
                      }`}>
                        {n}
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>

              {(() => {
                const bucket = byStatus[libraryTab] || { shows: [], movies: [] };
                const total = bucket.shows.length + bucket.movies.length;
                if (total === 0) {
                  const tabConfig = LIBRARY_TABS.find((t) => t.key === libraryTab);
                  return (
                    <div className="glass-subtle rounded-2xl py-8 px-6 text-center border border-white/[0.04]">
                      <p className={`mb-2 flex justify-center ${tabConfig?.color || 'text-text-muted'}`}>
                        {LIBRARY_TAB_ICONS[libraryTab]}
                      </p>
                      <p className="text-body-sm text-text-secondary">
                        Nothing in <span className="text-white font-semibold">{tabConfig?.label}</span> yet.
                      </p>
                      <p className="text-caption text-text-muted mt-1">
                        Use the Track button on any show or movie to add it here.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
                    {bucket.shows.map((show, i) => (
                      <motion.div
                        key={`s-${show.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(0.04 + i * 0.02, 0.4), duration: 0.3 }}
                      >
                        <Link to={`/show/${show.id}`} className="group block">
                          <div className="relative rounded-xl overflow-hidden aspect-[2/3] border border-white/[0.06] group-hover:border-accent-peach/40 transition-colors">
                            <img
                              src={getMediumImage(show.image)}
                              alt={show.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded bg-black/55 backdrop-blur text-white/90">
                              TV
                            </span>
                          </div>
                          <p className="text-caption text-text-secondary mt-1.5 break-words min-w-0 group-hover:text-white transition-colors">
                            {show.name}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                    {bucket.movies.map((movie, i) => (
                      <motion.div
                        key={`m-${movie.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(0.04 + (bucket.shows.length + i) * 0.02, 0.4), duration: 0.3 }}
                      >
                        <Link to={`/movie/${movie.id}`} className="group block relative">
                          <div className="relative rounded-xl overflow-hidden aspect-[2/3] border border-white/[0.06] group-hover:border-accent-gold/40 transition-colors">
                            <img
                              src={getTmdbPosterUrl(movie.poster_path)}
                              alt={movie.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded bg-black/55 backdrop-blur text-white/90">
                              Movie
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMovieFromWatchlist(movie.id); }}
                              aria-label="Remove from library"
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent-red transition-all"
                            >
                              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-caption text-text-secondary mt-1.5 break-words min-w-0 group-hover:text-white transition-colors">
                            {movie.title}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </motion.section>
          )}

          {/* TRACKED SHOWS */}
          {trackedShowIds.length > 0 && (
            <motion.section variants={fadeUp} className="mb-10">
              <SectionHeader title="Continue watching" count={trackedShowIds.length} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <AnimatePresence>
                  {trackedShowIds.map((showId) => (
                    <TrackedShowCard
                      key={showId}
                      showId={showId}
                      watchedIds={watchedEpisodes[showId] || []}
                      onClear={handleClearProgress}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {/* Collapsible stats & insights */}
          {(totalEpisodes > 0 || genreEntries.length > 0 || collectionsTotal > 0) && (
            <motion.section variants={fadeUp} className="mb-10">
              <button
                type="button"
                onClick={() => setInsightsOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left"
                aria-expanded={insightsOpen}
              >
                <span className="text-body-sm font-semibold text-white">Stats & insights</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`shrink-0 transition-transform ${insightsOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {insightsOpen && (
                <div className="mt-4 space-y-4">
          {totalEpisodes > 0 && (() => {
            const week = getWeekActivity();
            const maxWeekCount = Math.max(1, ...week.map((d) => d.count));

            return (
              <motion.section
                variants={fadeUp}
                className="
                  relative overflow-hidden rounded-2xl
                  border border-white/[0.06]
                  bg-gradient-to-br from-bg-elevated/60 to-bg-secondary/30
                  p-4 sm:p-5 mb-8
                "
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                  {/* Streak triplet */}
                  <div className="grid grid-cols-3 gap-6 sm:gap-10 flex-shrink-0">
                    <StatTriplet
                      value={streak.current}
                      label="Day streak"
                      accent={streak.current > 0 ? '#f97316' : '#5a4a3a'}
                    />
                    <StatTriplet
                      value={todayCount}
                      label="Today"
                      accent="#c4835b"
                    />
                    <StatTriplet
                      value={streak.best}
                      label="Best streak"
                      accent="#d4a056"
                    />
                  </div>

                  {/* Week activity bars */}
                  <div className="flex-1 lg:flex lg:justify-end">
                    <div className="flex items-end gap-1.5 sm:gap-2 h-12">
                      {week.map((d) => {
                        const heightPx = d.count > 0
                          ? Math.max(8, (d.count / maxWeekCount) * 40)
                          : 4;
                        return (
                          <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1 sm:flex-none sm:w-8 max-w-10">
                            <div
                              className="w-full sm:w-7 rounded-sm transition-all duration-500"
                              style={{
                                height: `${heightPx}px`,
                                background: d.count > 0
                                  ? `linear-gradient(to top, #c4553a, #d4a056)`
                                  : 'rgba(255,255,255,0.05)',
                                opacity: d.count > 0 ? Math.max(0.45, d.count / maxWeekCount) : 1,
                              }}
                              title={`${d.count} ep${d.count === 1 ? '' : 's'}`}
                            />
                            <span className="text-[10px] font-mono uppercase text-text-muted tracking-widest">
                              {d.day.slice(0, 1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.section>
            );
          })()}

          {/* STATS BENTO — 3-card row */}
          {(totalEpisodes > 0 || genreEntries.length > 0 || collectionsTotal > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Card 1: Watch stats */}
              {totalEpisodes > 0 && (
                <motion.section
                  variants={fadeUp}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <StatBlock value={totalEpisodes} label="Episodes" accent="#c4835b" />
                    <StatBlock value={totalHours} suffix="h" label="Watch time" accent="#d4a056" />
                    <StatBlock value={totalShows} label="Shows" accent="#c4553a" />
                    <StatBlock value={totalDays} suffix="d" label="Days of content" accent="#22c55e" />
                  </div>
                </motion.section>
              )}

              {/* Card 2: Genre DNA */}
              {genreEntries.length > 0 && (
                <motion.section
                  variants={fadeUp}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5 flex flex-col min-h-[180px]"
                >
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="text-h3 font-semibold text-white">Genre DNA</h3>
                    <span className="text-caption text-text-muted font-mono">
                      {String(genreEntries.length).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-1 min-h-0">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                      <GenreDonut entries={genreEntries} totalViews={totalGenreViews} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-mono text-h2 font-extrabold text-white tabular-nums leading-none">
                          {totalGenreViews}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5">
                          views
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {genreEntries.slice(0, 6).map(([genre, count], i) => {
                        const pct = Math.round((count / totalGenreViews) * 100);
                        const color = GENRE_COLORS[genre] || '#c4835b';
                        return (
                          <motion.div
                            key={genre}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.04 }}
                            className="flex items-center gap-2 group min-w-0"
                          >
                            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-caption text-text-secondary group-hover:text-white transition-colors break-words min-w-0 flex-1">
                              {genre}
                            </span>
                            <span className="text-caption font-mono text-text-muted tabular-nums">
                              {pct}%
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Card 3: Collections */}
              <motion.section
                variants={fadeUp}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5 flex flex-col"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <p className="font-mono text-h1 sm:text-display-sm font-extrabold text-white tabular-nums leading-none">
                      {collections.length}
                    </p>
                    <p className="mt-2 text-meta uppercase text-text-muted font-semibold tracking-widest">
                      Collections · {collectionsTotal} items
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {collections.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 text-caption px-2.5 py-1 rounded-full bg-white/[0.03] text-text-secondary border border-white/[0.06]"
                    >
                      {c.name}
                      {c.shows.length > 0 && (
                        <span className="font-mono text-text-muted tabular-nums">{c.shows.length}</span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="mt-auto pt-4 text-caption text-text-muted">
                  Add from any show or movie page via &ldquo;Add to collection&rdquo;.
                </p>
              </motion.section>
            </div>
          )}
                </div>
              )}
            </motion.section>
          )}

          {/* YOUR COLLECTIONS */}
          {usedCollections.length > 0 && (
            <motion.section variants={fadeUp} className="mb-10">
              <SectionHeader
                title="Your collections"
                count={usedCollections.length}
              />
              <div className="space-y-6">
                {usedCollections.map((col) => (
                  <div
                    key={col.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
                  >
                    <div className="flex items-baseline justify-between mb-4">
                      <h3 className="text-body font-semibold text-white flex items-center gap-2">
                        <span className="text-base opacity-80">{col.icon}</span>
                        {col.name}
                      </h3>
                      <span className="text-caption text-text-muted font-mono">
                        {String(col.shows.length).padStart(2, '0')}
                      </span>
                    </div>
                    <HorizontalScroll gapClass="gap-3" className="-mx-1 px-1">
                      {col.shows.map((item) => {
                        const href = (item.type === 'movie' ? '/movie/' : '/show/') + item.id;
                        const imgSrc = typeof item.image === 'string' ? item.image : getMediumImage(item.image);
                        return (
                          <Link
                            key={`${item.type || 'show'}-${item.id}`}
                            to={href}
                            className="group block w-[6.5rem] sm:w-[7.5rem] flex-shrink-0"
                          >
                            <div className="relative rounded-lg overflow-hidden aspect-[2/3] border border-white/[0.06] group-hover:border-accent-peach/40 transition-colors">
                              <img
                                src={imgSrc}
                                alt={item.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <p className="text-caption text-text-secondary mt-1.5 break-words min-w-0 group-hover:text-white transition-colors">
                              {item.name}
                            </p>
                          </Link>
                        );
                      })}
                    </HorizontalScroll>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* RECENTLY VIEWED */}
          {recentlyViewed.length > 0 && (
            <motion.section variants={fadeUp} className="mb-10">
              <SectionHeader title="Recently viewed" count={recentlyViewed.length} />
              <HorizontalScroll gapClass="gap-3" className="pb-2">
                  {recentlyViewed.slice(0, 14).map((show, i) => (
                    <motion.div
                      key={show.id}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.03 }}
                      className="flex-shrink-0"
                    >
                      <Link to={`/show/${show.id}`} className="group block">
                        <div className="relative w-[7.5rem] rounded-xl overflow-hidden aspect-[2/3] border border-white/[0.06] group-hover:border-accent-peach/40 transition-colors">
                          <img
                            src={getMediumImage(show.image)}
                            alt={show.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-70" />
                          <p className="absolute inset-x-0 bottom-0 p-2.5 text-[11px] text-white font-medium break-words min-w-0">
                            {show.name}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
              </HorizontalScroll>
            </motion.section>
          )}

          {/* TRACKING SINCE FOOTER */}
          {stats.firstTracked && (
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 pt-4">
              <div aria-hidden className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-white/10" />
              <p className="text-meta text-text-muted font-mono tracking-widest uppercase">
                Tracking since{' '}
                {new Date(stats.firstTracked).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div aria-hidden className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-white/10" />
            </motion.div>
          )}
        </motion.div>
      </Container>

      {/* Clear progress confirmation */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setConfirmClear(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-white/[0.10] bg-bg-elevated p-6 max-w-sm w-full shadow-elevation-3"
            >
              <h3 className="text-h3 font-semibold text-white mb-2">Clear progress?</h3>
              <p className="text-body-sm text-text-secondary mb-6 leading-relaxed">
                This will remove all watched-episode data for{' '}
                <strong className="text-white">{confirmClear.name}</strong>. Can't be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmClear(null)}
                  className="flex-1 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-text-secondary hover:text-white hover:bg-white/[0.08] text-body-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClearProgress}
                  className="flex-1 h-10 rounded-lg bg-accent-red/20 border border-accent-red/30 text-accent-red hover:bg-accent-red/30 text-body-sm font-semibold transition-colors"
                >
                  Clear progress
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

/* ──────────────────  STAT TRIPLET  ────────────────── */

function StatTriplet({ value, label, accent }) {
  return (
    <div>
      <p
        className="font-mono text-h1 sm:text-display-sm font-extrabold tabular-nums leading-none"
        style={{ color: 'white' }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-meta uppercase text-text-muted font-semibold tracking-widest">
        {label}
      </p>
      <div
        className="w-8 h-0.5 rounded-full mt-2"
        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
      />
    </div>
  );
}
