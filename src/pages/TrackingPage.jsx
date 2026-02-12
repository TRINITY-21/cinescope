import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import Container from '../components/ui/Container';
import { useApp } from '../context/AppContext';
import { GENRE_COLORS } from '../utils/constants';
import { formatYear } from '../utils/formatters';
import { getMediumImage, getTmdbPosterUrl } from '../utils/imageUrl';


const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Visualizations ─── */

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
          key={seg.genre} r={radius} cx="100" cy="100" fill="none" stroke={seg.color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${seg.arcLen} ${circumference - seg.arcLen}`}
          transform={`rotate(${seg.angle - 90} 100 100)`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
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
        fill="white" fontSize={size * 0.24} fontWeight="700"
        className="transform rotate-90" style={{ transformOrigin: 'center' }}
      >
        {percentage}%
      </text>
    </svg>
  );
}

/* ─── Tracked Show Card ─── */

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
        if (!cancelled) { setShow(showData); setTotalEpisodes(epsData?.length || 0); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [showId]);

  if (loading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-28 rounded-lg bg-bg-elevated flex-shrink-0" />
          <div className="flex-1 space-y-3"><div className="h-4 w-3/4 bg-bg-elevated rounded" /><div className="h-3 w-1/2 bg-bg-elevated rounded" /><div className="h-2 w-full bg-bg-elevated rounded mt-4" /></div>
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} layout className="glass rounded-xl p-3 sm:p-4 hover:border-white/10 transition-all group">
      <div className="flex gap-3 sm:gap-4">
        <Link to={`/show/${show.id}`} className="flex-shrink-0">
          <img src={getMediumImage(show.image)} alt={show.name} className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg object-cover group-hover:ring-2 ring-accent-violet/50 transition-all" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <Link to={`/show/${show.id}`} className="hover:text-accent-violet transition-colors">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{show.name}</h3>
              </Link>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                <span className="text-[11px] sm:text-xs text-text-secondary">{formatYear(show.premiered)}</span>
                {show.network && (<><span className="text-text-muted text-[11px] sm:text-xs">·</span><span className="text-[11px] sm:text-xs text-text-secondary">{show.network.name}</span></>)}
                {isComplete && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">Complete</span>}
              </div>
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <span className="text-[10px] sm:text-[11px] text-text-secondary">{watched} of {totalEpisodes} episodes</span>
              {hoursWatched > 0 && <span className="text-[10px] sm:text-[11px] text-text-muted">{hoursWatched}h watched</span>}
            </div>
            <div className="h-1 sm:h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-accent-violet'}`} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 sm:mt-3">
            <Link to={`/show/${show.id}`} className="text-[11px] sm:text-xs text-accent-violet hover:text-accent-gold transition-colors font-medium whitespace-nowrap">
              {isComplete ? 'View show' : 'Continue watching'}
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => onClear(show.id, show.name)} className="text-[11px] sm:text-xs text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                Clear progress
              </button>
              <div className="flex-shrink-0 sm:hidden"><ProgressRing percentage={percentage} size={28} strokeWidth={2.5} /></div>
              <div className="flex-shrink-0 hidden sm:block"><ProgressRing percentage={percentage} size={34} strokeWidth={3} /></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */

export default function TrackingPage() {
  const {
    watchedEpisodes, stats, clearShowProgress,
    watchlist, movieWatchlist, removeMovieFromWatchlist,
    recentlyViewed, collections,
  } = useApp();
  const [confirmClear, setConfirmClear] = useState(null);

  useEffect(() => {
    document.title = 'My Library — CineScope';
    return () => { document.title = 'CineScope'; };
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

  const hasData = totalEpisodes > 0 || watchlist.length > 0 || movieWatchlist.length > 0 || collectionsTotal > 0;

  function handleClearProgress(showId, showName) { setConfirmClear({ id: showId, name: showName }); }
  function confirmClearProgress() {
    if (!confirmClear) return;
    clearShowProgress(confirmClear.id);
    setConfirmClear(null);
  }

  // Empty state
  if (!hasData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
        <Container>
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-text-muted">
                  <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-bg-elevated border border-white/10 flex items-center justify-center">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your library is empty</h2>
            <p className="text-text-secondary max-w-sm mb-8 text-sm leading-relaxed">
              Start watching shows, tracking episodes, and saving movies. Your personal entertainment hub will come alive with data.
            </p>
            <div className="flex gap-3">
              <Link to="/browse" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-violet/80 text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent-violet/20 transition-all">
                Browse Shows
              </Link>
              <Link to="/movies" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10 transition-all">
                Browse Movies
              </Link>
            </div>
          </div>
        </Container>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-12 sm:pb-16">
      <Container>
        <motion.div variants={stagger} initial="initial" animate="animate">

          {/* ═══════════ HEADER ═══════════ */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">My Library</h1>
              <p className="text-text-secondary mt-2 text-sm">
                {trackedShowIds.length} show{trackedShowIds.length !== 1 ? 's' : ''} tracked
                {movieWatchlist.length > 0 ? ` · ${movieWatchlist.length} movie${movieWatchlist.length !== 1 ? 's' : ''} saved` : ''}
                {watchlist.length > 0 ? ` · ${watchlist.length} in watchlist` : ''}
              </p>
            </div>
          </div>

          {/* ═══════════ STATS + GENRE DNA + COLLECTIONS (single row) ═══════════ */}
          {(totalEpisodes > 0 || genreEntries.length > 0 || collectionsTotal > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
              {/* Card 1: Stats */}
              {totalEpisodes > 0 && (
                <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-bg-elevated/50 border border-white/[0.05] noise-overlay min-h-[200px] flex flex-col justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/[0.08] via-transparent to-accent-red/[0.06]" />
                  <div className="absolute inset-0 border border-white/[0.06] rounded-2xl pointer-events-none" />
                  <div className="relative z-10 p-6">
                    <div className="grid grid-cols-2 gap-4 sm:gap-5">
                      {[
                        { value: totalEpisodes, label: 'Episodes', suffix: '', color: 'accent-violet', delay: 0.3 },
                        { value: totalHours, label: 'Watch time', suffix: 'h', color: 'accent-gold', delay: 0.4 },
                        { value: totalShows, label: 'Shows', suffix: '', color: 'accent-red', delay: 0.5 },
                        { value: totalDays, label: 'Days of content', suffix: 'd', color: 'green-500', delay: 0.6 },
                      ].map((stat) => (
                        <div key={stat.label}>
                          <motion.p
                            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: stat.delay, duration: 0.5 }}
                          >
                            {stat.value}{stat.suffix && <span className="text-base font-semibold text-text-muted ml-0.5">{stat.suffix}</span>}
                          </motion.p>
                          <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
                          <div className={`w-8 h-0.5 rounded-full bg-gradient-to-r from-${stat.color} to-transparent mt-1.5 animate-glow-breathe`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Card 2: Genre DNA */}
              {genreEntries.length > 0 && (
                <motion.div variants={fadeUp} className="rounded-2xl bg-bg-elevated/50 border border-white/[0.05] gradient-border p-6 flex flex-col min-h-[200px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-violet/5 flex items-center justify-center">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
                        <path d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Genre DNA</h3>
                      <p className="text-xs text-text-muted">{genreEntries.length} genres explored</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-1 min-h-0">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                      <GenreDonut entries={genreEntries} totalViews={totalGenreViews} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-extrabold text-white">{totalGenreViews}</span>
                        <span className="text-[9px] uppercase tracking-widest text-text-muted">views</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0 overflow-hidden">
                      {genreEntries.slice(0, 6).map(([genre, count], i) => {
                        const pct = Math.round((count / totalGenreViews) * 100);
                        return (
                          <motion.div key={genre} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="flex items-center gap-2 group">
                            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: GENRE_COLORS[genre] || '#c4835b' }} />
                            <span className="text-xs text-text-secondary group-hover:text-white transition-colors truncate flex-1">{genre}</span>
                            <span className="text-[11px] font-mono text-text-muted tabular-nums">{pct}%</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Card 3: Collections */}
              
                <motion.div variants={fadeUp} className="rounded-2xl bg-bg-elevated/50 border border-white/[0.05] p-6 min-h-[200px] flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-red/20 to-accent-red/5 flex items-center justify-center">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-accent-red">
                        <path d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.243 1.007-2.25 2.25-2.25h13.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white leading-none">{collections.length}</p>
                      <p className="text-xs text-text-muted mt-1">Collections &middot; {collectionsTotal} shows</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {collections.map((c) => (
                      <span key={c.id} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:border-white/10 transition-colors cursor-default">
                        {c.name}{c.shows.length > 0 && <span className="text-text-muted ml-1.5">{c.shows.length}</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted mt-3">
                    Add shows and movies from their pages via &ldquo;Add to collection&rdquo;.
                  </p>
                </motion.div>
              
            </div>
          )}

          {/* ═══════════ YOUR COLLECTIONS (items) ═══════════ */}
          {collectionsTotal > 0 && (
            <motion.div variants={fadeUp} className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-red/20 to-accent-red/5 flex items-center justify-center">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-red">
                    <path d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.243 1.007-2.25 2.25-2.25h13.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Your collections</h3>
                  <p className="text-xs text-text-muted">{collectionsTotal} item{collectionsTotal !== 1 ? 's' : ''} across {collections.filter((c) => c.shows.length > 0).length} collection{collections.filter((c) => c.shows.length > 0).length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-6">
                {collections.filter((c) => c.shows.length > 0).map((col) => (
                  <div key={col.id} className="rounded-xl bg-bg-elevated/30 border border-white/[0.05] p-4">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <span>{col.icon}</span> {col.name}
                    </h4>
                    <div className="relative">
                      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
                        {col.shows.map((item) => {
                          const href = (item.type === 'movie' ? '/movie/' : '/show/') + item.id;
                          const imgSrc = typeof item.image === 'string' ? item.image : getMediumImage(item.image);
                          return (
                            <Link key={item.id} to={href} className="group block w-[6.5rem] sm:w-[7.5rem] flex-shrink-0">
                              <div className="relative rounded-lg overflow-hidden aspect-[2/3] ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all">
                                <img src={imgSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <p className="text-xs text-text-secondary mt-1.5 truncate group-hover:text-white transition-colors">{item.name}</p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ TRACKED SHOWS ═══════════ */}
          {trackedShowIds.length > 0 && (
            <motion.div variants={fadeUp} className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-violet/5 flex items-center justify-center">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
                    <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tracked Shows</h3>
                  <p className="text-xs text-text-muted">{trackedShowIds.length} show{trackedShowIds.length !== 1 ? 's' : ''} in progress</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {trackedShowIds.map((showId) => (
                    <TrackedShowCard key={showId} showId={showId} watchedIds={watchedEpisodes[showId] || []} onClear={handleClearProgress} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ═══════════ SHOW WATCHLIST ═══════════ */}
          {watchlist.length > 0 && (
            <motion.div variants={fadeUp} className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-violet/5 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
                      <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Show Watchlist</h3>
                    <p className="text-xs text-text-muted">{watchlist.length} shows saved</p>
                  </div>
                </div>
                <Link to="/browse" className="text-xs text-text-muted hover:text-accent-violet transition-colors flex items-center gap-1.5">
                  Add more <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {watchlist.map((show, i) => (
                  <motion.div key={show.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03, duration: 0.4 }}>
                    <Link to={`/show/${show.id}`} className="group block">
                      <div className="relative rounded-xl overflow-hidden aspect-[2/3] ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all">
                        <img src={getMediumImage(show.image)} alt={show.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <p className="text-xs text-text-secondary mt-1.5 truncate group-hover:text-white transition-colors">{show.name}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ MOVIE WATCHLIST ═══════════ */}
          {movieWatchlist.length > 0 && (
            <motion.div variants={fadeUp} className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold">
                      <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Movie Watchlist</h3>
                    <p className="text-xs text-text-muted">{movieWatchlist.length} movie{movieWatchlist.length !== 1 ? 's' : ''} saved</p>
                  </div>
                </div>
                <Link to="/movies" className="text-xs text-text-muted hover:text-accent-gold transition-colors flex items-center gap-1.5">
                  Browse movies <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {movieWatchlist.map((movie, i) => (
                  <motion.div key={movie.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.03, duration: 0.4 }}>
                    <Link to={`/movie/${movie.id}`} className="group block relative">
                      <div className="relative rounded-xl overflow-hidden aspect-[2/3] ring-1 ring-white/[0.06] group-hover:ring-accent-gold/30 transition-all">
                        <img src={getTmdbPosterUrl(movie.poster_path)} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMovieFromWatchlist(movie.id); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
                          aria-label="Remove from watchlist"
                        >
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary mt-1.5 truncate group-hover:text-white transition-colors">{movie.title}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ RECENTLY VIEWED ═══════════ */}
          {recentlyViewed.length > 0 && (
            <motion.div variants={fadeUp} className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 flex items-center justify-center">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold">
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Recently Viewed</h3>
                  <p className="text-xs text-text-muted">{recentlyViewed.length} shows</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-1">
                  {recentlyViewed.slice(0, 14).map((show, i) => (
                    <motion.div key={show.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }} className="flex-shrink-0">
                      <Link to={`/show/${show.id}`} className="group block">
                        <div className="relative w-[7.5rem] rounded-xl overflow-hidden aspect-[2/3] ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all">
                          <img src={getMediumImage(show.image)} alt={show.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-[11px] text-white font-medium truncate">{show.name}</p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════ TRACKING SINCE FOOTER ═══════════ */}
          {stats.firstTracked && (
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 pt-4">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-white/10" />
              <p className="text-[11px] text-text-muted font-mono tracking-wide">
                Tracking since {new Date(stats.firstTracked).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-white/10" />
            </motion.div>
          )}

        </motion.div>
      </Container>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmClear(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-white mb-2">Clear progress?</h3>
              <p className="text-sm text-text-secondary mb-6">
                This will remove all watched episode data for <strong className="text-white">{confirmClear.name}</strong>. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmClear(null)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-text-secondary hover:text-white text-sm font-medium transition-colors">Cancel</button>
                <button onClick={confirmClearProgress} className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors">Clear Progress</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
