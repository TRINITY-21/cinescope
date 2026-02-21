import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Carousel({ children, title, subtitle, viewAllLink, className = '' }) {
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
        <div className="flex items-end justify-between mb-4 px-1">
          <div>
            {title && <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>}
            {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
          </div>
          {viewAllLink && (
            <Link to={viewAllLink} className="text-sm text-accent-violet hover:text-accent-red transition-colors font-medium">
              View All &rarr;
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
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-heavy flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/10 hover:shadow-glow-violet hover:border-accent-violet/20 hover:scale-110"
              aria-label="Scroll left"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
        >
          {children}
        </div>

        {canScrollRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-heavy flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/10 hover:shadow-glow-violet hover:border-accent-violet/20 hover:scale-110"
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
