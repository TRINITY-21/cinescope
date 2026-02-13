import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import { useApp } from '../../context/AppContext';
import { getMediumImage } from '../../utils/imageUrl';
import GlassPanel from '../ui/GlassPanel';

export default function TonightsPlan() {
  const { watchedEpisodes } = useApp();
  const [budget, setBudget] = useState(120); // minutes
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  const inProgressIds = useMemo(() =>
    Object.entries(watchedEpisodes)
      .filter(([, eps]) => eps.length > 0)
      .map(([id]) => id),
    [watchedEpisodes]
  );

  useEffect(() => {
    if (inProgressIds.length === 0) { setLoading(false); return; }
    let cancelled = false;

    async function buildPlan() {
      try {
        const results = await Promise.all(
          inProgressIds.slice(0, 8).map(async (showId) => {
            const [show, episodes] = await Promise.all([
              fetchApi(endpoints.show(showId)),
              fetchApi(endpoints.showEpisodes(showId)),
            ]);
            return { show, episodes: episodes || [] };
          })
        );

        if (cancelled) return;

        const items = [];
        for (const { show, episodes } of results) {
          const watchedSet = new Set(watchedEpisodes[show.id] || []);
          const nextEps = episodes
            .filter((ep) => !watchedSet.has(ep.id) && ep.season != null && ep.number != null)
            .sort((a, b) => a.season - b.season || a.number - b.number);

          if (nextEps.length > 0) {
            const runtime = nextEps[0].runtime || show.runtime || show.averageRuntime || 45;
            items.push({ show, nextEps, runtime, watchedCount: watchedSet.size, totalEps: episodes.length });
          }
        }

        // Sort: shows closer to completion first
        items.sort((a, b) => (b.watchedCount / b.totalEps) - (a.watchedCount / a.totalEps));
        setPlan(items);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    buildPlan();
    return () => { cancelled = true; };
  }, [inProgressIds, watchedEpisodes]);

  if (loading || inProgressIds.length === 0) return null;

  // Fit episodes into budget
  let remaining = budget;
  const tonight = [];
  for (const item of plan) {
    if (remaining <= 0) break;
    const count = Math.min(
      Math.floor(remaining / item.runtime) || 1,
      item.nextEps.length
    );
    if (count > 0) {
      tonight.push({
        ...item,
        epsToWatch: count,
        firstEp: item.nextEps[0],
        minutesNeeded: count * item.runtime,
      });
      remaining -= count * item.runtime;
    }
  }

  if (tonight.length === 0) return null;

  const totalMinutes = tonight.reduce((s, t) => s + t.minutesNeeded, 0);
  const totalEps = tonight.reduce((s, t) => s + t.epsToWatch, 0);

  return (
    <GlassPanel glow="violet" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-violet/5 flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Tonight's Plan</h3>
            <p className="text-[11px] text-text-muted">{totalEps} ep{totalEps !== 1 ? 's' : ''} &middot; ~{Math.round(totalMinutes / 60 * 10) / 10}h</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted">Budget:</span>
          <select
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-violet/50 cursor-pointer"
          >
            <option value={60}>1h</option>
            <option value={90}>1.5h</option>
            <option value={120}>2h</option>
            <option value={180}>3h</option>
            <option value={240}>4h</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {tonight.map(({ show, epsToWatch, firstEp, minutesNeeded, runtime }) => (
          <Link
            key={show.id}
            to={`/show/${show.id}`}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
          >
            <img
              src={getMediumImage(show.image)}
              alt={show.name}
              className="w-10 h-14 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-accent-violet transition-colors">{show.name}</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {epsToWatch > 1 ? `${epsToWatch} episodes` : '1 episode'}
                {' '}starting S{String(firstEp.season).padStart(2, '0')}E{String(firstEp.number).padStart(2, '0')}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-medium text-text-secondary">{minutesNeeded}min</p>
              <p className="text-[10px] text-text-muted">{runtime}min/ep</p>
            </div>
          </Link>
        ))}
      </div>

      {remaining < 0 && (
        <p className="text-[11px] text-accent-gold/70 text-center">
          ~{Math.abs(Math.round(remaining))}min over budget
        </p>
      )}
    </GlassPanel>
  );
}
