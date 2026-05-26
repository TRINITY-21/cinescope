/**
 * Shared schema.org JSON-LD builders. Pages pass the returned objects to
 * `usePageHead({ jsonLd: [...] })`. Keeping the schema generators in one
 * place means every page produces consistent shapes Google can rely on.
 *
 * All builders return either a single object or `null` if there's nothing
 * meaningful to emit — pass-through via `.filter(Boolean)` on the call site.
 */

import { SITE_ORIGIN } from '../hooks/usePageHead';

/**
 * Builds a BreadcrumbList — Google shows breadcrumbs in SERP when present.
 *
 * @param {Array<{ name: string, url?: string }>} crumbs
 *   The trail, root first (typically "Home"). The last item's URL is the
 *   current page and is optional; we'll set it to the canonical if omitted.
 * @param {string} [currentUrl] absolute URL of the current page (fallback for last crumb).
 */
export function breadcrumbJsonLd(crumbs, currentUrl) {
  if (!Array.isArray(crumbs) || crumbs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      const url = c.url || (isLast ? currentUrl : null);
      const item = {
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
      };
      if (url) item.item = url;
      return item;
    }),
  };
}

/** FAQPage from a list of { q, a } pairs. Returns null when empty. */
export function faqJsonLd(faq) {
  if (!Array.isArray(faq) || !faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Resolves an absolute URL given a leading-slash path. */
export function absoluteUrl(path) {
  if (!path) return SITE_ORIGIN;
  if (path.startsWith('http')) return path;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Standard breadcrumb trail for SEO landing pages. Pass the section label
 * + page name; we'll inject "Home" automatically.
 *
 *   seoBreadcrumb('Bynge Lists', '/best', 'Best Horror Movies', '/best/best-horror-movies')
 *   → Home > Bynge Lists > Best Horror Movies
 */
export function seoBreadcrumb(sectionLabel, sectionPath, pageName, pagePath) {
  return breadcrumbJsonLd(
    [
      { name: 'Home', url: absoluteUrl('/') },
      { name: sectionLabel, url: absoluteUrl(sectionPath) },
      pageName ? { name: pageName, url: absoluteUrl(pagePath) } : null,
    ].filter(Boolean),
    absoluteUrl(pagePath),
  );
}
