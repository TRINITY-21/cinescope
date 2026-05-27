import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { fetchApi } from '../../api/tvmaze';
import { useApp } from '../../context/AppContext';
import { getMediumImage } from '../../utils/imageUrl';

const BUDGETS = [
  { label: '1h', value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
  { label: '4h', value: 240 },
];

export default function TonightsPlan() {
  const { watchedEpisodes } = useApp();
  const [budget, setBudget] = useState(120);
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
  const hours = Math.round(totalMinutes / 60 * 10) / 10;

  return (
    <section className="border-t border-white/[0.06] pt-section">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Tonight's plan
          </p>
          <p className="mt-1.5 text-h3 sm:text-h2 font-extrabold tracking-tight text-white leading-tight">
            {totalEps} episode{totalEps !== 1 ? 's' : ''}
            <span className="text-text-muted font-normal mx-2">·</span>
            <span className="font-mono tabular-nums">{hours}h</span>
          </p>
          <p className="mt-1 text-caption text-text-muted">
            Built around what you're already watching.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.06] self-start sm:self-auto">
          {BUDGETS.map((b) => {
            const active = budget === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => setBudget(b.value)}
                className={`
                  px-3 h-7 rounded-full text-caption font-semibold tracking-tight font-mono tabular-nums
                  transition-colors
                  ${active
                    ? 'bg-white text-bg-primary'
                    : 'text-text-secondary hover:text-white'}
                `}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-white/[0.04] border-y border-white/[0.06]">
        {tonight.map(({ show, epsToWatch, firstEp, minutesNeeded, runtime }, idx) => (
          <Link
            key={show.id}
            to={`/show/${show.id}/watch?s=${firstEp.season}&e=${firstEp.number}`}
            className="flex items-center gap-4 py-4 group hover:bg-white/[0.02] transition-colors -mx-2 px-2 rounded-lg"
          >
            <span className="text-meta font-mono tabular-nums text-text-muted w-6 flex-shrink-0">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <img
              src={getMediumImage(show.image)}
              alt={show.name}
              className="w-12 h-16 rounded-md object-cover flex-shrink-0 ring-1 ring-white/[0.06] group-hover:ring-white/20 transition-all"
            />
            <div className="flex-1 min-w-0">
              <p className="text-body font-semibold text-white break-words group-hover:text-accent-peach transition-colors">
                {show.name}
              </p>
              <p className="text-caption text-text-muted mt-0.5 break-words">
                <span className="font-mono tabular-nums">
                  S{String(firstEp.season).padStart(2, '0')}E{String(firstEp.number).padStart(2, '0')}
                </span>
                {epsToWatch > 1 && (
                  <>
                    <span className="mx-1.5">·</span>
                    {epsToWatch} episodes
                  </>
                )}
              </p>
            </div>
            <div className="text-right flex-shrink-0 hidden sm:block">
              <p className="text-meta font-mono tabular-nums text-white">{minutesNeeded}m</p>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">
                {runtime}m/ep
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      {remaining < 0 && (
        <p className="mt-3 text-meta uppercase tracking-widest text-accent-gold/70">
          ~{Math.abs(Math.round(remaining))}m over budget
        </p>
      )}
    </section>
  );
}
