import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { fetchApi } from '../../api/tvmaze';
import { formatEpisodeCode } from '../../utils/formatters';
import { getMediumImage } from '../../utils/imageUrl';

export default function OnThisDay() {
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOnThisDay() {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const data = await fetchApi(endpoints.schedule('US', today));
        if (!data) return;

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
      <section className="border-t border-white/[0.06] pt-section">
        <div className="mb-5">
          <div className="h-3 w-24 bg-bg-elevated rounded animate-pulse" />
          <div className="h-7 w-48 bg-bg-elevated rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 bg-bg-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (episodes.length === 0) return null;

  const todayFormatted = format(new Date(), 'MMMM d');
  const todayWeekday = format(new Date(), 'EEEE');

  return (
    <section className="border-t border-white/[0.06] pt-section">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            {todayWeekday} · Airing today
          </p>
          <h2 className="mt-1.5 text-h2 font-extrabold tracking-tight text-white leading-tight">
            New episodes on {todayFormatted}
          </h2>
        </div>
        <Link
          to="/schedule"
          className="hidden sm:inline-flex items-center gap-1.5 text-body-sm font-semibold text-text-secondary hover:text-white transition-colors flex-shrink-0 pb-1"
        >
          Full schedule
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {episodes.map((ep, i) => (
          <motion.div
            key={`${ep.id}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.3) }}
          >
            <Link
              to={`/show/${ep.show?.id}`}
              className="block group p-3 rounded-xl ring-1 ring-white/[0.06] hover:ring-white/20 hover:bg-white/[0.02] transition-all h-full"
            >
              <div className="flex gap-3">
                <img
                  src={getMediumImage(ep.show?.image)}
                  alt={ep.show?.name}
                  className="w-14 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-meta font-mono tabular-nums text-text-secondary">
                      {formatEpisodeCode(ep.season, ep.number)}
                    </span>
                    {ep.airtime && (
                      <>
                        <span className="text-text-muted">·</span>
                        <span className="text-meta font-mono tabular-nums text-text-muted">{ep.airtime}</span>
                      </>
                    )}
                  </div>
                  <h4 className="text-body-sm font-semibold text-white break-words mt-0.5 group-hover:text-accent-peach transition-colors">
                    {ep.show?.name}
                  </h4>
                  <p className="text-caption text-text-muted break-words mt-0.5">{ep.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {ep.show?.network?.name && (
                      <span className="text-[10px] uppercase tracking-widest text-text-muted">{ep.show.network.name}</span>
                    )}
                    {ep.show?.rating?.average && (
                      <>
                        {ep.show?.network?.name && <span className="text-text-muted">·</span>}
                        <span className="text-meta font-mono tabular-nums text-accent-gold">
                          {ep.show.rating.average.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
