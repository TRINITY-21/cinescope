import { useEffect, useRef, useState } from 'react';

/**
 * Horizontal row with edge fades + scroll buttons (touch-friendly).
 * Drop-in replacement for bare overflow-x-auto rows.
 */
export default function HorizontalScroll({
  children,
  className = '',
  gapClass = 'gap-3',
  showButtons = true,
}) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  function update() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [children]);

  function scroll(dir) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: 'smooth' });
  }

  return (
    <div className={`relative group/scroll ${className}`}>
      {canLeft && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-10 z-10 bg-gradient-to-r from-bg-primary to-transparent"
        />
      )}
      {canRight && (
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-10 z-10 bg-gradient-to-l from-bg-primary to-transparent"
        />
      )}

      {showButtons && canLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full glass-heavy flex items-center justify-center opacity-80 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/scroll:opacity-100 transition-opacity"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      {showButtons && canRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full glass-heavy flex items-center justify-center opacity-80 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/scroll:opacity-100 transition-opacity"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      <div
        ref={scrollRef}
        className={`flex ${gapClass} scroll-x-track scroll-smooth`}
      >
        {children}
      </div>
    </div>
  );
}
