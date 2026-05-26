/**
 * Suspense fallback used while a lazy route chunk loads.
 *
 * Renders an animated top-loading bar (YouTube/GitHub-style) instead of
 * blanking the page. The navbar stays visible because this lives inside
 * MainLayout, so the perceived load is just "page is changing" not
 * "site is broken".
 */
export default function RouteLoader() {
  return (
    <div className="min-h-[60vh]">
      <div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="route-loader-bar h-full bg-gradient-to-r from-accent-peach via-accent-gold to-accent-peach" />
      </div>
      <span className="sr-only" role="status" aria-live="polite">Loading page</span>
    </div>
  );
}
