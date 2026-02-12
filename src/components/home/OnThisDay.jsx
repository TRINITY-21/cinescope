import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import { getMediumImage } from '../../utils/imageUrl';
import { formatEpisodeCode } from '../../utils/formatters';
import RatingBadge from '../ui/RatingBadge';

export default function OnThisDay() {
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOnThisDay() {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const data = await fetchApi(endpoints.schedule('US', today));
        if (!data) return;

        // Pick the highest-rated or most notable episodes (ones with ratings and images)
        const notable = data
          .filter((ep) => ep.show?.image && ep.show?.rating?.average)
          .sort((a, b) => (b.show?.rating?.average || 0) - (a.show?.rating?.average || 0))
          .slice(0, 8);

        setEpisodes(notable);
      } catch (err) {
        console.error('Failed to load On This Day:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadOnThisDay();
  }, []);

  if (isLoading) {
    return (
      <section>
        <h2 className="text-xl font-bold text-white mb-4">On This Day</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="animate-pulse glass rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-14 h-20 rounded-lg bg-bg-elevated" />
                <div className="flex-1">
                  <div className="h-3 w-20 bg-bg-elevated rounded" />
                  <div className="h-4 w-32 bg-bg-elevated rounded mt-2" />
                  <div className="h-3 w-24 bg-bg-elevated rounded mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (episodes.length === 0) return null;

  const todayFormatted = format(new Date(), 'MMMM d');

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <h2 className="text-xl font-bold text-white">Airing on {todayFormatted}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold font-medium">
          {episodes.length} top shows
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {episodes.map((ep, i) => (
          <motion.div
            key={`${ep.id}-${i}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.06, 0.3) }}
          >
            <Link to={`/show/${ep.show?.id}`} className="block group">
              <div className="glass rounded-xl p-3 hover:bg-white/[0.04] transition-all h-full">
                <div className="flex gap-3">
                  <img
                    src={getMediumImage(ep.show?.image)}
                    alt={ep.show?.name}
                    className="w-14 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-accent-gold">
                        {formatEpisodeCode(ep.season, ep.number)}
                      </span>
                      {ep.airtime && (
                        <span className="text-[10px] text-text-muted">{ep.airtime}</span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white truncate mt-0.5 group-hover:text-accent-violet transition-colors">
                      {ep.show?.name}
                    </h4>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{ep.name}</p>
                    {ep.show?.network?.name && (
                      <p className="text-[10px] text-text-muted mt-1">{ep.show.network.name}</p>
                    )}
                  </div>
                  {ep.show?.rating?.average && (
                    <div className="flex-shrink-0">
                      <RatingBadge rating={ep.show.rating.average} size="sm" />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
