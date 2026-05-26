import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Minimal toast system. Use via the `useToast()` hook:
 *
 *   const { toast } = useToast();
 *   toast({ message: 'Added to Sci-Fi Favorites', variant: 'success' });
 *
 *   toast({
 *     message: 'Removed from Watchlist',
 *     action: { label: 'Undo', onClick: () => restoreItem() },
 *   });
 *
 * Rules of use:
 *   - Only fire toasts for invisible actions (anything where the UI itself
 *     doesn't already reflect the result). Don't double-confirm button state
 *     changes.
 *   - 3s default duration; 5s if there's an action button (so the user can
 *     reach for Undo).
 *   - Max 3 stacked visible at once — oldest is dropped silently.
 */

const ToastContext = createContext(null);

const DEFAULT_DURATION = 3000;
const ACTION_DURATION = 5000;
const MAX_TOASTS = 3;

let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ message, variant = 'info', action = null, duration }) => {
      const id = ++toastCounter;
      const total = action ? (duration ?? ACTION_DURATION) : (duration ?? DEFAULT_DURATION);
      setToasts((prev) => {
        const next = [...prev, { id, message, variant, action }];
        // Cap at MAX_TOASTS — drop oldest, clear its timer too.
        while (next.length > MAX_TOASTS) {
          const dropped = next.shift();
          const t = timeoutsRef.current.get(dropped.id);
          if (t) {
            clearTimeout(t);
            timeoutsRef.current.delete(dropped.id);
          }
        }
        return next;
      });
      const timer = setTimeout(() => dismiss(id), total);
      timeoutsRef.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  useEffect(() => () => {
    for (const t of timeoutsRef.current.values()) clearTimeout(t);
    timeoutsRef.current.clear();
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op when used outside provider (e.g., in tests).
    return { toast: () => null, dismiss: () => null };
  }
  return ctx;
}

const variantStyles = {
  success: 'border-accent-peach/30 bg-accent-peach/[0.08] text-text-primary',
  error: 'border-accent-red/30 bg-accent-red/[0.08] text-text-primary',
  info: 'border-white/[0.10] bg-bg-elevated/95 text-text-primary',
};

const variantIcons = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-peach">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-red">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      className="
        fixed z-[100] pointer-events-none
        bottom-4 right-4
        left-4 sm:left-auto
        flex flex-col gap-2
        items-stretch sm:items-end
      "
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`
              pointer-events-auto
              w-full sm:w-auto sm:min-w-[280px] sm:max-w-md
              flex items-center gap-3
              rounded-xl border backdrop-blur-xl shadow-elevation-3
              px-4 py-3
              ${variantStyles[t.variant] || variantStyles.info}
            `}
            role="status"
          >
            <div className="flex-shrink-0">{variantIcons[t.variant] || variantIcons.info}</div>
            <p className="flex-1 text-body-sm leading-snug">{t.message}</p>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  try { t.action.onClick(); } finally { onDismiss(t.id); }
                }}
                className="flex-shrink-0 text-body-sm font-semibold text-accent-peach hover:text-accent-gold transition-colors"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
