import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import { useApp } from '../context/AppContext';
import { GENRE_COLORS } from '../utils/constants';
import { getMediumImage, getTmdbPosterUrl } from '../utils/imageUrl';

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

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
          r={radius}
          cx="100"
          cy="100"
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeLinecap="round"
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

export default function StatsPage() {
  const { stats, watchlist, movieWatchlist, recentlyViewed, watchedEpisodes, collections } = useApp();

  const totalShows = Object.keys(watchedEpisodes).length;
  const totalEpisodes = stats.totalEpisodesWatched || 0;
  const totalMinutes = stats.totalMinutesWatched || 0;
  const totalHours = Math.round(totalMinutes / 60);
  const totalDays = (totalMinutes / (60 * 24)).toFixed(1);

  const genreEntries = Object.entries(stats.genresWatched || {}).sort((a, b) => b[1] - a[1]);
  const totalGenreViews = genreEntries.reduce((sum, [, c]) => sum + c, 0);

  const hasData = totalEpisodes > 0 || watchlist.length > 0 || movieWatchlist.length > 0;

  const collectionsTotal = collections.reduce((sum, c) => sum + c.shows.length, 0);

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
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
                  <path d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your story begins here</h2>
            <p className="text-text-secondary max-w-sm mb-8 text-sm leading-relaxed">
              Watch shows, track episodes, and build your personal viewing profile. Your dashboard will come alive with data.
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-violet to-accent-gold text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent-violet/20 transition-all"
            >
              Discover Shows
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </Container>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-12 sm:pb-16">
      <Container>
        <motion.div variants={stagger} initial="initial" animate="animate">

          {/* ═══════════ HERO BANNER ═══════════ */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl mb-8 noise-overlay">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/[0.08] via-bg-elevated to-accent-red/[0.06]" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/[0.04] rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-violet/[0.06] rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-3xl pointer-events-none" />

            <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-10 md:px-12 md:py-14">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 sm:gap-y-8 sm:gap-x-6 md:gap-x-12">
                <div>
                  <motion.p
                    className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    {totalEpisodes}
                  </motion.p>
                  <p className="text-sm text-text-secondary mt-2">Episodes</p>
                  <div className="w-12 h-0.5 rounded-full bg-gradient-to-r from-accent-violet to-transparent mt-2 animate-glow-breathe" />
                </div>
                <div>
                  <motion.p
                    className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    {totalHours}<span className="text-xl font-semibold text-text-muted ml-0.5">h</span>
                  </motion.p>
                  <p className="text-sm text-text-secondary mt-2">Watch time</p>
                  <div className="w-12 h-0.5 rounded-full bg-gradient-to-r from-accent-gold to-transparent mt-2 animate-glow-breathe" />
                </div>
                <div>
                  <motion.p
                    className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    {totalShows}
                  </motion.p>
                  <p className="text-sm text-text-secondary mt-2">Shows</p>
                  <div className="w-12 h-0.5 rounded-full bg-gradient-to-r from-accent-red to-transparent mt-2 animate-glow-breathe" />
                </div>
                <div>
                  <motion.p
                    className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    {totalDays}<span className="text-xl font-semibold text-text-muted ml-0.5">d</span>
                  </motion.p>
                  <p className="text-sm text-text-secondary mt-2">Days of content</p>
                  <div className="w-12 h-0.5 rounded-full bg-gradient-to-r from-green-500 to-transparent mt-2 animate-glow-breathe" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══════════ BENTO GRID ═══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">

            {/* Genre DNA */}
            {genreEntries.length > 0 && (
              <motion.div variants={fadeUp} className="lg:col-span-7 rounded-2xl bg-bg-elevated/50 border border-white/[0.05] gradient-border p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-violet/5 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
                      <path d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                      <path d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Genre DNA</h3>
                    <p className="text-xs text-text-muted">{genreEntries.length} genres explored</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex-shrink-0">
                    <GenreDonut entries={genreEntries} totalViews={totalGenreViews} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalGenreViews}</span>
                      <span className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">views</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    {genreEntries.slice(0, 8).map(([genre, count], i) => {
                      const pct = Math.round((count / totalGenreViews) * 100);
                      return (
                        <motion.div
                          key={genre}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.06 }}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: GENRE_COLORS[genre] || '#c4835b', boxShadow: `0 0 6px ${GENRE_COLORS[genre] || '#c4835b'}40` }}
                          />
                          <span className="text-sm text-text-secondary group-hover:text-white transition-colors flex-1 truncate">
                            {genre}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-1 rounded-full bg-white/[0.04] overflow-hidden hidden sm:block">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: GENRE_COLORS[genre] || '#c4835b' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.6 + i * 0.06 }}
                              />
                            </div>
                            <span className="text-xs font-mono text-text-muted tabular-nums w-8 text-right">{pct}%</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Right column */}
            <div className={`${genreEntries.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-5`}>

              {/* Watchlist card */}
              <motion.div variants={fadeUp}>
                <button
                  onClick={() => document.getElementById('watchlist')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full text-left rounded-2xl bg-bg-elevated/50 border border-white/[0.05] p-6 hover:border-accent-gold/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 flex items-center justify-center group-hover:from-accent-gold/30 transition-all">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-accent-gold">
                          <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white leading-none">{watchlist.length + movieWatchlist.length}</p>
                        <p className="text-xs text-text-muted mt-1">In watchlist</p>
                      </div>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-text-muted group-hover:text-accent-gold transition-colors">
                      <path d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                    </svg>
                  </div>
                </button>
              </motion.div>

              {/* Collections */}
              <motion.div variants={fadeUp} className="rounded-2xl bg-bg-elevated/50 border border-white/[0.05] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
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
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {collections.map((c) => (
                    <span
                      key={c.id}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:border-white/10 transition-colors cursor-default"
                    >
                      {c.name}
                      {c.shows.length > 0 && <span className="text-text-muted ml-1.5">{c.shows.length}</span>}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-text-muted mt-3">
                  Add from show or movie pages via &ldquo;Add to collection&rdquo;.
                </p>
              </motion.div>
            </div>
          </div>

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
                    <motion.div
                      key={show.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }}
                      className="flex-shrink-0"
                    >
                      <Link to={`/show/${show.id}`} className="group block">
                        <div className="relative w-[7.5rem] rounded-xl overflow-hidden aspect-[2/3] ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all">
                          <img
                            src={getMediumImage(show.image)}
                            alt={show.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
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

          {/* ═══════════ WATCHLIST GRID ═══════════ */}
          {watchlist.length > 0 && (
            <motion.div variants={fadeUp} id="watchlist" className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-violet/5 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
                      <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Watchlist</h3>
                    <p className="text-xs text-text-muted">{watchlist.length} shows saved</p>
                  </div>
                </div>
                <Link
                  to="/browse"
                  className="text-xs text-text-muted hover:text-accent-violet transition-colors flex items-center gap-1.5"
                >
                  Add more
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {watchlist.map((show, i) => (
                  <motion.div
                    key={show.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.03, duration: 0.4 }}
                  >
                    <Link to={`/show/${show.id}`} className="group block">
                      <div className="relative rounded-xl overflow-hidden aspect-[2/3] ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all">
                        <img
                          src={getMediumImage(show.image)}
                          alt={show.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <p className="text-xs text-text-secondary mt-1.5 truncate group-hover:text-white transition-colors">{show.name}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ MOVIE WATCHLIST GRID ═══════════ */}
          {movieWatchlist.length > 0 && (
            <motion.div variants={fadeUp} id="movie-watchlist" className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold">
                      <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Movie Watchlist</h3>
                    <p className="text-xs text-text-muted">{movieWatchlist.length} movies saved</p>
                  </div>
                </div>
                <Link
                  to="/movies"
                  className="text-xs text-text-muted hover:text-accent-gold transition-colors flex items-center gap-1.5"
                >
                  Browse movies
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {movieWatchlist.map((movie, i) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.03, duration: 0.4 }}
                  >
                    <Link to={`/movie/${movie.id}`} className="group block">
                      <div className="relative rounded-xl overflow-hidden aspect-[2/3] ring-1 ring-white/[0.06] group-hover:ring-accent-gold/30 transition-all">
                        <img
                          src={getTmdbPosterUrl(movie.poster_path)}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <p className="text-xs text-text-secondary mt-1.5 truncate group-hover:text-white transition-colors">{movie.title}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════ FOOTER ═══════════ */}
          {stats.firstTracked && (
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 pt-4">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-white/10" />
              <p className="text-[11px] text-text-muted font-mono tracking-wide">
                {new Date(stats.firstTracked).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-white/10" />
            </motion.div>
          )}

        </motion.div>
      </Container>
    </motion.div>
  );
}
