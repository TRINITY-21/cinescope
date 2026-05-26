import { useEffect, useMemo, useState } from 'react';
import { formatEpisodeCode } from '../../utils/formatters';

export function getNextUpcomingEpisode(episodes) {
  if (!episodes) return null;
  const now = new Date();
  const nextEpisode = episodes.find((ep) => ep.airstamp && new Date(ep.airstamp) > now);
  if (!nextEpisode) return null;
  const diff = new Date(nextEpisode.airstamp) - now;
  if (diff <= 0) return null;
  return nextEpisode;
}

export default function CountdownTimer({ episodes }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextEpisode = useMemo(() => getNextUpcomingEpisode(episodes), [episodes, now]);

  if (!nextEpisode) return null;

  const airDate = new Date(nextEpisode.airstamp);
  const diff = airDate - now;

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
    <section className="border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex items-baseline gap-3">
        <p className="text-meta uppercase text-accent-red font-semibold tracking-widest flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-red" />
          </span>
          Next episode
        </p>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <div>
        <p className="text-meta font-mono tabular-nums text-text-secondary">
          {formatEpisodeCode(nextEpisode.season, nextEpisode.number)}
        </p>
        <p className="text-h3 font-semibold text-white mt-0.5 leading-tight">
          {nextEpisode.name}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-2">
        {timeBlocks.map(({ value, label }) => (
          <div key={label} className="border border-white/[0.06] rounded-xl p-2 sm:p-3 text-center">
            <p className="text-h2 sm:text-display-sm font-extrabold font-mono tabular-nums text-white leading-none">
              {String(value).padStart(2, '0')}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mt-2 font-semibold">
              {label}
            </p>
          </div>
        ))}
      </div>

      <p className="text-caption text-text-muted text-center font-mono tabular-nums">
        {airDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        <span className="mx-2">·</span>
        {airDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
    </section>
  );
}
