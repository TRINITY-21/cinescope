import { useState } from 'react';

export default function CollapsibleNotice({ title = 'Playback tip', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-bg-elevated/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-body-sm text-text-secondary hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-text-primary">{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3 text-body-sm text-text-secondary leading-relaxed border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}
