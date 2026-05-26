/**
 * Layout-shaped skeletons that mirror real page structure.
 *
 * Design rules:
 *   - The hero backdrop is a STATIC dark gradient, not a shimmer. A real
 *     backdrop is dark while loading; a shimmering full-screen panel reads
 *     as something is *wrong*, not loading.
 *   - Shimmer only on the small content placeholders (poster, title, meta
 *     rows, buttons, cards). These are the bits that map to real text/images
 *     so users see the structure populate.
 *   - Match the real component dimensions (poster aspect, hero pt-20, etc.)
 *     so there's no layout jump when content arrives.
 */

import Container from './Container';

function Shimmer({ className = '', rounded = 'rounded-md' }) {
  return (
    <div
      className={`${rounded} bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] animate-shimmer bg-[length:200%_100%] ${className}`}
    />
  );
}

/** Backdrop hero placeholder — mirrors MovieHero / ShowHero layout. */
export function HeroSkeleton() {
  return (
    <div className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh] overflow-hidden">
      {/* Static dark backdrop — looks like a hero before its image has loaded */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-secondary via-bg-primary to-black" />
      <div className="absolute inset-0 hero-gradient-overlay" />
      <div className="absolute inset-0 hero-gradient-left" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-section flex items-end min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full">
          {/* Poster (desktop only — matches real hero) */}
          <Shimmer rounded="rounded-xl" className="hidden md:block w-56 lg:w-64 aspect-[2/3] flex-shrink-0 shadow-elevation-3" />

          {/* Title + meta + actions */}
          <div className="flex-1 w-full space-y-5 max-w-2xl">
            {/* Title (logo-sized rectangle) */}
            <Shimmer rounded="rounded-lg" className="h-12 sm:h-16 md:h-20 lg:h-24 w-3/4" />

            {/* Meta row: year · runtime · network · type */}
            <div className="flex items-center gap-3">
              <Shimmer className="h-3.5 w-12" />
              <span className="text-text-muted">·</span>
              <Shimmer className="h-3.5 w-16" />
              <span className="text-text-muted hidden sm:inline">·</span>
              <Shimmer className="h-3.5 w-20 hidden sm:block" />
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3">
              <Shimmer rounded="rounded-full" className="h-10 w-10" />
              <Shimmer className="h-4 w-24" />
            </div>

            {/* Genre pills */}
            <div className="flex flex-wrap gap-2">
              <Shimmer rounded="rounded-full" className="h-6 w-16" />
              <Shimmer rounded="rounded-full" className="h-6 w-20" />
              <Shimmer rounded="rounded-full" className="h-6 w-14" />
            </div>

            {/* Action row: 2 primary buttons + 3 icon buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Shimmer rounded="rounded-lg" className="h-11 w-36" />
              <Shimmer rounded="rounded-lg" className="h-11 w-36" />
              <div className="flex items-center gap-2 ml-1">
                <Shimmer rounded="rounded-full" className="h-11 w-11" />
                <Shimmer rounded="rounded-full" className="h-11 w-11" />
                <Shimmer rounded="rounded-full" className="h-11 w-11" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Strip of meta cards (date, runtime, status, etc.) below the hero. */
export function MetaStripSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-card">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-card gap-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer className="h-2.5 w-14" />
            <Shimmer className="h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Two-column block: wide synopsis + narrower sidebar. Matches the real
 *  MoviePage/ShowPage synopsis + DidYouKnow grid. */
export function SynopsisBlockSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-card">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-card space-y-3">
        <Shimmer className="h-4 w-24 mb-2" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <Shimmer className="h-3 w-4/6" />
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-card space-y-3">
        <Shimmer className="h-4 w-32 mb-2" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-3/4" />
        <Shimmer className="h-3 w-5/6" />
      </div>
    </div>
  );
}

/** Wide row block — used to suggest "Where to watch" / "Media" section. */
export function WideRowSkeleton() {
  return (
    <div className="space-y-3">
      <Shimmer className="h-4 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer
            key={i}
            rounded="rounded-xl"
            className="h-24 w-40 flex-shrink-0 hidden sm:block first:block"
          />
        ))}
      </div>
    </div>
  );
}

/** Horizontal carousel of poster cards — matches Recommendations / Cast. */
export function CardRowSkeleton({ count = 6 }) {
  return (
    <div className="space-y-3">
      <Shimmer className="h-4 w-32" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-32 sm:w-36 md:w-40 space-y-2">
            <Shimmer rounded="rounded-xl" className="aspect-[2/3]" />
            <Shimmer className="h-3 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full hero + content placeholder for ShowPage / MoviePage. */
export function DetailPageSkeleton() {
  return (
    <div>
      <HeroSkeleton />
      <Container>
        <div className="mt-section space-y-section">
          <MetaStripSkeleton />
          <SynopsisBlockSkeleton />
          <WideRowSkeleton />
          <CardRowSkeleton />
        </div>
      </Container>
    </div>
  );
}

/** Card grid placeholder — used by MoviesPage / BrowsePage. */
export function CardGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer rounded="rounded-xl" className="aspect-[2/3]" />
          <Shimmer className="h-3 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Browse page header + grid skeleton. */
export function BrowsePageSkeleton() {
  return (
    <div className="pt-20 sm:pt-24 pb-section">
      <Container>
        <div className="flex items-end justify-between mb-section">
          <div className="space-y-3">
            <Shimmer rounded="rounded-lg" className="h-10 sm:h-12 w-64" />
            <Shimmer className="h-4 w-48" />
          </div>
          <Shimmer rounded="rounded-lg" className="h-10 w-24" />
        </div>
        <div className="flex gap-2 overflow-hidden mb-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Shimmer key={i} rounded="rounded-full" className="h-9 w-24 flex-shrink-0" />
          ))}
        </div>
        <CardGridSkeleton />
      </Container>
    </div>
  );
}
