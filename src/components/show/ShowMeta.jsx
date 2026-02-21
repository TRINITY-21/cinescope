import GlassPanel from '../ui/GlassPanel';
import { formatAirDate, formatRuntime, formatScheduleDays } from '../../utils/formatters';

export default function ShowMeta({ show }) {
  const meta = [
    { label: 'Premiered', value: formatAirDate(show.premiered) },
    { label: 'Status', value: show.status },
    { label: 'Network', value: show.network?.name || show.webChannel?.name || 'N/A' },
    { label: 'Schedule', value: formatScheduleDays(show.schedule?.days, show.schedule?.time) || 'N/A' },
    { label: 'Runtime', value: show.runtime ? formatRuntime(show.runtime) : show.averageRuntime ? formatRuntime(show.averageRuntime) : 'N/A' },
    { label: 'Language', value: show.language || 'N/A' },
  ].filter((m) => m.value && m.value !== 'N/A');

  if (show.externals?.imdb) {
    meta.push({
      label: 'IMDb',
      value: show.externals.imdb,
      link: `https://www.imdb.com/title/${show.externals.imdb}`,
    });
  }

  return (
    <GlassPanel className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
      {meta.map((item) => (
        <div key={item.label}>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{item.label}</p>
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent-violet hover:text-accent-red transition-colors"
            >
              {item.value}
            </a>
          ) : (
            <p className="text-sm font-medium text-white">{item.value}</p>
          )}
        </div>
      ))}
    </GlassPanel>
  );
}
