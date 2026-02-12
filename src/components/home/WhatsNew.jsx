import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import { getMediumImage } from '../../utils/imageUrl';
import Badge from '../ui/Badge';

export default function WhatsNew() {
  const [updatedShows, setUpdatedShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUpdates() {
      try {
        const updates = await fetchApi(endpoints.showUpdates('day'));
        if (!updates) return;

        // updates is { showId: timestamp, ... } — get the 12 most recently updated
        const entries = Object.entries(updates)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 12);

        // Fetch show details for each
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
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h2 className="text-xl font-bold text-white">What's New</h2>
        </div>
        <div className="card-grid-compact">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-xl bg-bg-elevated" />
              <div className="h-3 w-20 bg-bg-elevated rounded mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (updatedShows.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping" />
        </div>
        <h2 className="text-xl font-bold text-white">What's New</h2>
        <span className="text-xs text-text-muted">Updated in the last 24 hours</span>
      </div>

      <div className="card-grid-compact">
        {updatedShows.map((show, i) => (
          <motion.div
            key={show.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.06, 0.3) }}
          >
            <Link to={`/show/${show.id}`} className="group block">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5">
                <img
                  src={getMediumImage(show.image)}
                  alt={show.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium backdrop-blur-sm border border-green-500/20">
                    Updated
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-semibold text-white truncate">{show.name}</p>
                  {show.genres?.[0] && (
                    <p className="text-[10px] text-text-secondary mt-0.5">{show.genres[0]}</p>
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
