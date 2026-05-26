import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll window to top on every route change (fixes "See all" / deep links
 * landing mid-page when leaving a scrolled show or movie detail).
 * Hash URLs scroll to the target element instead.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, '');
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
