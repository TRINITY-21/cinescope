import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import Button from './Button';

/**
 * item: { id, name, image, genres } — for shows use show; for movies normalize to this shape
 */
export default function AddToCollectionDropdown({ item, buttonVariant = 'ghost', buttonClassName = '' }) {
  const { collections, addToCollection, removeFromCollection, isInCollection } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant={buttonVariant}
        className={buttonClassName}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.243 1.007-2.25 2.25-2.25h13.5z" />
          </svg>
          Add to collection
        </span>
      </Button>
      {open && (
        <div className="absolute left-0 top-full mt-2 min-w-[200px] rounded-xl bg-bg-elevated border border-white/10 shadow-xl py-1.5 z-50">
          {collections.map((c) => {
            const inCol = isInCollection(c.id, item.id);
            return (
              <button
                key={c.id}
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2 hover:bg-white/5 transition-colors"
                onClick={() => {
                  if (inCol) removeFromCollection(c.id, item.id);
                  else addToCollection(c.id, item);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <span>{c.icon}</span>
                  <span className="text-text-primary">{c.name}</span>
                </span>
                {inCol && <span className="text-accent-violet">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
