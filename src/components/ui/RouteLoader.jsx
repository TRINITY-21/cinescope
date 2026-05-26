import ByngeSpinner from './ByngeSpinner';

/**
 * Suspense fallback while a lazy route chunk loads.
 * Top progress bar + subtle centered mark (navbar stays visible).
 */
export default function RouteLoader() {
  return (
    <div className="relative min-h-[50vh] flex items-center justify-center">
      <div className="route-loader-track" aria-hidden="true">
        <div className="route-loader-bar" />
      </div>

      <div className="flex flex-col items-center gap-3 opacity-90">
        <ByngeSpinner size="md" />
        <p className="text-[11px] font-medium text-text-muted tracking-[0.14em] uppercase">
          Loading
        </p>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        Loading page
      </span>
    </div>
  );
}
