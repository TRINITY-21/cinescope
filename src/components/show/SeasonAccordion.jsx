import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EpisodeRow from './EpisodeRow';
import { formatAirDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export default function SeasonAccordion({ seasons, episodes, specialEpisodes, showId, onEpisodeSelect }) {
  const [openSeason, setOpenSeason] = useState(seasons?.[0]?.id);
  const [showSpecials, setShowSpecials] = useState(false);
  const { isEpisodeWatched, markSeasonWatched } = useApp();

  if (!seasons || seasons.length === 0) return <p className="text-text-secondary">No season data available.</p>;

  const episodesBySeason = {};
  episodes?.forEach((ep) => {
    if (!episodesBySeason[ep.season]) episodesBySeason[ep.season] = [];
    episodesBySeason[ep.season].push(ep);
  });

  // Find specials — episodes in specialEpisodes but not in regular episodes
  const regularIds = new Set(episodes?.map((e) => e.id) || []);
  const specials = (specialEpisodes || []).filter((ep) => !regularIds.has(ep.id));

  function handleMarkSeasonWatched(seasonNumber) {
    const seasonEps = episodesBySeason[seasonNumber] || [];
    const ids = seasonEps.map((ep) => ep.id);
    const avgRuntime = seasonEps[0]?.runtime || 0;
    markSeasonWatched(showId, ids, avgRuntime);
  }

  return (
    <div className="space-y-2">
      {/* Specials toggle */}
      {specials.length > 0 && (
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={() => setShowSpecials(!showSpecials)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showSpecials
                ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'
                : 'glass text-text-secondary hover:text-white'
            }`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Specials ({specials.length})
          </button>
        </div>
      )}

      {seasons.map((season) => {
        const isOpen = openSeason === season.id;
        const seasonEps = episodesBySeason[season.number] || [];
        const watchedCount = showId ? seasonEps.filter((ep) => isEpisodeWatched(showId, ep.id)).length : 0;
        const progressPct = seasonEps.length > 0 ? Math.round((watchedCount / seasonEps.length) * 100) : 0;

        return (
          <div key={season.id} className="rounded-xl overflow-hidden border border-white/5">
            <button
              onClick={() => setOpenSeason(isOpen ? null : season.id)}
              className="w-full flex items-center justify-between p-3 sm:p-4 bg-bg-elevated/50 hover:bg-bg-elevated/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <span className="text-base sm:text-lg font-bold text-white">Season {season.number}</span>
                <span className="text-xs sm:text-sm text-text-secondary">{seasonEps.length} eps</span>
                {season.premiereDate && (
                  <span className="text-sm text-text-muted hidden sm:inline">{formatAirDate(season.premiereDate)}</span>
                )}
                {showId && seasonEps.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 ml-auto mr-4">
                    <div className="w-24 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                      <div className="h-full bg-accent-violet rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-xs text-text-muted whitespace-nowrap">{watchedCount}/{seasonEps.length}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showId && seasonEps.length > 0 && watchedCount < seasonEps.length && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkSeasonWatched(season.number); }}
                    className="text-xs px-3 py-1 rounded-lg bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20 transition-colors whitespace-nowrap"
                  >
                    Mark all
                  </button>
                )}
                {watchedCount === seasonEps.length && seasonEps.length > 0 && (
                  <span className="text-xs text-green-400">✓ Complete</span>
                )}
                <motion.svg
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  className="text-text-secondary flex-shrink-0"
                >
                  <path d="M6 9l6 6 6-6"/>
                </motion.svg>
              </div>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-white/5">
                    {seasonEps.map((ep) => (
                      <EpisodeRow key={ep.id} episode={ep} showId={showId} onSelect={onEpisodeSelect} />
                    ))}
                    {seasonEps.length === 0 && <p className="p-4 text-text-secondary text-sm">No episodes available.</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Specials section */}
      <AnimatePresence>
        {showSpecials && specials.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl overflow-hidden border border-accent-gold/20 bg-accent-gold/[0.02]">
              <div className="p-4 bg-accent-gold/10 border-b border-accent-gold/20">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-lg font-bold text-white">Specials</span>
                  <span className="text-sm text-text-secondary">{specials.length} episodes</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {specials.map((ep) => (
                  <EpisodeRow key={ep.id} episode={ep} showId={showId} onSelect={onEpisodeSelect} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
