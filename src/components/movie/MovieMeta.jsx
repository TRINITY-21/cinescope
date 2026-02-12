import GlassPanel from '../ui/GlassPanel';
import { formatAirDate, formatRuntime, formatCurrency } from '../../utils/formatters';

export default function MovieMeta({ movie, certification }) {
  const meta = [
    { label: 'Release Date', value: formatAirDate(movie.release_date) },
    { label: 'Runtime', value: movie.runtime ? formatRuntime(movie.runtime) : null },
    { label: 'Status', value: movie.status },
    { label: 'Budget', value: formatCurrency(movie.budget) },
    { label: 'Revenue', value: formatCurrency(movie.revenue) },
    { label: 'Language', value: movie.original_language?.toUpperCase() },
    certification && { label: 'Rating', value: certification },
    movie.production_companies?.length > 0 && {
      label: 'Studio',
      value: movie.production_companies.map((c) => c.name).join(', '),
    },
    movie.imdb_id && {
      label: 'IMDb',
      value: movie.imdb_id,
      link: `https://www.imdb.com/title/${movie.imdb_id}`,
    },
  ].filter(Boolean).filter((m) => m.value);

  if (meta.length === 0) return null;

  return (
    <GlassPanel className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
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
