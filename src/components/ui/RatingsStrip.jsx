/**
 * Displays Rotten Tomatoes / IMDb / Metacritic scores side-by-side.
 */

function rtClass(score) {
  if (score == null) return '';
  return score >= 60 ? 'text-red-400' : 'text-yellow-500';
}
function imdbClass(score) {
  if (score == null) return '';
  return score >= 7 ? 'text-accent-gold' : 'text-text-secondary';
}
function metaBoxClass(score) {
  if (score == null) return '';
  if (score >= 61) return 'bg-green-500 text-white ring-1 ring-green-400/60';
  if (score >= 40) return 'bg-yellow-400 text-black ring-1 ring-yellow-300/60';
  return 'bg-red-500 text-white ring-1 ring-red-400/60';
}

const RT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-500" aria-hidden>
    <circle cx="12" cy="12" r="10" opacity="0.2" />
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5v10l6-5-6-5z" />
  </svg>
);

const TROPHY_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-gold shrink-0" aria-hidden>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 4h2a2 2 0 012 2v1a4 4 0 01-4 4M7 4H5a2 2 0 00-2 2v1a4 4 0 004 4" />
  </svg>
);

export default function RatingsStrip({ ratings, awards, className = '' }) {
  const { imdb, rottenTomatoes, metacritic } = ratings || {};
  const hasAny = imdb != null || rottenTomatoes != null || metacritic != null;
  if (!hasAny && !awards) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      {rottenTomatoes != null && (
        <div className="flex items-center gap-1.5" title="Rotten Tomatoes">
          {RT_ICON}
          <span className={`font-bold text-base ${rtClass(rottenTomatoes)}`}>{rottenTomatoes}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">RT</span>
        </div>
      )}
      {imdb != null && (
        <div className="flex items-center gap-1.5" title="IMDb">
          <span className="text-[10px] font-black tracking-tight px-1.5 py-0.5 rounded bg-accent-gold text-black">IMDb</span>
          <span className={`font-bold text-base ${imdbClass(imdb)}`}>{imdb.toFixed(1)}</span>
        </div>
      )}
      {metacritic != null && (
        <div className="flex items-center gap-1.5" title={`Metacritic: ${metacritic}`}>
          <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-sm font-black rounded-md shadow-sm ${metaBoxClass(metacritic)}`}>
            {metacritic}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Metacritic</span>
        </div>
      )}
      {awards && (
        <div className="flex w-full min-w-0 basis-full items-start gap-1.5 text-xs text-accent-gold/90 leading-relaxed">
          {TROPHY_ICON}
          <span className="min-w-0">{awards}</span>
        </div>
      )}
    </div>
  );
}
