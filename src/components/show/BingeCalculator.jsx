import { useMemo } from 'react';
import GlassPanel from '../ui/GlassPanel';
import { useApp } from '../../context/AppContext';

export default function BingeCalculator({ show, episodes }) {
  const { getShowProgress } = useApp();

  const calc = useMemo(() => {
    if (!episodes || episodes.length === 0) return null;

    const totalEpisodes = episodes.length;
    const totalMinutes = episodes.reduce((sum, ep) => sum + (ep.runtime || show?.runtime || show?.averageRuntime || 45), 0);
    const totalHours = Math.round(totalMinutes / 60);
    const totalDays = (totalMinutes / (60 * 24)).toFixed(1);

    const progress = show ? getShowProgress(show.id, totalEpisodes) : { watched: 0, percentage: 0 };
    const remainingEps = totalEpisodes - progress.watched;
    const remainingMinutes = Math.round((remainingEps / totalEpisodes) * totalMinutes);
    const remainingHours = Math.round(remainingMinutes / 60);

    const binge4h = Math.ceil(remainingMinutes / (4 * 60));
    const binge8h = Math.ceil(remainingMinutes / (8 * 60));
    const bingeMarathon = Math.ceil(remainingMinutes / (12 * 60));

    return { totalEpisodes, totalMinutes, totalHours, totalDays, remainingEps, remainingHours, binge4h, binge8h, bingeMarathon, progress };
  }, [episodes, show]);

  if (!calc) return null;

  return (
    <GlassPanel glow="violet" className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🍿</span>
        <h3 className="font-bold text-white text-lg">Binge Calculator</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-white">{calc.totalEpisodes}</p>
          <p className="text-xs text-text-secondary mt-1">Total Episodes</p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-white">{calc.totalHours}<span className="text-sm text-text-muted">h</span></p>
          <p className="text-xs text-text-secondary mt-1">Total Runtime</p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-white">{calc.totalDays}</p>
          <p className="text-xs text-text-secondary mt-1">Days Non-Stop</p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-accent-violet">{calc.progress.percentage}%</p>
          <p className="text-xs text-text-secondary mt-1">Your Progress</p>
        </div>
      </div>

      {calc.progress.watched > 0 && (
        <div>
          <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent-violet to-accent-red rounded-full transition-all duration-700" style={{ width: `${calc.progress.percentage}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-1">{calc.progress.watched} of {calc.totalEpisodes} episodes watched</p>
        </div>
      )}

      {calc.remainingEps > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-sm text-text-secondary mb-3">
            <span className="text-white font-semibold">{calc.remainingEps} episodes</span> ({calc.remainingHours}h) remaining:
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-primary/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-accent-gold">{calc.binge4h}</p>
              <p className="text-[10px] text-text-muted mt-0.5">days @ 4h/day</p>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-green-400">{calc.binge8h}</p>
              <p className="text-[10px] text-text-muted mt-0.5">days @ 8h/day</p>
            </div>
            <div className="bg-bg-primary/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-accent-red">{calc.bingeMarathon}</p>
              <p className="text-[10px] text-text-muted mt-0.5">days marathon</p>
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
