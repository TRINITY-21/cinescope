import { formatAirDate, formatRuntime, formatScheduleDays } from '../../utils/formatters';

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

export default function ShowMeta({ show }) {
  const meta = [
    { label: 'Premiered', value: formatAirDate(show.premiered), mono: true },
    { label: 'Status', value: show.status },
    { label: 'Network', value: show.network?.name || show.webChannel?.name || 'N/A' },
    { label: 'Schedule', value: formatScheduleDays(show.schedule?.days, show.schedule?.time) || 'N/A' },
    { label: 'Runtime', value: show.runtime ? formatRuntime(show.runtime) : show.averageRuntime ? formatRuntime(show.averageRuntime) : 'N/A', mono: true },
    { label: 'Language', value: show.language || 'N/A' },
  ].filter((m) => m.value && m.value !== 'N/A');

  if (meta.length === 0) return null;

  return (
    <div className="border-y border-white/[0.06] py-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-5">
      {meta.map((item) => (
        <MetaCell key={item.label} {...item} />
      ))}
    </div>
  );
}
