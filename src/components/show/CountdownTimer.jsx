import { useState, useEffect, useMemo } from 'react';
import { formatEpisodeCode } from '../../utils/formatters';
import GlassPanel from '../ui/GlassPanel';

export default function CountdownTimer({ episodes }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextEpisode = useMemo(() => {
    if (!episodes) return null;
    const today = new Date();
    return episodes.find((ep) => ep.airstamp && new Date(ep.airstamp) > today);
  }, [episodes]);

  if (!nextEpisode) return null;

  const airDate = new Date(nextEpisode.airstamp);
  const diff = airDate - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const timeBlocks = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Min' },
    { value: seconds, label: 'Sec' },
  ];

  return (
    <GlassPanel glow="red" className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">⏱️</span>
        <div>
          <h3 className="font-bold text-white">Next Episode</h3>
          <p className="text-sm text-text-secondary">
            {formatEpisodeCode(nextEpisode.season, nextEpisode.number)} — {nextEpisode.name}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {timeBlocks.map(({ value, label }) => (
          <div key={label} className="bg-bg-primary/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
            <p className="text-lg sm:text-2xl md:text-3xl font-bold text-white font-mono">{String(value).padStart(2, '0')}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted text-center">
        {airDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {airDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
    </GlassPanel>
  );
}
