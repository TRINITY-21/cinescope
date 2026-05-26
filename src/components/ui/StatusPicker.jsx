import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

const STATE_ICONS = {
  watching: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  watched: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  watchlist: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  paused: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  dropped: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};

const STATES = [
  { key: 'watching', label: 'Watching', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  { key: 'watched', label: 'Watched', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { key: 'watchlist', label: 'Watchlist', color: 'text-accent-peach', bg: 'bg-accent-peach/20', border: 'border-accent-peach/30' },
  { key: 'paused', label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { key: 'dropped', label: 'Dropped', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
];

export default function StatusPicker({ kind, id, item, className = '' }) {
  const {
    getItemStatus,
    updateItemStatus,
    addToWatchlist,
    removeFromWatchlist,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
  } = useApp();
  const { toast } = useToast();
  const status = getItemStatus(kind, id);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function applyStatus(nextStatus, currentStatus) {
    if (kind === 'show') {
      if (nextStatus && !currentStatus) addToWatchlist(item);
      if (!nextStatus) removeFromWatchlist(id);
    } else if (kind === 'movie') {
      if (nextStatus && !currentStatus) addMovieToWatchlist(item);
      if (!nextStatus) removeMovieFromWatchlist(id);
    }
    updateItemStatus(kind, id, nextStatus);
  }

  function handleSelect(newStatus) {
    setOpen(false);
    const previousStatus = status;
    applyStatus(newStatus, previousStatus);

    if (!newStatus && previousStatus) {
      const title = item?.name || item?.title || 'Item';
      toast({
        message: `Removed "${title}" from library`,
        variant: 'info',
        action: {
          label: 'Undo',
          onClick: () => applyStatus(previousStatus, null),
        },
      });
    }
  }

  const current = STATES.find((s) => s.key === status);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 px-5 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base border ${
          current
            ? `${current.bg} ${current.color} ${current.border}`
            : 'bg-bg-elevated hover:bg-bg-elevated/90 text-text-primary border-white/10 hover:border-white/15'
        }`}
      >
        <span className="flex items-center justify-center w-4 h-4">
          {current ? STATE_ICONS[current.key] : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </span>
        <span>{current?.label ?? 'Track'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 mt-2 w-52 bg-bg-secondary border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {STATES.map((s) => {
            const active = s.key === status;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleSelect(s.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  active ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span className={`flex items-center justify-center w-4 h-4 ${s.color}`}>
                  {STATE_ICONS[s.key]}
                </span>
                <span className={active ? 'text-white font-semibold' : 'text-text-secondary'}>
                  {s.label}
                </span>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-auto text-accent-peach" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
          {status && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs text-text-muted hover:bg-white/5 border-t border-white/10"
            >
              <span className="flex items-center justify-center w-4 h-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </span>
              <span>Remove from library</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
