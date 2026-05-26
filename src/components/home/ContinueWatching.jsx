import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { fetchApi } from '../../api/tvmaze';
import { useApp } from '../../context/AppContext';
import { getMediumImage } from '../../utils/imageUrl';
import Carousel from '../ui/Carousel';

/**
 * Continue Watching — the highest-leverage return-visit driver on the home page.
 *
 * For each in-progress show (any watched episode), we lazy-fetch the episode
 * list and surface the *next unwatched episode* explicitly with a direct
 * "Watch S1E5 →" CTA. That's what makes this strip actually useful versus a
 * generic "shows you opened recently" rail.
 *
 * Caches per show in memory for the session so spinning the home page doesn't
 * re-fetch the same episode lists.
 */

const episodeCache = new Map();

async function loadShowEpisodes(showId) {
  if (episodeCache.has(showId)) return episodeCache.get(showId);
  try {
    const eps = await fetchApi(endpoints.showEpisodes(showId));
    const sorted = (eps || []).filter((e) => e.season > 0).sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.number - b.number;
    });
    episodeCache.set(showId, sorted);
    return sorted;
  } catch {
    return [];
  }
}

function nextUnwatched(allEpisodes, watchedIds) {
  const watchedSet = new Set(watchedIds);
  return allEpisodes.find((e) => !watchedSet.has(e.id)) || null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function ContinueWatching() {
  const { recentlyViewed, watchedEpisodes } = useApp();
  const [byShowId, setByShowId] = useState({});

  const inProgress = recentlyViewed.filter((show) => {
    const eps = watchedEpisodes[show.id];
    return eps && eps.length > 0;
  });

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const updates = {};
      for (const show of inProgress) {
        if (byShowId[show.id]) continue;
        const eps = await loadShowEpisodes(show.id);
        if (cancelled) return;
        updates[show.id] = {
          total: eps.length,
          next: nextUnwatched(eps, watchedEpisodes[show.id] || []),
        };
      }
      if (Object.keys(updates).length && !cancelled) {
        setByShowId((p) => ({ ...p, ...updates }));
      }
    }
    if (inProgress.length) loadAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress.map((s) => s.id).join(','), watchedEpisodes]);

  if (inProgress.length === 0) return null;

  return (
    <Carousel title="Continue Watching" subtitle="Pick up where you left off">
      {inProgress.map((show) => {
        const watchedCount = (watchedEpisodes[show.id] || []).length;
        const meta = byShowId[show.id];
        const next = meta?.next;
        const total = meta?.total || 0;
        const pct = total > 0 ? Math.min(100, (watchedCount / total) * 100) : Math.min(90, watchedCount * 5);

        const detailHref = `/show/${show.id}`;
        const watchHref = next
          ? `/show/${show.id}/watch?s=${next.season}&e=${next.number}`
          : `/show/${show.id}/watch`;

        return (
          <div
            key={show.id}
            className="flex-shrink-0 snap-start w-60 sm:w-64 group"
          >
            <Link to={watchHref} className="block">
              <div className="relative rounded-xl overflow-hidden">
                <div className="aspect-video bg-bg-elevated">
                  <img src={getMediumImage(show.image)} alt={show.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-primary/50">
                  <div className="h-full bg-accent-peach" style={{ width: `${pct}%` }} />
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-xs font-bold flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    {next ? `S${pad(next.season)}E${pad(next.number)}` : 'Resume'}
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-3 right-3">
                  <p className="text-sm font-semibold text-white break-words group-hover:text-accent-peach transition-colors">
                    {show.name}
                  </p>
                  {next ? (
                    <p className="text-xs text-text-secondary break-words">
                      Next: {next.name}
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary">
                      {watchedCount} episode{watchedCount === 1 ? '' : 's'} watched
                    </p>
                  )}
                </div>
              </div>
            </Link>
            <div className="flex gap-2 mt-2">
              <Link
                to={watchHref}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-accent-peach/15 text-accent-peach hover:bg-accent-peach/25 text-center font-medium transition-colors"
              >
                {next ? `Watch S${pad(next.season)}E${pad(next.number)} →` : 'Resume →'}
              </Link>
              <Link
                to={detailHref}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white transition-colors"
              >
                Details
              </Link>
            </div>
          </div>
        );
      })}
    </Carousel>
  );
}
