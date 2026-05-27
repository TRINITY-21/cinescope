import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Carousel({ children, title, subtitle, eyebrow, viewAllLink, className = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [children]);

  function scroll(direction) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  return (
    <div className={`relative group ${className}`}>
      {(title || viewAllLink) && (
        <div className="flex items-end justify-between gap-4 mb-5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest mb-1.5">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-h3 sm:text-h2 font-extrabold tracking-tight text-white leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-caption text-text-muted mt-1.5">{subtitle}</p>
            )}
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-text-secondary hover:text-white transition-colors flex-shrink-0 self-end pb-1"
            >
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}

      <div className="relative">
        {canScrollLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-heavy flex items-center justify-center opacity-80 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-110"
              aria-label="Scroll left"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 scroll-x-track scroll-smooth snap-x snap-mandatory"
        >
          {children}
        </div>

        {canScrollRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-heavy flex items-center justify-center opacity-80 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-110"
              aria-label="Scroll right"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
