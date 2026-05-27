import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { fetchApi } from '../../api/tvmaze';
import { getMediumImage } from '../../utils/imageUrl';

export default function WhatsNew() {
  const [updatedShows, setUpdatedShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUpdates() {
      try {
        const updates = await fetchApi(endpoints.showUpdates('day'));
        if (!updates) return;

        const entries = Object.entries(updates)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 12);

        const shows = await Promise.allSettled(
          entries.map(([id]) => fetchApi(endpoints.show(id)))
        );

        setUpdatedShows(
          shows
            .filter((r) => r.status === 'fulfilled' && r.value)
            .map((r) => r.value)
        );
      } catch (err) {
        console.error('Failed to load updates:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUpdates();
  }, []);

  if (isLoading) {
    return (
      <section className="border-t border-white/[0.06] pt-section">
        <div className="mb-5">
          <div className="h-3 w-24 bg-bg-elevated rounded animate-pulse" />
          <div className="h-7 w-48 bg-bg-elevated rounded animate-pulse mt-2" />
        </div>
        <div className="card-grid-compact">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-bg-elevated animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (updatedShows.length === 0) return null;

  return (
    <section className="border-t border-white/[0.06] pt-section">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-peach opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-peach" />
            </span>
            Live updates
          </p>
          <h2 className="mt-1.5 text-h3 sm:text-h2 font-extrabold tracking-tight text-white leading-tight">
            What's new
          </h2>
          <p className="text-caption text-text-muted mt-1">
            Shows refreshed in the last 24 hours
            <span className="mx-2">·</span>
            <span className="font-mono tabular-nums">{String(updatedShows.length).padStart(2, '0')}</span>
          </p>
        </div>
      </div>

      <div className="card-grid-compact">
        {updatedShows.map((show, i) => (
          <motion.div
            key={show.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
          >
            <Link to={`/show/${show.id}`} className="group block">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-white/20 transition-all">
                <img
                  src={getMediumImage(show.image)}
                  alt={show.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute top-2 right-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-white border border-white/10">
                    Updated
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-body-sm font-semibold text-white break-words">{show.name}</p>
                  {show.genres?.[0] && (
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">
                      {show.genres[0]}
                    </p>
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
