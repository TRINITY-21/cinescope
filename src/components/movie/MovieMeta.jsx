import { formatAirDate, formatCurrency, formatRuntime } from '../../utils/formatters';

function MetaCell({ label, value, mono }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{label}</p>
      <p className={`mt-2 text-body-sm font-semibold text-white ${mono ? 'font-mono tabular-nums whitespace-nowrap' : 'break-words min-w-0'}`}>
        {value}
      </p>
    </div>
  );
}

export default function MovieMeta({ movie, certification }) {
  const meta = [
    { label: 'Release', value: formatAirDate(movie.release_date), mono: true },
    { label: 'Runtime', value: movie.runtime ? formatRuntime(movie.runtime) : null, mono: true },
    { label: 'Status', value: movie.status },
    { label: 'Budget', value: formatCurrency(movie.budget), mono: true },
    { label: 'Revenue', value: formatCurrency(movie.revenue), mono: true },
    { label: 'Language', value: movie.original_language?.toUpperCase() },
    certification && { label: 'Rating', value: certification },
    movie.production_companies?.length > 0 && {
      label: 'Studio',
      value: movie.production_companies.map((c) => c.name).join(', '),
    },
  ].filter(Boolean).filter((m) => m.value);

  if (meta.length === 0) return null;

  return (
    <div className="border-y border-white/[0.06] py-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-5">
      {meta.map((item) => (
        <MetaCell key={item.label} {...item} />
      ))}
    </div>
  );
}
