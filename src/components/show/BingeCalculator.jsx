import { useMemo, useState } from 'react';
import GlassPanel from '../ui/GlassPanel';
import { useApp } from '../../context/AppContext';

export default function BingeCalculator({ show, episodes }) {
  const { getShowProgress } = useApp();
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [mode, setMode] = useState('hours');
  const [targetDate, setTargetDate] = useState('');

  const calc = useMemo(() => {
    if (!episodes || episodes.length === 0) return null;

    const totalEpisodes = episodes.length;
    const totalMinutes = episodes.reduce((sum, ep) => sum + (ep.runtime || show?.runtime || show?.averageRuntime || 45), 0);
    const totalHours = Math.round(totalMinutes / 60);

    const progress = show ? getShowProgress(show.id, totalEpisodes) : { watched: 0, percentage: 0 };
    const remainingEps = totalEpisodes - progress.watched;
    const avgRuntime = totalEpisodes > 0 ? totalMinutes / totalEpisodes : 45;
    const remainingMinutes = Math.round(remainingEps * avgRuntime);
    const remainingHours = Math.round(remainingMinutes / 60);

    return { totalEpisodes, totalHours, remainingEps, remainingMinutes, remainingHours, avgRuntime, progress };
  }, [episodes, show, getShowProgress]);

  if (!calc) return null;

  const epsPerDay = Math.floor((hoursPerDay * 60) / calc.avgRuntime) || 1;
  const daysToFinish = Math.ceil(calc.remainingEps / epsPerDay);
  const finishDate = new Date(Date.now() + daysToFinish * 86400000);
  const finishStr = finishDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });

  let targetDaysLeft = 0;
  let targetHoursPerDay = 0;
  let targetEpsPerDay = 0;
  if (targetDate) {
    targetDaysLeft = Math.max(1, Math.ceil((new Date(targetDate) - new Date()) / 86400000));
    targetEpsPerDay = Math.ceil(calc.remainingEps / targetDaysLeft);
    targetHoursPerDay = Math.round((targetEpsPerDay * calc.avgRuntime) / 60 * 10) / 10;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <GlassPanel glow="violet" className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🍿</span>
        <h3 className="font-bold text-white text-lg">Binge Planner</h3>
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
          <p className="text-lg sm:text-2xl font-bold text-accent-violet">{calc.progress.percentage}%</p>
          <p className="text-xs text-text-secondary mt-1">Progress</p>
        </div>
        <div className="text-center">
          <p className="text-lg sm:text-2xl font-bold text-white">{calc.remainingEps}</p>
          <p className="text-xs text-text-secondary mt-1">Remaining</p>
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
        <div className="border-t border-white/5 pt-4 space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-white/10 w-fit">
            <button
              onClick={() => setMode('hours')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'hours' ? 'bg-accent-violet/80 text-white' : 'bg-white/5 text-text-muted hover:text-white'}`}
            >
              I have time
            </button>
            <button
              onClick={() => setMode('date')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'date' ? 'bg-accent-violet/80 text-white' : 'bg-white/5 text-text-muted hover:text-white'}`}
            >
              Finish by date
            </button>
          </div>

          {mode === 'hours' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary mb-2 block">Hours per day: <span className="text-white font-semibold">{hoursPerDay}h</span></label>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                  className="w-full accent-accent-violet h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>30min</span>
                  <span>12h</span>
                </div>
              </div>
              <div className="bg-bg-primary/50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-accent-gold">{epsPerDay}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">eps/day</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-400">{daysToFinish}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">days</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-accent-violet">{finishStr}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">finish date</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary mb-2 block">I want to finish by:</label>
                <input
                  type="date"
                  min={today}
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-bg-primary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-violet/50"
                />
              </div>
              {targetDate && (
                <div className="bg-bg-primary/50 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-accent-gold">{targetEpsPerDay}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">eps/day</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-400">{targetDaysLeft}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">days left</p>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${targetHoursPerDay > 8 ? 'text-red-400' : 'text-accent-violet'}`}>{targetHoursPerDay}h</p>
                      <p className="text-[10px] text-text-muted mt-0.5">per day</p>
                    </div>
                  </div>
                  {targetHoursPerDay > 8 && (
                    <p className="text-[11px] text-red-400/80 text-center mt-2">That's a marathon! Consider extending your deadline.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {calc.remainingEps === 0 && (
        <div className="border-t border-white/5 pt-4 text-center">
          <p className="text-green-400 font-medium text-sm">All caught up! Nothing left to binge.</p>
        </div>
      )}
    </GlassPanel>
  );
}
