import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fires a GA4 `page_view` on every client-side route change (and on the first
 * load). The gtag config in index.html runs with `send_page_view:false`, so
 * this hook is the sole source of pageviews — without it, GA would only ever
 * record the URL the browser landed on and miss every in-app navigation
 * (e.g. /browse, which is almost always reached by clicking, not a fresh load).
 *
 * Consent Mode still governs cookies: until the user accepts the banner,
 * `analytics_storage` is denied and these hits are sent cookieless.
 */
export default function usePageViews() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: pathname + search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);
}
