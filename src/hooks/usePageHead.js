import { useEffect, useRef } from 'react';

/**
 * Centralizes per-page document.title / meta description / canonical / OG tags.
 *
 * Real users only see <title> change; the meta tags exist primarily so that
 * social link unfurlers (when middleware.js doesn't catch them) and any
 * crawler that slips past UA detection still gets something correct.
 *
 * Pass only what you have — undefined fields are left alone (not cleared) so
 * partial updates compose cleanly.
 *
 * @param {object} opts
 * @param {string} [opts.title]        full <title>, including the " — Bynge" suffix if you want one
 * @param {string} [opts.description]  meta description
 * @param {string} [opts.canonical]    absolute canonical URL
 * @param {string} [opts.ogImage]      absolute URL of a 1200×630 (or any) OG image
 * @param {string} [opts.ogType]       defaults to "website"; set "video.movie" / "video.tv_show" / "profile" for detail pages
 * @param {Array<object>} [opts.jsonLd] schema.org objects to inject as <script type="application/ld+json">
 * @param {string} [opts.robots]       e.g. "noindex" for soft-404 pages in the SPA
 */
export function usePageHead({ title, description, canonical, ogImage, ogType, jsonLd, robots } = {}) {
  // Restore title on unmount so navigating away from a landing page doesn't
  // strand its title on subsequent routes.
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);

  useEffect(() => {
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, 'property');
    }
    if (title) {
      setMeta('og:title', title, 'property');
      setMeta('twitter:title', title);
    }
    if (canonical) {
      setCanonical(canonical);
      setMeta('og:url', canonical, 'property');
    }
    if (ogImage) {
      setMeta('og:image', ogImage, 'property');
      setMeta('twitter:image', ogImage);
    }
    if (ogType) {
      setMeta('og:type', ogType, 'property');
    }
    if (robots) {
      setMeta('robots', robots);
    }
  }, [title, description, canonical, ogImage, ogType, robots]);

  // Reset scroll when the canonical URL changes — solves the "click /trending/today,
  // scroll down, click /trending/year, still scrolled" bug across all landing pages
  // that swap content under a :slug/:window/:provider/:mood param. Skips the first
  // mount so detail pages that handle their own scroll behavior aren't disturbed.
  const firstRun = useRef(true);
  useEffect(() => {
    if (!canonical) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [canonical]);

  // JSON-LD: append <script> elements tagged with a sentinel so we can clean
  // them up on unmount without disturbing other scripts.
  useEffect(() => {
    if (!jsonLd || !jsonLd.length) return;
    const SENTINEL = 'data-bynge-jsonld';
    const nodes = jsonLd.map((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute(SENTINEL, '');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      return script;
    });
    return () => {
      nodes.forEach((n) => n.parentNode?.removeChild(n));
    };
  }, [jsonLd]);
}

function setMeta(name, value, kind = 'name') {
  if (value == null) return;
  let tag = document.querySelector(`meta[${kind}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(kind, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

function setCanonical(url) {
  let tag = document.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.rel = 'canonical';
    document.head.appendChild(tag);
  }
  tag.href = url;
}

/** The site's canonical origin. Reads from Vite env, falls back to bynge.app. */
export const SITE_ORIGIN = import.meta.env?.VITE_SITE_URL || 'https://bynge.app';
